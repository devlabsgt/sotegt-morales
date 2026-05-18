import type { Afiliado, Lider } from "../esquemas";

/** Misma lista que en el reporte de líderes (vista simulada). */
export const LIDERES_DEMO: Lider[] = [
  {
    id: "demo-1",
    email: "maria.garcia",
    nombres: "María",
    apellidos: "García López",
    rol: "LIDER",
    nivel_compromiso: "alto",
    conteoAfiliados: 58,
    conteoTitulares: 36,
    conteoFamiliares: 22,
  },
  {
    id: "demo-2",
    email: "carlos.mendez",
    nombres: "Carlos",
    apellidos: "Méndez Ruiz",
    rol: "LIDER",
    nivel_compromiso: "alto",
    conteoAfiliados: 51,
    conteoTitulares: 33,
    conteoFamiliares: 18,
  },
  {
    id: "demo-3",
    email: "sofia.hernandez",
    nombres: "Sofía",
    apellidos: "Hernández Rivas",
    rol: "LIDER",
    nivel_compromiso: "alto",
    conteoAfiliados: 47,
    conteoTitulares: 31,
    conteoFamiliares: 16,
  },
  {
    id: "demo-4",
    email: "roberto.campos",
    nombres: "Roberto",
    apellidos: "Campos Estrada",
    rol: "LIDER",
    nivel_compromiso: "alto",
    conteoAfiliados: 44,
    conteoTitulares: 30,
    conteoFamiliares: 14,
  },
  {
    id: "demo-5",
    email: "carmen.aguilar",
    nombres: "Carmen",
    apellidos: "Aguilar Toledo",
    rol: "LIDER",
    nivel_compromiso: "alto",
    conteoAfiliados: 39,
    conteoTitulares: 27,
    conteoFamiliares: 12,
  },
  {
    id: "demo-6",
    email: "ana.morales",
    nombres: "Ana",
    apellidos: "Morales Castillo",
    rol: "LIDER",
    nivel_compromiso: "medio",
    conteoAfiliados: 35,
    conteoTitulares: 24,
    conteoFamiliares: 11,
  },
  {
    id: "demo-7",
    email: "luis.ortiz",
    nombres: "Luis",
    apellidos: "Ortiz Pérez",
    rol: "LIDER",
    nivel_compromiso: "medio",
    conteoAfiliados: 31,
    conteoTitulares: 22,
    conteoFamiliares: 9,
  },
  {
    id: "demo-8",
    email: "rosa.diaz",
    nombres: "Rosa",
    apellidos: "Díaz Hernández",
    rol: "LIDER",
    nivel_compromiso: "medio",
    conteoAfiliados: 28,
    conteoTitulares: 19,
    conteoFamiliares: 9,
  },
  {
    id: "demo-9",
    email: "miguel.paiz",
    nombres: "Miguel",
    apellidos: "Paíz Arriola",
    rol: "LIDER",
    nivel_compromiso: "medio",
    conteoAfiliados: 24,
    conteoTitulares: 17,
    conteoFamiliares: 7,
  },
  {
    id: "demo-10",
    email: "gabriela.romero",
    nombres: "Gabriela",
    apellidos: "Romero Fuentes",
    rol: "LIDER",
    nivel_compromiso: "medio",
    conteoAfiliados: 21,
    conteoTitulares: 15,
    conteoFamiliares: 6,
  },
  {
    id: "demo-11",
    email: "ricardo.altan",
    nombres: "Ricardo",
    apellidos: "Altán Lemus",
    rol: "LIDER",
    nivel_compromiso: "medio",
    conteoAfiliados: 18,
    conteoTitulares: 14,
    conteoFamiliares: 4,
  },
  {
    id: "demo-12",
    email: "andrea.macias",
    nombres: "Andrea",
    apellidos: "Macías López",
    rol: "LIDER",
    nivel_compromiso: "medio",
    conteoAfiliados: 16,
    conteoTitulares: 12,
    conteoFamiliares: 4,
  },
  {
    id: "demo-13",
    email: "jorge.reyes",
    nombres: "Jorge",
    apellidos: "Reyes Soto",
    rol: "LIDER",
    nivel_compromiso: "bajo",
    conteoAfiliados: 14,
    conteoTitulares: 11,
    conteoFamiliares: 3,
  },
  {
    id: "demo-14",
    email: "patricia.vega",
    nombres: "Patricia",
    apellidos: "Vega Núñez",
    rol: "LIDER",
    nivel_compromiso: "bajo",
    conteoAfiliados: 11,
    conteoTitulares: 8,
    conteoFamiliares: 3,
  },
  {
    id: "demo-15",
    email: "hector.marroquin",
    nombres: "Héctor",
    apellidos: "Marroquín Lara",
    rol: "LIDER",
    nivel_compromiso: "bajo",
    conteoAfiliados: 9,
    conteoTitulares: 7,
    conteoFamiliares: 2,
  },
  {
    id: "demo-16",
    email: "lucia.batres",
    nombres: "Lucía",
    apellidos: "Batres Cruz",
    rol: "LIDER",
    nivel_compromiso: "bajo",
    conteoAfiliados: 7,
    conteoTitulares: 6,
    conteoFamiliares: 1,
  },
  {
    id: "demo-17",
    email: "fernando.escobar",
    nombres: "Fernando",
    apellidos: "Escobar Orellana",
    rol: "LIDER",
    nivel_compromiso: "medio",
    conteoAfiliados: 5,
    conteoTitulares: 5,
    conteoFamiliares: 0,
  },
  {
    id: "demo-18",
    email: "demo.sin.nivel",
    nombres: "Alejandro",
    apellidos: "Demo Pendiente",
    rol: "LIDER",
    nivel_compromiso: null,
    conteoAfiliados: 3,
    conteoTitulares: 3,
    conteoFamiliares: 0,
  },
  {
    id: "demo-19",
    email: "claudia.demo",
    nombres: "Claudia",
    apellidos: "Sin nivel afiliaciones",
    rol: "LIDER",
    nivel_compromiso: null,
    conteoAfiliados: 2,
    conteoTitulares: 2,
    conteoFamiliares: 0,
  },
  {
    id: "demo-20",
    email: "enrique.preview",
    nombres: "Enrique",
    apellidos: "Revisión capa",
    rol: "LIDER",
    nivel_compromiso: null,
    conteoAfiliados: 0,
    conteoTitulares: 0,
    conteoFamiliares: 0,
  },
];

