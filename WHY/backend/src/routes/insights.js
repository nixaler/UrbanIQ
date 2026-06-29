const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// GET /insights  — feedback trend data for the current user
router.get('/', authenticate, async (req, res) => {
  const userId = req.user.id;

  // Total feedback received
  const { rows: totals } = await query(
    'SELECT COUNT(*) AS total FROM feedback WHERE recipient_id = $1 AND delivered = true',
    [userId]
  );

  // Feedback count over last 30 days, grouped by week
  const { rows: weekly } = await query(
    `SELECT DATE_TRUNC('week', delivered_at) AS week, COUNT(*) AS count
     FROM feedback
     WHERE recipient_id = $1 AND delivered = true
       AND delivered_at > NOW() - INTERVAL '90 days'
     GROUP BY week ORDER BY week`,
    [userId]
  );

  // Most recent 5 reasons (anonymized — just the text, no link to swipers)
  const { rows: recent } = await query(
    `SELECT reason, suggestion, delivered_at
     FROM feedback WHERE recipient_id = $1 AND delivered = true
     ORDER BY delivered_at DESC LIMIT 5`,
    [userId]
  );

  // Curiosity score history (just current + a stub trend for now)
  const curiosityScore = req.user.curiosity_score;

  // Word frequency from reasons (simple word cloud data)
  const { rows: wordData } = await query(
    `SELECT word, COUNT(*) AS freq
     FROM (
       SELECT regexp_split_to_table(lower(reason), '\\s+') AS word
       FROM feedback WHERE recipient_id = $1 AND delivered = true
     ) words
     WHERE length(word) > 4
       AND word NOT IN ('about','their','there','these','those','which','would','could','should','because')
     GROUP BY word ORDER BY freq DESC LIMIT 20`,
    [userId]
  );

  res.json({
    total_feedback: parseInt(totals[0].total),
    weekly_trend: weekly,
    recent_feedback: recent,
    curiosity_score: curiosityScore,
    top_words: wordData,
  });
});

module.exports = router;
