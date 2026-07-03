// lib/db/performance.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { makeTempDataDir } from '../../tests/setup';

beforeEach(() => { makeTempDataDir(); });

describe('createGoal', () => {
  it("creates an active goal with id 'gl_...' and 0 progress", async () => {
    const { createGoal } = await import('./performance');
    const goal = await createGoal({ userId: 'u1', title: 'Ship module', description: 'do it' });
    expect(goal.id.startsWith('gl_')).toBe(true);
    expect(goal.userId).toBe('u1');
    expect(goal.title).toBe('Ship module');
    expect(goal.description).toBe('do it');
    expect(goal.progress).toBe(0);
    expect(goal.status).toBe('active');
  });

  it('defaults description to empty string when omitted', async () => {
    const { createGoal } = await import('./performance');
    const goal = await createGoal({ userId: 'u1', title: 'No desc' });
    expect(goal.description).toBe('');
  });
});

describe('updateGoalProgress', () => {
  it('auto-completes the goal (status done) when progress reaches 100', async () => {
    const { createGoal, updateGoalProgress, listGoals } = await import('./performance');
    const goal = await createGoal({ userId: 'u1', title: 'g' });
    await updateGoalProgress('u1', goal.id, 100);
    const after = (await listGoals('u1')).find(g => g.id === goal.id);
    expect(after?.progress).toBe(100);
    expect(after?.status).toBe('done');
  });

  it('keeps status active when progress is below 100', async () => {
    const { createGoal, updateGoalProgress, listGoals } = await import('./performance');
    const goal = await createGoal({ userId: 'u1', title: 'g' });
    await updateGoalProgress('u1', goal.id, 60);
    const after = (await listGoals('u1')).find(g => g.id === goal.id);
    expect(after?.progress).toBe(60);
    expect(after?.status).toBe('active');
  });

  it('reverts a completed goal to active when progress drops below 100', async () => {
    const { createGoal, updateGoalProgress, listGoals } = await import('./performance');
    const goal = await createGoal({ userId: 'u1', title: 'g' });
    await updateGoalProgress('u1', goal.id, 100);
    await updateGoalProgress('u1', goal.id, 40);
    const after = (await listGoals('u1')).find(g => g.id === goal.id);
    expect(after?.status).toBe('active');
  });

  it('throws when goal not found', async () => {
    const { updateGoalProgress } = await import('./performance');
    await expect(updateGoalProgress('u1', 'gl_nope', 50)).rejects.toThrow(/Goal not found/i);
  });
});

describe('setGoalStatus and deleteGoal', () => {
  it('archives a goal', async () => {
    const { createGoal, setGoalStatus, listGoals } = await import('./performance');
    const goal = await createGoal({ userId: 'u1', title: 'g' });
    await setGoalStatus('u1', goal.id, 'archived');
    const after = (await listGoals('u1')).find(g => g.id === goal.id);
    expect(after?.status).toBe('archived');
  });

  it('deletes a goal', async () => {
    const { createGoal, deleteGoal, listGoals } = await import('./performance');
    const goal = await createGoal({ userId: 'u1', title: 'g' });
    await deleteGoal('u1', goal.id);
    expect((await listGoals('u1')).find(g => g.id === goal.id)).toBeUndefined();
  });
});

describe('review lifecycle', () => {
  it("creates a draft review with id 'rv_...'", async () => {
    const { createReview } = await import('./performance');
    const review = await createReview({ userId: 'u1', cycle: '2026 Mid-Year' });
    expect(review.id.startsWith('rv_')).toBe(true);
    expect(review.cycle).toBe('2026 Mid-Year');
    expect(review.status).toBe('draft');
    expect(review.managerId).toBeNull();
    expect(review.managerRating).toBeNull();
  });

  it('saves the self-assessment text', async () => {
    const { createReview, updateSelfAssessment, getReview } = await import('./performance');
    const review = await createReview({ userId: 'u1', cycle: '2026 Mid-Year' });
    await updateSelfAssessment('u1', review.id, 'I did great work');
    const after = await getReview('u1', review.id);
    expect(after?.selfAssessment).toBe('I did great work');
  });

  it('transitions draft -> submitted -> finalized recording rating and notes', async () => {
    const { createReview, submitReview, finalizeReview, getReview } = await import('./performance');
    const review = await createReview({ userId: 'u1', cycle: '2026 Mid-Year' });
    await submitReview('u1', review.id);
    let after = await getReview('u1', review.id);
    expect(after?.status).toBe('submitted');

    await finalizeReview('u1', review.id, 'mgr-1', 4, 'Solid year');
    after = await getReview('u1', review.id);
    expect(after?.status).toBe('finalized');
    expect(after?.managerId).toBe('mgr-1');
    expect(after?.managerRating).toBe(4);
    expect(after?.managerNotes).toBe('Solid year');
  });

  it('throws when submitting a non-draft review', async () => {
    const { createReview, submitReview } = await import('./performance');
    const review = await createReview({ userId: 'u1', cycle: '2026 Mid-Year' });
    await submitReview('u1', review.id);
    await expect(submitReview('u1', review.id)).rejects.toThrow(/already submitted/i);
  });

  it('throws when finalizing a review that is not submitted', async () => {
    const { createReview, finalizeReview } = await import('./performance');
    const review = await createReview({ userId: 'u1', cycle: '2026 Mid-Year' });
    // still a draft
    await expect(finalizeReview('u1', review.id, 'mgr-1', 3, 'x')).rejects.toThrow(/must be submitted/i);
  });
});
