import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { activityItems, projects, techStackSnapshots } from './schema';

export const schema = { projects, techStackSnapshots, activityItems };

const client = createClient({
  url: process.env.TURSO_URL || '',
  authToken: process.env.TURSO_TOKEN
});

export const db = drizzle(client, { schema });
