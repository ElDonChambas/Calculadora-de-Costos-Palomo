-- Permitir que cualquier usuario (incluso anónimos) pueda subir, ver y editar imágenes en este bucket
CREATE POLICY "Permitir acceso total a zapatos_imagenes"
ON storage.objects FOR ALL
TO public
USING (bucket_id = 'zapatos_imagenes')
WITH CHECK (bucket_id = 'zapatos_imagenes');