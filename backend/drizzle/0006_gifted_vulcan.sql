DROP TABLE "system_settings" CASCADE;--> statement-breakpoint
ALTER TABLE "fund_plans" ADD COLUMN "max_amount" numeric(10, 2) DEFAULT '50000.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "fund_plans" ADD COLUMN "max_participants" integer DEFAULT 100 NOT NULL;