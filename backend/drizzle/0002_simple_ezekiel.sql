DROP INDEX "activity_project_idx";--> statement-breakpoint
DROP INDEX "activity_type_idx";--> statement-breakpoint
DROP INDEX "projects_path_idx";--> statement-breakpoint
DROP INDEX "projects_status_idx";--> statement-breakpoint
DROP INDEX "projects_source_idx";--> statement-breakpoint
DROP INDEX "tech_project_idx";--> statement-breakpoint
ALTER TABLE `projects` ALTER COLUMN "is_pinned" TO "is_pinned" integer NOT NULL DEFAULT false;--> statement-breakpoint
CREATE INDEX `activity_project_idx` ON `activity_items` (`project_id`);--> statement-breakpoint
CREATE INDEX `activity_type_idx` ON `activity_items` (`type`);--> statement-breakpoint
CREATE UNIQUE INDEX `projects_path_idx` ON `projects` (`path`);--> statement-breakpoint
CREATE INDEX `projects_status_idx` ON `projects` (`status`);--> statement-breakpoint
CREATE INDEX `projects_source_idx` ON `projects` (`source`);--> statement-breakpoint
CREATE UNIQUE INDEX `tech_project_idx` ON `tech_stack_snapshots` (`project_id`);--> statement-breakpoint
ALTER TABLE `projects` ADD `stage` text DEFAULT 'indev';