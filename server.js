const express = require("express");
const path = require("path");
const Stripe = require("stripe");

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());

// ── SECURITY: block common bot probe paths ─────────────────────────────────────
const BOT_PROBE_RE = /^\/?(\.env|\.git|\.svn|\.hg|\.DS_Store|wp-admin|wp-login|phpinfo|\.php|web\.config|Dockerfile|docker-compose|\.aws|\.ssh|\.bash_history|\.bashrc|node_modules\/.bin)(\/|$)/i;
app.use((req, res, next) => {
  if (BOT_PROBE_RE.test(req.path)) {
    return res.status(404).end();
  }
  next();
});

// ── STRIPE ROUTES ──────────────────────────────────────────────────────────────
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;
const PRODUCT_ID = "prod_UZxyu1sQCPZH6u";

// GET /api/stripe/products — return product + prices (auto-create if needed)
app.get("/api/stripe/products", async (_req, res) => {
  if (!stripe) return res.json({ data: [] });
  try {
    // Find or create the UrbanIQ Supporter product
    let productId = PRODUCT_ID;
    let product;
    try {
      product = await stripe.products.retrieve(productId);
    } catch {
      // Product not found in this mode — search by name
      const list = await stripe.products.list({ active: true, limit: 20 });
      product = list.data.find(p => p.name === "UrbanIQ Supporter");
      if (!product) {
        product = await stripe.products.create({
          name: "UrbanIQ Supporter",
          description: "Support UrbanIQ and keep it free & ad-free. Unlock streak shields, leaderboard badge, and exclusive themes."
        });
        // Create prices for the new product
        await stripe.prices.create({ product: product.id, unit_amount: 300, currency: "usd", recurring: { interval: "month" } });
        await stripe.prices.create({ product: product.id, unit_amount: 2500, currency: "usd", recurring: { interval: "year" } });
      }
      productId = product.id;
    }
    const prices = await stripe.prices.list({ product: productId, active: true });
    res.json({ data: [{ ...product, prices: prices.data }] });
  } catch (e) {
    console.error("[stripe] products error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/stripe/checkout — create checkout session
app.post("/api/stripe/checkout", async (req, res) => {
  if (!stripe) return res.status(503).json({ error: "Payments not configured" });
  try {
    const { email, priceId, origin } = req.body;
    if (!email || !priceId) return res.status(400).json({ error: "Missing email or priceId" });
    // If priceId is a placeholder, look up the real price
    let realPriceId = priceId;
    if (priceId.includes("placeholder")) {
      const interval = priceId.includes("monthly") ? "month" : "year";
      const list = await stripe.products.list({ active: true, limit: 20 });
      const product = list.data.find(p => p.name === "UrbanIQ Supporter");
      if (product) {
        const prices = await stripe.prices.list({ product: product.id, active: true });
        const match = prices.data.find(p => p.recurring?.interval === interval);
        if (match) realPriceId = match.id;
      }
    }
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: realPriceId, quantity: 1 }],
      success_url: `${origin}/?supporter=success`,
      cancel_url: `${origin}/?supporter=cancel`,
      metadata: { email }
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error("[stripe] checkout error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/stripe/portal — customer billing portal
app.post("/api/stripe/portal", async (req, res) => {
  if (!stripe) return res.status(503).json({ error: "Payments not configured" });
  try {
    const { email, origin } = req.body;
    if (!email) return res.status(400).json({ error: "Missing email" });
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers.data.length) return res.status(404).json({ error: "No subscription found for this email" });
    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${origin}/`
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error("[stripe] portal error:", e.message);
    res.status(500).json({ error: e.message });
  }
});
app.use(express.static(path.join(__dirname, "dist")));

  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const store = {
    async get(k) {
      try {
        const { data } = await supabase
          .from("kv_store").select("value")
          .eq("key", k).single();
        return data?.value ?? null;
      } catch { return null; }
    },
    async set(k, v) {
      try {
        await supabase.from("kv_store")
          .upsert({ key: k, value: v });
      } catch {}
    },
    async del(k) {
      try {
        await supabase.from("kv_store")
          .delete().eq("key", k);
      } catch {}
    },
    async list(prefix) {
      try {
        const { data } = await supabase
          .from("kv_store").select("key")
          .like("key", `${prefix}%`);
        return (data || []).map(r => r.key);
      } catch { return []; }
    }
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

// ── DAILY PUZZLE LEADERBOARD ──────────────────────────────────────────────────

const VALID_GAMES = new Set(["pdx","dc","balt","states","nfl","la","nyc","chi"]);
const VALID_DIFFS = new Set(["normal","hard","pro"]);

function sanitizeName(n) {
  if (typeof n !== "string") return "Anonymous";
  return n.replace(/[<>"'&]/g, "").trim().slice(0, 30) || "Anonymous";
}

// POST /api/scores/submit
app.post("/api/scores/submit", async (req, res) => {
  try {
    const { playerName, gameKey, dayNum, roundIdx, difficulty, guessCount, won } = req.body;
    if (!VALID_GAMES.has(gameKey)) return res.status(400).json({ error: "Invalid game" });
    if (typeof dayNum !== "number" || dayNum < 1 || dayNum > 99999) return res.status(400).json({ error: "Invalid dayNum" });
    if (typeof guessCount !== "number" || guessCount < 1 || guessCount > 20) return res.status(400).json({ error: "Invalid guessCount" });
    const key = `daily:${gameKey}:${dayNum}`;
    const _raw = await store.get(key);
    const arr = Array.isArray(_raw) ? _raw : [];
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      playerName: sanitizeName(playerName),
      guessCount: Math.floor(guessCount),
      won: !!won,
      difficulty: VALID_DIFFS.has(difficulty) ? difficulty : "normal",
      roundIdx: Math.max(0, Math.min(2, Math.floor(roundIdx) || 0)),
      ts: new Date().toISOString()
    };
    arr.push(entry);
    arr.sort((a, b) => (b.won - a.won) || (a.guessCount - b.guessCount) || new Date(a.ts) - new Date(b.ts));
    await store.set(key, arr.slice(0, 500));
    const rank = arr.findIndex(e => e.id === entry.id) + 1;
    res.json({ ok: true, rank, total: arr.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/scores/leaderboard/:gameKey/:dayNum
app.get("/api/scores/leaderboard/:gameKey/:dayNum", async (req, res) => {
  try {
    const { gameKey, dayNum } = req.params;
    if (!VALID_GAMES.has(gameKey)) return res.status(400).json({ error: "Invalid game" });
    const dn = parseInt(dayNum, 10);
    if (!dn || dn < 1) return res.status(400).json({ error: "Invalid dayNum" });
    const _raw2 = await store.get(`daily:${gameKey}:${dn}`);
    const arr = Array.isArray(_raw2) ? _raw2 : [];
    res.json({ entries: arr.slice(0, 50), total: arr.length });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/scores/stats — global aggregate counts
app.get("/api/scores/stats", async (req, res) => {
  try {
    const keys = await store.list("daily:");
    let total = 0, wins = 0;
    for (const k of keys) {
      const _r = await store.get(k);
      const arr = Array.isArray(_r) ? _r : [];
      total += arr.length;
      wins += arr.filter(e => e.won).length;
    }
    res.json({ total, wins });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/health — lets frontend detect if PvP API is available
app.get("/api/health", (_req, res) => res.json({ pvp: true, db: !!db }));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`UrbanIQ running on http://0.0.0.0:${PORT}`);
});
