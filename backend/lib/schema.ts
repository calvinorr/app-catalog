import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable(
  'projects',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    displayName: text('display_name'), // User-friendly name (overrides ugly repo names)
    path: text('path').notNull(),
    repoSlug: text('repo_slug'),
    vercelProject: text('vercel_project'),
    vercelUrl: text('vercel_url'), // Actual deployment URL from Vercel
    status: text('status', { enum: ['active', 'redundant'] }).notNull().default('active'),
    stage: text('stage', { enum: ['final', 'beta', 'alpha', 'indev'] }).default('indev'),
    source: text('source', { enum: ['scanner', 'github'] }).default('scanner'),
    description: text('description'),
    language: text('language'),
    htmlUrl: text('html_url'),
    lastDeploymentAt: integer('last_deployment_at', { mode: 'timestamp' }),
    lastCommitAt: integer('last_commit_at', { mode: 'timestamp' }),
    isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
  },
  (table) => ({
    pathIdx: uniqueIndex('projects_path_idx').on(table.path),
    statusIdx: index('projects_status_idx').on(table.status),
    sourceIdx: index('projects_source_idx').on(table.source)
  })
);

export const techStackSnapshots = sqliteTable(
  'tech_stack_snapshots',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id').notNull().references(() => projects.id),
    primaryFramework: text('primary_framework'),
    backendFramework: text('backend_framework'),
    primaryDB: text('primary_db'),
    primaryAuth: text('primary_auth'),
    tags: text('tags'), // JSON string array
    lastScannedAt: integer('last_scanned_at', { mode: 'timestamp' }).notNull()
  },
  (table) => ({
    projectIdx: uniqueIndex('tech_project_idx').on(table.projectId)
  })
);

export const activityItems = sqliteTable(
  'activity_items',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id').notNull().references(() => projects.id),
    type: text('type', { enum: ['commit', 'deployment'] }).notNull(),
    timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
    title: text('title').notNull(),
    url: text('url'),
    metadata: text('metadata') // JSON payload
  },
  (table) => ({
    projectIdx: index('activity_project_idx').on(table.projectId),
    typeIdx: index('activity_type_idx').on(table.type)
  })
);
