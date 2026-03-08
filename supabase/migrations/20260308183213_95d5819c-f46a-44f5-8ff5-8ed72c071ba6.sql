
-- Allow admins to read files from verification-documents bucket
CREATE POLICY "Admins can read verification documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'verification-documents'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow authenticated users to upload to verification-documents during registration
CREATE POLICY "Users can upload verification documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'verification-documents'
);
