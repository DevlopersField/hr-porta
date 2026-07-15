// lib/db/projects.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { makeTempDataDir } from '../../tests/setup';

beforeEach(() => {
  makeTempDataDir();
});

describe('createProject + getProject', () => {
  it('creates a project with name and optional code, active by default', async () => {
    const { createProject, getProject } = await import('./projects');
    const p = await createProject({ name: 'Website Redesign', code: 'WEB' });
    expect(p.id).toMatch(/^prj_/);
    expect(p.name).toBe('Website Redesign');
    expect(p.code).toBe('WEB');
    expect(p.active).toBe(true);
    const fetched = await getProject(p.id);
    expect(fetched?.name).toBe('Website Redesign');
  });

  it('rejects an empty name', async () => {
    const { createProject } = await import('./projects');
    await expect(createProject({ name: '   ' })).rejects.toThrow(/name/i);
  });

  it('rejects a duplicate name (case-insensitive)', async () => {
    const { createProject } = await import('./projects');
    await createProject({ name: 'Internal Tools' });
    await expect(createProject({ name: 'internal tools' })).rejects.toThrow(/already exists/i);
  });
});

describe('listProjects', () => {
  it('lists all projects sorted by name, or only active ones', async () => {
    const { createProject, setProjectActive, listProjects } = await import('./projects');
    const b = await createProject({ name: 'Beta' });
    await createProject({ name: 'Alpha' });
    await setProjectActive(b.id, false);
    const all = await listProjects();
    expect(all.map(p => p.name)).toEqual(['Alpha', 'Beta']);
    const active = await listProjects({ activeOnly: true });
    expect(active.map(p => p.name)).toEqual(['Alpha']);
  });
});

describe('addProjectTask', () => {
  it('adds a named task inside a project', async () => {
    const { createProject, addProjectTask, getProject } = await import('./projects');
    const p = await createProject({ name: 'Website Redesign' });
    const task = await addProjectTask(p.id, 'Design mockups');
    expect(task.id).toMatch(/^ptk_/);
    const after = await getProject(p.id);
    expect(after?.tasks.map(t => t.name)).toEqual(['Design mockups']);
  });

  it('rejects duplicate task names within the same project (case-insensitive)', async () => {
    const { createProject, addProjectTask } = await import('./projects');
    const p = await createProject({ name: 'App' });
    await addProjectTask(p.id, 'QA');
    await expect(addProjectTask(p.id, 'qa')).rejects.toThrow(/already exists/i);
  });

  it('rejects an empty task name and a missing project', async () => {
    const { createProject, addProjectTask } = await import('./projects');
    const p = await createProject({ name: 'X' });
    await expect(addProjectTask(p.id, '  ')).rejects.toThrow(/name/i);
    await expect(addProjectTask('prj_missing', 'T')).rejects.toThrow(/not found/i);
  });

  it('existing projects without tasks parse with an empty task list', async () => {
    const { createProject, getProject } = await import('./projects');
    const p = await createProject({ name: 'Legacy' });
    expect((await getProject(p.id))?.tasks).toEqual([]);
  });
});

describe('setProjectActive', () => {
  it('archives and restores a project', async () => {
    const { createProject, setProjectActive, getProject } = await import('./projects');
    const p = await createProject({ name: 'Old Initiative' });
    await setProjectActive(p.id, false);
    expect((await getProject(p.id))?.active).toBe(false);
    await setProjectActive(p.id, true);
    expect((await getProject(p.id))?.active).toBe(true);
  });

  it('throws for a missing project', async () => {
    const { setProjectActive } = await import('./projects');
    await expect(setProjectActive('prj_missing', false)).rejects.toThrow(/not found/i);
  });
});
