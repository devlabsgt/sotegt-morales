"use server";

import { createClient } from "@/utils/supabase/server";
import type { UserRPCData } from "@/hooks/sesion/actions";
import { listarUsuariosAction } from "./usuarios";
import { obtenerLugaresAction } from "./lugares";

export type AfiliacionVerDashboard = {
  session: UserRPCData;
  todosUsuariosData: Awaited<ReturnType<typeof listarUsuariosAction>>;
  lugaresData: Awaited<ReturnType<typeof obtenerLugaresAction>>;
};

export async function loadAfiliacionVerDashboardAction(): Promise<
  AfiliacionVerDashboard | null
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("info_perfil")
    .select(
      `
      nombres,
      apellidos,
      rol_id,
      roles ( nombre )
    `,
    )
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) return null;

  const profileAny = profile as {
    nombres: string | null;
    apellidos: string | null;
    rol_id: number | null;
    roles?: { nombre?: string } | null;
  };

  const session: UserRPCData = {
    id: user.id,
    email: user.email || "",
    nombres: profileAny.nombres,
    apellidos: profileAny.apellidos,
    rol: profileAny.roles?.nombre || null,
    rol_id: profileAny.rol_id,
  };

  const rol = session.rol || "";
  const esCualquierAdmin =
    rol === "SUPER" || rol === "ADMINISTRADOR" || rol === "ADMIN";
  const arrAdmins = ["ADMINISTRADOR", "SUPER", "ADMIN"];

  const [todosUsuariosData, lugaresData] = await Promise.all([
    listarUsuariosAction(
      esCualquierAdmin ? ["LIDER", ...arrAdmins] : ["LIDER"],
    ),
    obtenerLugaresAction(),
  ]);

  return { session, todosUsuariosData, lugaresData };
}
