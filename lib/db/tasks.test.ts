// lib/db/tasks.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { makeTempDataDir } from '../../tests/setup';

beforeEach(() => { makeTempDataDir(); });

describe('createTask', () => {
  it("creates a task with id 'task_...', done=false", async () => {
    const { createTask } = await import('./tasks');
    const task = await createTask({ userId: 'u1', title: 'Do thing' });
    expect(task.id.startsWith('task_')).toBe(true);
    expect(task.done).toBe(false);
    expect(task.title).toBe('Do thing');
    expect(task.dueDate).toBeNull();
  });

  it('retains a due date when provided', async () => {
    const { createTask } = await import('./tasks');
    const task = await createTask({ userId: 'u1', title: 'X', dueDate: '2026-07-10' });
    expect(task.dueDate).toBe('2026-07-10');
  });
});

describe('listUserTasks', () => {
  it('returns empty for a user with no tasks', async () => {
    const { listUserTasks } = await import('./tasks');
    expect(await listUserTasks('nobody')).toEqual([]);
  });

  it('lists created tasks', async () => {
    const { createTask, listUserTasks } = await import('./tasks');
    await createTask({ userId: 'u1', title: 'A' });
    await createTask({ userId: 'u1', title: 'B' });
    expect(await listUserTasks('u1')).toHaveLength(2);
  });
});

describe('toggleTask', () => {
  it('flips done state', async () => {
    const { createTask, toggleTask, listUserTasks } = await import('./tasks');
    const task = await createTask({ userId: 'u1', title: 'A' });
    await toggleTask('u1', task.id);
    expect((await listUserTasks('u1'))[0]!.done).toBe(true);
    await toggleTask('u1', task.id);
    expect((await listUserTasks('u1'))[0]!.done).toBe(false);
  });
});

describe('deleteTask', () => {
  it('removes a task', async () => {
    const { createTask, deleteTask, listUserTasks } = await import('./tasks');
    const task = await createTask({ userId: 'u1', title: 'A' });
    await deleteTask('u1', task.id);
    expect(await listUserTasks('u1')).toEqual([]);
  });
});
