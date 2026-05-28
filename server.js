const express = require("express");
const path = require("path");

const app = express();
const PORT = 5000;
app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));

// Replit DB with in-memory fallback
let db = null;
const mem = {};
try {
  const DB = require("@replit/database");
  db = new DB();
  console.log("[battle] Replit DB connected");
} catch(e) {
  console.log("[battle] Using in-memory store (Replit DB unavailable)");
}

const store = {
  async get(k) {
    try { return db ? await db.get(k) : (mem[k] ?? null); } catch { return null; }
  },
  async set(k, v) {
    try { if (db) await db.set(k, v); else mem[k] = v; } catch {}
  },
  async del(k) {
    try { if (db) await db.delete(k); else delete mem[k]; } catch {}
  },
  async list(prefix) {
    try {
      if (db) return await db.list(prefix);
      return Object.keys(mem).filter(k => k.startsWith(prefix));
    } catch { return []; }
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

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`UrbanIQ running on http://0.0.0.0:${PORT}`);
});
