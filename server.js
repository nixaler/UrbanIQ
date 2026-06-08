const express = require("express");
const path = require("path");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Supabase — requires SUPABASE_URL + SUPABASE_SERVICE_KEY in Railway env vars
// Run this SQL once in your Supabase dashboard:
//   CREATE TABLE IF NOT EXISTS leaderboard (
//     id BIGSERIAL PRIMARY KEY,
//     player_name TEXT NOT NULL,
//     game_key TEXT NOT NULL,
//     difficulty TEXT NOT NULL,
//     wins INTEGER NOT NULL DEFAULT 0,
//     rounds INTEGER NOT NULL DEFAULT 0,
//     total_guesses INTEGER NOT NULL DEFAULT 0,
//     day_num INTEGER NOT NULL,
//     device_id TEXT,
//     ts TIMESTAMPTZ DEFAULT NOW()
//   );
//   CREATE INDEX IF NOT EXISTS idx_lb_game ON leaderboard(game_key, wins DESC, total_guesses ASC, ts ASC);
const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

// Trust Railway's load balancer so rate limiters see real client IPs
app.set("trust proxy", 1);

// Security headers
app.use((req, res, next) => {
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// CORS — allow only production domain (and localhost for dev)
const ALLOWED_ORIGINS = ["https://urbaniq.quest", "https://www.urbaniq.quest", "http://localhost:5173", "http://localhost:5000"];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Vary", "Origin");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Compress all responses (gzip) — reduces JS bundle from ~750KB to ~210KB on the wire
app.use(compression({ level: 6 }));

app.use(express.json());

// Cache hashed assets (JS/CSS) for 1 year; HTML and SW never cached
app.use(express.static(path.join(__dirname, "dist"), {
  setHeaders(res, filePath) {
    if (/\.(js|css|woff2?|ttf|otf|eot|png|jpg|jpeg|svg|ico|webp)$/.test(filePath)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else if (filePath.endsWith(".html") || filePath.endsWith("sw.js")) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    }
  }
}));

// Persistent KV store backed by Supabase (kv_store table), in-memory fallback
const mem = {};
const store = {
  async get(k) {
    if (supabase) {
      try {
        const { data } = await supabase.from("kv_store").select("value").eq("key", k).maybeSingle();
        return data ? data.value : null;
      } catch { return null; }
    }
    return mem[k] ?? null;
  },
  async set(k, v) {
    if (supabase) {
      try { await supabase.from("kv_store").upsert({ key: k, value: v, updated_at: new Date().toISOString() }); return; } catch {}
    }
    mem[k] = v;
  },
  async del(k) {
    if (supabase) {
      try { await supabase.from("kv_store").delete().eq("key", k); return; } catch {}
    }
    delete mem[k];
  },
  async list(prefix) {
    if (supabase) {
      try {
        const { data } = await supabase.from("kv_store").select("key").like("key", prefix + "%");
        return data ? data.map(r => r.key) : [];
      } catch { return []; }
    }
    return Object.keys(mem).filter(k => k.startsWith(prefix));
  }
};

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function resolveBattle(deckA, deckB) {
  let wA = 0, wB = 0;
  const rounds = [];
  const len = Math.max(deckA.length, deckB.length);
  for (let i = 0; i < len; i++) {
    const cA = deckA[i], cB = deckB[i];
    if (!cA) { wB++; rounds.push({ winner: "b", sA: 0, sB: cB?.power || 10, nameA: "—", nameB: cB?.name || "—", rarityA: "common", rarityB: cB?.rarityId || "common" }); continue; }
    if (!cB) { wA++; rounds.push({ winner: "a", sA: cA?.power || 10, sB: 0, nameA: cA?.name || "—", nameB: "—", rarityA: cA?.rarityId || "common", rarityB: "common" }); continue; }
    let sA = cA.power || 10, sB = cB.power || 10;
    const beA = cA.ability?.battleEffect, beB = cB.ability?.battleEffect;
    if (beA?.type === "power_bonus") sA += beA.value || 0;
    if (beB?.type === "power_bonus") sB += beB.value || 0;
    if (beA?.type === "random_bonus") sA += (beA.min || 0) + Math.random() * ((beA.max || 20) - (beA.min || 0));
    if (beB?.type === "random_bonus") sB += (beB.min || 0) + Math.random() * ((beB.max || 20) - (beB.min || 0));
    const ADV = { transit: "geography", geography: "sports", sports: "transit" };
    if (ADV[cA.cardType] === cB.cardType) sA *= 1.18;
    if (ADV[cB.cardType] === cA.cardType) sB *= 1.18;
    sA = Math.round(sA); sB = Math.round(sB);
    const w = sA >= sB ? "a" : "b";
    if (w === "a") wA++; else wB++;
    rounds.push({ winner: w, sA, sB, nameA: cA.name, nameB: cB.name, rarityA: cA.rarityId, rarityB: cB.rarityId });
  }
  let winner;
  if (wA > wB) winner = "a";
  else if (wB > wA) winner = "b";
  else {
    const rs = d => d.reduce((s, c) => s + (c.rarityId === "legendary" ? 3 : c.rarityId === "rare" ? 2 : c.rarityId === "uncommon" ? 1 : 0), 0);
    winner = rs(deckA) >= rs(deckB) ? "a" : "b";
  }
  return { wA, wB, rounds, winner };
}

async function updateLb(playerId, playerName, isWin) {
  const key = `lb:${playerId}`;
  const e = await store.get(key) || { playerId, playerName, wins: 0, losses: 0, games: 0 };
  e.playerName = playerName;
  e.games = (e.games || 0) + 1;
  if (isWin) e.wins = (e.wins || 0) + 1; else e.losses = (e.losses || 0) + 1;
  await store.set(key, e);
}

async function appendHistory(playerId, record) {
  const key = `hist:${playerId}`;
  const h = (await store.get(key)) || [];
  h.unshift({
    battleId: record.battleId, result: record.result,
    opponentName: record.opponentName, resolvedAt: record.resolvedAt,
    winsA: record.winsA, winsB: record.winsB
  });
  await store.set(key, h.slice(0, 10));
}

// POST /api/battle/submit
app.post("/api/battle/submit", async (req, res) => {
  try {
    const { playerId, playerName, deck } = req.body;
    if (!playerId || !Array.isArray(deck) || deck.length < 1) {
      return res.status(400).json({ error: "Invalid submission" });
    }
    const waitingKeys = await store.list("bwait:");
    let matched = null;
    for (const k of waitingKeys) {
      const b = await store.get(k);
      if (b?.status === "waiting" && b.playerId !== playerId) { matched = b; break; }
    }
    const battleId = genId();
    const now = new Date().toISOString();
    const name = playerName || "Challenger";
    if (matched) {
      const resolution = resolveBattle(matched.deck, deck);
      const rA = resolution.winner === "a" ? "win" : "loss";
      const rB = resolution.winner === "b" ? "win" : "loss";
      const matchedRecord = {
        ...matched, status: "resolved", result: rA,
        opponentId: playerId, opponentName: name, opponentDeck: deck,
        rounds: resolution.rounds, winsA: resolution.wA, winsB: resolution.wB, resolvedAt: now
      };
      const myRecord = {
        battleId, playerId, playerName: name, deck, status: "resolved", result: rB,
        opponentId: matched.playerId, opponentName: matched.playerName, opponentDeck: matched.deck,
        rounds: resolution.rounds.map(r => ({
          ...r, winner: r.winner === "a" ? "b" : "a",
          sA: r.sB, sB: r.sA, nameA: r.nameB, nameB: r.nameA,
          rarityA: r.rarityB, rarityB: r.rarityA
        })),
        winsA: resolution.wB, winsB: resolution.wA, submittedAt: now, resolvedAt: now
      };
      await store.set(`bresv:${matched.battleId}`, matchedRecord);
      await store.del(`bwait:${matched.battleId}`);
      await store.set(`bresv:${battleId}`, myRecord);
      await updateLb(matched.playerId, matched.playerName, rA === "win");
      await updateLb(playerId, name, rB === "win");
      await appendHistory(matched.playerId, matchedRecord);
      await appendHistory(playerId, myRecord);
      return res.json({ battleId, status: "resolved", result: rB, record: myRecord });
    } else {
      const record = { battleId, playerId, playerName: name, deck, status: "waiting", result: null, submittedAt: now };
      await store.set(`bwait:${battleId}`, record);
      return res.json({ battleId, status: "waiting" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/battle/status/:battleId
app.get("/api/battle/status/:battleId", async (req, res) => {
  try {
    const { battleId } = req.params;
    const r = (await store.get(`bresv:${battleId}`)) || (await store.get(`bwait:${battleId}`));
    if (r) return res.json(r);
    res.status(404).json({ error: "Not found" });
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

// GET /api/battle/history/:playerId
app.get("/api/battle/history/:playerId", async (req, res) => {
  try {
    const h = (await store.get(`hist:${req.params.playerId}`)) || [];
    res.json(h);
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

// GET /api/battle/leaderboard
app.get("/api/battle/leaderboard", async (req, res) => {
  try {
    const keys = await store.list("lb:");
    const entries = await Promise.all(keys.map(k => store.get(k)));
    const sorted = entries.filter(Boolean)
      .sort((a, b) => (b.wins - a.wins) || (a.losses - b.losses))
      .slice(0, 10);
    res.json(sorted);
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

// GET /api/health — lets frontend detect if PvP API is available
app.get("/api/health", (_req, res) => res.json({ pvp: true, db: !!db }));

// ── WMATA PROXY ──────────────────────────────────────────────────────────────
const WMATA_KEY = process.env.WMATA_API_KEY || null;
const WMATA_BASE = "https://api.wmata.com";

function simulateArrivals(code) {
  const lines = ["Red","Blue","Orange","Silver","Green","Yellow"];
  const dests = {
    Red:["Shady Grove","Glenmont","Silver Spring","Bethesda"],
    Blue:["Franconia-Springfield","Largo Town Center","Pentagon City","Reagan Airport"],
    Orange:["Vienna","New Carrollton","Ballston","Stadium-Armory"],
    Silver:["Ashburn","Largo Town Center","McLean","Wiehle-Reston East"],
    Green:["Greenbelt","Branch Ave","College Park","Navy Yard"],
    Yellow:["Huntington","Mt Vernon Sq","Pentagon","Archives"]
  };
  const count = 3 + Math.floor(Math.random() * 2);
  const result = [];
  for (let i = 0; i < count; i++) {
    const line = lines[Math.floor(Math.random() * lines.length)];
    const destList = dests[line] || ["Terminal"];
    const dest = destList[Math.floor(Math.random() * destList.length)];
    result.push({
      Line: line, DestinationName: dest,
      Min: String(1 + Math.floor(Math.random() * 18)),
      Car: String([4,6,8][Math.floor(Math.random()*3)])
    });
  }
  return result.sort((a,b) => Number(a.Min) - Number(b.Min));
}

app.get("/api/wmata/arrivals", async (req, res) => {
  const { stationCode } = req.query;
  if (!stationCode) return res.status(400).json({ error: "stationCode required" });
  if (!WMATA_KEY) return res.json({ simulated: true, Trains: simulateArrivals(stationCode) });
  try {
    const https = require("https");
    const url = `${WMATA_BASE}/StationPrediction.svc/json/GetPrediction/${stationCode}?api_key=${WMATA_KEY}`;
    const data = await new Promise((resolve, reject) => {
      https.get(url, r => {
        let body = "";
        r.on("data", c => body += c);
        r.on("end", () => { try { resolve(JSON.parse(body)); } catch { reject(new Error("JSON parse")); } });
      }).on("error", reject);
    });
    res.json(data);
  } catch (e) {
    res.json({ simulated: true, Trains: simulateArrivals(stationCode) });
  }
});

app.get("/api/wmata/incidents", async (req, res) => {
  if (!WMATA_KEY) return res.json({ Incidents: [] });
  try {
    const https = require("https");
    const url = `${WMATA_BASE}/Incidents.svc/json/Incidents?api_key=${WMATA_KEY}`;
    const data = await new Promise((resolve, reject) => {
      https.get(url, r => {
        let body = "";
        r.on("data", c => body += c);
        r.on("end", () => { try { resolve(JSON.parse(body)); } catch { reject(new Error("JSON parse")); } });
      }).on("error", reject);
    });
    res.json(data);
  } catch (e) {
    res.json({ Incidents: [] });
  }
});

// ── PARTNER OFFER CODES (server-side only — never sent in bundle) ─────────────
const OFFER_CODES = {
  "busboys-dc": "BUSBOYS15",
  "powells-pdx": "POWELLS10",
  "katz-nyc": "KATZIQ10",
  "loumal-chi": "LOUMAL10",
};

app.get("/api/offers/code/:offerId", (req, res) => {
  const code = OFFER_CODES[req.params.offerId];
  if (!code) return res.status(404).json({ error: "Offer not found." });
  return res.json({ code });
});

// ── REWARD CLAIMS ────────────────────────────────────────────────────────────
const claimsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many claim attempts. Please wait 15 minutes." },
});

// Stores claims server-side and enforces: one claim per email+tier, one claim
// per device+tier, and a minimum account age of 12 days for $10 cash.
// first-play is anchored on first claim — client cannot reset it after that.
app.post("/api/claims", claimsLimiter, async (req, res) => {
  const { id, label, email, city, xp, firstPlay, deviceId, ts } = req.body || {};
  if (!id || !email || !deviceId || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: "Invalid claim data." });
  }

  // Anchor first-play server-side: record once per device, never overwrite.
  const fpKey = `device:firstPlay:${deviceId}`;
  let serverFirstPlay = await store.get(fpKey);
  if (!serverFirstPlay && firstPlay) {
    serverFirstPlay = firstPlay;
    await store.set(fpKey, firstPlay);
  }

  // Minimum account age check for $10 tier — uses server-anchored timestamp.
  if (id === "cash10" && serverFirstPlay) {
    const ageDays = (Date.now() - new Date(serverFirstPlay).getTime()) / 86400000;
    if (ageDays < 12) {
      return res.status(403).json({ error: "Keep playing! $10 cash requires 12 days of play." });
    }
  }

  // Duplicate email+tier check
  const emailKey = `claim:email:${id}:${email.toLowerCase().trim()}`;
  if (await store.get(emailKey)) {
    return res.status(409).json({ error: "This email has already claimed this reward." });
  }

  // Duplicate device+tier check
  const deviceKey = `claim:device:${id}:${deviceId}`;
  if (await store.get(deviceKey)) {
    return res.status(409).json({ error: "This reward has already been claimed on this device." });
  }

  const claimId = genId();
  const claim = { _id: claimId, id, label, email, city, xp, firstPlay: serverFirstPlay, deviceId, ts: ts || new Date().toISOString() };
  await store.set(`claim:${claimId}`, claim);
  await store.set(emailKey, claimId);
  await store.set(deviceKey, claimId);
  console.log(`[claim] ${id} → ${email} device=${deviceId} xp=${xp}`);
  return res.json({ ok: true, claimId });
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────
const ADMIN_LOGIN_HTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UrbanIQ Admin</title>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:system-ui,sans-serif;background:#f4f4f4;display:flex;align-items:center;justify-content:center;min-height:100vh;}.box{background:#fff;border-radius:14px;padding:36px 32px;width:100%;max-width:340px;box-shadow:0 4px 24px rgba(0,0,0,.08);border:1px solid #e5e5e5;}h1{font-size:20px;font-weight:800;margin-bottom:4px;}p{font-size:12px;color:#888;margin-bottom:24px;}input{width:100%;padding:11px 14px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:12px;font-family:inherit;outline:none;}input:focus{border-color:#111;}button{width:100%;padding:12px;background:#111;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:.5px;font-family:inherit;}.err{color:#c00;font-size:12px;margin-top:8px;text-align:center;}</style></head>
<body><div class="box"><h1>UrbanIQ Admin</h1><p>Enter your admin password to continue.</p>
<form method="POST" action="/admin/login"><input type="password" name="password" placeholder="Password" autofocus autocomplete="current-password"/><button type="submit">SIGN IN →</button></form>
<div class="err" id="e"></div></div>
<script>const p=new URLSearchParams(location.search);if(p.get('err'))document.getElementById('e').textContent='Incorrect password — try again.';</script>
</body></html>`;

function adminAuth(req, res, next) {
  const pw = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS;
  if (!pw) return res.status(503).send("Admin not configured. Set ADMIN_PASSWORD in Railway.");
  const cookie = req.headers.cookie || "";
  const token = cookie.split(";").map(c => c.trim()).find(c => c.startsWith("admin_token="))?.split("=")[1];
  if (token === pw) return next();
  res.redirect("/admin/login");
}

app.get("/admin/login", (_req, res) => res.send(ADMIN_LOGIN_HTML));
app.post("/admin/login", express.urlencoded({ extended: false }), (req, res) => {
  const pw = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS;
  if (!pw || req.body.password !== pw) return res.redirect("/admin/login?err=1");
  res.setHeader("Set-Cookie", `admin_token=${pw}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
  res.redirect("/admin");
});

const ADMIN_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UrbanIQ Admin</title>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:system-ui,sans-serif;background:#f4f4f4;color:#111;padding:24px;max-width:900px;margin:0 auto;}h1{font-size:22px;font-weight:800;margin-bottom:6px;letter-spacing:-0.5px;}p.sub{font-size:12px;color:#888;margin-bottom:20px;}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:24px;}.stat{background:#fff;border-radius:10px;padding:14px 18px;border:1px solid #e5e5e5;}.stat-val{font-size:28px;font-weight:800;color:#0a0a0a;}.stat-lbl{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#888;margin-top:3px;}.section{background:#fff;border-radius:10px;border:1px solid #e5e5e5;margin-bottom:20px;overflow:hidden;}.section-hdr{padding:14px 18px;border-bottom:1px solid #e5e5e5;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#555;display:flex;justify-content:space-between;align-items:center;}table{width:100%;border-collapse:collapse;}th{text-align:left;padding:10px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;border-bottom:1px solid #f0f0f0;}td{padding:10px 14px;border-bottom:1px solid #f5f5f5;font-size:13px;vertical-align:middle;word-break:break-all;}tr:last-child td{border-bottom:none;}.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;}.pend{background:#fef3c7;color:#92400e;}.done{background:#d1fae5;color:#065f46;}.btn{padding:5px 12px;border:none;border-radius:5px;cursor:pointer;font-size:11px;font-weight:700;letter-spacing:.5px;font-family:inherit;}.btn-do{background:#111;color:#fff;}.btn-do:disabled{background:#ccc;cursor:default;}.refresh{background:none;border:1px solid #ddd;border-radius:6px;padding:5px 12px;font-size:11px;cursor:pointer;font-family:inherit;}</style></head>
<body>
<h1>UrbanIQ Admin</h1><p class="sub">Reward claims &amp; player stats</p>
<div class="stats">
  <div class="stat"><div class="stat-val" id="s-total">—</div><div class="stat-lbl">Total Claims</div></div>
  <div class="stat"><div class="stat-val" id="s-pending">—</div><div class="stat-lbl">Pending</div></div>
  <div class="stat"><div class="stat-val" id="s-fulfilled">—</div><div class="stat-lbl">Fulfilled</div></div>
  <div class="stat"><div class="stat-val" id="s-dau">—</div><div class="stat-lbl">Today's Players</div></div>
  <div class="stat"><div class="stat-val" id="s-pv30">—</div><div class="stat-lbl">Views (30d)</div></div>
  <div class="stat"><div class="stat-val" id="s-pvtoday">—</div><div class="stat-lbl">Views Today</div></div>
  <div class="stat"><div class="stat-val" id="s-mobile">—</div><div class="stat-lbl">Mobile %</div></div>
</div>
<div class="section">
  <div class="section-hdr">Page Views — Last 30 Days <button class="refresh" onclick="loadAnalytics()">↻ Refresh</button></div>
  <div style="padding:14px 18px">
    <canvas id="pv-chart" height="120" style="width:100%"></canvas>
  </div>
</div>
<div class="section" id="refs-section" style="display:none">
  <div class="section-hdr">Top Referrers</div>
  <table><thead><tr><th>Source</th><th>Visits</th></tr></thead><tbody id="refs-tbody"></tbody></table>
</div>
<div class="section">
  <div class="section-hdr">Reward Claims <button class="refresh" onclick="loadAll()">↻ Refresh</button></div>
  <table><thead><tr><th>Date</th><th>Reward</th><th>Email</th><th>City</th><th>XP</th><th>Status</th><th>Action</th></tr></thead>
  <tbody id="tbody"></tbody></table>
</div>
<script>
async function loadAll(){
  const [cr, sr] = await Promise.all([fetch('/api/claims'), fetch('/api/admin/stats')]);
  const claims = await cr.json();
  const stats = sr.ok ? await sr.json() : {};
  let pend=0, done=0;
  const tbody = document.getElementById('tbody');
  tbody.innerHTML='';
  claims.sort((a,b)=>new Date(b.ts)-new Date(a.ts));
  claims.forEach(c=>{
    if(c.fulfilled) done++; else pend++;
    const tr = document.createElement('tr');
    const cid = c._id || '';
    tr.innerHTML = '<td>'+new Date(c.ts).toLocaleDateString()+'</td>'
      +'<td>'+escHtml(c.label||c.id)+'</td>'
      +'<td>'+escHtml(c.email)+'</td>'
      +'<td>'+(c.city||'—')+'</td>'
      +'<td>'+(c.xp||'?')+'</td>'
      +'<td><span class="badge '+(c.fulfilled?'done':'pend')+'">'+(c.fulfilled?'Fulfilled':'Pending')+'</span></td>'
      +'<td><button class="btn btn-do" '+(c.fulfilled?'disabled':'')
      +' onclick="fulfill(\''+cid+'\',this)">'+(c.fulfilled?'Done':'Mark Fulfilled')+'</button></td>';
    tbody.appendChild(tr);
  });
  document.getElementById('s-total').textContent = claims.length;
  document.getElementById('s-pending').textContent = pend;
  document.getElementById('s-fulfilled').textContent = done;
  document.getElementById('s-dau').textContent = stats.dau ?? '—';
}
async function loadAnalytics(){
  const r = await fetch('/api/analytics?days=30');
  if(!r.ok) return;
  const d = await r.json();
  const today = new Date().toISOString().slice(0,10);
  const todayViews = (d.daily.find(x=>x.date===today)||{}).views || 0;
  document.getElementById('s-pv30').textContent = d.total.toLocaleString();
  document.getElementById('s-pvtoday').textContent = todayViews.toLocaleString();
  const pct = d.total ? Math.round((d.mobile/(d.mobile+d.desktop||1))*100) : 0;
  document.getElementById('s-mobile').textContent = pct+'%';
  drawChart(d.daily);
  if(d.topRefs && d.topRefs.length){
    document.getElementById('refs-section').style.display='';
    const tb = document.getElementById('refs-tbody');
    tb.innerHTML = d.topRefs.map(r=>'<tr><td>'+escHtml(r.host||'direct')+'</td><td>'+r.count+'</td></tr>').join('');
  }
}
function drawChart(daily){
  const canvas = document.getElementById('pv-chart');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth * devicePixelRatio;
  canvas.height = 120 * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  const W = canvas.offsetWidth, H = 120;
  ctx.clearRect(0,0,W,H);
  if(!daily.length) return;
  const max = Math.max(...daily.map(d=>d.views), 1);
  const barW = Math.max(2, Math.floor((W - daily.length) / daily.length));
  const gap = Math.floor((W - barW * daily.length) / (daily.length + 1));
  daily.forEach((d, i) => {
    const h = Math.round((d.views / max) * (H - 24));
    const x = gap + i * (barW + gap);
    const y = H - 16 - h;
    ctx.fillStyle = '#4169E1';
    ctx.beginPath();
    ctx.roundRect(x, y, barW, h, [2,2,0,0]);
    ctx.fill();
  });
  ctx.fillStyle = '#888';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'center';
  if(daily.length > 0) ctx.fillText(daily[0].date.slice(5), gap + barW/2, H - 2);
  if(daily.length > 1) ctx.fillText(daily[daily.length-1].date.slice(5), gap + (daily.length-1)*(barW+gap) + barW/2, H - 2);
}
async function fulfill(cid, btn){
  if(!cid){alert('No claim ID');return;}
  btn.disabled=true;btn.textContent='...';
  const r = await fetch('/api/claims/'+cid+'/fulfill',{method:'PATCH'});
  if(r.ok){
    const td=btn.closest('tr');
    td.querySelector('.badge').className='badge done';
    td.querySelector('.badge').textContent='Fulfilled';
    btn.textContent='Done';
    const p=document.getElementById('s-pending');const d=document.getElementById('s-fulfilled');
    p.textContent=Number(p.textContent)-1;d.textContent=Number(d.textContent)+1;
  }else{btn.disabled=false;btn.textContent='Mark Fulfilled';alert('Failed');}
}
function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
loadAll();loadAnalytics();
</script></body></html>`;

app.get("/admin", adminAuth, (_req, res) => res.send(ADMIN_HTML));

app.get("/api/claims", adminAuth, async (req, res) => {
  const keys = await store.list("claim:");
  const claimKeys = keys.filter(k => k.match(/^claim:[a-z0-9]+$/));
  const claims = await Promise.all(claimKeys.map(async k => {
    const c = await store.get(k);
    if (!c) return null;
    return c._id ? c : { ...c, _id: k.replace("claim:", "") };
  }));
  return res.json(claims.filter(Boolean));
});

app.patch("/api/claims/:claimId/fulfill", adminAuth, async (req, res) => {
  const { claimId } = req.params;
  const claim = await store.get(`claim:${claimId}`);
  if (!claim) return res.status(404).json({ error: "Claim not found." });
  await store.set(`claim:${claimId}`, { ...claim, fulfilled: true, fulfilledAt: new Date().toISOString() });
  return res.json({ ok: true });
});

app.get("/api/admin/stats", adminAuth, async (req, res) => {
  let dau = 0;
  if (supabase) {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase.from("leaderboard").select("device_id").gte("ts", today + "T00:00:00Z");
    if (data) dau = new Set(data.map(r => r.device_id).filter(Boolean)).size;
  }
  return res.json({ dau });
});

// ── ACCOUNTS (magic-link / OTP auth) ─────────────────────────────────────────
// Required Supabase tables (run once in dashboard):
//   CREATE TABLE IF NOT EXISTS users (
//     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     email TEXT UNIQUE NOT NULL,
//     display_name TEXT,
//     xp INTEGER NOT NULL DEFAULT 0,
//     streak INTEGER NOT NULL DEFAULT 0,
//     last_win_date TEXT,
//     shields INTEGER NOT NULL DEFAULT 0,
//     pro_status BOOLEAN NOT NULL DEFAULT false,
//     created_at TIMESTAMPTZ DEFAULT NOW(),
//     updated_at TIMESTAMPTZ DEFAULT NOW()
//   );
//   CREATE TABLE IF NOT EXISTS otps (
//     id BIGSERIAL PRIMARY KEY,
//     email TEXT NOT NULL,
//     code TEXT NOT NULL,
//     expires_at TIMESTAMPTZ NOT NULL,
//     used BOOLEAN NOT NULL DEFAULT false
//   );
//   CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email, used, expires_at);
//
// Required env vars: JWT_SECRET, and optionally RESEND_API_KEY for email delivery.
// Without RESEND_API_KEY the OTP is returned directly in the API response (dev mode).

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

// In-memory OTP fallback — used when Supabase otps table isn't set up yet
const _otpStore = new Map(); // email -> { code, expires }
function otpSet(email, code) { _otpStore.set(email, { code, expires: Date.now() + 10 * 60 * 1000 }); }
function otpGet(email) {
  const r = _otpStore.get(email);
  if (!r) return null;
  if (Date.now() > r.expires) { _otpStore.delete(email); return null; }
  return r.code;
}
function otpClear(email) { _otpStore.delete(email); }

function jwtRequired(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Not authenticated." });
  try {
    req.user = jwt.verify(auth.slice(7), process.env.JWT_SECRET || "urbaniq-dev-secret");
    next();
  } catch { return res.status(401).json({ error: "Invalid or expired token." }); }
}

async function sendOtpEmail(email, code) {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "UrbanIQ <noreply@urbaniq.quest>",
          to: [email],
          subject: `Your UrbanIQ sign-in code: ${code}`,
          html: `<p>Your UrbanIQ sign-in code is:</p><h1 style="letter-spacing:4px;font-size:36px">${code}</h1><p>This code expires in 10 minutes. If you didn't request this, ignore it.</p>`,
        }),
      });
      return true;
    } catch (e) { console.error("[auth/email]", e.message); }
  }
  console.log(`[auth/otp] ${email} → ${code}`);
  return false;
}

// POST /api/auth/send — send OTP to email
app.post("/api/auth/send", authLimiter, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Accounts not configured (needs Supabase)." });
  const { email } = req.body || {};
  if (!email || !/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: "Valid email required." });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const cleanEmail = email.toLowerCase().trim();
  let usedMemory = false;
  if (supabase) {
    const { error } = await supabase.from("otps").insert({ email: cleanEmail, code, expires_at: expiresAt, used: false });
    if (error) {
      console.warn("[auth/send] Supabase otps unavailable, using memory:", error.message);
      otpSet(cleanEmail, code);
      usedMemory = true;
    }
  } else {
    otpSet(cleanEmail, code);
    usedMemory = true;
  }
  const emailSent = await sendOtpEmail(cleanEmail, code);
  if (!emailSent && !process.env.RESEND_API_KEY) {
    return res.json({ ok: true, _devCode: code, note: "Set RESEND_API_KEY to send real emails." });
  }
  if (!emailSent) return res.status(500).json({ error: "Could not send code." });
  return res.json({ ok: true });
});

// POST /api/auth/verify — verify OTP, return JWT + user profile
app.post("/api/auth/verify", authLimiter, async (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) return res.status(400).json({ error: "Email and code required." });
  const cleanEmail = email.toLowerCase().trim();
  // Check in-memory store first (fallback when Supabase tables not ready)
  const memCode = otpGet(cleanEmail);
  if (memCode) {
    if (memCode !== code) return res.status(401).json({ error: "Invalid or expired code." });
    otpClear(cleanEmail);
  } else {
    if (!supabase) return res.status(503).json({ error: "Accounts not configured." });
    const { data: rows, error: qErr } = await supabase.from("otps")
      .select("*").eq("email", cleanEmail).eq("code", code).eq("used", false)
      .gte("expires_at", new Date().toISOString()).order("id", { ascending: false }).limit(1);
    if (qErr || !rows || rows.length === 0) return res.status(401).json({ error: "Invalid or expired code." });
    await supabase.from("otps").update({ used: true }).eq("id", rows[0].id);
  }
  let { data: users } = await supabase.from("users").select("*").eq("email", cleanEmail).limit(1);
  let user = users?.[0];
  if (!user) {
    const { data: newUser, error: insErr } = await supabase.from("users").insert({ email: cleanEmail }).select().single();
    if (insErr) { console.error("[auth/verify/insert]", insErr.message); return res.status(500).json({ error: "Account creation failed." }); }
    user = newUser;
  }
  const token = jwt.sign({ userId: user.id, email: cleanEmail }, process.env.JWT_SECRET || "urbaniq-dev-secret", { expiresIn: "90d" });
  return res.json({ ok: true, token, user: { id: user.id, email: user.email, displayName: user.display_name, xp: user.xp, streak: user.streak, shields: user.shields, proStatus: user.pro_status } });
});

// GET /api/me — fetch own profile
app.get("/api/me", jwtRequired, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Not configured." });
  const { data, error } = await supabase.from("users").select("*").eq("id", req.user.userId).single();
  if (error || !data) return res.status(404).json({ error: "User not found." });
  return res.json({ id: data.id, email: data.email, displayName: data.display_name, xp: data.xp, streak: data.streak, shields: data.shields, proStatus: data.pro_status });
});

// POST /api/me/sync — push local progress to server (take-max for XP, server wins for streak if more recent)
app.post("/api/me/sync", jwtRequired, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Not configured." });
  const { xp, streak, lastWinDate, shields, displayName } = req.body || {};
  const { data: cur } = await supabase.from("users").select("xp,streak,last_win_date,shields,display_name").eq("id", req.user.userId).single();
  if (!cur) return res.status(404).json({ error: "User not found." });
  const updates = {
    xp: Math.max(cur.xp || 0, Number(xp) || 0),
    streak: Number(streak) || cur.streak,
    last_win_date: lastWinDate || cur.last_win_date,
    shields: Math.max(cur.shields || 0, Number(shields) || 0),
    updated_at: new Date().toISOString(),
  };
  if (displayName) updates.display_name = String(displayName).trim().slice(0, 30);
  await supabase.from("users").update(updates).eq("id", req.user.userId);
  return res.json({ ok: true, ...updates });
});

// ── STRIPE ────────────────────────────────────────────────────────────────────
function stripeRequired(req, res, next) {
  if (!stripe) return res.status(503).json({ error: "Payments not configured." });
  next();
}

// List active products with their prices — frontend picks the "Supporter" product
app.get("/api/stripe/products", stripeRequired, async (req, res) => {
  try {
    const products = await stripe.products.list({ active: true, limit: 20 });
    const withPrices = await Promise.all(products.data.map(async (prod) => {
      const prices = await stripe.prices.list({ product: prod.id, active: true, limit: 10 });
      return { ...prod, prices: prices.data };
    }));
    return res.json({ data: withPrices });
  } catch (e) {
    console.error("[stripe/products]", e.message);
    return res.status(500).json({ error: e.message });
  }
});

// Create a Checkout Session → returns hosted Stripe URL
app.post("/api/stripe/checkout", stripeRequired, async (req, res) => {
  const { email, priceId, origin } = req.body || {};
  if (!email || !priceId || !origin) return res.status(400).json({ error: "Missing fields." });
  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/?supporter=1`,
      cancel_url: `${origin}/`,
      allow_promotion_codes: true,
    });
    return res.json({ url: session.url });
  } catch (e) {
    console.error("[stripe/checkout]", e.message);
    return res.status(500).json({ error: e.message });
  }
});

// Create a Customer Portal session so subscriber can manage/cancel
app.post("/api/stripe/portal", stripeRequired, async (req, res) => {
  const { email, origin } = req.body || {};
  if (!email || !origin) return res.status(400).json({ error: "Missing fields." });
  try {
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers.data.length) return res.status(404).json({ error: "Subscription not found." });
    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: origin,
    });
    return res.json({ url: session.url });
  } catch (e) {
    console.error("[stripe/portal]", e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ── LIVE LEADERBOARD ─────────────────────────────────────────────────────────
const scoresLimiter = rateLimit({ windowMs: 60000, max: 20, standardHeaders: true, legacyHeaders: false });

// POST /api/scores — submit a game session result
app.post("/api/scores", scoresLimiter, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Leaderboard not configured." });
  const { playerName, gameKey, difficulty, wins, rounds, totalGuesses, dayNum, deviceId } = req.body || {};
  if (!playerName || !gameKey || wins == null) return res.status(400).json({ error: "Missing fields." });
  const safe = String(playerName).trim().slice(0, 30);
  if (!safe) return res.status(400).json({ error: "Invalid name." });
  const { error } = await supabase.from("leaderboard").insert({
    player_name: safe, game_key: gameKey, difficulty: difficulty || "medium",
    wins: Number(wins) || 0, rounds: Number(rounds) || 3,
    total_guesses: Number(totalGuesses) || 0, day_num: Number(dayNum) || 0,
    device_id: deviceId || null,
  });
  if (error) { console.error("[scores/post]", error.message); return res.status(500).json({ error: error.message }); }
  return res.json({ ok: true });
});

// GET /api/scores?gameKey=dc&limit=15 — fetch top scores for a game
app.get("/api/scores", async (req, res) => {
  if (!supabase) return res.json([]);
  const gameKey = req.query.gameKey || "dc";
  const limit = Math.min(Number(req.query.limit) || 15, 50);
  const { data, error } = await supabase.from("leaderboard")
    .select("player_name,game_key,difficulty,wins,rounds,total_guesses,day_num,ts")
    .eq("game_key", gameKey)
    .order("wins", { ascending: false })
    .order("total_guesses", { ascending: true })
    .order("ts", { ascending: true })
    .limit(limit);
  if (error) { console.error("[scores/get]", error.message); return res.json([]); }
  return res.json(data || []);
});

// ── ANALYTICS ────────────────────────────────────────────────────────────────
// Supabase table (run once in dashboard):
//   CREATE TABLE IF NOT EXISTS page_views (
//     id BIGSERIAL PRIMARY KEY,
//     ts TIMESTAMPTZ DEFAULT NOW(),
//     path TEXT NOT NULL DEFAULT '/',
//     referrer TEXT,
//     country TEXT,
//     ua_type TEXT  -- 'mobile' | 'desktop' | 'bot'
//   );
//   CREATE INDEX IF NOT EXISTS idx_pv_ts ON page_views(ts DESC);

const _mem = { total: 0, days: {}, refs: {} }; // in-memory fallback

function uaType(ua = "") {
  if (/bot|crawl|spider|slurp|facebookexternalhit|twitterbot/i.test(ua)) return "bot";
  if (/mobile|android|iphone|ipad/i.test(ua)) return "mobile";
  return "desktop";
}

// Track every page-load (non-API, non-asset)
app.use(async (req, res, next) => {
  next();
  if (req.method !== "GET") return;
  if (/^\/api\/|^\/manifest|\./.test(req.path)) return;
  const today = new Date().toISOString().slice(0, 10);
  const ua = req.headers["user-agent"] || "";
  const type = uaType(ua);
  if (type === "bot") return;
  const ref = (req.headers.referer || req.headers.referrer || "").slice(0, 200);
  const pth = req.path.slice(0, 100);
  // in-memory
  _mem.total++;
  _mem.days[today] = (_mem.days[today] || 0) + 1;
  if (ref) { try { const h = new URL(ref).hostname; if (h) _mem.refs[h] = (_mem.refs[h] || 0) + 1; } catch {} }
  // persist to Supabase if available
  if (supabase) {
    supabase.from("page_views").insert({ path: pth, referrer: ref || null, ua_type: type }).then(() => {});
  }
});

app.get("/api/analytics", adminAuth, async (req, res) => {
  const days = Number(req.query.days) || 30;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  if (supabase) {
    const { data, error } = await supabase
      .from("page_views")
      .select("ts, referrer, ua_type")
      .gte("ts", since)
      .neq("ua_type", "bot");
    if (error) return res.status(500).json({ error: error.message });
    const rows = data || [];
    const dailyMap = {};
    const refMap = {};
    let mobile = 0, desktop = 0;
    for (const r of rows) {
      const d = r.ts.slice(0, 10);
      dailyMap[d] = (dailyMap[d] || 0) + 1;
      if (r.referrer) { try { const h = new URL(r.referrer).hostname; refMap[h] = (refMap[h] || 0) + 1; } catch {} }
      if (r.ua_type === "mobile") mobile++; else desktop++;
    }
    const daily = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, views]) => ({ date, views }));
    const topRefs = Object.entries(refMap).sort(([,a], [,b]) => b - a).slice(0, 10).map(([host, count]) => ({ host, count }));
    return res.json({ total: rows.length, daily, topRefs, mobile, desktop, days });
  }
  // fallback: return in-memory stats
  const daily = Object.entries(_mem.days).sort(([a], [b]) => a.localeCompare(b)).map(([date, views]) => ({ date, views }));
  const topRefs = Object.entries(_mem.refs).sort(([,a], [,b]) => b - a).slice(0, 10).map(([host, count]) => ({ host, count }));
  return res.json({ total: _mem.total, daily, topRefs, note: "In-memory only — add Supabase for persistence" });
});



// ── PHYSICAL CARD REDEMPTION ──────────────────────────────────────────────────
// In-memory code store (replace with Supabase later)
const CARD_CATALOG = {
  "PDX-C-0001": { city:"Portland", stationName:"Pioneer Square North", rarity:"Common", ability:"Local Knowledge", power:32, fact:"Pioneer Square North is one of the oldest MAX stops, opening in 1986." },
  "PDX-U-0002": { city:"Portland", stationName:"Gateway/NE 99th Ave TC", rarity:"Uncommon", ability:"Transfer Point", power:48, fact:"Gateway is the only MAX station served by all four light rail lines." },
  "PDX-R-0003": { city:"Portland", stationName:"Lloyd District/NE 11th Ave", rarity:"Rare", ability:"Express Service", power:65, fact:"Lloyd District station sits at the heart of Portland's sports and entertainment zone." },
  "PDX-L-0004": { city:"Portland", stationName:"Hillsboro Central/SE 3rd", rarity:"Legendary", ability:"Westside Rush", power:88, fact:"Hillsboro Central anchors the western terminus of MAX's Blue Line." },
  "DC-C-0001": { city:"Washington DC", stationName:"Capitol South", rarity:"Common", ability:"Government Work", power:35, fact:"Capitol South is steps from the US Capitol building and House offices." },
  "DC-U-0002": { city:"Washington DC", stationName:"Dupont Circle", rarity:"Uncommon", ability:"Circle Transfer", power:52, fact:"Dupont Circle has two entrances—Q Street and P Street—both beloved by locals." },
  "DC-R-0003": { city:"Washington DC", stationName:"Metro Center", rarity:"Rare", ability:"Hub Control", power:71, fact:"Metro Center is the only station where Red, Orange, Silver, and Blue lines meet." },
  "DC-L-0004": { city:"Washington DC", stationName:"Union Station", rarity:"Legendary", ability:"Grand Arrival", power:92, fact:"Union Station is one of the busiest train stations in the US, handling Amtrak and Metro." },
  "NYC-C-0001": { city:"New York City", stationName:"116 St-Columbia University", rarity:"Common", ability:"Academic Edge", power:30, fact:"116th Street station serves both Columbia University and Barnard College." },
  "NYC-R-0002": { city:"New York City", stationName:"Times Sq-42 St", rarity:"Rare", ability:"Crossroads", power:78, fact:"Times Square is the most complex subway station in New York, with 10 lines converging." },
  "NYC-L-0003": { city:"New York City", stationName:"Grand Central-42 St", rarity:"Legendary", ability:"Terminal Rush", power:95, fact:"Grand Central Terminal sees 750,000 people daily — more than any airport in the country." },
  "TEST-L-0001": { city:"Test City", stationName:"Test Station", rarity:"Legendary", ability:"Debug Power", power:99, fact:"This is a test card for development purposes." },
};
const _redeemedCodes = new Map(); // code -> { deviceId, ts }

app.post("/api/redeem-card", (req, res) => {
  const { code, deviceId } = req.body || {};
  if (!code || typeof code !== "string") return res.status(400).json({ error: "Missing code." });
  const clean = code.trim().toUpperCase();
  const card = CARD_CATALOG[clean];
  if (!card) return res.status(404).json({ error: "Invalid card code." });
  if (_redeemedCodes.has(clean)) {
    const r = _redeemedCodes.get(clean);
    if (r.deviceId !== deviceId) return res.status(409).json({ error: "Already redeemed." });
  }
  _redeemedCodes.set(clean, { deviceId: deviceId || "unknown", ts: Date.now() });
  return res.json({ ok: true, card });
});

app.get("/api/card/:code", (req, res) => {
  const clean = (req.params.code || "").trim().toUpperCase();
  const card = CARD_CATALOG[clean];
  if (!card) return res.status(404).json({ error: "Invalid card code." });
  return res.json({ card, alreadyRedeemed: _redeemedCodes.has(clean) });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`UrbanIQ running on http://0.0.0.0:${PORT}`);
});
