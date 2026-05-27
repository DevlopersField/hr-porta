// app/page.tsx

// ============= IMPORTS =============
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

// ============= PAGE =============
export default async function RootPage() {
  const session = await auth();
  redirect(session?.user ? '/home' : '/login');
}
