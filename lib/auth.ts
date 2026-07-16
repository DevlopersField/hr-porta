// lib/auth.ts

// ============= IMPORTS =============
import NextAuth, { type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getUserByEmail, touchLastLogin } from '@/lib/db/users';
import {
  ForbiddenError,
  hasPermission,
  type Permission,
} from '@/lib/permissions';
import { authConfig } from '../auth.config';

// ============= INPUT VALIDATION =============
const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

// ============= NEXTAUTH (Node-only — includes DB-using authorize) =============
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = CredentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await getUserByEmail(parsed.data.email);
        if (!user || !user.active) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        await touchLastLogin(user.id);
        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          permissions: user.permissions,
        } as never;
      },
    }),
  ],
});

// ============= REQUIRE SESSION HELPER =============
export async function requireSession(perm?: Permission): Promise<Session['user']> {
  const session = await auth();
  if (!session?.user) throw new ForbiddenError('Not authenticated');
  if (perm && !hasPermission(session.user, perm)) {
    throw new ForbiddenError(`Missing permission: ${perm}`);
  }
  return session.user;
}
