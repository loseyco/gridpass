-- Create the 'garage' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('garage', 'garage', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload files to 'garage' bucket
CREATE POLICY "Authenticated users can upload garage images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'garage');

-- Policy: Allow public access to view files in 'garage' bucket
CREATE POLICY "Public can view garage images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'garage');

-- Policy: Allow users to update their own uploads (optional, but good for edits)
-- Note: This requires tracking ownership, which storage.objects does via owner_id usually.
CREATE POLICY "Users can update their own garage images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'garage' AND auth.uid() = owner);

-- Policy: Allow users to delete their own uploads
CREATE POLICY "Users can delete their own garage images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'garage' AND auth.uid() = owner);
