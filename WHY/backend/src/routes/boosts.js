const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// GET /boosts/status
router.get('/status', authenticate, async (req, res) => {
  const { rows: active } = await query(
    'SELECT * FROM boosts WHERE user_id = $1 AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1',
    [req.user.id]
  );
  res.json({
    boosts_remaining: req.user.boosts_remaining,
    active_boost: active[0] || null,
  });
});

// POST /boosts/activate  — use a boost
router.post('/activate', authenticate, async (req, res) => {
  if (req.user.boosts_remaining < 1) {
    return res.status(400).json({ error: 'No boosts remaining. Purchase more.' });
  }

  const { rows: existing } = await query(
    'SELECT 1 FROM boosts WHERE user_id = $1 AND expires_at > NOW()', [req.user.id]
  );
  if (existing.length) return res.status(400).json({ error: 'A boost is already active' });

  const durationMin = 30;
  const expiresAt = new Date(Date.now() + durationMin * 60 * 1000);

  const { rows } = await query(
    `INSERT INTO boosts (user_id, activated_at, expires_at, duration_min)
     VALUES ($1, NOW(), $2, $3) RETURNING *`,
    [req.user.id, expiresAt, durationMin]
  );

  await query(
    'UPDATE users SET boosts_remaining = boosts_remaining - 1 WHERE id = $1',
    [req.user.id]
  );

  res.status(201).json({ boost: rows[0], boosts_remaining: req.user.boosts_remaining - 1 });
});

// POST /boosts/purchase  — à la carte purchase (stub: real implementation uses StoreKit)
router.post('/purchase', authenticate, async (req, res) => {
  const { quantity = 1, receipt_data } = req.body;
  if (!receipt_data) return res.status(400).json({ error: 'receipt_data required (App Store receipt)' });

  // TODO: validate receipt with Apple StoreKit API
  // For now, stub: just credit the user
  const qty = Math.min(parseInt(quantity) || 1, 10);
  await query(
    'UPDATE users SET boosts_remaining = boosts_remaining + $1 WHERE id = $2',
    [qty, req.user.id]
  );
  const { rows } = await query('SELECT boosts_remaining FROM users WHERE id = $1', [req.user.id]);
  res.json({ message: `${qty} boost(s) added`, boosts_remaining: rows[0].boosts_remaining });
});

// POST /boosts/premium  — activate premium subscription (stub)
router.post('/premium', authenticate, async (req, res) => {
  const { receipt_data } = req.body;
  if (!receipt_data) return res.status(400).json({ error: 'receipt_data required' });

  // TODO: validate with Apple StoreKit
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await query(
    `UPDATE users SET is_premium = true, premium_expires_at = $1, boosts_remaining = boosts_remaining + 5
     WHERE id = $2`,
    [expiresAt, req.user.id]
  );
  res.json({ message: 'Premium activated', expires_at: expiresAt, monthly_boosts_added: 5 });
});

module.exports = router;
