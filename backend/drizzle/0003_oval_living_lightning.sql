CREATE TABLE "payment_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"method_id" uuid NOT NULL,
	"account_name" text NOT NULL,
	"account_number" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_methods" DROP COLUMN "account_name";--> statement-breakpoint
ALTER TABLE "payment_methods" DROP COLUMN "account_number";