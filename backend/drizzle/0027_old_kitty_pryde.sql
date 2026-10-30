CREATE TABLE "system_settings" (
	"id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
	"max_users" integer DEFAULT 100 NOT NULL,
	"youtube_channel_url" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_tasks" ADD COLUMN "fake_likes" integer DEFAULT 0 NOT NULL;