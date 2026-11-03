CREATE TABLE "global_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_am" text NOT NULL,
	"title_en" text NOT NULL,
	"content_am" text NOT NULL,
	"content_en" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_am" text NOT NULL,
	"title_en" text NOT NULL,
	"content_am" text NOT NULL,
	"content_en" text NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
