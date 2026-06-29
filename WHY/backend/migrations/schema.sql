-- WHY Dating App — PostgreSQL Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email                 VARCHAR(255) UNIQUE,
  phone                 VARCHAR(20) UNIQUE,
  password_hash         VARCHAR(255),
  name                  VARCHAR(100) NOT NULL,
  date_of_birth         DATE NOT NULL,
  gender                VARCHAR(30) NOT NULL,
  seeking               VARCHAR(30)[] NOT NULL DEFAULT '{}',
  bio                   TEXT,
  latitude              DECIMAL(10,8),
  longitude             DECIMAL(11,8),
  location_city         VARCHAR(100),

  -- Subscription
  is_premium            BOOLEAN NOT NULL DEFAULT false,
  premium_expires_at    TIMESTAMPTZ,
  boosts_remaining      INT NOT NULL DEFAULT 0,

  -- Verification
  email_verified        BOOLEAN NOT NULL DEFAULT false,
  phone_verified        BOOLEAN NOT NULL DEFAULT false,
  identity_verified     BOOLEAN NOT NULL DEFAULT false,
  identity_photo_url    VARCHAR(500),

  -- Settings
  profile_paused        BOOLEAN NOT NULL DEFAULT false,
  feedback_opt_out      BOOLEAN NOT NULL DEFAULT false,
  hidden_from_feedback  BOOLEAN NOT NULL DEFAULT false,
  swipes_used_today     INT NOT NULL DEFAULT 0,
  swipes_reset_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Dealbreaker filters
  filter_min_age        INT NOT NULL DEFAULT 18,
  filter_max_age        INT NOT NULL DEFAULT 99,
  filter_max_distance   INT NOT NULL DEFAULT 100,  -- km
  filter_genders        VARCHAR(30)[] NOT NULL DEFAULT '{}',

  -- Curiosity score (0-100, updated by feedback system)
  curiosity_score       INT NOT NULL DEFAULT 50,

  -- Activity
  last_active_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_location ON users(latitude, longitude) WHERE deleted_at IS NULL AND profile_paused = false;
CREATE INDEX idx_users_last_active ON users(last_active_at);

-- ─── PHOTOS ────────────────────────────────────────────────────────────────────
CREATE TABLE photos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url         VARCHAR(500) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_user ON photos(user_id);

-- ─── PROFILE PROMPTS ───────────────────────────────────────────────────────────
CREATE TABLE preset_prompts (
  id      SERIAL PRIMARY KEY,
  text    VARCHAR(200) NOT NULL
);

CREATE TABLE user_prompts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_text VARCHAR(200) NOT NULL,
  answer      TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_prompts_user ON user_prompts(user_id);

-- ─── VERIFICATION CODES ────────────────────────────────────────────────────────
CREATE TABLE verification_codes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('phone', 'email')),
  code        VARCHAR(10) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_user ON verification_codes(user_id, type) WHERE used = false;

-- ─── SWIPES ────────────────────────────────────────────────────────────────────
CREATE TABLE swipes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swiper_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  swiped_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  direction     VARCHAR(5) NOT NULL CHECK (direction IN ('left', 'right')),
  undone        BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(swiper_id, swiped_id)
);

CREATE INDEX idx_swipes_swiper ON swipes(swiper_id, created_at);
CREATE INDEX idx_swipes_swiped ON swipes(swiped_id);
CREATE INDEX idx_swipes_pair ON swipes(swiper_id, swiped_id);

-- Track left-swipes per swiped user for triggering WHY feedback
CREATE TABLE left_swipe_counters (
  swiped_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch_num     INT NOT NULL DEFAULT 1,
  count         INT NOT NULL DEFAULT 0,
  feedback_sent BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (swiped_id, batch_num)
);

-- ─── MATCHES ────────────────────────────────────────────────────────────────────
CREATE TABLE matches (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id)
);

CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);

-- ─── MESSAGES ───────────────────────────────────────────────────────────────────
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT,
  photo_url   VARCHAR(500),
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (content IS NOT NULL OR photo_url IS NOT NULL)
);

CREATE INDEX idx_messages_match ON messages(match_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- ─── WHY FEEDBACK ───────────────────────────────────────────────────────────────
CREATE TABLE feedback_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  swiper_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  swipe_id        UUID NOT NULL REFERENCES swipes(id) ON DELETE CASCADE,
  completed       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(swiper_id, swipe_id)
);

CREATE INDEX idx_feedback_requests_swiper ON feedback_requests(swiper_id, completed);
CREATE INDEX idx_feedback_requests_recipient ON feedback_requests(recipient_id);

CREATE TABLE feedback (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id          UUID NOT NULL REFERENCES feedback_requests(id) ON DELETE CASCADE,
  recipient_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason              TEXT NOT NULL,
  suggestion          TEXT,
  moderation_passed   BOOLEAN NOT NULL DEFAULT false,
  moderation_score    JSONB,
  delivered           BOOLEAN NOT NULL DEFAULT false,
  delivered_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_recipient ON feedback(recipient_id, delivered_at);

CREATE TABLE feedback_replies (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id  UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  sender_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- the recipient replying
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── BOOSTS ─────────────────────────────────────────────────────────────────────
CREATE TABLE boosts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activated_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  duration_min INT NOT NULL DEFAULT 30,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_boosts_user ON boosts(user_id);
CREATE INDEX idx_boosts_active ON boosts(user_id, expires_at);

-- ─── BLOCKS ─────────────────────────────────────────────────────────────────────
CREATE TABLE blocks (
  blocker_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);

-- ─── PUSH TOKENS ────────────────────────────────────────────────────────────────
CREATE TABLE push_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(500) NOT NULL,
  platform    VARCHAR(10) NOT NULL DEFAULT 'ios',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, token)
);

CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);

-- ─── SEED: PRESET PROMPTS ────────────────────────────────────────────────────────
INSERT INTO preset_prompts (text) VALUES
  ('The most adventurous thing I''ve done is...'),
  ('My perfect Sunday looks like...'),
  ('A skill I''m still learning...'),
  ('The question I ask everyone I meet...'),
  ('What I''m most curious about right now...'),
  ('A fact that blew my mind recently...'),
  ('I''ll judge you if...'),
  ('My simple pleasures are...'),
  ('We''ll get along if you...'),
  ('The best thing I ever ate was...'),
  ('Right now I''m obsessed with...'),
  ('I''m weirdly good at...'),
  ('Change my mind:'),
  ('My love language is...'),
  ('Two truths and a lie:'),
  ('The last thing I read was...'),
  ('I''m looking for someone who...'),
  ('My most controversial opinion is...');

-- ─── TRIGGERS ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
