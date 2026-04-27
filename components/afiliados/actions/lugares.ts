"use server";

import { createClient } from "@/utils/supabase/server";

export async function obtenerLugaresAction() {
  const supabase = await createClient();

  const [lugaresRes, sectoresRes] = await Promise.all([
    supabase
      .from("lugares")
      .select("id, nombre, sector_id")
      .order("nombre", { ascending: true }),
    supabase.from("sectores").select("id, nombre").order("nombre"),
  ]);

  if (lugaresRes.error) throw new Error(lugaresRes.error.message);

  const lugares = lugaresRes.data ?? [];
  const sectores = sectoresRes.data ?? [];
  const sectorMap = new Map(sectores.map((s: any) => [s.id, s.nombre]));

  return lugares.map((l: any) => ({
    id: l.id,
    nombre: l.nombre,
    sector_id: l.sector_id ?? null,
    sector_nombre: l.sector_id ? sectorMap.get(l.sector_id) || null : null,
  }));
}
