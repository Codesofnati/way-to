CREATE TABLE "withdraw_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_percent" numeric(5, 2) NOT NULL,
	"amounts" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "withdrawal_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount_requested" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) NOT NULL,
	"amount_to_receive" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"bank_details_snapshot" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
