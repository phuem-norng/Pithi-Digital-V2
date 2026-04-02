-- Create dedicated table for gallery images linked to events
CREATE TABLE "event_gallery_images" (
  "id" SERIAL NOT NULL,
  "event_id" TEXT NOT NULL,
  "image_url" TEXT NOT NULL,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "event_gallery_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "event_gallery_images_event_id_idx" ON "event_gallery_images"("event_id");
CREATE UNIQUE INDEX "event_gallery_images_event_id_image_url_key" ON "event_gallery_images"("event_id", "image_url");

ALTER TABLE "event_gallery_images"
ADD CONSTRAINT "event_gallery_images_event_id_fkey"
FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
