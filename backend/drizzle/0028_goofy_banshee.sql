CREATE TABLE "daily_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"youtube_url" text NOT NULL,
	"thumbnail_url" text,
	"fake_likes" integer DEFAULT 0 NOT NULL,
	"scheduled_date" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
