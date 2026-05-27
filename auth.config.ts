// auth.config.ts

// ============= IMPORTS =============
import type { NextAuthConfig } from 'next-auth';

// ============= TYPE AUGMENTATION =============
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      permissions: string[];
    };
  }
}

// ============= EDGE-SAFE AUTH CONFIG =============
export const authConfig = {
  session: {
    strategy: 'jwt',
    maxAge: Number(process.env.SESSION_MAX_AGE ?? 28800),
  },
  pages: { signIn: '/login' },
  providers: [], // Filled in by lib/auth.ts (which is Node-only). Middleware doesn't need providers — only the session callback.
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.id = (user as any).id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.permissions = (user as any).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.permissions = (token.permissions ?? []) as string[];
      return session;
    },
  },
} satisfies NextAuthConfig;
