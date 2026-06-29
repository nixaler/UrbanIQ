let twilioClient;

function getClient() {
  if (!twilioClient) {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

async function sendVerificationCode(phone, code) {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log(`[SMS stub] Sending code ${code} to ${phone}`);
    return;
  }
  await getClient().messages.create({
    body: `Your WHY verification code is: ${code}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { sendVerificationCode, generateCode };
