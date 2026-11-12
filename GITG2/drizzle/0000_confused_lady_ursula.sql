CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room` text NOT NULL,
	`command_id` text NOT NULL,
	`revision` integer NOT NULL,
	`time` text NOT NULL,
	`event` text NOT NULL,
	`details` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_command` ON `events` (`room`,`command_id`);--> statement-breakpoint
CREATE INDEX `events_room` ON `events` (`room`,`id`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`key_hash` text NOT NULL,
	`controller_key` text NOT NULL,
	`state` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`last_command` text
);
