CREATE TABLE "system_settings" (
	"id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
	"max_users" integer DEFAULT 100 NOT NULL
);
