const OpenAI = require('openai');

let openai;
const getClient = () => {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
};

// Returns { passed: bool, score: object }
async function moderateText(text) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set — skipping moderation, auto-passing');
    return { passed: true, score: {} };
  }
  try {
    const client = getClient();
    const response = await client.moderations.create({ input: text });
    const result = response.results[0];
    const passed = !result.flagged;
    return { passed, score: result.category_scores };
  } catch (err) {
    console.error('Moderation API error:', err.message);
    // Fail open on API errors to avoid blocking users if OpenAI is down
    return { passed: true, score: {} };
  }
}

module.exports = { moderateText };
