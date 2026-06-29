const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Verify user is part of a match
async function getMatch(matchId, userId) {
  const { rows } = await query(
    'SELECT * FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
    [matchId, userId]
  );
  return rows[0] || null;
}

// GET /messages/:matchId
router.get('/:matchId', authenticate, async (req, res) => {
  const match = await getMatch(req.params.matchId, req.user.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const { rows } = await query(
    'SELECT * FROM messages WHERE match_id = $1 ORDER BY created_at ASC',
    [req.params.matchId]
  );

  // Mark incoming messages as read
  await query(
    `UPDATE messages SET read_at = NOW()
     WHERE match_id = $1 AND sender_id != $2 AND read_at IS NULL`,
    [req.params.matchId, req.user.id]
  );

  res.json({ messages: rows });
});

// POST /messages/:matchId  — send text message
router.post('/:matchId', authenticate, async (req, res) => {
  const match = await getMatch(req.params.matchId, req.user.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content required' });

  const { rows } = await query(
    `INSERT INTO messages (match_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *`,
    [req.params.matchId, req.user.id, content.trim()]
  );

  const message = rows[0];
  // Socket broadcast handled in socket layer — REST response gives msg back to sender
  res.status(201).json({ message });
});

// POST /messages/:matchId/photo  — send photo
router.post('/:matchId/photo', authenticate, upload.single('photo'), async (req, res) => {
  const match = await getMatch(req.params.matchId, req.user.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (!req.file) return res.status(400).json({ error: 'Photo required' });

  const photoUrl = `/uploads/${req.file.filename}`;
  const { rows } = await query(
    `INSERT INTO messages (match_id, sender_id, photo_url) VALUES ($1, $2, $3) RETURNING *`,
    [req.params.matchId, req.user.id, photoUrl]
  );
  res.status(201).json({ message: rows[0] });
});

module.exports = router;
