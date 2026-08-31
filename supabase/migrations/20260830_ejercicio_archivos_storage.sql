-- Storage bucket for exercise file attachments (PDFs, images, videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ejercicio-archivos',
  'ejercicio-archivos',
  true,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ejercicio-archivos');

-- Allow anyone to view (bucket is public)
CREATE POLICY "Public read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ejercicio-archivos');

-- Allow users to delete their own uploads
CREATE POLICY "Owner delete"
ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'ejercicio-archivos');
