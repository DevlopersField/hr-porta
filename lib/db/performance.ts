// lib/db/performance.ts

// ============= IMPORTS =============
import { z } from 'zod';
import crypto from 'node:crypto';
import { readJson, updateJson } from './core';

// ============= TYPES =============
export const GOAL_STATUSES = ['active', 'done', 'archived'] as const;
export type GoalStatus = typeof GOAL_STATUSES[number];

export const REVIEW_STATUSES = ['draft', 'submitted', 'finalized'] as const;
export type ReviewStatus = typeof REVIEW_STATUSES[number];

// ============= SCHEMA =============
export const GoalSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().default(''),
  progress: z.number().min(0).max(100).default(0),
  status: z.enum(GOAL_STATUSES).default('active'),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Goal = z.infer<typeof GoalSchema>;

export const ReviewSchema = z.object({
  id: z.string(),
  userId: z.string(),
  cycle: z.string(),
  selfAssessment: z.string().default(''),
  managerId: z.string().nullable().default(null),
  managerRating: z.number().int().min(1).max(5).nullable().default(null),
  managerNotes: z.string().default(''),
  status: z.enum(REVIEW_STATUSES).default('draft'),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Review = z.infer<typeof ReviewSchema>;

export const PerformanceFileSchema = z.object({
  goals: z.array(GoalSchema),
  reviews: z.array(ReviewSchema),
});
export type PerformanceFile = z.infer<typeof PerformanceFileSchema>;

const EMPTY: PerformanceFile = { goals: [], reviews: [] };

function pathFor(userId: string): string {
  return `performance/${userId}.json`;
}

// ============= GOAL READS =============
export async function listGoals(userId: string): Promise<Goal[]> {
  const data = await readJson(pathFor(userId), PerformanceFileSchema, EMPTY);
  return data.goals;
}

// ============= GOAL WRITES =============
export type CreateGoalInput = {
  userId: string;
  title: string;
  description?: string;
};

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const now = new Date().toISOString();
  const result = await updateJson(pathFor(input.userId), PerformanceFileSchema, EMPTY, (current) => {
    const newGoal: Goal = {
      id: `gl_${crypto.randomBytes(6).toString('hex')}`,
      userId: input.userId,
      title: input.title,
      description: input.description ?? '',
      progress: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    return { ...current, goals: [...current.goals, newGoal] };
  });
  return result.goals[result.goals.length - 1]!;
}

export async function updateGoalProgress(userId: string, id: string, progress: number): Promise<void> {
  await updateJson(pathFor(userId), PerformanceFileSchema, EMPTY, (current) => {
    const target = current.goals.find(g => g.id === id);
    if (!target) throw new Error('Goal not found');
    const status: GoalStatus = progress === 100 ? 'done' : 'active';
    return {
      ...current,
      goals: current.goals.map(g =>
        g.id === id ? { ...g, progress, status, updatedAt: new Date().toISOString() } : g,
      ),
    };
  });
}

export async function setGoalStatus(userId: string, id: string, status: GoalStatus): Promise<void> {
  await updateJson(pathFor(userId), PerformanceFileSchema, EMPTY, (current) => {
    const target = current.goals.find(g => g.id === id);
    if (!target) throw new Error('Goal not found');
    return {
      ...current,
      goals: current.goals.map(g =>
        g.id === id ? { ...g, status, updatedAt: new Date().toISOString() } : g,
      ),
    };
  });
}

export async function deleteGoal(userId: string, id: string): Promise<void> {
  await updateJson(pathFor(userId), PerformanceFileSchema, EMPTY, (current) => ({
    ...current,
    goals: current.goals.filter(g => g.id !== id),
  }));
}

// ============= REVIEW READS =============
export async function listReviews(userId: string): Promise<Review[]> {
  const data = await readJson(pathFor(userId), PerformanceFileSchema, EMPTY);
  return data.reviews;
}

export async function getReview(userId: string, id: string): Promise<Review | null> {
  const reviews = await listReviews(userId);
  return reviews.find(r => r.id === id) ?? null;
}

// ============= REVIEW WRITES =============
export type CreateReviewInput = {
  userId: string;
  cycle: string;
};

export async function createReview(input: CreateReviewInput): Promise<Review> {
  const now = new Date().toISOString();
  const result = await updateJson(pathFor(input.userId), PerformanceFileSchema, EMPTY, (current) => {
    const newReview: Review = {
      id: `rv_${crypto.randomBytes(6).toString('hex')}`,
      userId: input.userId,
      cycle: input.cycle,
      selfAssessment: '',
      managerId: null,
      managerRating: null,
      managerNotes: '',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
    return { ...current, reviews: [...current.reviews, newReview] };
  });
  return result.reviews[result.reviews.length - 1]!;
}

export async function updateSelfAssessment(userId: string, id: string, text: string): Promise<void> {
  await updateJson(pathFor(userId), PerformanceFileSchema, EMPTY, (current) => {
    const target = current.reviews.find(r => r.id === id);
    if (!target) throw new Error('Review not found');
    return {
      ...current,
      reviews: current.reviews.map(r =>
        r.id === id ? { ...r, selfAssessment: text, updatedAt: new Date().toISOString() } : r,
      ),
    };
  });
}

export async function submitReview(userId: string, id: string): Promise<void> {
  await updateJson(pathFor(userId), PerformanceFileSchema, EMPTY, (current) => {
    const target = current.reviews.find(r => r.id === id);
    if (!target) throw new Error('Review not found');
    if (target.status !== 'draft') {
      throw new Error(`Review already ${target.status}`);
    }
    return {
      ...current,
      reviews: current.reviews.map(r =>
        r.id === id ? { ...r, status: 'submitted' as const, updatedAt: new Date().toISOString() } : r,
      ),
    };
  });
}

export async function finalizeReview(
  userId: string,
  id: string,
  managerId: string,
  rating: number,
  notes: string,
): Promise<void> {
  await updateJson(pathFor(userId), PerformanceFileSchema, EMPTY, (current) => {
    const target = current.reviews.find(r => r.id === id);
    if (!target) throw new Error('Review not found');
    if (target.status !== 'submitted') {
      throw new Error(`Review must be submitted to finalize (currently ${target.status})`);
    }
    return {
      ...current,
      reviews: current.reviews.map(r =>
        r.id === id
          ? {
              ...r,
              status: 'finalized' as const,
              managerId,
              managerRating: rating,
              managerNotes: notes,
              updatedAt: new Date().toISOString(),
            }
          : r,
      ),
    };
  });
}
