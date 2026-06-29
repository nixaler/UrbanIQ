const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { sendPush } = require('../services/notifications');

const FREE_SWIPES_PER_DAY = 50;
const LEFT_SWIPES_PER_FEEDBACK_BATCH = 5;

// GET /swipes/stack  — get next cards to show
router.get('/stack', authenticate, async (req, res) => {
  const u = req.user;
  const limit = parseInt(req.query.limit) || 20;

  // Apply dealbreaker filters + exclude already-swiped + blocked
  const { rows } = await query(
    `SELECT u.id, u.name, u.date_of_birth, u.gender, u.bio, u.curiosity_score,
            u.identity_verified, u.last_active_at, u.location_city,
            u.latitude, u.longitude,
            EXTRACT(YEAR FROM AGE(u.date_of_birth))::INT AS age,
            (DATE_PART('day', NOW() - u.last_active_at) < 1) AS recently_active,
            EXISTS(SELECT 1 FROM boosts b WHERE b.user_id = u.id AND b.expires_at > NOW()) AS is_boosted
     FROM users u
     WHERE u.id != $1
       AND u.deleted_at IS NULL
       AND u.profile_paused = false
       AND ($2::varchar[] = '{}' OR u.gender = ANY($2::varchar[]))
       AND EXTRACT(YEAR FROM AGE(u.date_of_birth))::INT BETWEEN $3 AND $4
       AND u.id NOT IN (
         SELECT swiped_id FROM swipes WHERE swiper_id = $1 AND undone = false
       )
       AND u.id NOT IN (
         SELECT blocked_id FROM blocks WHERE blocker_id = $1
         UNION
         SELECT blocker_id FROM blocks WHERE blocked_id = $1
       )
       AND ($5 IS NULL OR u.latitude IS NULL OR (
         6371 * acos(
           cos(radians($5)) * cos(radians(u.latitude)) *
           cos(radians(u.longitude) - radians($6)) +
           sin(radians($5)) * sin(radians(u.latitude))
         ) <= $7
       ))
     ORDER BY is_boosted DESC, u.last_active_at DESC
     LIMIT $8`,
    [
      u.id,
      u.filter_genders,
      u.filter_min_age,
      u.filter_max_age,
      u.latitude || null,
      u.longitude || null,
      u.filter_max_distance,
      limit,
    ]
  );

  // Attach first photo to each card
  const withPhotos = await Promise.all(
    rows.map(async (user) => {
      const { rows: photos } = await query(
        'SELECT url FROM photos WHERE user_id = $1 ORDER BY sort_order LIMIT 3', [user.id]
      );
      return { ...user, photos: photos.map((p) => p.url) };
    })
  );

  res.json({ cards: withPhotos });
});

// POST /swipes  — record a swipe
router.post('/', authenticate, async (req, res) => {
  const { target_id, direction } = req.body;
  if (!target_id || !['left', 'right'].includes(direction)) {
    return res.status(400).json({ error: 'target_id and direction (left|right) required' });
  }
  if (target_id === req.user.id) return res.status(400).json({ error: 'Cannot swipe yourself' });

  const u = req.user;

  // Enforce daily swipe limit for free users
  if (!u.is_premium) {
    const reset = new Date(u.swipes_reset_at);
    const now = new Date();
    const sameDay = reset.toDateString() === now.toDateString();
    const used = sameDay ? u.swipes_used_today : 0;

    if (used >= FREE_SWIPES_PER_DAY) {
      return res.status(429).json({ error: 'Daily swipe limit reached', limit: FREE_SWIPES_PER_DAY });
    }

    await query(
      `UPDATE users SET swipes_used_today = $1, swipes_reset_at = $2 WHERE id = $3`,
      [sameDay ? used + 1 : 1, sameDay ? u.swipes_reset_at : now, u.id]
    );
  }

  // Upsert swipe
  let swipeRow;
  try {
    const { rows } = await query(
      `INSERT INTO swipes (swiper_id, swiped_id, direction)
       VALUES ($1, $2, $3)
       ON CONFLICT (swiper_id, swiped_id) DO UPDATE SET direction = $3, undone = false
       RETURNING *`,
      [u.id, target_id, direction]
    );
    swipeRow = rows[0];
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Swipe failed' });
  }

  let match = null;

  if (direction === 'right') {
    // Check mutual like
    const { rows: mutual } = await query(
      'SELECT 1 FROM swipes WHERE swiper_id = $1 AND swiped_id = $2 AND direction = $3 AND undone = false',
      [target_id, u.id, 'right']
    );
    if (mutual.length) {
      // Create match (ensure user1_id < user2_id)
      const [a, b] = [u.id, target_id].sort();
      const { rows: matchRows } = await query(
        `INSERT INTO matches (user1_id, user2_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING RETURNING *`,
        [a, b]
      );
      if (matchRows.length) {
        match = matchRows[0];
        await sendPush(target_id, "It's a match! 🎉", `You matched with ${u.name}`, { type: 'match', matchId: match.id });
        await sendPush(u.id, "It's a match! 🎉", `You matched with someone new`, { type: 'match', matchId: match.id });
      }
    }
  }

  if (direction === 'left') {
    await handleLeftSwipeFeedback(swipeRow, target_id);
  }

  res.json({ swipe: swipeRow, match });
});

