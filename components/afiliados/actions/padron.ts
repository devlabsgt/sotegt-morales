"use server";

import { createClient } from "@/utils/supabase/server";

export async function obtenerPadronAction(
  page: number = 1,
  pageSize: number = 50,
  searchTerm: string = ""
) {
  const supabase = await createClient();

  let query = supabase.from("padron_tse").select("*", { count: "exact" });

  if (searchTerm) {
    query = query.or(`nombre_completo.ilike.%${searchTerm}%,dpi.ilike.%${searchTerm}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to).order("nombre_completo", { ascending: true });

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching padron:", error);
    throw new Error(error.message);
  }

  return {
    data: data || [],
    totalCount: count || 0,
  };
}

/** Todas las filas que aplican al mismo filtro de búsqueda (paginado en servidor). */
export async function obtenerPadronTodoParaExportAction(
  searchTerm: string = "",
) {
  const pageSize = 2000;
  let page = 1;
  const rows: NonNullable<Awaited<ReturnType<typeof obtenerPadronAction>>["data"]> =
    [];
  let totalCount = 0;

  while (true) {
    const chunk = await obtenerPadronAction(page, pageSize, searchTerm);
    totalCount = chunk.totalCount;
    const data = chunk.data || [];
    rows.push(...data);
    if (rows.length >= totalCount || data.length === 0) break;
    page += 1;
  }

  return { rows, totalCount };
}
