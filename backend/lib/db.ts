import { createClient, Client } from '@libsql/client';
import { drizzle, LibSQLDatabase } from 'drizzle-orm/libsql';
import { activityItems, projects, techStackSnapshots } from './schema';

export const schema = { projects, techStackSnapshots, activityItems };

// Lazy initialization to avoid build-time errors when env vars aren't available
let client: Client | null = null;
let dbInstance: LibSQLDatabase<typeof schema> | null = null;

function getClient(): Client {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_URL || '',
      authToken: process.env.TURSO_TOKEN
    });
  }
  return client;
}

export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
  get(_, prop) {
    if (!dbInstance) {
      dbInstance = drizzle(getClient(), { schema });
    }
    return (dbInstance as unknown as Record<string | symbol, unknown>)[prop];
  }
});
