require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const USERS = [
  { name: 'Alex Rivera', email: 'alex@test.com', dob: '1995-03-15', gender: 'man', seeking: ['woman', 'nonbinary'], bio: 'Perpetually curious. Amateur astronomer. Will always suggest tacos.' },
  { name: 'Jordan Lee', email: 'jordan@test.com', dob: '1997-07-22', gender: 'woman', seeking: ['man'], bio: 'Bookworm who somehow always ends up at concerts. Ask me about my sourdough.' },
  { name: 'Sam Chen', email: 'sam@test.com', dob: '1993-11-08', gender: 'nonbinary', seeking: ['man', 'woman', 'nonbinary'], bio: 'Software engineer by day, terrible golfer by weekend. Cats > dogs, fight me.' },
  { name: 'Maya Patel', email: 'maya@test.com', dob: '1998-01-30', gender: 'woman', seeking: ['woman', 'nonbinary'], bio: 'Yoga instructor + chaos gremlin. I contain multitudes.' },
  { name: 'Chris Davis', email: 'chris@test.com', dob: '1991-09-12', gender: 'man', seeking: ['man'], bio: 'Chef who only eats cereal at home. Professional overthinker.' },
  { name: 'Taylor Kim', email: 'taylor@test.com', dob: '1996-05-25', gender: 'nonbinary', seeking: ['man', 'woman', 'nonbinary'], bio: 'Documentary addict. I believe every person has a story worth hearing.' },
  { name: 'Morgan Walsh', email: 'morgan@test.com', dob: '1994-12-03', gender: 'woman', seeking: ['man'], bio: 'Rock climber, podcast addict, and proud owner of 47 houseplants.' },
  { name: 'Casey Torres', email: 'casey@test.com', dob: '1999-08-18', gender: 'man', seeking: ['woman'], bio: 'Architect who still can\'t parallel park. Big on hiking, bad at mornings.' },
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding test users...');
    const password = await bcrypt.hash('Password123!', 12);

    for (const u of USERS) {
      const { rows } = await client.query(
        `INSERT INTO users (email, password_hash, name, date_of_birth, gender, seeking,
                            latitude, longitude, location_city, phone_verified, email_verified,
                            identity_verified, is_premium)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [
          u.email, password, u.name, u.dob, u.gender, u.seeking,
          40.7128 + (Math.random() - 0.5) * 0.1,
          -74.006 + (Math.random() - 0.5) * 0.1,
          'New York, NY',
          true, true,
          Math.random() > 0.5,
          Math.random() > 0.7,
        ]
      );

      const userId = rows[0].id;

      // Add bio
      await client.query('UPDATE users SET bio = $1 WHERE id = $2', [u.bio, userId]);

      // Add a placeholder photo (points to a public avatar)
      await client.query(
        'INSERT INTO photos (user_id, url, sort_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [userId, `https://i.pravatar.cc/400?u=${u.email}`, 0]
      );

      // Add a prompt
      await client.query(
        `INSERT INTO user_prompts (user_id, prompt_text, answer, sort_order)
         VALUES ($1, $2, $3, 0) ON CONFLICT DO NOTHING`,
        [userId, 'What I\'m most curious about right now...', u.bio?.split('.')[0] || '']
      );

      console.log(`  ✓ ${u.name} (${u.email}) — id: ${userId}`);
    }

    console.log('\n✅ Done! All test users use password: Password123!\n');
    console.log('Sample logins:');
    USERS.forEach((u) => console.log(`  ${u.email} / Password123!`));
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
