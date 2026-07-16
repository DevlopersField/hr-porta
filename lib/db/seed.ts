// lib/db/seed.ts

// ============= IMPORTS =============
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail, listUsers, type User } from './users';
import { PERMISSIONS } from '../permissions';
import { createLeaveRequest } from './leaves';
import { listProjects, createProject, addProjectTask } from './projects';
import { logger } from '../logger';
import { getDataDir, storageIsBlobs } from './core';



// ============= SEED =============
export async function seedIfEmpty(): Promise<void> {
  // The fs mkdir + data-seed defaults copy are an fs-only convenience. On the
  // blobs backend there is no local dir; settings fall back to schema defaults
  // (which parse fine) and the admin/demo users go through createUser (blobs-backed).
    if (!storageIsBlobs()) {
          try {
    const dataDir = getDataDir();
    await fs.mkdir(dataDir, { recursive: true });

    // Copy data-seed defaults if files don't exist yet
    const seedDir = path.join(process.cwd(), 'data-seed');
    for (const file of ['users.json', 'settings.json']) {
      const target = path.join(dataDir, file);
      try { await fs.access(target); }
      catch {
        const src = path.join(seedDir, file);
        try { await fs.copyFile(src, target); } catch { /* skip if no seed file */ }
      }
    }
          } catch (err) {
                  logger.warn({ err }, 'seedIfEmpty: failed to prepare local data dir, continuing without fs seed');
          }
    }

  // Create bootstrap admin if no users exist
  const users = await listUsers();
  if (users.length === 0) {
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@local.test';
    // A fixed password (env) makes login stable across deploys/instances; when
    // unset we generate a temp one and force a change on first login.
    const fixed = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    const password = fixed ?? crypto.randomBytes(12).toString('base64url');
    const passwordHash = await bcrypt.hash(password, 12);
    await createUser({
      email,
      passwordHash,
      displayName: 'Bootstrap Admin',
      permissions: ['*'],
      department: 'HR',
      jobTitle: 'Administrator',
      mustChangePassword: fixed ? false : true,
    });
    if (!fixed) {
      logger.warn({ email, tempPassword: password }, 'BOOTSTRAP ADMIN CREATED — save this password, you must change it on first login');
    }
  }

  // Optionally seed a realistic demo company for multi-user/team testing.
  if (process.env.SEED_DEMO === 'true') {
    await seedDemoOrg();
  }
}

// ============= DEMO ORG =============
// Idempotent: keyed off a sentinel demo email. All demo users share one password
// (env DEMO_PASSWORD or 'Password123!') and can log in directly (no forced change),
// so you can exercise team-vs-admin views immediately.
const MANAGER_PERMS = [
  PERMISSIONS.APPROVE_LEAVE,
  PERMISSIONS.APPROVE_REQUESTS,
  PERMISSIONS.VIEW_TEAM_LEAVE,
  PERMISSIONS.VIEW_TEAM_ATTENDANCE,
];
const HR_PERMS = [
  PERMISSIONS.VIEW_ALL_PEOPLE,
  PERMISSIONS.EDIT_USER_PROFILES,
  PERMISSIONS.CREATE_USERS,
  PERMISSIONS.VIEW_ALL_LEAVE,
  PERMISSIONS.APPROVE_LEAVE,
  PERMISSIONS.APPROVE_REQUESTS,
];

export async function seedDemoOrg(): Promise<void> {
  const SENTINEL = 'sara.chen@acme.test';
  if (await getUserByEmail(SENTINEL)) return; // already seeded

  const password = process.env.DEMO_PASSWORD ?? 'Password123!';
  const passwordHash = await bcrypt.hash(password, 12);

  const mk = (
    email: string,
    displayName: string,
    department: string,
    jobTitle: string,
    managerId: string | null,
    permissions: string[] = [],
  ): Promise<User> =>
    createUser({ email, passwordHash, displayName, department, jobTitle, managerId, permissions, mustChangePassword: false });

  // Managers / leads first (reports reference their ids).
  const sara = await mk(SENTINEL, 'Sara Chen', 'Engineering', 'Engineering Manager', null, MANAGER_PERMS);
  const tom = await mk('tom.becker@acme.test', 'Tom Becker', 'Sales', 'Sales Manager', null, MANAGER_PERMS);
  const grace = await mk('grace.kim@acme.test', 'Grace Kim', 'HR', 'HR Generalist', null, HR_PERMS);

  // Individual contributors.
  const eng = [
    ['alex.rivera@acme.test', 'Alex Rivera', 'Software Engineer'],
    ['priya.patel@acme.test', 'Priya Patel', 'Senior Software Engineer'],
    ['diego.santos@acme.test', 'Diego Santos', 'Frontend Engineer'],
    ['mei.lin@acme.test', 'Mei Lin', 'QA Engineer'],
  ] as const;
  const sales = [
    ['jordan.blake@acme.test', 'Jordan Blake', 'Account Executive'],
    ['nina.rossi@acme.test', 'Nina Rossi', 'Sales Development Rep'],
    ['omar.haddad@acme.test', 'Omar Haddad', 'Account Executive'],
  ] as const;

  const engUsers: User[] = [];
  for (const [email, name, title] of eng) engUsers.push(await mk(email, name, 'Engineering', title, sara.id));
  for (const [email, name, title] of sales) await mk(email, name, 'Sales', title, tom.id);
  await mk('liam.wong@acme.test', 'Liam Wong', 'HR', 'Recruiter', grace.id);

  // Starter projects (with tasks) so the timesheet is usable out of the box.
  if ((await listProjects()).length === 0) {
    const web = await createProject({ name: 'Website Redesign', code: 'WEB' });
    await addProjectTask(web.id, 'Design');
    await addProjectTask(web.id, 'Development');
    await addProjectTask(web.id, 'QA');
    const app = await createProject({ name: 'Mobile App', code: 'APP' });
    await addProjectTask(app.id, 'Development');
    await addProjectTask(app.id, 'Testing');
    await createProject({ name: 'Internal Tools', code: 'INT' });
    await createProject({ name: 'Customer Onboarding', code: 'ONB' });
  }

  // A little sample leave so the approvals inbox isn't empty.
  const year = new Date().getUTCFullYear();
  if (engUsers[0]) {
    await createLeaveRequest({
      userId: engUsers[0].id, type: 'annual',
      startDate: `${year}-08-10`, endDate: `${year}-08-14`, days: 5,
      reason: 'Family holiday',
    });
  }
  if (engUsers[1]) {
    await createLeaveRequest({
      userId: engUsers[1].id, type: 'sick',
      startDate: `${year}-07-21`, endDate: `${year}-07-22`, days: 2,
      reason: 'Medical appointment',
    });
  }

  logger.warn({ password, users: 11 }, 'DEMO ORG SEEDED — log in as any *@acme.test with this password');
}
