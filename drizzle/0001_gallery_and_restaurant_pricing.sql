CREATE TABLE "gallery_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_key" text NOT NULL,
	"entity_id" uuid,
	"image_url" text NOT NULL,
	"alt_text" text,
	"caption" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_pricing_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"price" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "restaurant_pricing_items_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "restaurant_pricing_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
ALTER TABLE "restaurant_pricing_translations" ADD CONSTRAINT "rpt_item_fk" FOREIGN KEY ("item_id") REFERENCES "public"."restaurant_pricing_items"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_gallery_section_entity" ON "gallery_images" USING btree ("section_key","entity_id");
--> statement-breakpoint
CREATE INDEX "idx_rest_pricing_slug" ON "restaurant_pricing_items" USING btree ("slug");
--> statement-breakpoint
CREATE UNIQUE INDEX "rest_pricing_trans_unique" ON "restaurant_pricing_translations" USING btree ("item_id","locale");
