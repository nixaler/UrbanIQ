const { query } = require('../config/database');

let provider;

function getProvider() {
  if (!provider && process.env.APN_KEY && process.env.APN_KEY_ID && process.env.APN_TEAM_ID) {
    const apn = require('apn');
    provider = new apn.Provider({
      token: {
        key: process.env.APN_KEY,
        keyId: process.env.APN_KEY_ID,
        teamId: process.env.APN_TEAM_ID,
      },
      production: process.env.NODE_ENV === 'production',
    });
  }
  return provider;
}

async function sendPush(userId, title, body, data = {}) {
  const p = getProvider();
  if (!p) {
    console.log(`[PUSH stub] userId=${userId} title="${title}" body="${body}"`);
    return;
  }
  const { rows } = await query('SELECT token FROM push_tokens WHERE user_id = $1', [userId]);
  if (!rows.length) return;

  const apn = require('apn');
  const note = new apn.Notification();
  note.expiry = Math.floor(Date.now() / 1000) + 3600;
  note.badge = 1;
  note.sound = 'default';
  note.alert = { title, body };
  note.payload = data;
  note.topic = process.env.APN_BUNDLE_ID;

  for (const { token } of rows) {
    const result = await p.send(note, token);
    if (result.failed.length) {
      console.error('APNs failure:', result.failed);
    }
  }
}

module.exports = { sendPush };
