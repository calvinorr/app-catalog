CREATE TABLE `activity_items` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`type` text NOT NULL,
	`timestamp` integer NOT NULL,
	`title` text NOT NULL,
	`url` text,
	`metadata` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `activity_project_idx` ON `activity_items` (`project_id`);--> statement-breakpoint
CREATE INDEX `activity_type_idx` ON `activity_items` (`type`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`repo_slug` text,
	`vercel_project` text,
	`status` text DEFAULT 'active' NOT NULL,
	`source` text DEFAULT 'scanner',
	`description` text,
	`language` text,
	`html_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_path_idx` ON `projects` (`path`);--> statement-breakpoint
CREATE INDEX `projects_status_idx` ON `projects` (`status`);--> statement-breakpoint
CREATE INDEX `projects_source_idx` ON `projects` (`source`);--> statement-breakpoint
CREATE TABLE `tech_stack_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`primary_framework` text,
	`primary_db` text,
	`primary_auth` text,
	`tags` text,
	`last_scanned_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tech_project_idx` ON `tech_stack_snapshots` (`project_id`);