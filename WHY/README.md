# WHY — The dating app where curiosity meets connection

**Logo:** Two question marks forming a heart — `?❤️?`  
**Stack:** React Native (iOS first) + Node.js/Express + PostgreSQL + Socket.io

---

## Project Structure

```
WHY/
├── backend/                   Node.js + Express API
│   ├── src/
│   │   ├── server.js          Entry point — Express + Socket.io
│   │   ├── config/
│   │   │   └── database.js    PostgreSQL pool
│   │   ├── middleware/
│   │   │   ├── auth.js        JWT authentication
│   │   │   └── upload.js      Multer photo uploads
│   │   ├── routes/
│   │   │   ├── auth.js        Register, login, phone/identity verify
│   │   │   ├── users.js       Profiles, photos, prompts, blocking
│   │   │   ├── swipes.js      Card stack, swipe recording, undo
│   │   │   ├── matches.js     Mutual matches, likes list (premium)
│   │   │   ├── messages.js    Chat messages (REST fallback)
│   │   │   ├── feedback.js    WHY feedback system (give + receive)
│   │   │   ├── boosts.js      Boost activation + purchase stub
│   │   │   └── insights.js    Anonymized trend data
│   │   ├── services/
│   │   │   ├── aiModeration.js  OpenAI moderation API
│   │   │   ├── notifications.js APNs push notifications
│   │   │   └── sms.js           Twilio SMS verification
│   │   └── socket/
│   │       └── chat.js        Socket.io real-time chat
│   ├── migrations/
│   │   └── schema.sql         Full PostgreSQL schema
│   └── seed.js                Test user seeder (8 users)
│
├── mobile/                    React Native app
│   ├── src/
│   │   ├── App.js
│   │   ├── theme/colors.js    Dark mode — blue/white palette
│   │   ├── context/AuthContext.js
│   │   ├── navigation/AppNavigator.js
│   │   ├── services/
│   │   │   ├── api.js         Axios client (all endpoints)
│   │   │   └── socket.js      Socket.io client
│   │   ├── components/
│   │   │   ├── SwipeCard.js   Gesture-based card with animations
│   │   │   ├── MatchCard.js   Match list row
│   │   │   ├── FeedbackItem.js Feedback with anonymous reply
│   │   │   └── Logo.js        Two-?-heart logo
│   │   └── screens/
│   │       ├── auth/          Welcome, SignUp, Login, PhoneVerify, IdentityVerify
│   │       ├── main/          Swipe, Matches, Chat, Profile, Feedback, Insights
│   │       └── settings/      Settings (pause, opt-outs, premium, delete)
│
├── docker-compose.yml         PostgreSQL + API in Docker
├── .env.example
└── README.md
```

---

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ (or Docker)
- Xcode 15+ (for iOS simulator)
- CocoaPods

---

### 1. Clone & configure environment

```bash
cd WHY/backend
cp ../.env.example .env
# Edit .env — at minimum set DATABASE_URL and JWT_SECRET
```

### 2. Start the database

**Option A — Docker (recommended):**
```bash
# From WHY/
docker-compose up db -d
```

**Option B — Local PostgreSQL:**
```bash
createdb why_dating
psql why_dating -f backend/migrations/schema.sql
```

### 3. Start the API

```bash
cd WHY/backend
npm install
npm run dev
# API running at http://localhost:3000
```

### 4. Seed test users

```bash
cd WHY/backend
npm run seed
```

All 8 test users use password: `Password123!`

| Email | Name | Gender | Looking for |
|---|---|---|---|
| alex@test.com | Alex Rivera | Man | Women, NB |
| jordan@test.com | Jordan Lee | Woman | Men |
| sam@test.com | Sam Chen | Nonbinary | All |
| maya@test.com | Maya Patel | Woman | Women, NB |
| chris@test.com | Chris Davis | Man | Men |
| taylor@test.com | Taylor Kim | Nonbinary | All |
| morgan@test.com | Morgan Walsh | Woman | Men |
| casey@test.com | Casey Torres | Man | Women |

### 5. Run the mobile app

```bash
cd WHY/mobile
npm install
cd ios && pod install && cd ..
npx react-native run-ios
```

The app connects to `http://localhost:3000` by default. Change `API_URL` in `src/services/api.js` for a deployed backend.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `PORT` | No | API port (default: 3000) |
| `TWILIO_ACCOUNT_SID` | No | Twilio SID for SMS (stubs without it) |
| `TWILIO_AUTH_TOKEN` | No | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | No | Twilio sender number |
| `OPENAI_API_KEY` | No | OpenAI key for content moderation (auto-passes without it) |
| `APN_KEY` | No | Apple push notification .p8 key content |
| `APN_KEY_ID` | No | Apple Key ID |
| `APN_TEAM_ID` | No | Apple Team ID |
| `APN_BUNDLE_ID` | No | iOS bundle ID (default: com.why.datingapp) |

