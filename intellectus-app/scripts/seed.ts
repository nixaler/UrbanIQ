import 'dotenv/config';
import { db } from '../src/lib/db/client';
import { users, topics, articles, contentBlocks, badges } from '../src/lib/db/schema';
import { randomUUID } from 'node:crypto';

async function main() {
  const editorId = randomUUID();
  await db.insert(users).values({
    id: editorId,
    displayName: 'Founding Editor',
    role: 'editor',
    reputationScore: 100,
  });

  await db.insert(badges).values([
    { slug: 'top-analytical-thinker', label: 'Top Analytical Thinker', description: 'Consistently well-researched contributions.', minReputationScore: 50 },
    { slug: 'economics-contributor', label: 'Economics Contributor', description: 'Reliable economic analysis.', minReputationScore: 30 },
  ]);

  const [topic] = await db
    .insert(topics)
    .values({ slug: 'sample-topic', title: 'General News' })
    .returning();
  if (!topic) throw new Error('Failed to insert seed topic');

  const [article] = await db
    .insert(articles)
    .values({
      topicId: topic.id,
      publishDate: new Date().toISOString().slice(0, 10),
      title: 'Sample daily read',
      status: 'published',
      humanEditorId: editorId,
    })
    .returning();
  if (!article) throw new Error('Failed to insert seed article');

  await db.insert(contentBlocks).values([
    { articleId: article.id, blockType: 'event', depthLevel: 'summary', body: { text: 'A brief summary of what happened.' } },
    { articleId: article.id, blockType: 'event', depthLevel: 'standard', body: { text: 'A fuller account of what happened, with context.' } },
    { articleId: article.id, blockType: 'event', depthLevel: 'deep', body: { text: 'An in-depth account of what happened, including primary-source detail.' } },
    { articleId: article.id, blockType: 'backstory', depthLevel: 'standard', body: { text: 'Relevant history leading up to this event.' } },
  ]);

  console.log(`Seeded topic "${topic.title}" and article "${article.title}" (${article.id})`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
