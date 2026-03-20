-- ============================================
-- COCO GAMES - Migration V3: Storage Bucket
-- Run this in the Supabase SQL Editor AFTER v2
-- ============================================

-- Create the storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-attachments',
  'ticket-attachments',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public reads on ticket attachment images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'public_read_ticket_attachments'
  ) THEN
    CREATE POLICY public_read_ticket_attachments
    ON storage.objects FOR SELECT
    USING (bucket_id = 'ticket-attachments');
  END IF;
END $$;

-- Allow inserts for ticket attachments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'service_upload_ticket_attachments'
  ) THEN
    CREATE POLICY service_upload_ticket_attachments
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'ticket-attachments');
  END IF;
END $$;
