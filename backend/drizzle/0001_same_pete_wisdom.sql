CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" text NOT NULL,
	"ft_number" text NOT NULL,
	"screenshot_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"approvals_count" integer DEFAULT 0 NOT NULL,
	"approvedBy_admins" text DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_ft_number_unique" UNIQUE("ft_number")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"target_user_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "withdrawals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "name" text DEFAULT 'User' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "password_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "wallet_balance" numeric(10, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "is_locked" boolean DEFAULT false NOT NULL;