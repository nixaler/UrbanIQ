const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { sendVerificationCode, generateCode } = require('../services/sms');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /auth/register
router.post(
  '/register',
  [
    body('email').optional().isEmail(),
    body('phone').optional().isMobilePhone(),
    body('password').isLength({ min: 8 }),
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('date_of_birth').isISO8601(),
    body('gender').isLength({ min: 1, max: 30 }),
    body('seeking').isArray({ min: 1 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, phone, password, name, date_of_birth, gender, seeking } = req.body;
    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone is required' });
    }

    try {
      if (email) {
        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });
      }
      if (phone) {
        const existing = await query('SELECT id FROM users WHERE phone = $1', [phone]);
        if (existing.rows.length) return res.status(409).json({ error: 'Phone already registered' });
      }

      const hash = await bcrypt.hash(password, 12);
      const { rows } = await query(
        `INSERT INTO users (email, phone, password_hash, name, date_of_birth, gender, seeking)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [email || null, phone || null, hash, name, date_of_birth, gender, seeking]
      );
      const user = rows[0];

      // If phone provided, send verification code
      if (phone) {
        const code = generateCode();
        const expires = new Date(Date.now() + 10 * 60 * 1000);
        await query(
          'INSERT INTO verification_codes (user_id, type, code, expires_at) VALUES ($1, $2, $3, $4)',
          [user.id, 'phone', code, expires]
        );
        await sendVerificationCode(phone, code);
      }

      res.status(201).json({ token: signToken(user.id), user: sanitize(user) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// POST /auth/login
router.post(
  '/login',
  [body('password').exists()],
  async (req, res) => {
    const { email, phone, password } = req.body;
    if (!email && !phone) return res.status(400).json({ error: 'Email or phone required' });

    try {
      const col = email ? 'email' : 'phone';
      const val = email || phone;
      const { rows } = await query(
        `SELECT * FROM users WHERE ${col} = $1 AND deleted_at IS NULL`,
        [val]
      );
      if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

      const user = rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      await query('UPDATE users SET last_active_at = NOW() WHERE id = $1', [user.id]);
      res.json({ token: signToken(user.id), user: sanitize(user) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// POST /auth/verify-phone
router.post('/verify-phone', authenticate, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code required' });

  try {
    const { rows } = await query(
      `SELECT * FROM verification_codes
       WHERE user_id = $1 AND type = 'phone' AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(400).json({ error: 'No active code' });
    if (rows[0].code !== code) return res.status(400).json({ error: 'Incorrect code' });

    await query('UPDATE verification_codes SET used = true WHERE id = $1', [rows[0].id]);
    await query('UPDATE users SET phone_verified = true WHERE id = $1', [req.user.id]);
    res.json({ message: 'Phone verified' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /auth/resend-code
router.post('/resend-code', authenticate, async (req, res) => {
  const { phone } = req.user;
  if (!phone) return res.status(400).json({ error: 'No phone on account' });

  const code = generateCode();
  const expires = new Date(Date.now() + 10 * 60 * 1000);
  await query(
    'INSERT INTO verification_codes (user_id, type, code, expires_at) VALUES ($1, $2, $3, $4)',
    [req.user.id, 'phone', code, expires]
  );
  await sendVerificationCode(phone, code);
  res.json({ message: 'Code sent' });
});

// POST /auth/verify-identity  (selfie / ID upload)
router.post('/verify-identity', authenticate, upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Photo required' });

  const photoUrl = `/uploads/${req.file.filename}`;
  await query(
    'UPDATE users SET identity_verified = true, identity_photo_url = $1 WHERE id = $2',
    [photoUrl, req.user.id]
  );
  res.json({ message: 'Identity verification submitted', verified: true });
});

// POST /auth/push-token
router.post('/push-token', authenticate, async (req, res) => {
  const { token, platform = 'ios' } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });
  await query(
    `INSERT INTO push_tokens (user_id, token, platform) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, token) DO NOTHING`,
    [req.user.id, token, platform]
  );
  res.json({ message: 'Token saved' });
});

function sanitize(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

module.exports = router;
