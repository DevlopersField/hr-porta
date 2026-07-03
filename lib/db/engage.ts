// lib/db/engage.ts

// ============= IMPORTS =============
import { z } from 'zod';
import crypto from 'node:crypto';
import { readJson, updateJson } from './core';

// ============= CONSTANTS =============
export const ALLOWED_EMOJIS = ['👍', '❤️', '🎉', '👏'] as const;
export type Emoji = typeof ALLOWED_EMOJIS[number];

// ============= SCHEMA =============
export const PostSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  title: z.string(),
  body: z.string(),
  createdAt: z.string(),
  reactions: z.record(z.string(), z.array(z.string())).default(() => ({})),
  attachmentIds: z.array(z.string()).default([]),
});
export type Post = z.infer<typeof PostSchema>;

export const EngageFileSchema = z.object({
  posts: z.array(PostSchema),
});
export type EngageFile = z.infer<typeof EngageFileSchema>;

const EMPTY: EngageFile = { posts: [] };
const PATH = 'engage.json';

// ============= READS =============
export async function listPosts(): Promise<Post[]> {
  const data = await readJson(PATH, EngageFileSchema, EMPTY);
  return [...data.posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPost(id: string): Promise<Post | null> {
  const data = await readJson(PATH, EngageFileSchema, EMPTY);
  return data.posts.find(p => p.id === id) ?? null;
}

// ============= WRITES =============
export type CreatePostInput = {
  authorId: string;
  title: string;
  body: string;
  attachmentIds?: string[];
};

export async function createPost(input: CreatePostInput): Promise<Post> {
  const result = await updateJson(PATH, EngageFileSchema, EMPTY, (current) => {
    const newPost: Post = {
      id: `pst_${crypto.randomBytes(6).toString('hex')}`,
      authorId: input.authorId,
      title: input.title,
      body: input.body,
      createdAt: new Date().toISOString(),
      reactions: {},
      attachmentIds: input.attachmentIds ?? [],
    };
    return { posts: [...current.posts, newPost] };
  });
  return result.posts[result.posts.length - 1]!;
}

// Toggle a user's reaction on a post. One reaction per user per post:
// - if the user already reacted with this emoji, remove it (toggle off)
// - otherwise add it, first removing the user from any OTHER emoji on the post
export async function toggleReaction(postId: string, userId: string, emoji: string): Promise<void> {
  await updateJson(PATH, EngageFileSchema, EMPTY, (current) => {
    const target = current.posts.find(p => p.id === postId);
    if (!target) throw new Error('Post not found');
    return {
      posts: current.posts.map(p => {
        if (p.id !== postId) return p;
        const already = (p.reactions[emoji] ?? []).includes(userId);
        const nextReactions: Record<string, string[]> = {};
        for (const [key, ids] of Object.entries(p.reactions)) {
          // Remove the user from every emoji first (enforces one-per-user).
          const cleaned = ids.filter(id => id !== userId);
          if (cleaned.length > 0) nextReactions[key] = cleaned;
        }
        if (!already) {
          nextReactions[emoji] = [...(nextReactions[emoji] ?? []), userId];
        }
        return { ...p, reactions: nextReactions };
      }),
    };
  });
}