All external services degrade gracefully with stub behavior in development when keys are absent.

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | — | Email or phone registration |
| POST | /api/auth/login | — | Login, returns JWT |
| POST | /api/auth/verify-phone | ✓ | Submit 6-digit SMS code |
| POST | /api/auth/resend-code | ✓ | Resend SMS code |
| POST | /api/auth/verify-identity | ✓ | Upload selfie/ID (multipart) |
| POST | /api/auth/push-token | ✓ | Register APNs token |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/users/me | ✓ | My profile + photos + prompts |
| PATCH | /api/users/me | ✓ | Update bio, filters, settings |
| DELETE | /api/users/me | ✓ | Permanently delete account |
| GET | /api/users/presets | ✓ | Preset prompt list |
| POST | /api/users/me/photos | ✓ | Upload photo (multipart) |
| DELETE | /api/users/me/photos/:id | ✓ | Remove photo |
| PUT | /api/users/me/photos/order | ✓ | Reorder photos |
| POST | /api/users/me/prompts | ✓ | Save up to 3 prompts |
| GET | /api/users/:id | ✓ | View another user's profile |
| POST | /api/users/:id/block | ✓ | Block a user |

### Swipes
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/swipes/stack | ✓ | Get next cards (respects dealbreakers) |
| POST | /api/swipes | ✓ | Record swipe (triggers feedback at 5 left-swipes) |
| POST | /api/swipes/undo | ✓ | Undo last swipe |
| GET | /api/swipes/remaining | ✓ | Daily swipe count (free users) |

### Matches & Messages
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/matches | ✓ | All matches with last message |
| GET | /api/matches/likes | ✓ Premium | Who liked me |
| DELETE | /api/matches/:id | ✓ | Unmatch |
| GET | /api/messages/:matchId | ✓ | Chat history |
| POST | /api/messages/:matchId | ✓ | Send text message |
| POST | /api/messages/:matchId/photo | ✓ | Send photo |

### WHY Feedback
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/feedback/pending | ✓ | Feedback requests I need to fill |
| POST | /api/feedback/:requestId | ✓ | Submit feedback (required, cannot skip) |
| GET | /api/feedback/inbox | ✓ | My received feedback |
| POST | /api/feedback/:id/reply | ✓ | Reply anonymously to feedback |

### Boosts & Premium
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/boosts/status | ✓ | Remaining boosts + active boost |
| POST | /api/boosts/activate | ✓ | Use one boost (30 min) |
| POST | /api/boosts/purchase | ✓ | À la carte purchase (StoreKit stub) |
| POST | /api/boosts/premium | ✓ | Activate premium (StoreKit stub) |

### Insights
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/insights | ✓ | Trends, word cloud, curiosity score |

---

## Real-time Chat (Socket.io)

Connect with `{ auth: { token: '<jwt>' } }`.

**Emit events:**
| Event | Payload | Description |
|---|---|---|
| `join_match` | `{ matchId }` | Join a chat room |
| `send_message` | `{ matchId, content }` | Send a message |
| `typing` | `{ matchId, isTyping }` | Typing indicator |

**Listen events:**
| Event | Payload | Description |
|---|---|---|
| `new_message` | `{ message }` | Incoming message |
| `user_typing` | `{ userId, isTyping }` | Partner typing |
| `joined_match` | `{ matchId }` | Room joined confirmation |

---

## Feature Implementation Notes

### The WHY System
- Every 5 left-swipes on a user triggers anonymous feedback requests to those 5 swipers
- Feedback is **required** — the submit endpoint enforces a non-empty reason
- Before delivery, every submission goes through OpenAI's moderation API
- Content that fails moderation is silently dropped (not delivered)
- Recipient gets a push notification per delivered feedback
- Recipients can reply anonymously once per feedback item
- Premium users can set `hidden_from_feedback = true` to opt their profile out of triggering requests

### Swipe Limits
- Free users: 50 swipes/day, resets at midnight
- Premium users: unlimited
- Daily count is tracked in `users.swipes_used_today` + `swipes_reset_at`

### Dealbreaker Filters
- Stored on the user row (`filter_min_age`, `filter_max_age`, `filter_max_distance`, `filter_genders`)
- Applied server-side in the `/swipes/stack` query using Haversine distance formula
- Non-matching profiles never appear in the card stack

### Boosts
- Active boost = profile appears first in `/swipes/stack` for all users
- Premium gets 5 boosts/month on subscription activation
- Additional boosts purchasable (StoreKit receipt validation stubbed — wire up in production)

### Identity Verification
- Upload a selfie or ID photo at registration
- Backend marks `identity_verified = true` immediately (review flow is manual/admin in production)
- Verified users get a blue ✓ badge on their profile card

---

## Production Checklist

- [ ] Replace `JWT_SECRET` with a cryptographically random 64-char secret
- [ ] Configure real Twilio credentials for SMS
- [ ] Configure real OpenAI API key for moderation
- [ ] Set up APNs credentials (.p8 key from Apple Developer portal)
- [ ] Implement StoreKit receipt validation in `/api/boosts/premium` and `/api/boosts/purchase`
- [ ] Move photo storage to S3/CloudFront (swap `multer` disk storage for `multer-s3`)
- [ ] Add admin dashboard for manual identity verification review
- [ ] Set `NODE_ENV=production` and enable PostgreSQL SSL
- [ ] Add Redis for rate-limiting state in multi-instance deployments
- [ ] Configure CDN and CORS for production domain
