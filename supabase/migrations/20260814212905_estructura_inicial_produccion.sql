-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

CREATE TABLE public.presets (
  id                uuid                     DEFAULT gen_random_uuid() NOT NULL,
  style_id          text,
  nombre_preset     text                     NOT NULL,
  creado_por        uuid,
  datos_modificados jsonb                    NOT NULL,
  created_at        timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.presets
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.presets
  ADD CONSTRAINT presets_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES auth.users(id);

ALTER TABLE public.presets
  ADD CONSTRAINT presets_pkey PRIMARY KEY (id);

GRANT ALL ON public.presets TO anon;

GRANT ALL ON public.presets TO authenticated;

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.presets TO service_role;

CREATE POLICY "Permitir lectura a todos" ON public.presets
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir todo a autenticados" ON public.presets
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE public.styles (
  id            text    NOT NULL,
  style_name    text    NOT NULL,
  description   text,
  taxes_percent numeric DEFAULT 12,
  freight_cost  numeric DEFAULT 15,
  gallery       jsonb   DEFAULT '[]'::jsonb,
  components    jsonb   DEFAULT '[]'::jsonb,
  category_name text,
  is_hidden     boolean DEFAULT false
);

ALTER TABLE public.styles
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.styles
  ADD CONSTRAINT styles_pkey PRIMARY KEY (id);

ALTER TABLE public.presets
  ADD CONSTRAINT presets_style_id_fkey FOREIGN KEY (style_id) REFERENCES public.styles(id) ON DELETE CASCADE;

GRANT ALL ON public.styles TO anon;

GRANT ALL ON public.styles TO authenticated;

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.styles TO service_role;

CREATE POLICY "Permitir lectura a todos" ON public.styles
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir todo a autenticados" ON public.styles
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE public.user_roles (
  user_id uuid NOT NULL,
  role    text NOT NULL
);

ALTER TABLE public.user_roles
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id);

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check CHECK (role = ANY (ARRAY['admin'::text, 'operador'::text, 'cliente'::text]));

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON public.user_roles TO anon;

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON public.user_roles TO authenticated;

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.user_roles TO service_role;

CREATE POLICY "Permitir lectura a todos" ON public.user_roles
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir lectura de roles a todos" ON public.user_roles
  FOR SELECT
  USING (true);