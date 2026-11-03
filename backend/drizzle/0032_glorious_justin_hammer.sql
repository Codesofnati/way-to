CREATE TABLE "app_settings" (
	"id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
	"profit_images" text DEFAULT '[]' NOT NULL,
	"vip_image" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
