ALTER TABLE "user_funds" RENAME COLUMN "interest_earned" TO "daily_interest_birr";--> statement-breakpoint
ALTER TABLE "user_funds" ALTER COLUMN "start_date" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "fund_plans" ADD COLUMN "fake_joined_users" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "fund_plans" ADD COLUMN "start_date" timestamp NOT NULL;