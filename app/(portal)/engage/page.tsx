// app/(portal)/engage/page.tsx

// ============= IMPORTS =============
import { requireSession } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { listPosts, ALLOWED_EMOJIS } from '@/lib/db/engage';
import { listUsers } from '@/lib/db/users';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusPill } from '@/components/ui/StatusPill';
import { createPostAction, toggleReactionAction } from './actions';

// ============= PAGE =============
export default async function EngagePage() {
  const user = await requireSession();
  const canPublish = hasPermission(user, PERMISSIONS.PUBLISH_ENGAGE);
  const [posts, users] = await Promise.all([listPosts(), listUsers()]);
  const nameById = new Map(users.map(u => [u.id, u.displayName]));

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-3xl font-semibold">Engage</h1>

      {/* ============= COMPOSER ============= */}
      {canPublish && (
        <GlassPanel>
          <form action={createPostAction} className="flex flex-col gap-4">
            <Input name="title" label="Title" required maxLength={140} placeholder="Announcement headline" />
            <label className="text-sm font-medium">Body</label>
            <textarea
              name="body"
              required
              rows={4}
              maxLength={5000}
              placeholder="Share an update with the company…"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' } as React.CSSProperties}
            />
            <Button type="submit" className="self-start">Post</Button>
          </form>
        </GlassPanel>
      )}

      {/* ============= FEED ============= */}
      {posts.length === 0 && (
        <GlassPanel>
          <p className="text-sm text-text-muted">No announcements yet.</p>
        </GlassPanel>
      )}

      {posts.map(post => {
        const authorName = nameById.get(post.authorId) ?? 'Unknown';
        return (
          <GlassPanel key={post.id}>
            <div className="flex flex-col gap-3">
              {/* ---- Header ---- */}
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium">{authorName}</span>
                <span className="text-xs text-text-muted">{new Date(post.createdAt).toLocaleString()}</span>
              </div>

              {/* ---- Content ---- */}
              <h2 className="text-lg font-semibold">{post.title}</h2>
              <p className="text-sm whitespace-pre-line">{post.body}</p>

              {/* ---- Reactions ---- */}
              <div className="flex flex-wrap gap-2 mt-1">
                {ALLOWED_EMOJIS.map(emoji => {
                  const reactors = post.reactions[emoji] ?? [];
                  const count = reactors.length;
                  const mine = reactors.includes(user.id);
                  const react = async (fd: FormData) => {
                    'use server';
                    fd.set('postId', post.id);
                    fd.set('emoji', emoji);
                    await toggleReactionAction(fd);
                  };
                  return (
                    <form key={emoji} action={react}>
                      <Button type="submit" variant={mine ? 'primary' : 'ghost'} size="sm">
                        <span>{emoji}</span>
                        {count > 0 && <span className="ml-1">{count}</span>}
                      </Button>
                    </form>
                  );
                })}
                {(() => {
                  const total = ALLOWED_EMOJIS.reduce((n, e) => n + (post.reactions[e]?.length ?? 0), 0);
                  return total > 0 ? <StatusPill tone="green">{total} reactions</StatusPill> : null;
                })()}
              </div>
            </div>
          </GlassPanel>
        );
      })}
    </div>
  );
}
