DROP POLICY IF EXISTS "staff read menu images" ON storage.objects;
CREATE POLICY "staff read menu images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'menu-images');
DROP POLICY IF EXISTS "staff upload menu images" ON storage.objects;
CREATE POLICY "staff upload menu images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'menu-images' AND public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "staff update menu images" ON storage.objects;
CREATE POLICY "staff update menu images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'menu-images' AND public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "staff delete menu images" ON storage.objects;
CREATE POLICY "staff delete menu images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'menu-images' AND public.is_staff(auth.uid()));