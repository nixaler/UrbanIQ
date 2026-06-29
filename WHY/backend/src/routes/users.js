const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /users/me
router.get('/me', authenticate, async (req, res) => {
  const { rows: photos } = await query(
    'SELECT * FROM photos WHERE user_id = $1 ORDER BY sort_order', [req.user.id]
  );
  const { rows: prompts } = await query(
    'SELECT * FROM user_prompts WHERE user_id = $1 ORDER BY sort_order', [req.user.id]
  );
  res.json({ user: sanitize(req.user), photos, prompts });
});

// PATCH /users/me
router.patch('/me', authenticate, async (req, res) => {
  const allowed = ['name', 'bio', 'gender', 'seeking', 'latitude', 'longitude',
    'location_city', 'filter_min_age', 'filter_max_age', 'filter_max_distance',
    'filter_genders', 'profile_paused', 'feedback_opt_out', 'hidden_from_feedback'];

  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });

  const cols = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const vals = [...Object.values(updates), req.user.id];
  const { rows } = await query(
    `UPDATE users SET ${cols} WHERE id = $${vals.length} RETURNING *`, vals
  );
  res.json({ user: sanitize(rows[0]) });
});

// DELETE /users/me  (full account deletion)
router.delete('/me', authenticate, async (req, res) => {
  await query('UPDATE users SET deleted_at = NOW() WHERE id = $1', [req.user.id]);
  res.json({ message: 'Account deleted' });
});

// GET /users/presets  (preset prompts)
router.get('/presets', authenticate, async (req, res) => {
  const { rows } = await query('SELECT * FROM preset_prompts ORDER BY id');
  res.json({ prompts: rows });
});

// POST /users/me/photos
router.post('/me/photos', authenticate, upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Photo required' });

  const { rows: existing } = await query(
    'SELECT COUNT(*) FROM photos WHERE user_id = $1', [req.user.id]
  );
  if (parseInt(existing[0].count) >= 9) {
    return res.status(400).json({ error: 'Maximum 9 photos' });
  }

  const url = `/uploads/${req.file.filename}`;
  const sortOrder = parseInt(existing[0].count);
  const { rows } = await query(
    'INSERT INTO photos (user_id, url, sort_order) VALUES ($1, $2, $3) RETURNING *',
    [req.user.id, url, sortOrder]
  );
  res.status(201).json({ photo: rows[0] });
});

// DELETE /users/me/photos/:id
router.delete('/me/photos/:id', authenticate, async (req, res) => {
  const { rowCount } = await query(
    'DELETE FROM photos WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]
  );
  if (!rowCount) return res.status(404).json({ error: 'Photo not found' });
  res.json({ message: 'Deleted' });
});

// PUT /users/me/photos/order
router.put('/me/photos/order', authenticate, async (req, res) => {
  const { order } = req.body; // array of photo ids in desired order
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be array' });
  for (let i = 0; i < order.length; i++) {
    await query(
      'UPDATE photos SET sort_order = $1 WHERE id = $2 AND user_id = $3',
      [i, order[i], req.user.id]
    );
  }
  res.json({ message: 'Order updated' });
});

// POST /users/me/prompts
router.post('/me/prompts', authenticate, async (req, res) => {
  const { prompts } = req.body; // [{prompt_text, answer, sort_order}]
  if (!Array.isArray(prompts)) return res.status(400).json({ error: 'prompts must be array' });

  await query('DELETE FROM user_prompts WHERE user_id = $1', [req.user.id]);
  for (const p of prompts.slice(0, 3)) {
    await query(
      'INSERT INTO user_prompts (user_id, prompt_text, answer, sort_order) VALUES ($1, $2, $3, $4)',
      [req.user.id, p.prompt_text, p.answer, p.sort_order || 0]
    );
  }
  const { rows } = await query('SELECT * FROM user_prompts WHERE user_id = $1 ORDER BY sort_order', [req.user.id]);
  res.json({ prompts: rows });
});

// GET /users/:id  (view another user's profile)
router.get('/:id', authenticate, async (req, res) => {
  const { rows: blocked } = await query(
    'SELECT 1 FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)',
    [req.user.id, req.params.id]
  );
  if (blocked.length) return res.status(404).json({ error: 'User not found' });

  const { rows } = await query(
    `SELECT id, name, date_of_birth, gender, bio, curiosity_score, identity_verified,
            profile_paused, last_active_at, location_city, latitude, longitude
     FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });

  const { rows: photos } = await query(
    'SELECT * FROM photos WHERE user_id = $1 ORDER BY sort_order', [req.params.id]
  );
  const { rows: prompts } = await query(
    'SELECT * FROM user_prompts WHERE user_id = $1 ORDER BY sort_order', [req.params.id]
  );

  const user = rows[0];
  const age = getAge(user.date_of_birth);
  const recentlyActive = (Date.now() - new Date(user.last_active_at).getTime()) < 24 * 60 * 60 * 1000;

  res.json({ user: { ...user, age, recently_active: recentlyActive }, photos, prompts });
});

// POST /users/:id/block
router.post('/:id/block', authenticate, async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot block yourself' });
  await query(
    'INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [req.user.id, req.params.id]
  );
  res.json({ message: 'User blocked' });
});

function sanitize(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

function getAge(dob) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

module.exports = router;
