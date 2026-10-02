CREATE TYPE "public"."member_role" AS ENUM('manager', 'staff');--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "login_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reopened_weeks" (
	"shop_id" uuid NOT NULL,
	"week_start" date NOT NULL,
	"reopened_by" uuid,
	"reopened_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reopened_weeks_shop_id_week_start_pk" PRIMARY KEY("shop_id","week_start")
);
--> statement-breakpoint
ALTER TABLE "reopened_weeks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "shop_members" ADD COLUMN "role" "member_role" DEFAULT 'staff' NOT NULL;--> statement-breakpoint
ALTER TABLE "reopened_weeks" ADD CONSTRAINT "reopened_weeks_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reopened_weeks" ADD CONSTRAINT "reopened_weeks_reopened_by_users_id_fk" FOREIGN KEY ("reopened_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "login_attempts_email_at_idx" ON "login_attempts" USING btree ("email","at");--> statement-breakpoint
-- Everyone who already had access set the shop up, so they become managers.
UPDATE "shop_members" SET "role" = 'manager';
