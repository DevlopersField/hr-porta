// lib/db/projects.ts
// Project registry backing the timesheet: employees log hours against a
// project. Low-write lookup data, so a single monolithic file.

// ============= IMPORTS =============
import { z } from 'zod';
import crypto from 'node:crypto';
import { readJson, updateJson } from './core';
import { PROJECT_STATUSES, type ProjectStatus } from '../project-status';

// Re-exported so existing call sites (`import { PROJECT_STATUSES } from
// '@/lib/db/projects'`) keep working unchanged. The canonical definition
// lives in lib/project-status.ts (a pure, fs-free module) so client
// components can import the vocabulary without pulling in node:fs.
export { PROJECT_STATUSES };
export type { ProjectStatus };

// ============= SCHEMA =============

export const ProjectTaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().default(''),
  dueDate: z.string().nullable().default(null),
  // Same 6-stage lifecycle as projects; independent of the parent project's status.
  status: z.enum(PROJECT_STATUSES).default('discuss'),
});
export type ProjectTask = z.infer<typeof ProjectTaskSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string().nullable().default(null),
  description: z.string().default(''),
  dueDate: z.string().nullable().default(null),
  // Tasks scope time entries within a project; entries without a task fall
  // under the implicit "Other" bucket (taskId null).
  tasks: z.array(ProjectTaskSchema).default([]),
  createdAt: z.string(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const ProjectsFileSchema = z.object({
  projects: z.array(ProjectSchema),
});
export type ProjectsFile = z.infer<typeof ProjectsFileSchema>;

const EMPTY: ProjectsFile = { projects: [] };
const PATH = 'projects.json';

// ============= READS =============
export async function listProjects(): Promise<Project[]> {
  const data = await readJson(PATH, ProjectsFileSchema, EMPTY);
  return [...data.projects].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProject(id: string): Promise<Project | null> {
  const data = await readJson(PATH, ProjectsFileSchema, EMPTY);
  return data.projects.find(p => p.id === id) ?? null;
}

// ============= WRITES =============
export type CreateProjectInput = {
  name: string;
  code?: string | null;
  description?: string;
  // Initial task names; blanks skipped, duplicates deduped case-insensitively.
  tasks?: string[];
};

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const name = input.name.trim();
  if (!name) throw new Error('Project name is required');
  const seen = new Set<string>();
  const tasks: ProjectTask[] = [];
  for (const raw of input.tasks ?? []) {
    const taskName = raw.trim();
    if (!taskName || seen.has(taskName.toLowerCase())) continue;
    seen.add(taskName.toLowerCase());
    tasks.push({
      id: `ptk_${crypto.randomBytes(6).toString('hex')}`,
      name: taskName,
      description: '',
      dueDate: null,
      status: 'discuss',
    });
  }
  const project: Project = {
    id: `prj_${crypto.randomBytes(6).toString('hex')}`,
    name,
    code: input.code?.trim() || null,
    description: input.description?.trim() ?? '',
    dueDate: null,
    tasks,
    createdAt: new Date().toISOString(),
  };
  await updateJson(PATH, ProjectsFileSchema, EMPTY, (current) => {
    if (current.projects.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`Project "${name}" already exists`);
    }
    return { projects: [...current.projects, project] };
  });
  return project;
}

export type AddProjectTaskInput = {
  description?: string;
  dueDate?: string | null;
};

export async function addProjectTask(
  projectId: string,
  taskName: string,
  input: AddProjectTaskInput = {},
): Promise<ProjectTask> {
  const name = taskName.trim();
  if (!name) throw new Error('Task name is required');
  const task: ProjectTask = {
    id: `ptk_${crypto.randomBytes(6).toString('hex')}`,
    name,
    description: input.description?.trim() ?? '',
    dueDate: input.dueDate ?? null,
    status: 'discuss',
  };
  await updateJson(PATH, ProjectsFileSchema, EMPTY, (current) => {
    const target = current.projects.find(p => p.id === projectId);
    if (!target) throw new Error('Project not found');
    if (target.tasks.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`Task "${name}" already exists in this project`);
    }
    return {
      projects: current.projects.map(p =>
        p.id === projectId ? { ...p, tasks: [...p.tasks, task] } : p,
      ),
    };
  });
  return task;
}

export type UpdateProjectTaskPatch = {
  name?: string;
  description?: string;
  dueDate?: string | null;
  status?: ProjectStatus;
};

export async function updateProjectTask(
  projectId: string,
  taskId: string,
  patch: UpdateProjectTaskPatch,
): Promise<void> {
  await updateJson(PATH, ProjectsFileSchema, EMPTY, (current) => {
    const target = current.projects.find(p => p.id === projectId);
    if (!target) throw new Error('Project not found');
    if (!target.tasks.some(t => t.id === taskId)) throw new Error('Task not found');
    return {
      projects: current.projects.map(p =>
        p.id === projectId
          ? { ...p, tasks: p.tasks.map(t => (t.id === taskId ? { ...t, ...patch } : t)) }
          : p,
      ),
    };
  });
}

export async function setProjectDescription(id: string, description: string): Promise<void> {
  await updateJson(PATH, ProjectsFileSchema, EMPTY, (current) => {
    if (!current.projects.some(p => p.id === id)) {
      throw new Error('Project not found');
    }
    return {
      projects: current.projects.map(p => (p.id === id ? { ...p, description } : p)),
    };
  });
}

export async function setProjectDueDate(id: string, dueDate: string | null): Promise<void> {
  await updateJson(PATH, ProjectsFileSchema, EMPTY, (current) => {
    if (!current.projects.some(p => p.id === id)) {
      throw new Error('Project not found');
    }
    return {
      projects: current.projects.map(p => (p.id === id ? { ...p, dueDate } : p)),
    };
  });
}

// Removes a project outright. Callers (the action layer) are responsible for
// guarding against deleting a project with logged time — this function just
// performs the removal.
export async function deleteProject(id: string): Promise<void> {
  await updateJson(PATH, ProjectsFileSchema, EMPTY, (current) => {
    if (!current.projects.some(p => p.id === id)) {
      throw new Error('Project not found');
    }
    return {
      projects: current.projects.filter(p => p.id !== id),
    };
  });
}
