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
