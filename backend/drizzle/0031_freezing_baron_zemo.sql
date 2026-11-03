ALTER TABLE "withdrawal_requests" ADD COLUMN "locked_by" uuid;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD COLUMN "locked_at" timestamp;