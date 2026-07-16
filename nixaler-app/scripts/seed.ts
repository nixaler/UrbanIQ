import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { db } from '../src/lib/db/client';
import { users, llcFormations, curriculumModules } from '../src/lib/db/schema';

async function main() {
  const coachId = randomUUID();
  const clientId = randomUUID();

  await db.insert(users).values([
    { id: coachId, displayName: 'Sample Coach', email: 'coach@example.com', role: 'coach' },
    {
      id: clientId,
      displayName: 'Sample Client',
      email: 'client@example.com',
      role: 'client',
      businessName: "Sample Client's Kitchen",
      assignedCoachId: coachId,
    },
  ]);

  await db.insert(llcFormations).values({
    ownerId: clientId,
    businessName: "Sample Client's Kitchen LLC",
    status: 'info_submitted',
    formationState: 'Delaware',
  });

  await db.insert(curriculumModules).values([
    { title: 'Why an LLC (and why now)', description: 'The tax and liability basics before you file anything.', order: 1 },
    { title: 'Pricing your first offer', description: 'How to price so the business supports itself from month one.', order: 2 },
    { title: 'Running your CRM like a habit', description: 'A five-minute daily loop for keeping your pipeline honest.', order: 3 },
    { title: 'Planning a month of content', description: 'Working with your social media manager instead of around them.', order: 4 },
  ]);

  console.log('Seed complete.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
