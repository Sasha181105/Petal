CREATE TYPE "public"."waste_reason" AS ENUM('wilted', 'damaged', 'unsold', 'other');--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"flower_type_id" uuid NOT NULL,
	"supplier_id" uuid,
	"quantity" integer NOT NULL,
	"unit_cost_cents" integer NOT NULL,
	"received_on" date DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deliveries_quantity_positive" CHECK ("deliveries"."quantity" > 0),
	CONSTRAINT "deliveries_cost_non_negative" CHECK ("deliveries"."unit_cost_cents" >= 0)
);
--> statement-breakpoint
ALTER TABLE "deliveries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "flower_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flower_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "shop_members" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"shop_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shop_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "shops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"currency" char(3) DEFAULT 'EUR' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shops" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "waste_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"flower_type_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"reason" "waste_reason" NOT NULL,
	"wasted_on" date DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "waste_entries_quantity_positive" CHECK ("waste_entries"."quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "waste_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_flower_type_id_flower_types_id_fk" FOREIGN KEY ("flower_type_id") REFERENCES "public"."flower_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flower_types" ADD CONSTRAINT "flower_types_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_members" ADD CONSTRAINT "shop_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_members" ADD CONSTRAINT "shop_members_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waste_entries" ADD CONSTRAINT "waste_entries_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waste_entries" ADD CONSTRAINT "waste_entries_flower_type_id_flower_types_id_fk" FOREIGN KEY ("flower_type_id") REFERENCES "public"."flower_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waste_entries" ADD CONSTRAINT "waste_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deliveries_shop_date_idx" ON "deliveries" USING btree ("shop_id","received_on");--> statement-breakpoint
CREATE INDEX "deliveries_shop_flower_idx" ON "deliveries" USING btree ("shop_id","flower_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "flower_types_shop_name_uq" ON "flower_types" USING btree ("shop_id",lower("name"));--> statement-breakpoint
CREATE INDEX "shop_members_shop_idx" ON "shop_members" USING btree ("shop_id");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_shop_name_uq" ON "suppliers" USING btree ("shop_id",lower("name"));--> statement-breakpoint
CREATE INDEX "waste_entries_shop_date_idx" ON "waste_entries" USING btree ("shop_id","wasted_on");--> statement-breakpoint
CREATE INDEX "waste_entries_shop_flower_idx" ON "waste_entries" USING btree ("shop_id","flower_type_id");