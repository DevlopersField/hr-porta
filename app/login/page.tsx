// app/login/page.tsx

// ============= IMPORTS =============
import { redirect } from 'next/navigation';
import { auth, signIn } from '@/lib/auth';
import { getSettings } from '@/lib/db/settings';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// ============= PAGE =============
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect('/home');
  const settings = await getSettings();
  const { error } = await searchParams;

  // ============= ACTION =============
  async function login(formData: FormData) {
    'use server';
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    try {
      await signIn('credentials', { email, password, redirectTo: '/home' });
    } catch (err) {
      // Re-throw NEXT_REDIRECT — anything else means bad credentials
      if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) throw err;
      redirect('/login?error=invalid');
    }
  }

  // ============= RENDER =============
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <GlassPanel variant="strong" className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold mb-2">{settings.branding.companyName}</h1>
          <p className="text-sm text-text-muted">Sign in to your HR Portal</p>
        </div>
        <form action={login} className="flex flex-col gap-4">
          <Input name="email" type="email" label="Email" required autoComplete="email" />
          <Input name="password" type="password" label="Password" required autoComplete="current-password" />
          {error === 'invalid' && (
            <p
              className="text-sm"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ color: '#DC2626' } as React.CSSProperties}
            >
              Invalid email or password
            </p>
          )}
          <Button type="submit" size="lg">Sign in</Button>
        </form>
      </GlassPanel>
    </div>
  );
}
