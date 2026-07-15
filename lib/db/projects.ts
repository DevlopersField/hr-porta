// lib/db/projects.ts
// Project registry backing the timesheet: employees log hours against a
// project. Low-write lookup data, so a single monolithic file.

// ============= IMPORTS =============
import { z } from 'zod';
import crypto from 'node:crypto';
import { readJson, updateJson } from './core';

// ============= SCHEMA =============
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string().nullable().default(null),
  active: z.boolean().default(true),
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
export async function listProjects(opts: { activeOnly?: boolean } = {}): Promise<Project[]> {
  const data = await readJson(PATH, ProjectsFileSchema, EMPTY);
  const projects = opts.activeOnly ? data.projects.filter(p => p.active) : data.projects;
  return [...projects].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProject(id: string): Promise<Project | null> {
  const data = await readJson(PATH, ProjectsFileSchema, EMPTY);
  return data.projects.find(p => p.id === id) ?? null;
}

// ============= WRITES =============
export type CreateProjectInput = {
  name: string;
  code?: string | null;
};

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const name = input.name.trim();
  if (!name) throw new Error('Project name is required');
  const project: Project = {
    id: `prj_${crypto.randomBytes(6).toString('hex')}`,
    name,
    code: input.code?.trim() || null,
    active: true,
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

export async function setProjectActive(id: string, active: boolean): Promise<void> {
  await updateJson(PATH, ProjectsFileSchema, EMPTY, (current) => {
    if (!current.projects.some(p => p.id === id)) {
      throw new Error('Project not found');
    }
    return {
      projects: current.projects.map(p => (p.id === id ? { ...p, active } : p)),
    };
  });
}
