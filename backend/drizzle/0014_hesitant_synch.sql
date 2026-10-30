CREATE TABLE "referral_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level1_amount" numeric(10, 2) DEFAULT '400.00' NOT NULL,
	"level2_amount" numeric(10, 2) DEFAULT '100.00' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
