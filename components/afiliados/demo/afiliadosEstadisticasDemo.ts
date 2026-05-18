import type { Afiliado } from "../esquemas";
import { CONDICION_ESPECIAL_OPCIONES } from "../esquemas";

const RELIGIONES = [
  "Católica",
  "Evangélica",
  "Testigos de Jehová",
  "Mormona",
  "Sin religión",
  "Otra",
] as const;

const LUGARES = [
  { lugar: "SAN JORGE", sector: "Sector 1: Parte Baja", sid: 1 },
  { lugar: "CENTRO HISTÓRICO", sector: "Sector 1: Parte Baja", sid: 1 },
  { lugar: "LAS QUEBRADITAS", sector: "Sector 1: Parte Baja", sid: 1 },
  { lugar: "EL MIRADOR", sector: "Sector 2: Zona Alta", sid: 2 },
  { lugar: "TABLONES", sector: "Sector 2: Zona Alta", sid: 2 },
  { lugar: "Sin Especificar", sector: "Sin Clasificar", sid: 0 },
] as const;

function añoNacimientoParaEdad(edad: number): string {
  const y = new Date().getFullYear() - edad;
  return `${y}-06-15`;
}

/** Conjunto ilustrativo para gráficas de estadísticas (ADMIN / SUPER, switch Simular). */
export function crearAfiliadosDemoEstadisticas(cantidad = 160): Afiliado[] {
  const condPool = [...CONDICION_ESPECIAL_OPCIONES, null, null, null, null];
  const out: Afiliado[] = [];

  for (let i = 0; i < cantidad; i += 1) {
    const edad = 18 + (i * 7) % 53;
    const sexo: "M" | "F" = i % 3 === 0 ? "F" : "M";
    const lug = LUGARES[i % LUGARES.length];
    const rel = RELIGIONES[i % RELIGIONES.length];
    const condicion_especial = condPool[i % condPool.length];

    out.push({
      id: `est-demo-${i}`,
      nombres: "Demo",
      apellidos: `Afiliado ${i + 1}`,
      telefono: String(51000000 + (i % 9999)).padStart(8, "0"),
      telefono2: null,
      telefono3: null,
      dpi: String(1000000000000 + i).replace(/\D/g, "").padStart(13, "0").slice(0, 13),
      nacimiento: añoNacimientoParaEdad(edad),
      sexo,
      lugar_id: 1 + (i % 5),
      lider_id: null,
      politica_id: 1,
      sub_politica_id: null,
      empadronado: true,
      no_padron: String(100000 + (i % 899999)),
      religion: rel,
      religion_otra: undefined,
      condicion_especial,
      created_at: new Date().toISOString(),
      lider_nombre: null,
      lider_email: null,
      lugar_nombre: lug.lugar,
      sector_nombre: lug.sector,
      sector_id: lug.sid,
      politica: null,
      sub_politica: null,
      familiar_de: null,
      es_lider: false,
      img: null,
      dpi_frontal_url: null,
      dpi_reverso_url: null,
    });
  }

  return out;
}

export const AFILIADOS_DEMO_ESTADISTICAS = crearAfiliadosDemoEstadisticas(160);
