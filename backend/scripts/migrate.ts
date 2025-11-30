import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env file manually
const envPath = join(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

async function runMigration() {
  const client = createClient({
    url: envVars.TURSO_URL || process.env.TURSO_URL || '',
    authToken: envVars.TURSO_TOKEN || process.env.TURSO_TOKEN
  });

  try {
    console.log('Running migration 0001_zippy_raider.sql...');

    // Run each statement separately
    await client.execute('ALTER TABLE `projects` ADD `last_deployment_at` integer');
    console.log('Added last_deployment_at column');

    await client.execute('ALTER TABLE `projects` ADD `last_commit_at` integer');
    console.log('Added last_commit_at column');

    await client.execute('ALTER TABLE `projects` ADD `is_pinned` integer DEFAULT 0 NOT NULL');
    console.log('Added is_pinned column');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.close();
  }
}

runMigration().catch(console.error);
