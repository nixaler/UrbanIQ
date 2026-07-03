import { EventSchemas, Inngest } from 'inngest';

type Events = {
  'content/pipeline.requested': {
    data: { articleId: string; topicTitle: string; sourceMaterial: string };
  };
  'digest/weekly.requested': {
    data: { weekStartDate: string };
  };
  'streaks/nightly-reset.requested': {
    data: Record<string, never>;
  };
  'notifications/user.scheduled': {
    data: { userId: string; intelWindowTime: string; timezone: string };
  };
  'content/narration.requested': {
    data: { articleId: string };
  };
};

export const inngest = new Inngest({
  id: 'intellectus-app',
  schemas: new EventSchemas().fromRecord<Events>(),
});
