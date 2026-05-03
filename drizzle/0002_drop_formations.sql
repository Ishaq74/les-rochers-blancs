DROP TABLE IF EXISTS "formation_translations";--> statement-breakpoint
DROP TABLE IF EXISTS "formations";--> statement-breakpoint
ALTER TYPE "public"."reservation_type" RENAME TO "reservation_type_old";--> statement-breakpoint
CREATE TYPE "public"."reservation_type" AS ENUM('room', 'restaurant', 'service');--> statement-breakpoint
ALTER TABLE "reservations" ALTER COLUMN "type" TYPE "public"."reservation_type" USING "type"::text::"public"."reservation_type";--> statement-breakpoint
DROP TYPE "public"."reservation_type_old";
