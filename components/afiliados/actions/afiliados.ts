"use server";

import { createClient } from "@/utils/supabase/server";
import supabaseAdmin from "@/utils/supabase/admin";

export async function obtenerAfiliadosAction(liderId?: string) {
  const supabase = await createClient();

  let query = supabase.from("afiliados").select("*");

  if (liderId) {
    query = query.eq("lider_id", liderId);
  }

  const { data: afiliados, error } = await query.order("created_at", {
    ascending: true,
  });

  if (error) throw new Error(error.message);
  if (!afiliados) return [];

  const liderIds = [
    ...new Set(afiliados.map((a) => a.lider_id).filter((id) => id)),
  ];
  const lugarIds = [
    ...new Set(afiliados.map((a) => a.lugar_id).filter((id) => id)),
  ];

  // Ejecución en paralelo de las consultas de apoyo
  const [perfilesRes, lugaresRes, politicasRes] = await Promise.all([
    liderIds.length > 0
      ? supabase
          .from("info_perfil")
          .select("user_id, nombres, apellidos")
          .in("user_id", liderIds)
      : { data: [] },

    lugarIds.length > 0
      ? supabase.from("lugares").select("id, nombre").in("id", lugarIds)
      : { data: [] },

    supabase.from("sis_politicas").select("id, nombre")
  ]);

  const perfiles = perfilesRes.data || [];
  const lugares = lugaresRes.data || [];
  const politicas = politicasRes.data || [];

  const perfilMap = new Map(perfiles.map((p: any) => [p.user_id, p]));
  const lugarMap = new Map(lugares.map((l: any) => [l.id, l.nombre]));
  const politicaMap = new Map(politicas.map((p: any) => [p.id, p.nombre]));

  return afiliados.map((afiliado: any) => {
    const perfilLider = afiliado.lider_id
      ? perfilMap.get(afiliado.lider_id)
      : null;

    return {
      ...afiliado,
      lugar_nombre: afiliado.lugar_id
        ? lugarMap.get(afiliado.lugar_id) || null
        : null,
      politica: afiliado.politica_id 
        ? politicaMap.get(afiliado.politica_id) 
        : afiliado.politica,
      lider_nombre: perfilLider
        ? `${perfilLider.nombres} ${perfilLider.apellidos}`
        : "Sin Líder",
      lider_email: "",
    };
  });
}

export async function obtenerConteoPadronAction() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("padron_tse")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error al obtener conteo del padrón:", error);
    return 0;
  }
  return count || 0;
}

export async function obtenerReligionesUnicasAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("afiliados")
    .select("religion");

  if (error) {
    console.error("Error al obtener religiones:", error);
    return [];
  }
  const uniq = Array.from(new Set(data.map((d: any) => d.religion).filter(Boolean)));
  return uniq.filter(r => r !== "Católico" && r !== "Evangélico");
}
