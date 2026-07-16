import { listMyPosts } from '@/lib/actions/social';
import PostForm from '@/components/social/PostForm';
import PostCalendar from '@/components/social/PostCalendar';

export default async function SocialPage() {
  const posts = await listMyPosts();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Social media manager</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Your shared content calendar — plan it here, your manager schedules it with you.
        </p>
      </div>
      <PostForm />
      <PostCalendar posts={posts} />
    </div>
  );
}
