'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { ReactNode } from 'react';
import { Github, LogOut, Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  devMode?: boolean;
}

export function AuthGuard({ children, devMode = false }: AuthGuardProps) {
  const { data: session, status } = useSession();

  // Dev mode bypass
  if (devMode) {
    return (
      <>
        <DevModeBanner />
        {children}
      </>
    );
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return <SignInPage />;
  }

  // Authenticated
  return (
    <>
      <AuthHeader user={session.user} />
      {children}
    </>
  );
}

function DevModeBanner() {
  return (
    <div className="bg-amber-500 text-amber-950 text-center py-1 text-sm font-medium">
      Dev Mode - Authentication Bypassed
    </div>
  );
}

function AuthHeader({ user }: { user: any }) {
  return (
    <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Github className="w-5 h-5" />
        <span className="text-sm">Signed in as <strong>{user?.name || user?.email}</strong></span>
      </div>
      <button
        onClick={() => signOut()}
        className="flex items-center gap-1 text-sm text-slate-300 hover:text-white transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
  );
}

function SignInPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Github className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">App Catalog</h1>
          <p className="text-slate-600 mt-2">Sign in to access your project dashboard</p>
        </div>

        <button
          onClick={() => signIn('github')}
          className="w-full bg-slate-900 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
        >
          <Github className="w-5 h-5" />
          Sign in with GitHub
        </button>

        <p className="text-center text-sm text-slate-500 mt-6">
          Only authorized users can access this dashboard.
        </p>
      </div>
    </div>
  );
}