const NOMBRES_EXTRA = [
  "Marco",
  "Diana",
  "Julio",
  "Valentina",
  "Óscar",
  "Irene",
  "Bryan",
  "Camila",
  "Daniel",
  "Esther",
] as const;

const APELLIDOS_EXTRA = [
  "López García",
  "Reyes Paiz",
  "Tzul Coy",
  "Flores Morales",
  "Aguilar Toledo",
  "Pérez Contreras",
  "Ixquiat Toc",
  "Santos Grijalva",
  "Ramírez de León",
  "Chávez Ovalle",
] as const;

function filaDemoBase(
  lider: Lider,
  partial: Pick<Afiliado, "id" | "nombres" | "apellidos"> &
    Partial<Afiliado>,
): Afiliado {
  const slug = partial.id.replace(/[^a-z0-9-]/gi, "");
  const dpiNum = (1590000000000 + slug.length * 997) % 10 ** 13;
  return {
    nombres: partial.nombres,
    apellidos: partial.apellidos,
    telefono: "55551234",
    telefono2: null,
    telefono3: null,
    dpi: String(dpiNum).padStart(13, "0").slice(0, 13),
    nacimiento: "1988-05-20",
    sexo: partial.sexo ?? "M",
    lugar_id: 1,
    lider_id: lider.id,
    politica_id: 1,
    sub_politica_id: null,
    empadronado: true,
    no_padron: "1234567890123",
    religion: "Católica",
    religion_otra: undefined,
    condicion_especial: null,
    id: partial.id,
    created_at: new Date().toISOString(),
    lider_nombre: `${lider.nombres} ${lider.apellidos}`,
    lider_email: lider.email,
    lugar_nombre: "Vista simulada",
    familiar_de: partial.familiar_de ?? null,
    es_lider: partial.es_lider ?? false,
    img: null,
    dpi_frontal_url: null,
    dpi_reverso_url: null,
  };
}

/** Afiliados ilustrativos para el modal de célula (ids demo-*). */
export function construirAfiliadosCelulaDemo(lider: Lider): Afiliado[] {
  let nTit = lider.conteoTitulares ?? 0;
  let nFam = lider.conteoFamiliares ?? 0;
  const totalReportado = lider.conteoAfiliados ?? 0;

  if (nTit === 0 && nFam === 0 && totalReportado === 0) return [];

  if (nTit === 0 && totalReportado > 0) {
    nTit = Math.max(1, totalReportado - nFam);
  }

  const maxFilas = 150;
  nTit = Math.min(nTit, maxFilas);
  nFam = Math.min(nFam, Math.max(0, maxFilas - nTit));

  const out: Afiliado[] = [];
  const titularIds: string[] = [];

  const idLiderRow = `sim-lider-${lider.id}`;
  titularIds.push(idLiderRow);
  out.push(
    filaDemoBase(lider, {
      id: idLiderRow,
      nombres: lider.nombres,
      apellidos: lider.apellidos,
      es_lider: true,
      sexo: "M",
    }),
  );

  for (let i = 1; i < nTit; i += 1) {
    const id = `sim-t-${lider.id}-${i}`;
    titularIds.push(id);
    const ni = i % NOMBRES_EXTRA.length;
    const ai = (i * 3) % APELLIDOS_EXTRA.length;
    out.push(
      filaDemoBase(lider, {
        id,
        nombres: NOMBRES_EXTRA[ni],
        apellidos: APELLIDOS_EXTRA[ai],
        es_lider: false,
        sexo: i % 2 === 0 ? "F" : "M",
        dpi: String(1591000000000 + i * 7919).replace(/\D/g, "").slice(0, 13),
      }),
    );
  }

  for (let j = 0; j < nFam; j += 1) {
    const padreId = titularIds[j % titularIds.length];
    const id = `sim-f-${lider.id}-${j}`;
    const ni = (j + 4) % NOMBRES_EXTRA.length;
    const ai = (j * 5) % APELLIDOS_EXTRA.length;
    out.push(
      filaDemoBase(lider, {
        id,
        nombres: NOMBRES_EXTRA[ni],
        apellidos: APELLIDOS_EXTRA[ai],
        familiar_de: padreId,
        es_lider: false,
        sexo: j % 2 === 0 ? "F" : "M",
        dpi: String(1592000000000 + j * 8101).replace(/\D/g, "").slice(0, 13),
      }),
    );
  }

  return out;
}
