-- Agrega conteos por líder en una sola consulta (evita traer todas las filas de afiliados al servidor de Next).
-- Ejecutar en Supabase SQL Editor o como migración.

CREATE OR REPLACE FUNCTION public.conteos_afiliados_por_lider()
RETURNS TABLE (
  lider_id uuid,
  total integer,
  titulares integer,
  familiares integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.lider_id,
    COUNT(*)::integer AS total,
    COUNT(*) FILTER (WHERE a.familiar_de IS NULL)::integer AS titulares,
    COUNT(*) FILTER (WHERE a.familiar_de IS NOT NULL)::integer AS familiares
  FROM public.afiliados a
  WHERE a.lider_id IS NOT NULL
  GROUP BY a.lider_id;
$$;

GRANT EXECUTE ON FUNCTION public.conteos_afiliados_por_lider() TO authenticated;
GRANT EXECUTE ON FUNCTION public.conteos_afiliados_por_lider() TO service_role;
