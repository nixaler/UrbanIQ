const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { moderateText } = require('../services/aiModeration');
const { sendPush } = require('../services/notifications');

// GET /feedback/pending  — requests this user still needs to fill out
router.get('/pending', authenticate, async (req, res) => {
  const { rows } = await query(
    `SELECT fr.id, fr.recipient_id, fr.created_at,
            u.name AS recipient_name,
            (SELECT url FROM photos WHERE user_id = u.id ORDER BY sort_order LIMIT 1) AS recipient_photo
     FROM feedback_requests fr
     JOIN users u ON u.id = fr.recipient_id
     WHERE fr.swiper_id = $1 AND fr.completed = false
       AND u.deleted_at IS NULL
     ORDER BY fr.created_at DESC`,
    [req.user.id]
  );
  res.json({ requests: rows });
});

// POST /feedback/:requestId  — submit feedback (required, cannot skip)
router.post('/:requestId', authenticate, async (req, res) => {
  const { reason, suggestion } = req.body;
  if (!reason?.trim()) return res.status(400).json({ error: 'Reason is required — it cannot be skipped' });

  const { rows: reqRows } = await query(
    'SELECT * FROM feedback_requests WHERE id = $1 AND swiper_id = $2',
    [req.params.requestId, req.user.id]
  );
  if (!reqRows.length) return res.status(404).json({ error: 'Request not found' });
  const feedbackReq = reqRows[0];
  if (feedbackReq.completed) return res.status(400).json({ error: 'Already submitted' });

  // Check recipient opt-out
  const { rows: recipient } = await query(
    'SELECT feedback_opt_out FROM users WHERE id = $1', [feedbackReq.recipient_id]
  );
  if (recipient[0]?.feedback_opt_out) {
    await query('UPDATE feedback_requests SET completed = true WHERE id = $1', [req.params.requestId]);
    return res.json({ message: 'Submitted (recipient opted out)' });
  }

  // AI Moderation
  const fullText = [reason, suggestion].filter(Boolean).join(' ');
  const { passed, score } = await moderateText(fullText);

  const { rows } = await query(
    `INSERT INTO feedback (request_id, recipient_id, reason, suggestion, moderation_passed, moderation_score)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [feedbackReq.id, feedbackReq.recipient_id, reason.trim(), suggestion?.trim() || null, passed, score]
  );

  await query('UPDATE feedback_requests SET completed = true WHERE id = $1', [req.params.requestId]);

  if (passed) {
    await query('UPDATE feedback SET delivered = true, delivered_at = NOW() WHERE id = $1', [rows[0].id]);
    await sendPush(
      feedbackReq.recipient_id,
      'New anonymous feedback 💬',
      'Someone left you anonymous feedback. Tap to read it.',
      { type: 'feedback', feedbackId: rows[0].id }
    );

    // Update curiosity score (slight increment per piece of feedback received)
    await query(
      `UPDATE users SET curiosity_score = LEAST(100, curiosity_score + 1) WHERE id = $1`,
      [feedbackReq.recipient_id]
    );
  }

  res.status(201).json({ feedback: rows[0], moderation_passed: passed });
});

// GET /feedback/inbox  — my received feedback
router.get('/inbox', authenticate, async (req, res) => {
  if (req.user.feedback_opt_out) return res.json({ feedback: [], opted_out: true });

  const { rows } = await query(
    `SELECT f.id, f.reason, f.suggestion, f.delivered_at, f.created_at,
            (SELECT content FROM feedback_replies WHERE feedback_id = f.id
             ORDER BY created_at DESC LIMIT 1) AS my_reply
     FROM feedback f
     WHERE f.recipient_id = $1 AND f.delivered = true AND f.moderation_passed = true
     ORDER BY f.delivered_at DESC`,
    [req.user.id]
  );
  res.json({ feedback: rows });
});

// POST /feedback/:id/reply  — anonymous reply to received feedback
router.post('/:id/reply', authenticate, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content required' });

  const { rows: fb } = await query(
    'SELECT * FROM feedback WHERE id = $1 AND recipient_id = $2 AND delivered = true',
    [req.params.id, req.user.id]
  );
  if (!fb.length) return res.status(404).json({ error: 'Feedback not found' });

  const { passed } = await moderateText(content);
  if (!passed) return res.status(400).json({ error: 'Reply did not pass content moderation' });

  const { rows } = await query(
    'INSERT INTO feedback_replies (feedback_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *',
    [req.params.id, req.user.id, content.trim()]
  );
  res.status(201).json({ reply: rows[0] });
});

module.exports = router;
