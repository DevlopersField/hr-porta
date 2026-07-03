// lib/db/tasks.ts

// ============= IMPORTS =============
import { z } from 'zod';
import crypto from 'node:crypto';
import { readJson, updateJson } from './core';

// ============= SCHEMA =============
export const TaskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  done: z.boolean().default(false),
  dueDate: z.string().nullable().default(null),
  createdAt: z.string(),
});
export type Task = z.infer<typeof TaskSchema>;

export const TaskFileSchema = z.object({
  tasks: z.array(TaskSchema),
});
export type TaskFile = z.infer<typeof TaskFileSchema>;

const EMPTY: TaskFile = { tasks: [] };

function pathFor(userId: string): string {
  return `tasks/${userId}.json`;
}

// ============= READS =============
export async function listUserTasks(userId: string): Promise<Task[]> {
  const data = await readJson(pathFor(userId), TaskFileSchema, EMPTY);
  return data.tasks;
}

// ============= WRITES =============
export type CreateTaskInput = {
  userId: string;
  title: string;
  dueDate?: string | null;
};

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const result = await updateJson(pathFor(input.userId), TaskFileSchema, EMPTY, (current) => {
    const newTask: Task = {
      id: `task_${crypto.randomBytes(6).toString('hex')}`,
      userId: input.userId,
      title: input.title,
      done: false,
      dueDate: input.dueDate ?? null,
      createdAt: new Date().toISOString(),
    };
    return { tasks: [...current.tasks, newTask] };
  });
  return result.tasks[result.tasks.length - 1]!;
}

export async function toggleTask(userId: string, id: string): Promise<void> {
  await updateJson(pathFor(userId), TaskFileSchema, EMPTY, (current) => ({
    tasks: current.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t),
  }));
}

export async function deleteTask(userId: string, id: string): Promise<void> {
  await updateJson(pathFor(userId), TaskFileSchema, EMPTY, (current) => ({
    tasks: current.tasks.filter(t => t.id !== id),
  }));
}
