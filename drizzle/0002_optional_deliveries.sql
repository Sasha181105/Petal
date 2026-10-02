ALTER TABLE "flower_types" ADD COLUMN "unit_cost_cents" integer;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "deliveries_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Shops that already log deliveries keep the feature on.
UPDATE "shops" SET "deliveries_enabled" = true WHERE EXISTS (SELECT 1 FROM "deliveries" d WHERE d."shop_id" = "shops"."id");--> statement-breakpoint
-- Usual price per stem starts as each flower's latest delivery price.
UPDATE "flower_types" f SET "unit_cost_cents" = (SELECT d."unit_cost_cents" FROM "deliveries" d WHERE d."flower_type_id" = f."id" ORDER BY d."received_on" DESC, d."created_at" DESC LIMIT 1) WHERE f."unit_cost_cents" IS NULL;
