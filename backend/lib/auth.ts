import { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import { isAuthBypassed } from './devMode';

// Allowed GitHub usernames (add your username here)
const ALLOWED_USERS = ['calvinorr'];

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      // In dev mode, allow all sign-ins
      if (isAuthBypassed()) return true;

      // Check if user is in allowed list
      const githubUsername = (profile as any)?.login;
      return ALLOWED_USERS.includes(githubUsername);
    },
    async session({ session }) {
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper to check if request is authenticated or bypassed
export function isAuthenticated(session: any): boolean {
  if (isAuthBypassed()) return true;
  return !!session?.user;
}
