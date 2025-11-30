CREATE TABLE IF NOT EXISTS `projects` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `path` text NOT NULL,
  `repo_slug` text,
  `vercel_project` text,
  `status` text DEFAULT 'active' NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS `projects_path_idx` ON `projects` (`path`);
CREATE INDEX IF NOT EXISTS `projects_status_idx` ON `projects` (`status`);

CREATE TABLE IF NOT EXISTS `tech_stack_snapshots` (
  `id` text PRIMARY KEY NOT NULL,
  `project_id` text NOT NULL,
  `primary_framework` text,
  `primary_db` text,
  `primary_auth` text,
  `tags` text,
  `last_scanned_at` integer NOT NULL,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`)
);
CREATE UNIQUE INDEX IF NOT EXISTS `tech_project_idx` ON `tech_stack_snapshots` (`project_id`);

CREATE TABLE IF NOT EXISTS `activity_items` (
  `id` text PRIMARY KEY NOT NULL,
  `project_id` text NOT NULL,
  `type` text NOT NULL,
  `timestamp` integer NOT NULL,
  `title` text NOT NULL,
  `url` text,
  `metadata` text,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`)
);
CREATE INDEX IF NOT EXISTS `activity_project_idx` ON `activity_items` (`project_id`);
CREATE INDEX IF NOT EXISTS `activity_type_idx` ON `activity_items` (`type`);
