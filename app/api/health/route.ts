// app/api/health/route.ts

// ============= IMPORTS =============
import { getSettings } from '@/lib/db/settings';

// ============= GET =============
export async function GET() {
  try {
    const settings = await getSettings();
    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      branding: settings.branding.companyName,
    });
  } catch (err) {
    return Response.json(
      { status: 'error', message: (err as Error).message },
      { status: 500 },
    );
  }
}
