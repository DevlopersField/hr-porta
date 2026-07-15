// app/(portal)/my-worklife/actions.ts

// ============= IMPORTS =============
'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { ForbiddenError } from '@/lib/permissions';
import { getUserById } from '@/lib/db/users';
import {
  createGoal,
  updateGoalProgress,
  setGoalStatus,
  deleteGoal,
  createReview,
  updateSelfAssessment,
  submitReview,
  finalizeReview,
  GOAL_STATUSES,
} from '@/lib/db/performance';
import { auditLog } from '@/lib/db/audit';
import { setNoticeFlash } from '@/lib/flash';

// ============= SCHEMAS =============
const CreateGoalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

const ProgressSchema = z.object({
  goalId: z.string(),
  progress: z.coerce.number().min(0).max(100),
});

const GoalStatusSchema = z.object({
  goalId: z.string(),
  status: z.enum(GOAL_STATUSES),
});

const CreateReviewSchema = z.object({
  cycle: z.string().min(1).max(120),
});

const SelfAssessmentSchema = z.object({
  reviewId: z.string(),
  selfAssessment: z.string().max(5000),
});

const FinalizeSchema = z.object({
  userId: z.string(),
  reviewId: z.string(),
  rating: z.coerce.number().int().min(1).max(5),
  notes: z.string().max(5000).optional(),
});

// ============= GOAL ACTIONS =============
export async function createGoalAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const input = CreateGoalSchema.parse(Object.fromEntries(formData));
  const created = await createGoal({ userId: user.id, title: input.title, description: input.description });
  await auditLog({ actorId: user.id, action: 'goal.create', target: created.id, details: { title: input.title } });
  await setNoticeFlash('Goal created');
  revalidatePath('/my-worklife/goals');
}

export async function updateGoalProgressAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const input = ProgressSchema.parse(Object.fromEntries(formData));
  await updateGoalProgress(user.id, input.goalId, input.progress);
  await auditLog({ actorId: user.id, action: 'goal.progress', target: input.goalId, details: { progress: input.progress } });
  await setNoticeFlash('Progress saved');
  revalidatePath('/my-worklife/goals');
}

export async function setGoalStatusAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const input = GoalStatusSchema.parse(Object.fromEntries(formData));
  await setGoalStatus(user.id, input.goalId, input.status);
  await auditLog({ actorId: user.id, action: 'goal.status', target: input.goalId, details: { status: input.status } });
  await setNoticeFlash('Goal updated');
  revalidatePath('/my-worklife/goals');
}

export async function deleteGoalAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const input = z.object({ goalId: z.string() }).parse(Object.fromEntries(formData));
  await deleteGoal(user.id, input.goalId);
  await auditLog({ actorId: user.id, action: 'goal.delete', target: input.goalId });
  await setNoticeFlash('Goal deleted');
  revalidatePath('/my-worklife/goals');
}

// ============= REVIEW ACTIONS =============
export async function createReviewAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const input = CreateReviewSchema.parse(Object.fromEntries(formData));
  const created = await createReview({ userId: user.id, cycle: input.cycle });
  await auditLog({ actorId: user.id, action: 'review.create', target: created.id, details: { cycle: input.cycle } });
  await setNoticeFlash('Review created');
  revalidatePath('/my-worklife/reviews');
}

export async function saveSelfAssessmentAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const input = SelfAssessmentSchema.parse(Object.fromEntries(formData));
  await updateSelfAssessment(user.id, input.reviewId, input.selfAssessment);
  await auditLog({ actorId: user.id, action: 'review.self_assessment', target: input.reviewId });
  await setNoticeFlash('Self-assessment saved');
  revalidatePath('/my-worklife/reviews');
}

export async function submitReviewAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const input = z.object({ reviewId: z.string() }).parse(Object.fromEntries(formData));
  await submitReview(user.id, input.reviewId);
  await auditLog({ actorId: user.id, action: 'review.submit', target: input.reviewId });
  await setNoticeFlash('Review submitted');
  revalidatePath('/my-worklife/reviews');
}

export async function finalizeReviewAction(formData: FormData): Promise<void> {
  const manager = await requireSession();
  const input = FinalizeSchema.parse(Object.fromEntries(formData));
  const target = await getUserById(input.userId);
  if (!target || target.managerId !== manager.id) {
    throw new ForbiddenError('You are not the manager of this employee');
  }
  await finalizeReview(input.userId, input.reviewId, manager.id, input.rating, input.notes ?? '');
  await auditLog({
    actorId: manager.id,
    action: 'review.finalize',
    target: input.reviewId,
    details: { userId: input.userId, rating: input.rating },
  });
  await setNoticeFlash('Review finalized');
  revalidatePath('/my-worklife/reviews');
}
