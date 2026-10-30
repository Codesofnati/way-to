ALTER TABLE "withdrawal_requests" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "withdrawals" DROP COLUMN "rejection_reason";