// POST /swipes/undo  — undo last swipe (free users only for their most recent)
router.post('/undo', authenticate, async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM swipes WHERE swiper_id = $1 AND undone = false
     ORDER BY created_at DESC LIMIT 1`,
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Nothing to undo' });

  const swipe = rows[0];
  await query('UPDATE swipes SET undone = true WHERE id = $1', [swipe.id]);
  res.json({ message: 'Swipe undone', restored_user_id: swipe.swiped_id });
});

// GET /swipes/remaining  — for free user daily count display
router.get('/remaining', authenticate, async (req, res) => {
  if (req.user.is_premium) return res.json({ unlimited: true });
  const reset = new Date(req.user.swipes_reset_at);
  const now = new Date();
  const sameDay = reset.toDateString() === now.toDateString();
  const used = sameDay ? req.user.swipes_used_today : 0;
  res.json({ used, remaining: Math.max(0, FREE_SWIPES_PER_DAY - used), limit: FREE_SWIPES_PER_DAY });
});

async function handleLeftSwipeFeedback(swipe, targetId) {
  try {
    // Get or create counter for this batch
    const { rows: counters } = await query(
      `SELECT * FROM left_swipe_counters WHERE swiped_id = $1 ORDER BY batch_num DESC LIMIT 1`,
      [targetId]
    );

    let batchNum = 1;
    let count = 0;

    if (counters.length) {
      const last = counters[0];
      if (last.feedback_sent) {
        batchNum = last.batch_num + 1;
        count = 0;
      } else {
        batchNum = last.batch_num;
        count = last.count;
      }
    }

    count += 1;

    await query(
      `INSERT INTO left_swipe_counters (swiped_id, batch_num, count)
       VALUES ($1, $2, $3)
       ON CONFLICT (swiped_id, batch_num) DO UPDATE SET count = $3`,
      [targetId, batchNum, count]
    );

    if (count >= LEFT_SWIPES_PER_FEEDBACK_BATCH) {
      // Check if target has opted out or hidden from feedback
      const { rows: target } = await query(
        'SELECT feedback_opt_out, hidden_from_feedback, is_premium FROM users WHERE id = $1',
        [targetId]
      );
      if (!target.length || target[0].feedback_opt_out || target[0].hidden_from_feedback) return;

      // Mark batch as feedback_sent
      await query(
        'UPDATE left_swipe_counters SET feedback_sent = true WHERE swiped_id = $1 AND batch_num = $2',
        [targetId, batchNum]
      );

      // Get the last 5 swipers who swiped left
      const { rows: swipers } = await query(
        `SELECT s.swiper_id, s.id as swipe_id FROM swipes s
         WHERE s.swiped_id = $1 AND s.direction = 'left' AND s.undone = false
           AND s.swiper_id NOT IN (
             SELECT swiper_id FROM feedback_requests WHERE recipient_id = $1
           )
         ORDER BY s.created_at DESC LIMIT 5`,
        [targetId]
      );

      for (const { swiper_id, swipe_id } of swipers) {
        await query(
          `INSERT INTO feedback_requests (recipient_id, swiper_id, swipe_id)
           VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [targetId, swiper_id, swipe_id]
        );
      }
    }
  } catch (err) {
    console.error('Feedback trigger error:', err);
  }
}

module.exports = router;
