const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, requirePremium } = require('../middleware/auth');

// GET /matches  — list all matches with last message preview
router.get('/', authenticate, async (req, res) => {
  const { rows } = await query(
    `SELECT m.*,
            CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END AS other_user_id,
            (SELECT row_to_json(msg) FROM (
              SELECT content, photo_url, created_at, sender_id
              FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1
            ) msg) AS last_message,
            (SELECT COUNT(*) FROM messages
             WHERE match_id = m.id AND sender_id != $1 AND read_at IS NULL) AS unread_count
     FROM matches m
     WHERE (m.user1_id = $1 OR m.user2_id = $1)
     ORDER BY (SELECT created_at FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) DESC NULLS LAST,
              m.created_at DESC`,
    [req.user.id]
  );

  const withProfiles = await Promise.all(
    rows.map(async (match) => {
      const { rows: users } = await query(
        `SELECT u.id, u.name, u.identity_verified, u.last_active_at,
                (SELECT url FROM photos WHERE user_id = u.id ORDER BY sort_order LIMIT 1) AS photo
         FROM users u WHERE u.id = $1`,
        [match.other_user_id]
      );
      return { ...match, other_user: users[0] || null };
    })
  );

  res.json({ matches: withProfiles });
});

// GET /matches/likes  — premium: who liked me before matching
router.get('/likes', authenticate, requirePremium, async (req, res) => {
  const { rows } = await query(
    `SELECT s.swiper_id, s.created_at,
            u.name, u.identity_verified,
            (SELECT url FROM photos WHERE user_id = u.id ORDER BY sort_order LIMIT 1) AS photo
     FROM swipes s
     JOIN users u ON u.id = s.swiper_id
     WHERE s.swiped_id = $1 AND s.direction = 'right' AND s.undone = false
       AND NOT EXISTS (
         SELECT 1 FROM matches m
         WHERE (m.user1_id = LEAST(s.swiper_id, $1) AND m.user2_id = GREATEST(s.swiper_id, $1))
       )
       AND NOT EXISTS (
         SELECT 1 FROM blocks b
         WHERE (b.blocker_id = $1 AND b.blocked_id = s.swiper_id)
            OR (b.blocker_id = s.swiper_id AND b.blocked_id = $1)
       )
     ORDER BY s.created_at DESC`,
    [req.user.id]
  );
  res.json({ likes: rows });
});

// DELETE /matches/:id  — unmatch
router.delete('/:id', authenticate, async (req, res) => {
  const { rowCount } = await query(
    `DELETE FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
    [req.params.id, req.user.id]
  );
  if (!rowCount) return res.status(404).json({ error: 'Match not found' });
  res.json({ message: 'Unmatched' });
});

module.exports = router;
