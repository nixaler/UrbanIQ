#!/usr/bin/env node
// Offline script to generate a batch of card codes for a print run.
// Usage: node scripts/generate-card-codes.js --city PDX --rarity R --qty 50 --start 1
// Output: CSV to stdout, pipe to file: > codes.csv

const args = process.argv.slice(2);
function getArg(flag, def) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : def;
}

const city = (getArg("--city", "PDX")).toUpperCase();
const rarity = (getArg("--rarity", "C")).toUpperCase().charAt(0);
const qty = parseInt(getArg("--qty", "10"), 10);
const start = parseInt(getArg("--start", "1"), 10);

const RARITY_NAMES = { C: "Common", U: "Uncommon", R: "Rare", L: "Legendary" };
if (!RARITY_NAMES[rarity]) {
  console.error(`Invalid rarity "${rarity}". Use C, U, R, or L.`);
  process.exit(1);
}

const lines = ["code,city,rarity,qr_url"];
for (let i = 0; i < qty; i++) {
  const seq = String(start + i).padStart(4, "0");
  const code = `${city}-${rarity}-${seq}`;
  const qrUrl = `https://urbaniq.quest/card?code=${code}`;
  lines.push(`${code},${city},${RARITY_NAMES[rarity]},${qrUrl}`);
}

console.log(lines.join("\n"));
