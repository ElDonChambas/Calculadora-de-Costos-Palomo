-- 1. Habilitar RLS en las tres tablas
ALTER TABLE public.styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para STYLES
-- Cualquiera puede ver los zapatos
CREATE POLICY "Permitir lectura a todos" ON public.styles FOR SELECT USING (true);
-- Solo los logueados pueden guardar/editar/borrar
CREATE POLICY "Permitir todo a autenticados" ON public.styles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Políticas para PRESETS
CREATE POLICY "Permitir lectura a todos" ON public.presets FOR SELECT USING (true);
CREATE POLICY "Permitir todo a autenticados" ON public.presets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Políticas para USER_ROLES (Solo lectura para que Angular sepa quién es quién)
CREATE POLICY "Permitir lectura a todos" ON public.user_roles FOR SELECT USING (true);