'use client';

import App from '@/components/App';
import { AuthGuard } from '@/components/AuthGuard';

interface AuthGuardedAppProps {
  devMode: boolean;
}

export function AuthGuardedApp({ devMode }: AuthGuardedAppProps) {
  return (
    <AuthGuard devMode={devMode}>
      <App />
    </AuthGuard>
  );
}
