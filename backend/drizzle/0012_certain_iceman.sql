CREATE TABLE "banks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "banks_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_bank_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bank_id" uuid NOT NULL,
	"account_holder_name" text NOT NULL,
	"account_number" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_bank_details_user_id_unique" UNIQUE("user_id")
);
