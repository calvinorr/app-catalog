/**
 * Dev Mode Utilities
 *
 * Controls when to use mock data vs real database:
 * - DEV_MODE=true forces mock data
 * - In development (NODE_ENV=development) without DB configured, uses mock
 * - In preview deployments, can optionally use mock data
 */

export function isDevMode(): boolean {
  // Explicit dev mode toggle
  if (process.env.DEV_MODE === 'true') return true;

  // Development without DB credentials
  if (process.env.NODE_ENV === 'development' && !process.env.TURSO_URL) {
    return true;
  }

  return false;
}

export function shouldUseMockData(): boolean {
  return isDevMode();
}

// Auth bypass for dev mode
export function isAuthBypassed(): boolean {
  if (isDevMode()) return true;

  // Preview deployments can bypass auth for testing
  if (process.env.VERCEL_ENV === 'preview' && process.env.BYPASS_AUTH === 'true') {
    return true;
  }

  return false;
}
