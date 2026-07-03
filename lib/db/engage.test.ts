// lib/db/engage.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { makeTempDataDir } from '../../tests/setup';

beforeEach(() => { makeTempDataDir(); });

describe('createPost + listPosts', () => {
  it("creates a post with id 'pst_...' and empty reactions", async () => {
    const { createPost } = await import('./engage');
    const post = await createPost({ authorId: 'u1', title: 'Hello', body: 'World' });
    expect(post.id.startsWith('pst_')).toBe(true);
    expect(post.authorId).toBe('u1');
    expect(post.title).toBe('Hello');
    expect(post.body).toBe('World');
    expect(post.reactions).toEqual({});
  });

  it('lists posts newest first', async () => {
    const { createPost, listPosts } = await import('./engage');
    const first = await createPost({ authorId: 'u1', title: 'First', body: 'a' });
    // Ensure a distinct createdAt timestamp.
    await new Promise(r => setTimeout(r, 5));
    const second = await createPost({ authorId: 'u1', title: 'Second', body: 'b' });
    const posts = await listPosts();
    expect(posts.map(p => p.id)).toEqual([second.id, first.id]);
  });
});

describe('toggleReaction', () => {
  it('adds a reaction, then removes it on second toggle', async () => {
    const { createPost, toggleReaction, getPost } = await import('./engage');
    const post = await createPost({ authorId: 'u1', title: 'T', body: 'b' });

    await toggleReaction(post.id, 'u2', '👍');
    let after = await getPost(post.id);
    expect(after?.reactions['👍']).toEqual(['u2']);

    await toggleReaction(post.id, 'u2', '👍');
    after = await getPost(post.id);
    expect(after?.reactions['👍']).toBeUndefined();
  });

  it('moves a user from one emoji to another (one reaction per user per post)', async () => {
    const { createPost, toggleReaction, getPost } = await import('./engage');
    const post = await createPost({ authorId: 'u1', title: 'T', body: 'b' });

    await toggleReaction(post.id, 'u2', '👍');
    await toggleReaction(post.id, 'u2', '❤️');
    const after = await getPost(post.id);
    expect(after?.reactions['👍']).toBeUndefined();
    expect(after?.reactions['❤️']).toEqual(['u2']);
  });

  it('keeps other users when one user switches emoji', async () => {
    const { createPost, toggleReaction, getPost } = await import('./engage');
    const post = await createPost({ authorId: 'u1', title: 'T', body: 'b' });

    await toggleReaction(post.id, 'u2', '👍');
    await toggleReaction(post.id, 'u3', '👍');
    await toggleReaction(post.id, 'u2', '🎉');
    const after = await getPost(post.id);
    expect(after?.reactions['👍']).toEqual(['u3']);
    expect(after?.reactions['🎉']).toEqual(['u2']);
  });

  it('throws when the post does not exist', async () => {
    const { toggleReaction } = await import('./engage');
    await expect(toggleReaction('pst_missing', 'u2', '👍')).rejects.toThrow(/Post not found/i);
  });
});
