ALTER TABLE `projects` ADD `last_deployment_at` integer;--> statement-breakpoint
ALTER TABLE `projects` ADD `last_commit_at` integer;--> statement-breakpoint
ALTER TABLE `projects` ADD `is_pinned` integer DEFAULT 0 NOT NULL;