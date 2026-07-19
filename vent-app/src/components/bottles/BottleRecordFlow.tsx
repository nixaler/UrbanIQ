'use client';

import { useState } from 'react';
import { TopicCard } from '@/components/topics/TopicCard';
import { RecordBottle } from './RecordBottle';

interface Topic {
  id: string;
  name: string;
  description: string;
}

export function BottleRecordFlow({ topics }: { topics: Topic[] }) {
  const [topicId, setTopicId] = useState<string | null>(null);

  if (topicId) {
    return <RecordBottle topicId={topicId} />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {topics.map((topic) => (
        <TopicCard
          key={topic.id}
          name={topic.name}
          description={topic.description}
          selected={false}
          onClick={() => setTopicId(topic.id)}
        />
      ))}
    </div>
  );
}
