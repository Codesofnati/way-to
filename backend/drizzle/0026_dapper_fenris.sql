CREATE TABLE "platforms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"base_url" text NOT NULL,
	"logo_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platforms_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "contact_methods" ADD COLUMN "platform_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_methods" DROP COLUMN "photo_url";