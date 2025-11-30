import { AuthGuardedApp } from '@/components/AuthGuardedApp';

export default function Home() {
  // Check for dev mode at build/request time
  const devMode = process.env.DEV_MODE === 'true' || process.env.BYPASS_AUTH === 'true';

  return <AuthGuardedApp devMode={devMode} />;
}
