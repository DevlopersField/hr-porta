// app/api/health/route.ts

// ============= IMPORTS =============
import fs from 'node:fs/promises';
import path from 'node:path';
import { getSettings } from '@/lib/db/settings';
import { getDataDir } from '@/lib/db/core';

// ============= GET =============
export async function GET() {
  const dataDir = getDataDir();
  const checks = {
    dataDirReadable: false,
    dataDirWritable: false,
    settingsParses: false,
  };
  try { await fs.access(dataDir, fs.constants.R_OK); checks.dataDirReadable = true; } catch {}
  try { await fs.access(dataDir, fs.constants.W_OK); checks.dataDirWritable = true; } catch {}
  try { await getSettings(); checks.settingsParses = true; } catch {}
  const healthy = Object.values(checks).every(Boolean);
  return Response.json(checks, { status: healthy ? 200 : 503 });
}
