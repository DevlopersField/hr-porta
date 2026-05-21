// lib/db/seed.ts

// ============= IMPORTS =============
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { createUser, listUsers } from './users';
import { logger } from '../logger';

// ============= CONFIG =============
function getDataDir(): string {
  return process.env.DATA_DIR ?? path.join(process.cwd(), 'data');
}

// ============= SEED =============
export async function seedIfEmpty(): Promise<void> {
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

  // Create bootstrap admin if no users exist
  const users = await listUsers();
  if (users.length === 0) {
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@local';
    const tempPassword = crypto.randomBytes(12).toString('base64url');
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    await createUser({
      email,
      passwordHash,
      displayName: 'Bootstrap Admin',
      permissions: ['*'],
      department: 'HR',
      jobTitle: 'Administrator',
      mustChangePassword: true,
    });
    logger.warn({ email, tempPassword }, 'BOOTSTRAP ADMIN CREATED — save this password, you must change it on first login');
  }
}
