// lib/db/projects.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { makeTempDataDir } from '../../tests/setup';

beforeEach(() => {
  makeTempDataDir();
});

describe('createProject + getProject', () => {
  it('creates a project with name and optional code and no due date by default', async () => {
    const { createProject, getProject } = await import('./projects');
    const p = await createProject({ name: 'Website Redesign', code: 'WEB' });
    expect(p.id).toMatch(/^prj_/);
    expect(p.name).toBe('Website Redesign');
    expect(p.code).toBe('WEB');
    expect(p.dueDate).toBeNull();
    expect(p.description).toBe('');
    const fetched = await getProject(p.id);
    expect(fetched?.name).toBe('Website Redesign');
  });

  it('creates a project with description and initial tasks in one call', async () => {
    const { createProject } = await import('./projects');
    const p = await createProject({
      name: 'Portal v2',
      description: 'Full rebuild of the customer portal',
      tasks: ['Design', 'Development', 'QA'],
    });
    expect(p.description).toBe('Full rebuild of the customer portal');
    expect(p.tasks.map(t => t.name)).toEqual(['Design', 'Development', 'QA']);
    expect(p.tasks.every(t => t.id.startsWith('ptk_'))).toBe(true);
  });

  it('dedupes initial task names case-insensitively and skips blanks', async () => {
    const { createProject } = await import('./projects');
    const p = await createProject({ name: 'Dedup', tasks: ['Design', ' design ', '', 'QA'] });
    expect(p.tasks.map(t => t.name)).toEqual(['Design', 'QA']);
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
  it('lists all projects sorted by name', async () => {
    const { createProject, listProjects } = await import('./projects');
    await createProject({ name: 'Beta' });
    await createProject({ name: 'Alpha' });
    const all = await listProjects();
    expect(all.map(p => p.name)).toEqual(['Alpha', 'Beta']);
  });
});

describe('PROJECT_STATUSES', () => {
  it('uses the renamed 6-stage vocabulary (discuss/design/development/qa/uat/completed)', async () => {
    const { PROJECT_STATUSES } = await import('./projects');
    expect(PROJECT_STATUSES).toEqual(['discuss', 'design', 'development', 'qa', 'uat', 'completed']);
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

  it('defaults a new task to empty description, null dueDate, and discuss status', async () => {
    const { createProject, addProjectTask } = await import('./projects');
    const p = await createProject({ name: 'Defaults' });
    const task = await addProjectTask(p.id, 'Bare task');
    expect(task.description).toBe('');
    expect(task.dueDate).toBeNull();
    expect(task.status).toBe('discuss');
  });

  it('accepts optional description and dueDate on creation', async () => {
    const { createProject, addProjectTask } = await import('./projects');
    const p = await createProject({ name: 'Rich Task' });
    const task = await addProjectTask(p.id, 'Detailed task', {
      description: 'Do the thing',
      dueDate: '2026-08-01',
    });
    expect(task.description).toBe('Do the thing');
    expect(task.dueDate).toBe('2026-08-01');
  });

  it('accepts an explicit status on creation instead of defaulting to discuss', async () => {
    const { createProject, addProjectTask } = await import('./projects');
    const p = await createProject({ name: 'Task With Status' });
    const task = await addProjectTask(p.id, 'Straight to QA', { status: 'qa' });
    expect(task.status).toBe('qa');
  });
});

describe('updateProjectTask', () => {
  it('applies a partial update to an existing task', async () => {
    const { createProject, addProjectTask, updateProjectTask, getProject } = await import('./projects');
    const p = await createProject({ name: 'Update Me' });
    const task = await addProjectTask(p.id, 'Original name');
    await updateProjectTask(p.id, task.id, {
      name: 'Renamed',
      description: 'New description',
      dueDate: '2026-09-01',
      status: 'qa',
    });
    const after = await getProject(p.id);
    const updated = after?.tasks.find(t => t.id === task.id);
    expect(updated?.name).toBe('Renamed');
    expect(updated?.description).toBe('New description');
    expect(updated?.dueDate).toBe('2026-09-01');
    expect(updated?.status).toBe('qa');
  });

  it('leaves fields not present in the patch unchanged', async () => {
    const { createProject, addProjectTask, updateProjectTask, getProject } = await import('./projects');
    const p = await createProject({ name: 'Partial Update' });
    const task = await addProjectTask(p.id, 'Task', { description: 'Keep me' });
    await updateProjectTask(p.id, task.id, { status: 'design' });
    const after = await getProject(p.id);
    const updated = after?.tasks.find(t => t.id === task.id);
    expect(updated?.description).toBe('Keep me');
    expect(updated?.status).toBe('design');
  });

  it('throws for a missing project or missing task', async () => {
    const { createProject, addProjectTask, updateProjectTask } = await import('./projects');
    const p = await createProject({ name: 'Existing' });
    const task = await addProjectTask(p.id, 'Task');
    await expect(updateProjectTask('prj_missing', task.id, { name: 'X' })).rejects.toThrow(/not found/i);
    await expect(updateProjectTask(p.id, 'ptk_missing', { name: 'X' })).rejects.toThrow(/not found/i);
  });
});

describe('deleteProject', () => {
  it('removes a project from the list', async () => {
    const { createProject, deleteProject, listProjects } = await import('./projects');
    const p = await createProject({ name: 'To Delete' });
    await createProject({ name: 'Keep' });
    await deleteProject(p.id);
    const all = await listProjects();
    expect(all.map(pr => pr.name)).toEqual(['Keep']);
  });

  it('throws for a missing project', async () => {
    const { deleteProject } = await import('./projects');
    await expect(deleteProject('prj_missing')).rejects.toThrow(/not found/i);
  });
});

describe('setProjectDescription', () => {
  it('updates a project description', async () => {
    const { createProject, setProjectDescription, getProject } = await import('./projects');
    const p = await createProject({ name: 'Describe Me' });
    await setProjectDescription(p.id, 'Now with a description');
    expect((await getProject(p.id))?.description).toBe('Now with a description');
  });

  it('throws for a missing project', async () => {
    const { setProjectDescription } = await import('./projects');
    await expect(setProjectDescription('prj_missing', 'x')).rejects.toThrow(/not found/i);
  });
});

describe('setProjectDueDate', () => {
  it('sets and clears a due date', async () => {
    const { createProject, setProjectDueDate, getProject } = await import('./projects');
    const p = await createProject({ name: 'Dated Project' });
    await setProjectDueDate(p.id, '2026-08-01');
    expect((await getProject(p.id))?.dueDate).toBe('2026-08-01');
    await setProjectDueDate(p.id, null);
    expect((await getProject(p.id))?.dueDate).toBeNull();
  });

  it('throws for a missing project', async () => {
    const { setProjectDueDate } = await import('./projects');
    await expect(setProjectDueDate('prj_missing', '2026-08-01')).rejects.toThrow(/not found/i);
  });
});
