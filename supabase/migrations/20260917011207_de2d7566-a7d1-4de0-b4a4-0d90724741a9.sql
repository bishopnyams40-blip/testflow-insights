
CREATE POLICY "evidence_read_own_or_admin" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'testflow-evidence'
         AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));
CREATE POLICY "evidence_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'testflow-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "evidence_delete_own_or_admin" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'testflow-evidence'
         AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));
