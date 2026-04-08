"use server";

import { createClient } from "@/utils/supabase/server";

export type Politica = { id: number; nombre: string };
export type SubPolitica = { id: number; politica_id: number; nombre: string };
export type Lugar = { id: number; nombre: string };

export async function obtenerPoliticasAction(): Promise<Politica[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sis_politicas")
    .select("id, nombre")
    .order("nombre");
  if (error) return [];
  return data ?? [];
}

export async function obtenerSubPoliticasAction(politica_id: number): Promise<SubPolitica[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sis_politicas_sub")
    .select("id, politica_id, nombre")
    .eq("politica_id", politica_id)
    .order("nombre");
  if (error) return [];
  return data ?? [];
}

export async function crearSubPoliticaAction(politica_id: number, nombre: string): Promise<SubPolitica | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sis_politicas_sub")
    .insert({ politica_id, nombre })
    .select("id, politica_id, nombre")
    .single();
  if (error) return null;
  return data;
}

export async function obtenerLugaresAction(): Promise<Lugar[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lugares")
    .select("id, nombre")
    .order("nombre");
  if (error) return [];
  return data ?? [];
}

export async function crearLugarAction(nombre: string): Promise<Lugar | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lugares")
    .insert({ nombre: nombre.trim() })
    .select("id, nombre")
    .single();
  if (error) return null;
  return data;
}
