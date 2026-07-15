import 'dotenv/config';
import { db } from '../src/lib/db/client';
import { topics } from '../src/lib/db/schema';
import { MVP_TOPICS } from '../src/lib/constants/topics';
import { seedBadges } from '../src/lib/karma/badgeRules';

async function main() {
  for (const topic of MVP_TOPICS) {
    await db
      .insert(topics)
      .values(topic)
      .onConflictDoUpdate({
        target: topics.slug,
        set: {
          name: topic.name,
          description: topic.description,
          icon: topic.icon,
          sortOrder: topic.sortOrder,
        },
      });
  }
  console.log(`Seeded ${MVP_TOPICS.length} topics.`);

  await seedBadges();
  console.log('Seeded badges.');

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
