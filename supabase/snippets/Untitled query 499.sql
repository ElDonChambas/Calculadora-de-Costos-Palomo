DROP TABLE public.styles;

CREATE TABLE public.styles (
    id text PRIMARY KEY, -- AHORA ES TEXTO
    style_name text NOT NULL,
    description text,
    taxes_percent numeric DEFAULT 12,
    freight_cost numeric DEFAULT 15,
    gallery jsonb DEFAULT '[]'::jsonb,
    components jsonb DEFAULT '[]'::jsonb,
    category_name text
);

GRANT ALL ON public.styles TO anon;