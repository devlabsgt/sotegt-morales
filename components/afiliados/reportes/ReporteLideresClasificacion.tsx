"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/Switch";
import {
  X,
  PieChart as PieChartIcon,
  ChevronLeft,
  ChevronRight,
  Crown,
  UsersRound,
  MapPin,
  ChevronDown,
  FileSpreadsheet,
  Accessibility,
} from "lucide-react";
import {
  type Afiliado,
  type Lider,
  CONDICION_ESPECIAL_OPCIONES,
} from "../esquemas";
import { LIDERES_DEMO } from "../demo/lideresDemoData";
import { descargarExcelAoA } from "./DescargarExcel";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  LabelList,
} from "recharts";
import {
  maxBarRowThickness,
  verticalBarRowsHeight,
} from "../chartHorizontalUtils";
import {
  horizontalSingleSegmentLabel,
  stackedFamiliaresCategoriaLabel,
  stackedTitularesCategoriaLabel,
} from "../chartHorizontalStackedLabels";

type Props = {
  open: boolean;
  onClose: () => void;
  lideres: Lider[];
  afiliados: Afiliado[];
  mostrarOpcionSimular: boolean;
};

const ORDEN_NIVEL = (n: string | null | undefined): number => {
  const v = String(n ?? "").toLowerCase();
  if (v === "alto") return 0;
  if (v === "medio") return 1;
  if (v === "bajo") return 2;
  return 3;
};

const ETIQUETA_NIVEL = (n: string | null | undefined): string => {
  const v = String(n ?? "").toLowerCase();
  if (v === "alto" || v === "medio" || v === "bajo")
    return v.charAt(0).toUpperCase() + v.slice(1);
  return "Sin calificar";
};

const COLORS_BAR: Record<string, string> = {
  Alto: "#15803d",
  Medio: "#ea580c",
  Bajo: "#b91c1c",
  "Sin calificar": "#6b7280",
};

const NIVELES_TABLA = ["Alto", "Medio", "Bajo", "Sin calificar"] as const;
type NivelTabla = (typeof NIVELES_TABLA)[number];

const PAGE_SIZE_DETALLE = 10;

/** Anula el `text-[#06c]` del Button outline en descargas Excel */
const CLASS_BTN_EXCEL =
  "text-green-700 hover:text-green-800 hover:bg-green-700/10";

const COLOR_TITULAR = "#15803d";
const COLOR_FAMILIAR = "#7c3aed";

type AfiliadoRegionRow = Pick<
  Afiliado,
  "lugar_nombre" | "sector_nombre" | "sector_id" | "familiar_de"
>;

type BloqueSectorRegion = {
  sectorOrdenId: number;
  sectorNombre: string;
  total: number;
  titulares: number;
  familiares: number;
  lugares: {
    nombre: string;
    total: number;
    titulares: number;
    familiares: number;
  }[];
};

type FilaDistritoTerritorio = {
  key: string;
  sectorNombre: string;
  lugarNombre: string;
  titulares: number;
  familiares: number;
  total: number;
};

type ModoTerritorioReporte =
  | "todos"
  | "solo_region"
  | "solo_distrito";

const PALETA_SECTOR_REGION: string[] = [
  "#0f766e",
  "#0891b2",
  "#7c3aed",
  "#ca8a04",
  "#b91c1c",
  "#15803d",
  "#c026d3",
  "#0369a1",
];

const PALETA_CONDICION_ESPECIAL: string[] = [
  "#7c3aed",
  "#ea580c",
  "#0d9488",
  "#2563eb",
  "#db2777",
  "#ca8a04",
  "#4f46e5",
  "#15803d",
];

type AfiliadoResumenCondicion = {
  id: string;
  nombres: string;
  apellidos: string;
  dpi: string;
  /** Primer número con valor (telefono, telefono2 o telefono3) */
  telefono: string | null;
  condicionLabel: string;
  familiar_de?: string | null;
};

function primerTelefonoAfiliado(
  a: Pick<Afiliado, "telefono" | "telefono2" | "telefono3">,
): string | null {
  for (const t of [a.telefono, a.telefono2, a.telefono3]) {
    const s = String(t ?? "").trim();
    if (s.length > 0) return s;
  }
  return null;
}

/** WhatsApp: Guatemala +502; en formulario se guardan 8 dígitos locales */
function whatsappUrlGuatemala(
  telefono: string | null | undefined,
): string | null {
  const d = String(telefono ?? "").replace(/\D/g, "");
  if (d.length === 8) return `https://wa.me/502${d}`;
  if (d.length >= 11 && d.startsWith("502"))
    return `https://wa.me/${d.slice(0, 11)}`;
  return null;
}

/** Texto visible (sin +502); enlace WA sigue usando 502 en la URL */
function etiquetaTelefonoMostrar(telefono: string): string {
  const d = telefono.replace(/\D/g, "");
  if (d.length === 8) return `${d.slice(0, 4)} ${d.slice(4)}`;
  if (d.length >= 11 && d.startsWith("502")) {
    const local = d.slice(3, 11);
    if (local.length === 8) return `${local.slice(0, 4)} ${local.slice(4)}`;
  }
  return telefono.trim();
}

function telefonoLiderDemoDesdeId(id: string): string | null {
  if (!id.startsWith("demo-")) return null;
  const n = Number.parseInt(id.replace(/^demo-/, ""), 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return String(51000000 + n * 9973).padStart(8, "0").slice(-8);
}

function CeldaTelefonoWaGt({
  nombreCompleto,
  telefono,
}: {
  nombreCompleto: string;
  telefono: string | null | undefined;
}) {
  const telRaw = telefono?.trim() ?? "";
  const wa = telRaw.length > 0 ? whatsappUrlGuatemala(telRaw) : null;
  if (!telRaw) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  if (wa) {
    return (
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[13px] font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800"
        aria-label={`WhatsApp ${nombreCompleto}`}
      >
        {etiquetaTelefonoMostrar(telRaw)}
      </a>
    );
  }

  return (
    <span className="text-xs font-mono text-slate-600">{telRaw}</span>
  );
}

function textoCondicionEspecial(
  raw: string | null | undefined,
): string | null {
  const t = String(raw ?? "").trim();
  return t.length > 0 ? t : null;
}

/** Nombres simulados para vista demo del reporte (condición especial) */
const NOMBRES_DEMO_CONDICION_GT = [
  "María",
  "José Luis",
  "Ana Lucía",
  "Carlos",
  "Rosa Marina",
  "Miguel Ángel",
  "Gabriela",
  "Jorge Alberto",
  "Sofía",
  "Óscar René",
  "Patricia",
  "Fernando",
  "Lucía",
  "Marco Antonio",
  "Andrea",
  "Diego",
  "Claudia Maribel",
  "Ricardo",
  "Vilma",
  "Héctor",
  "Gladys",
  "Byron",
  "Silvia",
  "Edvin",
  "Marta",
] as const;

const APELLIDOS_DEMO_CONDICION_GT = [
  "López García",
  "Morales Castillo",
  "Hernández Ruiz",
  "Reyes Paiz",
  "González Estrada",
  "Pérez Contreras",
  "Aguilar Toledo",
  "Flores Morales",
  "Ixquiac Toc",
  "Tzul Coy",
  "Xiloj Cholom",
  "Maas Mijangos",
  "Coy Sum",
  "Batz Ixcot",
  "Pop Chuc",
  "Santos Grijalva",
  "Ramírez de León",
  "Arévalo Montes",
  "Maldonado Juárez",
  "Figueroa Rivas",
  "Díaz Velásquez",
  "Orellana Lara",
  "Altán Lemus",
  "Barrios Méndez",
  "Chávez Ovalle",
] as const;

function construirAfiliadosCondicionDemo(): AfiliadoResumenCondicion[] {
  const out: AfiliadoResumenCondicion[] = [];
  CONDICION_ESPECIAL_OPCIONES.forEach((condicionLabel, gi) => {
    const n = 2 + (gi % 3);
    for (let j = 0; j < n; j += 1) {
      const ni =
        (gi * 7 + j * 3) % NOMBRES_DEMO_CONDICION_GT.length;
      const ai =
        (gi * 5 + j * 11) % APELLIDOS_DEMO_CONDICION_GT.length;
      out.push({
        id: `demo-cond-${gi}-${j}`,
        nombres: NOMBRES_DEMO_CONDICION_GT[ni],
        apellidos: APELLIDOS_DEMO_CONDICION_GT[ai],
        dpi: `${1590000000000 + gi * 100 + j}`.slice(0, 13),
        telefono: String(51000000 + gi * 1000 + j * 113).padStart(8, "0"),
        condicionLabel,
        familiar_de: j > 0 ? `demo-cond-${gi}-0` : null,
      });
    }
  });
  return out;
}

function ordenGruposCondicionEspecial(
  a: { condicionLabel: string; personas: AfiliadoResumenCondicion[] },
  b: { condicionLabel: string; personas: AfiliadoResumenCondicion[] },
): number {
  const orden = new Map<string, number>(
    CONDICION_ESPECIAL_OPCIONES.map((v, i) => [v, i]),
  );
  const ia = orden.get(a.condicionLabel);
  const ib = orden.get(b.condicionLabel);
  if (ia !== undefined && ib !== undefined) return ia - ib;
  if (ia !== undefined) return -1;
  if (ib !== undefined) return 1;
  const d = b.personas.length - a.personas.length;
  if (d !== 0) return d;
  return a.condicionLabel.localeCompare(b.condicionLabel, "es");
}

function agruparPorCondicionEspecial(
  lista: AfiliadoResumenCondicion[],
): { condicionLabel: string; personas: AfiliadoResumenCondicion[] }[] {
  const mapa = new Map<string, AfiliadoResumenCondicion[]>();
  lista.forEach((p) => {
    const key = p.condicionLabel;
    const prev = mapa.get(key) ?? [];
    prev.push(p);
    mapa.set(key, prev);
  });
  const grupos = [...mapa.entries()].map(([condicionLabel, personas]) => ({
    condicionLabel,
    personas: [...personas].sort((a, b) =>
      `${a.apellidos} ${a.nombres}`.localeCompare(
        `${b.apellidos} ${b.nombres}`,
        "es",
      ),
    ),
  }));
  grupos.sort(ordenGruposCondicionEspecial);
  return grupos;
}

function construirAfiliadosRegionDemo(): AfiliadoRegionRow[] {
  const out: AfiliadoRegionRow[] = [];
  const s1Nombre = "Sector 1: Parte Baja";
  const s1Id = 1;
  const lugaresS1 = [
    "SAN JORGE",
    "BARRANCO COLORADO",
    "LA JARRETADA",
    "LAS QUEBRADITAS",
    "MAL PAIS",
    "SAN FELIPE",
    "SAN JUAN",
    "TABLONES",
  ];
  lugaresS1.forEach((lugar, idx) => {
    const total = 4 + idx + (idx % 3);
    for (let i = 0; i < total; i += 1) {
      const esTitular = i % 5 !== 0;
      out.push({
        lugar_nombre: lugar,
        sector_nombre: s1Nombre,
        sector_id: s1Id,
        familiar_de: esTitular ? null : `tit-${idx}-${Math.floor(i / 2)}`,
      });
    }
  });
  const s2Nombre = "Sector 2: Zona Alta";
  const s2Id = 2;
  const lugaresS2 = ["EL MIRADOR", "CENTRO HISTÓRICO"];
  lugaresS2.forEach((lugar, idx) => {
    const total = 6 + idx * 2;
    for (let i = 0; i < total; i += 1) {
      const esTitular = i % 4 !== 3;
      out.push({
        lugar_nombre: lugar,
        sector_nombre: s2Nombre,
        sector_id: s2Id,
        familiar_de: esTitular ? null : `alt-${idx}-${i}`,
      });
    }
  });
  out.push({
    lugar_nombre: null,
    sector_nombre: null,
    sector_id: null,
    familiar_de: null,
  });
  out.push({
    lugar_nombre: "SIN UBICACIÓN",
    sector_nombre: null,
    sector_id: null,
    familiar_de: "orfan",
  });
  out.push({
    lugar_nombre: null,
    sector_nombre: null,
    sector_id: null,
    familiar_de: null,
  });
  out.push({
    lugar_nombre: "SIN UBICACIÓN",
    sector_nombre: null,
    sector_id: null,
    familiar_de: null,
  });
  return out;
}

function agruparPorRegion(lista: AfiliadoRegionRow[]): BloqueSectorRegion[] {
  type Acc = {
    sectorOrdenId: number;
    sectorNombre: string;
    lugares: Map<
      string,
      { total: number; titulares: number; familiares: number }
    >;
  };
  const mapa = new Map<string, Acc>();
  lista.forEach((a) => {
    const rawSid = a.sector_id;
    const sectorOrdenId =
      typeof rawSid === "number" && Number.isFinite(rawSid)
        ? rawSid
        : 2147483647;
    const nombreSectorTrim = String(a.sector_nombre ?? "").trim();
    const sectorNombre =
      sectorOrdenId === 2147483647 && !nombreSectorTrim
        ? "Sin clasificar"
        : nombreSectorTrim || "Sin clasificar";
    const claveSector = `${sectorOrdenId}§${sectorNombre}`;
    let sec = mapa.get(claveSector);
    if (!sec) {
      sec = {
        sectorOrdenId,
        sectorNombre,
        lugares: new Map(),
      };
      mapa.set(claveSector, sec);
    }
    const nombreLugar = String(a.lugar_nombre ?? "").trim() || "Sin especificar";
    const esFamiliar =
      a.familiar_de !== null &&
      a.familiar_de !== undefined &&
      String(a.familiar_de).trim() !== "";
    const prev = sec.lugares.get(nombreLugar) ?? {
      total: 0,
      titulares: 0,
      familiares: 0,
    };
    prev.total += 1;
    if (esFamiliar) prev.familiares += 1;
    else prev.titulares += 1;
    sec.lugares.set(nombreLugar, prev);
  });
  const bloques = [...mapa.values()].map((sec) => {
    const lugaresArr = [...sec.lugares.entries()].map(([nombre, c]) => ({
      nombre,
      total: c.total,
      titulares: c.titulares,
      familiares: c.familiares,
    }));
    lugaresArr.sort((x, y) => {
      if (y.total !== x.total) return y.total - x.total;
      return x.nombre.localeCompare(y.nombre, "es");
    });
    return {
      sectorOrdenId: sec.sectorOrdenId,
      sectorNombre: sec.sectorNombre,
      total: lugaresArr.reduce((s, l) => s + l.total, 0),
      titulares: lugaresArr.reduce((s, l) => s + l.titulares, 0),
      familiares: lugaresArr.reduce((s, l) => s + l.familiares, 0),
      lugares: lugaresArr,
    };
  });
  bloques.sort((x, y) => {
    if (x.sectorOrdenId !== y.sectorOrdenId)
      return x.sectorOrdenId - y.sectorOrdenId;
    return x.sectorNombre.localeCompare(y.sectorNombre, "es");
  });
  return bloques;
}

const BARRAS_VIEWPORT_MOBILE_MAX_PX = 640;

function useBarrasViewportEstrecho(): boolean {
  const [estrecho, setEstrecho] = useState(() =>
    typeof window !== "undefined"
      ? window.innerWidth <= BARRAS_VIEWPORT_MOBILE_MAX_PX
      : false,
  );
  useEffect(() => {
    const mq = window.matchMedia(
      `(max-width: ${BARRAS_VIEWPORT_MOBILE_MAX_PX}px)`,
    );
    const aplicar = () => setEstrecho(mq.matches);
    aplicar();
    mq.addEventListener("change", aplicar);
    return () => mq.removeEventListener("change", aplicar);
  }, []);
  return estrecho;
}

export default function ReporteLideresClasificacion({
  open,
  onClose,
  lideres,
  afiliados,
  mostrarOpcionSimular,
}: Props) {
  const [simularRegistros, setSimularRegistros] = useState(false);
  const [filtroDetalleNiveles, setFiltroDetalleNiveles] =
    useState<Set<NivelTabla> | null>(null);
  const [paginaDetalle, setPaginaDetalle] = useState(1);
  const [pestañaReporte, setPestañaReporte] = useState<
    "lideres" | "enlaces" | "region" | "condicion_especial"
  >("lideres");
  const [paginaEnlaces, setPaginaEnlaces] = useState(1);
  const [modoTerritorio, setModoTerritorio] =
    useState<ModoTerritorioReporte>("todos");
  const vistaBarrasMovil = useBarrasViewportEstrecho();

  useEffect(() => {
    if (!open) {
      setSimularRegistros(false);
      setFiltroDetalleNiveles(null);
      setPaginaDetalle(1);
      setPestañaReporte("lideres");
      setPaginaEnlaces(1);
      setModoTerritorio("todos");
    }
  }, [open]);

  useEffect(() => {
    setPaginaDetalle(1);
    setPaginaEnlaces(1);
  }, [filtroDetalleNiveles, simularRegistros, mostrarOpcionSimular]);

  const simulacionDatosActivada =
    mostrarOpcionSimular && simularRegistros;

  const datosEfectivos = useMemo(
    () => (simulacionDatosActivada ? LIDERES_DEMO : lideres),
    [simulacionDatosActivada, lideres],
  );

  const telefonoPorLiderId = useMemo(() => {
    const m = new Map<string, string | null>();
    const byLider = new Map<string, Afiliado[]>();
    for (const a of afiliados) {
      const lid = a.lider_id;
      if (!lid) continue;
      const arr = byLider.get(lid) ?? [];
      arr.push(a);
      byLider.set(lid, arr);
    }
    for (const [lid, rows] of byLider) {
      const liderRow =
        rows.find((r) => r.es_lider) ??
        rows.find((r) => !r.familiar_de);
      m.set(lid, liderRow ? primerTelefonoAfiliado(liderRow) : null);
    }
    return m;
  }, [afiliados]);

  const telefonoDeLider = (l: Lider): string | undefined => {
    const t =
      telefonoPorLiderId.get(l.id) ??
      l.telefono ??
      telefonoLiderDemoDesdeId(l.id);
    const s = t == null ? "" : String(t).trim();
    return s === "" ? undefined : s;
  };

  const ordenados = useMemo(() => {
    return [...datosEfectivos].sort((a, b) => {
      const d =
        ORDEN_NIVEL(a.nivel_compromiso) - ORDEN_NIVEL(b.nivel_compromiso);
      if (d !== 0) return d;
      const na = `${a.nombres} ${a.apellidos}`.toLowerCase();
      const nb = `${b.nombres} ${b.apellidos}`.toLowerCase();
      return na.localeCompare(nb, "es");
    });
  }, [datosEfectivos]);

  const ordenadosFiltrados = useMemo(() => {
    if (filtroDetalleNiveles === null) return ordenados;
    return ordenados.filter((row) => {
      const label = ETIQUETA_NIVEL(row.nivel_compromiso) as NivelTabla;
      return filtroDetalleNiveles.has(label);
    });
  }, [ordenados, filtroDetalleNiveles]);

  useEffect(() => {
    const tp = Math.max(
      1,
      Math.ceil(ordenadosFiltrados.length / PAGE_SIZE_DETALLE),
    );
    setPaginaDetalle((p) => Math.min(Math.max(1, p), tp));
  }, [ordenadosFiltrados.length]);

  const lideresEnVista = useMemo(() => {
    if (filtroDetalleNiveles === null) return datosEfectivos;
    return datosEfectivos.filter((row) => {
      const label = ETIQUETA_NIVEL(row.nivel_compromiso) as NivelTabla;
      return filtroDetalleNiveles.has(label);
    });
  }, [datosEfectivos, filtroDetalleNiveles]);

  const lideresEnlacesLista = useMemo(
    () =>
      [...lideresEnVista].sort(
        (a, b) => (b.conteoAfiliados ?? 0) - (a.conteoAfiliados ?? 0),
      ),
    [lideresEnVista],
  );

  useEffect(() => {
    const tp = Math.max(
      1,
      Math.ceil(lideresEnlacesLista.length / PAGE_SIZE_DETALLE),
    );
    setPaginaEnlaces((p) => Math.min(Math.max(1, p), tp));
  }, [lideresEnlacesLista.length]);

  const totalPaginasDetalle = Math.max(
    1,
    Math.ceil(ordenadosFiltrados.length / PAGE_SIZE_DETALLE),
  );
  const paginaDetalleSegura = Math.min(paginaDetalle, totalPaginasDetalle);
  const indiceInicioDetalle = (paginaDetalleSegura - 1) * PAGE_SIZE_DETALLE;
  const filasPaginaDetalle = ordenadosFiltrados.slice(
    indiceInicioDetalle,
    indiceInicioDetalle + PAGE_SIZE_DETALLE,
  );

  const datosGrafico = useMemo(() => {
    const claves: Array<{ key: string; label: string }> = [
      { key: "alto", label: "Alto" },
      { key: "medio", label: "Medio" },
      { key: "bajo", label: "Bajo" },
      { key: "otro", label: "Sin calificar" },
    ];
    const counts = new Map<string, number>(claves.map((c) => [c.label, 0]));
    lideresEnVista.forEach((l) => {
      const v = String(l.nivel_compromiso ?? "").toLowerCase();
      if (v === "alto") counts.set("Alto", (counts.get("Alto") ?? 0) + 1);
      else if (v === "medio")
        counts.set("Medio", (counts.get("Medio") ?? 0) + 1);
      else if (v === "bajo") counts.set("Bajo", (counts.get("Bajo") ?? 0) + 1);
      else counts.set("Sin calificar", (counts.get("Sin calificar") ?? 0) + 1);
    });
    return claves.map((c) => ({
      nombre: c.label,
      cantidad: counts.get(c.label) ?? 0,
      fill: COLORS_BAR[c.label],
    }));
  }, [lideresEnVista]);

  const pieData = useMemo(
    () =>
      datosGrafico
        .filter((d) => d.cantidad > 0)
        .map((d) => ({
          name: d.nombre,
          value: d.cantidad,
          fill: d.fill,
        })),
    [datosGrafico],
  );

  const seleccionarTodosDetalle = () => setFiltroDetalleNiveles(null);

  const alternarNivelDetalle = (nivel: NivelTabla) => {
    setFiltroDetalleNiveles((prev) => {
      if (prev === null) return new Set<NivelTabla>([nivel]);
      const next = new Set(prev);
      if (next.has(nivel)) next.delete(nivel);
      else next.add(nivel);
      return next.size === 0 ? null : next;
    });
  };

  const nivelBotonColoreado = (nivel: NivelTabla) =>
    filtroDetalleNiveles === null || filtroDetalleNiveles.has(nivel);

  const enlacesTotalesMiembros = useMemo(() => {
    let titulares = 0;
    let familiares = 0;
    lideresEnVista.forEach((l) => {
      titulares += l.conteoTitulares ?? 0;
      familiares += l.conteoFamiliares ?? 0;
    });
    return { titulares, familiares };
  }, [lideresEnVista]);

  const enlacesPieMiembros = useMemo(() => {
    const { titulares, familiares } = enlacesTotalesMiembros;
    const out: { name: string; value: number; fill: string }[] = [];
    if (titulares > 0) {
      out.push({ name: "Titulares", value: titulares, fill: COLOR_TITULAR });
    }
    if (familiares > 0) {
      out.push({
        name: "Familiares",
        value: familiares,
        fill: COLOR_FAMILIAR,
      });
    }
    return out;
  }, [enlacesTotalesMiembros]);

  const enlacesPieLideresRed = useMemo(() => {
    let conFamilia = 0;
    let soloTitulares = 0;
    let sinMiembros = 0;
    lideresEnVista.forEach((l) => {
      const t = l.conteoTitulares ?? 0;
      const f = l.conteoFamiliares ?? 0;
      if (t === 0 && f === 0) sinMiembros++;
      else if (f > 0) conFamilia++;
      else soloTitulares++;
    });
    const out: { name: string; value: number; fill: string }[] = [];
    if (conFamilia > 0) {
      out.push({
        name: "Con familiares",
        value: conFamilia,
        fill: "#9333ea",
      });
    }
    if (soloTitulares > 0) {
      out.push({
        name: "Solo titulares",
        value: soloTitulares,
        fill: "#ca8a04",
      });
    }
    if (sinMiembros > 0) {
      out.push({
        name: "Sin miembros",
        value: sinMiembros,
        fill: "#94a3b8",
      });
    }
    return out;
  }, [lideresEnVista]);

  const enlacesBarCompleto = useMemo(
    () =>
      lideresEnlacesLista.map((l) => {
        const nombre = `${l.nombres} ${l.apellidos}`;
        return {
          id: l.id,
          nombre: nombre.length > 26 ? `${nombre.slice(0, 24)}…` : nombre,
          titulares: l.conteoTitulares ?? 0,
          familiares: l.conteoFamiliares ?? 0,
          total: l.conteoAfiliados ?? 0,
        };
      }),
    [lideresEnlacesLista],
  );

  const totalPaginasEnlaces = Math.max(
    1,
    Math.ceil(lideresEnlacesLista.length / PAGE_SIZE_DETALLE),
  );
  const paginaEnlacesSegura = Math.min(paginaEnlaces, totalPaginasEnlaces);
  const indiceInicioEnlaces = (paginaEnlacesSegura - 1) * PAGE_SIZE_DETALLE;
  const enlacesBarFilas = enlacesBarCompleto.slice(
    indiceInicioEnlaces,
    indiceInicioEnlaces + PAGE_SIZE_DETALLE,
  );
  const barSizeGraficoEnlaces = maxBarRowThickness(
    enlacesBarFilas.map((r) => r.nombre),
  );
  const alturaGraficoEnlaces = verticalBarRowsHeight(
    enlacesBarFilas.length,
    barSizeGraficoEnlaces,
  );
  const filasPaginaEnlaces = lideresEnlacesLista.slice(
    indiceInicioEnlaces,
    indiceInicioEnlaces + PAGE_SIZE_DETALLE,
  );

  const afiliadosPorRegionFuente = useMemo((): AfiliadoRegionRow[] => {
    if (simulacionDatosActivada) return construirAfiliadosRegionDemo();
    return afiliados.map((a) => ({
      lugar_nombre: a.lugar_nombre ?? null,
      sector_nombre: a.sector_nombre ?? null,
      sector_id: a.sector_id ?? null,
      familiar_de: a.familiar_de ?? null,
    }));
  }, [simulacionDatosActivada, afiliados]);

  const bloquesRegion = useMemo(
    () => agruparPorRegion(afiliadosPorRegionFuente),
    [afiliadosPorRegionFuente],
  );

  const regionPiePorSector = useMemo(
    () =>
      bloquesRegion
        .filter((b) => b.total > 0)
        .map((b, idx) => {
          const name =
            b.sectorNombre.length > 36
              ? `${b.sectorNombre.slice(0, 34)}…`
              : b.sectorNombre;
          return {
            name,
            nombreCompleto: b.sectorNombre,
            value: b.total,
            fill: PALETA_SECTOR_REGION[idx % PALETA_SECTOR_REGION.length],
          };
        }),
    [bloquesRegion],
  );

  const regionBarrasPorSector = useMemo(
    () =>
      bloquesRegion
        .filter((b) => b.total > 0)
        .map((b) => ({
          etiqueta:
            b.sectorNombre.length > 28
              ? `${b.sectorNombre.slice(0, 26)}…`
              : b.sectorNombre,
          titulares: b.titulares,
          familiares: b.familiares,
        })),
    [bloquesRegion],
  );

  const filasDistritoTerritorio = useMemo((): FilaDistritoTerritorio[] => {
    const out: FilaDistritoTerritorio[] = [];
    bloquesRegion.forEach((b) => {
      b.lugares.forEach((l) => {
        out.push({
          key: `${b.sectorOrdenId}:${l.nombre}`,
          sectorNombre: b.sectorNombre,
          lugarNombre: l.nombre,
          titulares: l.titulares,
          familiares: l.familiares,
          total: l.total,
        });
      });
    });
    out.sort((a, b) => {
      const d = b.total - a.total;
      if (d !== 0) return d;
      return `${a.sectorNombre} ${a.lugarNombre}`.localeCompare(
        `${b.sectorNombre} ${b.lugarNombre}`,
        "es",
      );
    });
    return out;
  }, [bloquesRegion]);

  const regionBarrasPorDistrito = useMemo(
    () =>
      filasDistritoTerritorio
        .filter((f) => f.total > 0)
        .map((f) => ({
          etiqueta:
            f.lugarNombre.length > 28
              ? `${f.lugarNombre.slice(0, 26)}…`
              : f.lugarNombre,
          tooltipLabel: `${f.lugarNombre} (${f.sectorNombre})`,
          titulares: f.titulares,
          familiares: f.familiares,
        })),
    [filasDistritoTerritorio],
  );

  const afiliadosCondicionResumen = useMemo((): AfiliadoResumenCondicion[] => {
    if (simulacionDatosActivada) return construirAfiliadosCondicionDemo();
    const out: AfiliadoResumenCondicion[] = [];
    for (const a of afiliados) {
      const label = textoCondicionEspecial(a.condicion_especial);
      if (!label) continue;
      out.push({
        id: a.id,
        nombres: a.nombres,
        apellidos: a.apellidos,
        dpi: a.dpi,
        telefono: primerTelefonoAfiliado(a),
        condicionLabel: label,
        familiar_de: a.familiar_de ?? null,
      });
    }
    return out;
  }, [simulacionDatosActivada, afiliados]);

  const gruposCondicionEspecial = useMemo(
    () => agruparPorCondicionEspecial(afiliadosCondicionResumen),
    [afiliadosCondicionResumen],
  );

  const condicionEspecialBarFilas = useMemo(
    () =>
      gruposCondicionEspecial.map((g) => {
        const raw = g.condicionLabel;
        return {
          etiqueta:
            raw.length > 36 ? `${raw.slice(0, 34)}…` : raw,
          etiquetaCompleta: raw,
          cantidad: g.personas.length,
        };
      }),
    [gruposCondicionEspecial],
  );

  const muestraChartsDistritoTerritorio =
    modoTerritorio === "solo_distrito";

  const territorioTituloBarras = muestraChartsDistritoTerritorio
    ? "Titulares y familiares por distrito (barras)"
    : "Titulares y familiares por sector (barras)";
  const territorioBarrasFilas = muestraChartsDistritoTerritorio
    ? regionBarrasPorDistrito
    : regionBarrasPorSector;
  const barSizeTerritorioReporte = maxBarRowThickness(
    territorioBarrasFilas.map((f) => f.etiqueta),
  );
  const territorioAlturaBarras = verticalBarRowsHeight(
    territorioBarrasFilas.length,
    barSizeTerritorioReporte,
  );
  const barSizeCondicionEspecial = maxBarRowThickness(
    condicionEspecialBarFilas.map((r) => r.etiquetaCompleta),
  );
  const alturaBarCondicionEspecial = verticalBarRowsHeight(
    condicionEspecialBarFilas.length,
    barSizeCondicionEspecial,
  );

  const etiquetaVistaTerritorio =
    modoTerritorio === "todos"
      ? "Región y distrito"
      : modoTerritorio === "solo_region"
        ? "Solo región"
        : "Solo distrito";

  const tituloCabeceraReporte =
    pestañaReporte === "lideres"
      ? "Reportes · Nivel de compromiso"
      : pestañaReporte === "enlaces"
        ? "Reportes · Enlaces en la organización"
        : pestañaReporte === "region"
          ? "Reportes · Territorio"
          : "Reportes · Condición especial";

  const subtituloCabeceraReporte =
    pestañaReporte === "lideres"
      ? `Orden: alto → medio → bajo · ${datosEfectivos.length} líderes${simulacionDatosActivada ? " · vista simulada" : ""}`
      : pestañaReporte === "enlaces"
        ? `Titulares y familiares por célula · ${lideresEnVista.length} líderes en vista${simulacionDatosActivada ? " · simulada" : ""}`
        : pestañaReporte === "region"
          ? `Vista territorial · ${etiquetaVistaTerritorio} · ${afiliadosPorRegionFuente.length} afiliados${simulacionDatosActivada ? " · simulada" : ""}`
          : `${afiliadosCondicionResumen.length} personas con condición declarada · ${gruposCondicionEspecial.length} tipo(s) distinto(s)${simulacionDatosActivada ? " · simulada" : ""}`;

  const descargarExcelDetalleClasificacion = (): void => {
    const filas: (string | number)[][] = [
      [
        "#",
        "Líder",
        "Correo (usuario)",
        "Nivel",
        "Total",
        "Titulares",
        "Familiares",
      ],
      ...ordenadosFiltrados.map((row, i) => {
        const nombre = `${row.nombres} ${row.apellidos}`.trim();
        const label = ETIQUETA_NIVEL(row.nivel_compromiso);
        return [
          i + 1,
          nombre,
          row.email ?? "",
          label,
          row.conteoAfiliados ?? 0,
          row.conteoTitulares ?? 0,
          row.conteoFamiliares ?? 0,
        ];
      }),
    ];
    descargarExcelAoA({
      nombreArchivoBase: "lideres-detalle-clasificacion",
      nombreHoja: "Detalle clasificación",
      filas,
    });
  };

  const descargarExcelEnlacesTitularesFamiliares = (): void => {
    const filas: (string | number)[][] = [
      ["#", "Líder", "Titulares", "Familiares", "Total", "% fam."],
      ...lideresEnlacesLista.map((row, i) => {
        const t = row.conteoAfiliados ?? 0;
        const f = row.conteoFamiliares ?? 0;
        const pct = t > 0 ? Math.round((f / t) * 100) : 0;
        const nombre = `${row.nombres} ${row.apellidos}`.trim();
        return [
          i + 1,
          nombre,
          row.conteoTitulares ?? 0,
          f,
          t,
          `${pct}%`,
        ];
      }),
    ];
    descargarExcelAoA({
      nombreArchivoBase: "enlaces-titulares-familiares",
      nombreHoja: "Titulares y familiares",
      filas,
    });
  };

  const descargarExcelTerritorioSector = (bloque: BloqueSectorRegion): void => {
    const slug = `territorio-${bloque.sectorNombre}`;
    const filas: (string | number)[][] = [
      ["Lugar", "Titulares", "Familiares", "Total", "% fam."],
      ...bloque.lugares.map((lugar) => {
        const pct =
          lugar.total > 0
            ? Math.round((lugar.familiares / lugar.total) * 100)
            : 0;
        return [lugar.nombre, lugar.titulares, lugar.familiares, lugar.total, `${pct}%`];
      }),
    ];
    descargarExcelAoA({
      nombreArchivoBase: slug,
      nombreHoja: bloque.sectorNombre,
      filas,
    });
  };

  const descargarExcelTerritorioSoloRegion = (): void => {
    const bloquesDatos = bloquesRegion.filter((b) => b.total > 0);
    const filas: (string | number)[][] = [
      ["Región", "Titulares", "Familiares", "Total", "% fam."],
      ...bloquesDatos.map((bloque) => {
        const pct =
          bloque.total > 0
            ? Math.round((bloque.familiares / bloque.total) * 100)
            : 0;
        return [
          bloque.sectorNombre,
          bloque.titulares,
          bloque.familiares,
          bloque.total,
          `${pct}%`,
        ];
      }),
    ];
    descargarExcelAoA({
      nombreArchivoBase: "territorio-solo-region",
      nombreHoja: "Solo región",
      filas,
    });
  };

  const descargarExcelTerritorioSoloDistrito = (): void => {
    const filas: (string | number)[][] = [
      ["Distrito", "Titulares", "Familiares", "Total", "% fam."],
      ...filasDistritoTerritorio.map((row) => {
        const pct =
          row.total > 0 ? Math.round((row.familiares / row.total) * 100) : 0;
        return [
          row.lugarNombre,
          row.titulares,
          row.familiares,
          row.total,
          `${pct}%`,
        ];
      }),
    ];
    descargarExcelAoA({
      nombreArchivoBase: "territorio-solo-distrito",
      nombreHoja: "Solo distrito",
      filas,
    });
  };

  const descargarExcelCondicionEspecial = (): void => {
    const filas: (string | number)[][] = [
      [
        "#",
        "Condición",
        "Nombres",
        "Apellidos",
        "DPI",
        "Teléfono",
        "Vínculo",
      ],
    ];
    let n = 0;
    for (const g of gruposCondicionEspecial) {
      for (const p of g.personas) {
        n += 1;
        const esFamiliar =
          !!p.familiar_de && String(p.familiar_de).trim() !== "";
        filas.push([
          n,
          g.condicionLabel,
          p.nombres,
          p.apellidos,
          p.dpi,
          (p.telefono ?? "").trim(),
          esFamiliar ? "Familiar" : "Titular",
        ]);
      }
    }
    descargarExcelAoA({
      nombreArchivoBase: "condicion-especial-personas",
      nombreHoja: "Condición especial",
      filas,
    });
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-hidden flex flex-col">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-2"
          >
            <DialogPanel className="relative flex h-full w-full min-h-0 flex-col bg-slate-50">
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 md:px-6 md:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-2 md:items-center">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-700 text-white md:mt-0">
                    <PieChartIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 pr-2">
                    <h2 className="truncate text-lg font-black uppercase tracking-tight text-slate-900 md:text-xl">
                      {tituloCabeceraReporte}
                    </h2>
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 md:text-xs">
                      {subtituloCabeceraReporte}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-row items-center gap-2">
                  {mostrarOpcionSimular && (
                    <label className="flex cursor-pointer select-none items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <Switch
                        checked={simularRegistros}
                        onCheckedChange={setSimularRegistros}
                      />
                      <span className="whitespace-nowrap text-xs font-semibold leading-snug text-slate-800 sm:text-sm">
                        Simular
                      </span>
                    </label>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    onClick={onClose}
                    aria-label="Cerrar"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                <div className="flex shrink-0 flex-wrap gap-2 border-b border-slate-200 bg-white px-4 pt-2 pb-3 md:px-6">
                  <button
                    type="button"
                    onClick={() => setPestañaReporte("lideres")}
                    className={`flex items-center gap-2 rounded-t-lg border-2 border-b-0 px-4 py-2.5 text-xs font-black uppercase md:text-sm ${
                      pestañaReporte === "lideres"
                        ? "border-amber-400 bg-amber-400 text-slate-900"
                        : "border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Crown className="h-4 w-4 shrink-0" aria-hidden />
                    Líderes
                  </button>
                  <button
                    type="button"
                    onClick={() => setPestañaReporte("enlaces")}
                    className={`flex items-center gap-2 rounded-t-lg border-2 border-b-0 px-4 py-2.5 text-xs font-black uppercase md:text-sm ${
                      pestañaReporte === "enlaces"
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <UsersRound className="h-4 w-4 shrink-0" aria-hidden />
                    Enlaces
                  </button>
                  <button
                    type="button"
                    onClick={() => setPestañaReporte("region")}
                    className={`flex items-center gap-2 rounded-t-lg border-2 border-b-0 px-4 py-2.5 text-xs font-black uppercase md:text-sm ${
                      pestañaReporte === "region"
                        ? "border-teal-700 bg-teal-700 text-white"
                        : "border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                    Territorio
                  </button>
                  <button
                    type="button"
                    onClick={() => setPestañaReporte("condicion_especial")}
                    className={`flex items-center gap-2 rounded-t-lg border-2 border-b-0 px-4 py-2.5 text-xs font-black uppercase md:text-sm ${
                      pestañaReporte === "condicion_especial"
                        ? "border-violet-700 bg-violet-700 text-white"
                        : "border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Accessibility className="h-4 w-4 shrink-0" aria-hidden />
                    Condición especial
                  </button>
                </div>
                <div className="px-4 py-5 md:px-6 md:py-6">
                  <div className="mx-auto flex max-w-[1400px] flex-col gap-6 lg:gap-8">
                  {pestañaReporte === "lideres" && (
                    <>
                      <div className="rounded-lg border border-amber-300 bg-amber-50/50 px-3 py-2 text-xs leading-snug text-slate-700">
                        <span className="font-black uppercase text-amber-900">
                          Líderes:
                        </span>{" "}
                        La vista resume la clasificación por nivel de compromiso de cada líder (
                        {!simulacionDatosActivada
                          ? "información cargada desde el sistema"
                          : "datos ilustrativos"}
                        ).
                      </div>
                      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                          <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-slate-500">
                            Distribución (barras)
                          </h3>
                          <div className="h-64 w-full md:h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={datosGrafico}
                                margin={{
                                  top: 12,
                                  right: 8,
                                  left: -12,
                                  bottom: 4,
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  vertical={false}
                                  stroke="#e2e8f0"
                                />
                                <XAxis
                                  dataKey="nombre"
                                  tick={{
                                    fontSize: 11,
                                    fill: "#64748b",
                                    fontWeight: 600,
                                  }}
                                  axisLine={{ stroke: "#cbd5e1" }}
                                  tickLine={false}
                                />
                                <YAxis
                                  allowDecimals={false}
                                  tick={{ fontSize: 11, fill: "#64748b" }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <Tooltip
                                  cursor={{ fill: "rgba(241,245,249,0.9)" }}
                                  contentStyle={{
                                    borderRadius: 8,
                                    border: "1px solid #e2e8f0",
                                  }}
                                />
                                <Bar
                                  dataKey="cantidad"
                                  radius={[10, 10, 0, 0]}
                                  name="Líderes"
                                >
                                  {datosGrafico.map((e) => (
                                    <Cell key={e.nombre} fill={e.fill} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                          <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
                            Distribución (dona)
                          </h3>
                          <div className="flex h-64 w-full flex-col md:h-72">
                            {pieData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart
                                  margin={{
                                    top: 8,
                                    right: 8,
                                    left: 8,
                                    bottom: 8,
                                  }}
                                >
                                  <Tooltip
                                    contentStyle={{
                                      borderRadius: 8,
                                      border: "1px solid #e2e8f0",
                                    }}
                                  />
                                  <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="46%"
                                    innerRadius="48%"
                                    outerRadius="78%"
                                    stroke="#fff"
                                    strokeWidth={3}
                                    paddingAngle={2}
                                  >
                                    {pieData.map((e) => (
                                      <Cell key={e.name} fill={e.fill} />
                                    ))}
                                  </Pie>
                                  <Legend
                                    verticalAlign="bottom"
                                    align="center"
                                    layout="horizontal"
                                    wrapperStyle={{
                                      paddingTop: 16,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: "#475569",
                                    }}
                                    formatter={(value, entry) =>
                                      `${value}: ${(entry.payload as { value?: number })?.value ?? ""}`
                                    }
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <p className="flex flex-1 items-center justify-center text-sm text-slate-500">
                                No hay líderes para graficar.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:px-5">
                          <h3 className="shrink-0 text-xs font-black uppercase tracking-wider text-slate-600">
                            Detalle · clasificación
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={seleccionarTodosDetalle}
                              className={`rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase md:px-3 md:text-xs ${
                                filtroDetalleNiveles === null
                                  ? "border-slate-800 bg-slate-800 text-white"
                                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              Todos
                            </button>
                            {NIVELES_TABLA.map((nivel) => {
                              const hex = COLORS_BAR[nivel];
                              const coloreado = nivelBotonColoreado(nivel);
                              return (
                                <button
                                  key={nivel}
                                  type="button"
                                  onClick={() => alternarNivelDetalle(nivel)}
                                  className={`rounded-lg border-2 px-2.5 py-1 text-[10px] font-black uppercase md:px-3 md:text-xs ${
                                    coloreado
                                      ? "border-transparent text-white"
                                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                  }`}
                                  style={
                                    coloreado
                                      ? {
                                          backgroundColor: hex,
                                          borderColor: hex,
                                        }
                                      : undefined
                                  }
                                >
                                  {nivel}
                                </button>
                              );
                            })}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={ordenadosFiltrados.length === 0}
                              onClick={descargarExcelDetalleClasificacion}
                              className={`h-9 gap-1.5 border-slate-300 text-[10px] font-black uppercase md:text-xs ${CLASS_BTN_EXCEL}`}
                              aria-label="Descargar Excel detalle clasificación"
                            >
                              <FileSpreadsheet className="h-4 w-4 shrink-0" />
                              Excel
                            </Button>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-100 bg-slate-50/90 text-left text-[10px] font-black uppercase tracking-wide text-slate-500 md:text-xs">
                                <th className="px-3 py-3 md:px-4">#</th>
                                <th className="px-3 py-3 md:px-4">Líder</th>
                                <th className="px-3 py-3 md:px-4">
                                  Correo (usuario)
                                </th>
                                <th className="px-3 py-3 md:px-4">
                                  Teléfono
                                </th>
                                <th className="px-3 py-3 md:px-4">Nivel</th>
                                <th className="px-3 py-3 text-right md:px-4">
                                  Total
                                </th>
                                <th className="px-3 py-3 text-right md:px-4">
                                  Titulares
                                </th>
                                <th className="px-3 py-3 text-right md:px-4">
                                  Familiares
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {filasPaginaDetalle.map((row, i) => {
                                const label = ETIQUETA_NIVEL(
                                  row.nivel_compromiso,
                                );
                                const color =
                                  COLORS_BAR[label] ??
                                  COLORS_BAR["Sin calificar"];
                                return (
                                  <tr
                                    key={row.id}
                                    className="border-b border-slate-100/80 transition-colors hover:bg-slate-50"
                                  >
                                    <td className="px-3 py-3 font-mono text-xs text-slate-400 md:px-4">
                                      {indiceInicioDetalle + i + 1}
                                    </td>
                                    <td className="px-3 py-3 font-semibold text-slate-900 md:px-4">
                                      {row.nombres} {row.apellidos}
                                    </td>
                                    <td className="px-3 py-3 text-xs italic text-slate-600 md:px-4">
                                      {row.email}
                                    </td>
                                    <td className="px-3 py-3 md:px-4">
                                      <CeldaTelefonoWaGt
                                        nombreCompleto={`${row.nombres} ${row.apellidos}`}
                                        telefono={telefonoDeLider(row)}
                                      />
                                    </td>
                                    <td className="px-3 py-3 md:px-4">
                                      <span
                                        className="text-xs font-black uppercase tracking-wide"
                                        style={{ color }}
                                      >
                                        {label}
                                      </span>
                                    </td>
                                    <td className="px-3 py-3 text-right font-bold tabular-nums text-slate-900 md:px-4">
                                      {row.conteoAfiliados ?? 0}
                                    </td>
                                    <td className="px-3 py-3 text-right tabular-nums text-slate-800 md:px-4">
                                      {row.conteoTitulares ?? 0}
                                    </td>
                                    <td className="px-3 py-3 text-right tabular-nums text-slate-800 md:px-4">
                                      {row.conteoFamiliares ?? 0}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        {ordenadosFiltrados.length > 0 && (
                          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/50 px-4 py-3 sm:flex-row md:px-5">
                            <span className="text-xs font-semibold text-slate-600">
                              {indiceInicioDetalle + 1}–
                              {Math.min(
                                indiceInicioDetalle + PAGE_SIZE_DETALLE,
                                ordenadosFiltrados.length,
                              )}{" "}
                              de {ordenadosFiltrados.length}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9 w-9 rounded-lg border-slate-300 p-0 text-slate-700 hover:bg-slate-100"
                                disabled={paginaDetalleSegura <= 1}
                                onClick={() =>
                                  setPaginaDetalle((p) => Math.max(1, p - 1))
                                }
                              >
                                <ChevronLeft className="h-5 w-5" />
                              </Button>
                              <span className="min-w-[5rem] text-center text-xs font-black text-slate-900 tabular-nums">
                                {paginaDetalleSegura} / {totalPaginasDetalle}
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9 w-9 rounded-lg border-slate-300 p-0 text-slate-700 hover:bg-slate-100"
                                disabled={
                                  paginaDetalleSegura >= totalPaginasDetalle
                                }
                                onClick={() =>
                                  setPaginaDetalle((p) =>
                                    Math.min(totalPaginasDetalle, p + 1),
                                  )
                                }
                              >
                                <ChevronRight className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                        )}
                        {ordenados.length === 0 && (
                          <p className="p-8 text-center text-sm text-slate-500">
                            No hay líderes en el sistema.
                          </p>
                        )}
                        {ordenados.length > 0 &&
                          ordenadosFiltrados.length === 0 && (
                            <p className="p-8 text-center text-sm text-slate-500">
                              Ningún líder coincide con los niveles
                              seleccionados.
                            </p>
                          )}
                      </div>
                    </>
                  )}
                  {pestañaReporte === "enlaces" && (
                    <>
                      <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 px-3 py-2 text-xs leading-snug text-slate-700">
                        <span className="font-black uppercase text-indigo-900">
                          Enlaces:
                        </span>{" "}
                        La vista muestra titulares y familiares por líder y las gráficas
                        asociadas a esos vínculos en la célula (
                        {!simulacionDatosActivada
                          ? "información cargada desde el sistema"
                          : "datos ilustrativos"}
                        ).
                      </div>
                      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                          <h3 className="mb-1 text-xs font-black uppercase tracking-wider text-slate-500">
                            Miembros agregados
                          </h3>
                          <p className="mb-3 text-[11px] text-slate-500">
                            Total titulares vs familiares en la vista actual.
                          </p>
                          <div className="h-64 w-full md:h-72">
                            {enlacesPieMiembros.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart
                                  margin={{
                                    top: 8,
                                    right: 8,
                                    left: 8,
                                    bottom: 8,
                                  }}
                                >
                                  <Tooltip
                                    contentStyle={{
                                      borderRadius: 8,
                                      border: "1px solid #e2e8f0",
                                    }}
                                  />
                                  <Pie
                                    data={enlacesPieMiembros}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="46%"
                                    innerRadius="48%"
                                    outerRadius="78%"
                                    stroke="#fff"
                                    strokeWidth={3}
                                    paddingAngle={2}
                                  >
                                    {enlacesPieMiembros.map((e) => (
                                      <Cell key={e.name} fill={e.fill} />
                                    ))}
                                  </Pie>
                                  <Legend
                                    verticalAlign="bottom"
                                    align="center"
                                    layout="horizontal"
                                    wrapperStyle={{
                                      paddingTop: 16,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: "#475569",
                                    }}
                                    formatter={(value, entry) =>
                                      `${value}: ${(entry.payload as { value?: number })?.value ?? ""}`
                                    }
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <p className="flex h-full items-center justify-center text-sm text-slate-500">
                                Sin miembros en esta vista.
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                          <h3 className="mb-1 text-xs font-black uppercase tracking-wider text-slate-500">
                            Líderes por tipo de vínculo
                          </h3>
                          <p className="mb-3 text-[11px] text-slate-500">
                            Con familiares en célula, solo titulares o sin
                            miembros.
                          </p>
                          <div className="h-64 w-full md:h-72">
                            {enlacesPieLideresRed.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart
                                  margin={{
                                    top: 8,
                                    right: 8,
                                    left: 8,
                                    bottom: 8,
                                  }}
                                >
                                  <Tooltip
                                    contentStyle={{
                                      borderRadius: 8,
                                      border: "1px solid #e2e8f0",
                                    }}
                                  />
                                  <Pie
                                    data={enlacesPieLideresRed}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="46%"
                                    innerRadius="48%"
                                    outerRadius="78%"
                                    stroke="#fff"
                                    strokeWidth={3}
                                    paddingAngle={2}
                                  >
                                    {enlacesPieLideresRed.map((e) => (
                                      <Cell key={e.name} fill={e.fill} />
                                    ))}
                                  </Pie>
                                  <Legend
                                    verticalAlign="bottom"
                                    align="center"
                                    layout="horizontal"
                                    wrapperStyle={{
                                      paddingTop: 16,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: "#475569",
                                    }}
                                    formatter={(value, entry) =>
                                      `${value}: ${(entry.payload as { value?: number })?.value ?? ""}`
                                    }
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <p className="flex h-full items-center justify-center text-sm text-slate-500">
                                Sin líderes en esta vista.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white">
                        <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 md:px-5">
                          <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                              Barras apiladas por líder
                            </h3>
                            <p className="mt-1 text-[11px] font-semibold text-slate-500">
                              {PAGE_SIZE_DETALLE} por página · misma página que
                              la tabla (paginador central)
                            </p>
                          </div>
                        </div>
                        <div className="px-2 py-4 sm:p-4 md:p-5">
                          {enlacesBarFilas.length > 0 ? (
                            <div
                              className="w-full"
                              style={{ height: alturaGraficoEnlaces }}
                            >
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  layout="vertical"
                                  data={enlacesBarFilas}
                                  margin={{
                                    left: vistaBarrasMovil ? 0 : 4,
                                    right: vistaBarrasMovil ? 10 : 20,
                                    top: vistaBarrasMovil ? 4 : 8,
                                    bottom: vistaBarrasMovil ? 4 : 8,
                                  }}
                                >
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    horizontal={false}
                                    stroke="#e2e8f0"
                                  />
                                  <XAxis
                                    type="number"
                                    allowDecimals={false}
                                    tick={{ fontSize: 11 }}
                                  />
                                  <YAxis
                                    type="category"
                                    dataKey="nombre"
                                    hide
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      borderRadius: 8,
                                      border: "1px solid #e2e8f0",
                                    }}
                                  />
                                  <Legend
                                    wrapperStyle={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                    }}
                                  />
                                  <Bar
                                    dataKey="titulares"
                                    stackId="m"
                                    fill={COLOR_TITULAR}
                                    name="Titulares"
                                    barSize={barSizeGraficoEnlaces}
                                  >
                                    <LabelList
                                      dataKey="titulares"
                                      content={(r) =>
                                        stackedTitularesCategoriaLabel(
                                          r,
                                          enlacesBarFilas,
                                        )
                                      }
                                    />
                                  </Bar>
                                  <Bar
                                    dataKey="familiares"
                                    stackId="m"
                                    fill={COLOR_FAMILIAR}
                                    name="Familiares"
                                    barSize={barSizeGraficoEnlaces}
                                  >
                                    <LabelList
                                      dataKey="familiares"
                                      content={(r) =>
                                        stackedFamiliaresCategoriaLabel(
                                          r,
                                          enlacesBarFilas,
                                        )
                                      }
                                    />
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <p className="py-12 text-center text-sm text-slate-500">
                              Sin líderes en esta vista.
                            </p>
                          )}
                        </div>
                      </div>

                      {lideresEnlacesLista.length > 0 && (
                        <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:justify-between md:max-w-xl md:px-5">
                          <span className="text-center text-xs font-semibold text-slate-600 sm:text-left">
                            {indiceInicioEnlaces + 1}–
                            {Math.min(
                              indiceInicioEnlaces + PAGE_SIZE_DETALLE,
                              lideresEnlacesLista.length,
                            )}{" "}
                            de {lideresEnlacesLista.length}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-9 w-9 rounded-lg border-slate-300 p-0 text-slate-700 hover:bg-slate-100"
                              disabled={paginaEnlacesSegura <= 1}
                              onClick={() =>
                                setPaginaEnlaces((p) => Math.max(1, p - 1))
                              }
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <span className="min-w-[5rem] text-center text-xs font-black text-slate-900 tabular-nums">
                              {paginaEnlacesSegura} / {totalPaginasEnlaces}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-9 w-9 rounded-lg border-slate-300 p-0 text-slate-700 hover:bg-slate-100"
                              disabled={
                                paginaEnlacesSegura >= totalPaginasEnlaces
                              }
                              onClick={() =>
                                setPaginaEnlaces((p) =>
                                  Math.min(totalPaginasEnlaces, p + 1),
                                )
                              }
                            >
                              <ChevronRight className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                            Tabla · titulares y familiares
                          </h3>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={lideresEnlacesLista.length === 0}
                            onClick={descargarExcelEnlacesTitularesFamiliares}
                            className={`h-9 w-full gap-1.5 border-slate-300 text-[10px] font-black uppercase sm:w-auto md:text-xs ${CLASS_BTN_EXCEL}`}
                            aria-label="Descargar Excel enlaces titulares y familiares"
                          >
                            <FileSpreadsheet className="h-4 w-4 shrink-0" />
                            Excel
                          </Button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-100 bg-slate-50/90 text-left text-[10px] font-black uppercase tracking-wide text-slate-500 md:text-xs">
                                <th className="px-3 py-3 md:px-4">#</th>
                                <th className="px-3 py-3 md:px-4">Líder</th>
                                <th className="px-3 py-3 md:px-4">
                                  Teléfono
                                </th>
                                <th className="px-3 py-3 text-right md:px-4">
                                  Titulares
                                </th>
                                <th className="px-3 py-3 text-right md:px-4">
                                  Familiares
                                </th>
                                <th className="px-3 py-3 text-right md:px-4">
                                  Total
                                </th>
                                <th className="px-3 py-3 text-right md:px-4">
                                  % fam.
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {filasPaginaEnlaces.map((row, i) => {
                                const t = row.conteoAfiliados ?? 0;
                                const f = row.conteoFamiliares ?? 0;
                                const pct =
                                  t > 0 ? Math.round((f / t) * 100) : 0;
                                return (
                                  <tr
                                    key={row.id}
                                    className="border-b border-slate-100/80 transition-colors hover:bg-slate-50"
                                  >
                                    <td className="px-3 py-3 font-mono text-xs text-slate-400 md:px-4">
                                      {indiceInicioEnlaces + i + 1}
                                    </td>
                                    <td className="px-3 py-3 font-semibold text-slate-900 md:px-4">
                                      {row.nombres} {row.apellidos}
                                    </td>
                                    <td className="px-3 py-3 md:px-4">
                                      <CeldaTelefonoWaGt
                                        nombreCompleto={`${row.nombres} ${row.apellidos}`}
                                        telefono={telefonoDeLider(row)}
                                      />
                                    </td>
                                    <td className="px-3 py-3 text-right tabular-nums text-slate-800 md:px-4">
                                      {row.conteoTitulares ?? 0}
                                    </td>
                                    <td className="px-3 py-3 text-right tabular-nums text-slate-800 md:px-4">
                                      {row.conteoFamiliares ?? 0}
                                    </td>
                                    <td className="px-3 py-3 text-right font-bold tabular-nums text-slate-900 md:px-4">
                                      {t}
                                    </td>
                                    <td className="px-3 py-3 text-right tabular-nums text-slate-600 md:px-4">
                                      {pct}%
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        {datosEfectivos.length === 0 && (
                          <p className="p-8 text-center text-sm text-slate-500">
                            No hay líderes en el sistema.
                          </p>
                        )}
                        {datosEfectivos.length > 0 &&
                          lideresEnlacesLista.length === 0 && (
                            <p className="p-8 text-center text-sm text-slate-500">
                              Ningún líder en la selección actual.
                            </p>
                          )}
                      </div>
                    </>
                  )}
                  {pestañaReporte === "region" && (
                    <>
                      <div className="rounded-lg border border-teal-200 bg-teal-50/40 px-3 py-2 text-xs leading-snug text-slate-700">
                        <span className="font-black uppercase text-teal-900">
                          Territorio:
                        </span>{" "}
                        Usa Todos para ver región + distrito por acordeón, Solo región para agregados por sector o Solo distrito por lugar dentro de cada región (
                        {!simulacionDatosActivada ? "lugares cargados desde el sistema" : "datos ilustrativos"}).
                      </div>
                      {afiliadosPorRegionFuente.length === 0 ? (
                        <p className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500">
                          No hay afiliados para mostrar por territorio.
                        </p>
                      ) : bloquesRegion.length === 0 ||
                        bloquesRegion.every((b) => b.total === 0) ? (
                        <p className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500">
                          Ningún afiliado coincide con datos de sector o lugar reconocibles.
                        </p>
                      ) : (
                        <>
                          <div
                            role="radiogroup"
                            aria-label="Vista territorial"
                            className="flex flex-wrap items-center gap-2"
                          >
                            {(
                              [
                                { id: "todos" as const, label: "Todos" },
                                {
                                  id: "solo_region" as const,
                                  label: "Solo región",
                                },
                                {
                                  id: "solo_distrito" as const,
                                  label: "Solo distrito",
                                },
                              ] as const
                            ).map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                role="radio"
                                aria-checked={modoTerritorio === opt.id}
                                onClick={() => setModoTerritorio(opt.id)}
                                className={`rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase md:px-3 md:text-xs ${
                                  modoTerritorio === opt.id
                                    ? "border-teal-800 bg-teal-800 text-white"
                                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          <div
                            className={
                              muestraChartsDistritoTerritorio
                                ? "flex flex-col gap-5"
                                : "grid gap-5 lg:grid-cols-2 lg:gap-6"
                            }
                          >
                            {!muestraChartsDistritoTerritorio && (
                              <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                                <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
                                  Distribución por sector (dona)
                                </h3>
                                <div className="h-64 w-full md:h-72">
                                  {regionPiePorSector.length > 0 ? (
                                    <ResponsiveContainer
                                      width="100%"
                                      height="100%"
                                    >
                                      <PieChart
                                        margin={{
                                          top: 8,
                                          right: 8,
                                          left: 8,
                                          bottom: 8,
                                        }}
                                      >
                                        <Tooltip
                                          formatter={(value, name, item) =>
                                            `${
                                              (
                                                item?.payload as {
                                                  nombreCompleto?: string;
                                                }
                                              )?.nombreCompleto ?? String(name ?? "")
                                            }: ${String(value ?? "")}`
                                          }
                                          contentStyle={{
                                            borderRadius: 8,
                                            border: "1px solid #e2e8f0",
                                          }}
                                        />
                                        <Pie
                                          data={regionPiePorSector}
                                          dataKey="value"
                                          nameKey="name"
                                          cx="50%"
                                          cy="46%"
                                          innerRadius="46%"
                                          outerRadius="74%"
                                          stroke="#fff"
                                          strokeWidth={3}
                                          paddingAngle={2}
                                        >
                                          {regionPiePorSector.map((e, idx) => (
                                            <Cell
                                              key={`${idx}-${e.nombreCompleto}`}
                                              fill={e.fill}
                                            />
                                          ))}
                                        </Pie>
                                        <Legend
                                          verticalAlign="bottom"
                                          align="center"
                                          layout="horizontal"
                                          wrapperStyle={{
                                            paddingTop: 14,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: "#475569",
                                          }}
                                          formatter={(value, entry) =>
                                            `${String(value ?? "")}: ${(entry.payload as { value?: number })?.value ?? ""}`
                                          }
                                        />
                                      </PieChart>
                                    </ResponsiveContainer>
                                  ) : (
                                    <p className="flex h-full items-center justify-center text-sm text-slate-500">
                                      Sin segmentos suficientes.
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                              <div className="rounded-2xl border border-slate-200 bg-white px-2 py-4 sm:p-4 md:p-5">
                                <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
                                  {territorioTituloBarras}
                                </h3>
                                <div
                                  className="w-full md:pt-2"
                                  style={{
                                    height: territorioAlturaBarras,
                                  }}
                                >
                                  <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                  >
                                    <BarChart
                                      layout="vertical"
                                      data={territorioBarrasFilas}
                                      margin={{
                                        left: vistaBarrasMovil ? 0 : 4,
                                        right: vistaBarrasMovil ? 8 : 18,
                                        top: vistaBarrasMovil ? 4 : 10,
                                        bottom: vistaBarrasMovil ? 4 : 10,
                                      }}
                                    >
                                      <CartesianGrid
                                        strokeDasharray="3 3"
                                        horizontal={false}
                                        stroke="#e2e8f0"
                                      />
                                      <XAxis
                                        type="number"
                                        allowDecimals={false}
                                        tick={{ fontSize: 11 }}
                                      />
                                      <YAxis
                                        type="category"
                                        dataKey="etiqueta"
                                        hide
                                      />
                                      <Tooltip
                                        labelFormatter={(label, payloadArr) => {
                                          if (
                                            !muestraChartsDistritoTerritorio
                                          ) {
                                            return String(label ?? "");
                                          }
                                          const payload = payloadArr?.[0]
                                            ?.payload as
                                            | { tooltipLabel?: string }
                                            | undefined;
                                          return (
                                            payload?.tooltipLabel ??
                                            String(label ?? "")
                                          );
                                        }}
                                        contentStyle={{
                                          borderRadius: 8,
                                          border: "1px solid #e2e8f0",
                                        }}
                                      />
                                      <Legend
                                        wrapperStyle={{
                                          fontSize: 11,
                                          fontWeight: 700,
                                        }}
                                      />
                                      <Bar
                                        dataKey="titulares"
                                        stackId="sf"
                                        fill={COLOR_TITULAR}
                                        name="Titulares"
                                        barSize={barSizeTerritorioReporte}
                                      >
                                        <LabelList
                                          dataKey="titulares"
                                          content={(r) =>
                                            stackedTitularesCategoriaLabel(
                                              r,
                                              territorioBarrasFilas,
                                            )
                                          }
                                        />
                                      </Bar>
                                      <Bar
                                        dataKey="familiares"
                                        stackId="sf"
                                        fill={COLOR_FAMILIAR}
                                        name="Familiares"
                                        barSize={barSizeTerritorioReporte}
                                      >
                                        <LabelList
                                          dataKey="familiares"
                                          content={(r) =>
                                            stackedFamiliaresCategoriaLabel(
                                              r,
                                              territorioBarrasFilas,
                                            )
                                          }
                                        />
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            </div>
                          {modoTerritorio === "todos" && (
                            <div className="flex flex-col gap-4">
                              {bloquesRegion
                                .filter((b) => b.total > 0)
                                .map((bloque) => (
                                  <details
                                    key={`${bloque.sectorOrdenId}-${bloque.sectorNombre}`}
                                    open
                                    className="group/details overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow duration-300 ease-out open:shadow-md"
                                  >
                                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/90 px-4 py-3 transition-colors duration-200 hover:bg-slate-100/90 md:px-5 [&::-webkit-details-marker]:hidden">
                                      <div className="min-w-0">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                                          {bloque.sectorNombre}
                                        </h3>
                                        <p className="mt-0.5 text-[11px] font-semibold uppercase text-teal-800">
                                          {bloque.lugares.length} lugar(es) ·{" "}
                                          {bloque.total} afiliados
                                        </p>
                                      </div>
                                      <span className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          disabled={bloque.lugares.length === 0}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            descargarExcelTerritorioSector(
                                              bloque,
                                            );
                                          }}
                                          className={`h-9 gap-1.5 border-slate-300 text-[10px] font-black uppercase md:text-xs ${CLASS_BTN_EXCEL}`}
                                          aria-label={`Descargar Excel territorio ${bloque.sectorNombre}`}
                                        >
                                          <FileSpreadsheet className="h-4 w-4 shrink-0" />
                                          Excel
                                        </Button>
                                        <span className="rounded-lg bg-teal-100 px-2.5 py-1 text-[10px] font-black uppercase text-teal-900">
                                          Ver lugares
                                        </span>
                                        <ChevronDown
                                          className="h-5 w-5 shrink-0 text-teal-800 transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none group-open/details:rotate-180"
                                          aria-hidden
                                        />
                                      </span>
                                    </summary>
                                    <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none group-open/details:grid-rows-[1fr]">
                                      <div className="min-h-0 overflow-hidden">
                                        <div className="overflow-x-auto">
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className="border-b border-slate-100 bg-white text-left text-[10px] font-black uppercase tracking-wide text-slate-500 md:text-xs">
                                            <th className="px-3 py-3 md:px-5">
                                              Lugar
                                            </th>
                                            <th className="px-3 py-3 text-right md:px-5">
                                              Titulares
                                            </th>
                                            <th className="px-3 py-3 text-right md:px-5">
                                              Familiares
                                            </th>
                                            <th className="px-3 py-3 text-right md:px-5">
                                              Total
                                            </th>
                                            <th className="px-3 py-3 text-right md:px-5">
                                              % fam.
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {bloque.lugares.map((lugar) => {
                                            const pct =
                                              lugar.total > 0
                                                ? Math.round(
                                                    (lugar.familiares /
                                                      lugar.total) *
                                                      100,
                                                  )
                                                : 0;
                                            return (
                                              <tr
                                                key={lugar.nombre}
                                                className="border-b border-slate-50 transition-colors hover:bg-slate-50/80"
                                              >
                                                <td className="px-3 py-3 font-semibold uppercase text-slate-900 md:px-5">
                                                  {lugar.nombre}
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums text-slate-800 md:px-5">
                                                  {lugar.titulares}
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums text-slate-800 md:px-5">
                                                  {lugar.familiares}
                                                </td>
                                                <td className="px-3 py-3 text-right font-bold tabular-nums text-slate-950 md:px-5">
                                                  {lugar.total}
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums text-slate-500 md:px-5">
                                                  {pct}%
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                        </div>
                                      </div>
                                    </div>
                                  </details>
                                ))}
                            </div>
                          )}
                          {modoTerritorio === "solo_region" && (
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                              <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                                  Tabla · solo región
                                </h3>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={
                                    !bloquesRegion.some((b) => b.total > 0)
                                  }
                                  onClick={descargarExcelTerritorioSoloRegion}
                                  className={`h-9 w-full gap-1.5 border-slate-300 text-[10px] font-black uppercase sm:w-auto md:text-xs ${CLASS_BTN_EXCEL}`}
                                  aria-label="Descargar Excel territorio solo región"
                                >
                                  <FileSpreadsheet className="h-4 w-4 shrink-0" />
                                  Excel
                                </Button>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/90 text-left text-[10px] font-black uppercase tracking-wide text-slate-500 md:text-xs">
                                      <th className="px-3 py-3 md:px-4">
                                        Región
                                      </th>
                                      <th className="px-3 py-3 text-right md:px-4">
                                        Titulares
                                      </th>
                                      <th className="px-3 py-3 text-right md:px-4">
                                        Familiares
                                      </th>
                                      <th className="px-3 py-3 text-right md:px-4">
                                        Total
                                      </th>
                                      <th className="px-3 py-3 text-right md:px-4">
                                        % fam.
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {bloquesRegion
                                      .filter((b) => b.total > 0)
                                      .map((bloque) => {
                                        const pct =
                                          bloque.total > 0
                                            ? Math.round(
                                                (bloque.familiares /
                                                  bloque.total) *
                                                  100,
                                              )
                                            : 0;
                                        return (
                                          <tr
                                            key={`${bloque.sectorOrdenId}-${bloque.sectorNombre}`}
                                            className="border-b border-slate-100/80 transition-colors hover:bg-slate-50"
                                          >
                                            <td className="px-3 py-3 font-semibold text-slate-900 md:px-4">
                                              {bloque.sectorNombre}
                                            </td>
                                            <td className="px-3 py-3 text-right tabular-nums text-slate-800 md:px-4">
                                              {bloque.titulares}
                                            </td>
                                            <td className="px-3 py-3 text-right tabular-nums text-slate-800 md:px-4">
                                              {bloque.familiares}
                                            </td>
                                            <td className="px-3 py-3 text-right font-bold tabular-nums text-slate-950 md:px-4">
                                              {bloque.total}
                                            </td>
                                            <td className="px-3 py-3 text-right tabular-nums text-slate-600 md:px-4">
                                              {pct}%
                                            </td>
                                          </tr>
                                        );
                                      })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                          {modoTerritorio === "solo_distrito" && (
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                              <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                                  Tabla · solo distrito
                                </h3>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={filasDistritoTerritorio.length === 0}
                                  onClick={descargarExcelTerritorioSoloDistrito}
                                  className={`h-9 w-full gap-1.5 border-slate-300 text-[10px] font-black uppercase sm:w-auto md:text-xs ${CLASS_BTN_EXCEL}`}
                                  aria-label="Descargar Excel territorio solo distrito"
                                >
                                  <FileSpreadsheet className="h-4 w-4 shrink-0" />
                                  Excel
                                </Button>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/90 text-left text-[10px] font-black uppercase tracking-wide text-slate-500 md:text-xs">
                                      <th className="px-3 py-3 md:px-4">
                                        Distrito
                                      </th>
                                      <th className="px-3 py-3 text-right md:px-4">
                                        Titulares
                                      </th>
                                      <th className="px-3 py-3 text-right md:px-4">
                                        Familiares
                                      </th>
                                      <th className="px-3 py-3 text-right md:px-4">
                                        Total
                                      </th>
                                      <th className="px-3 py-3 text-right md:px-4">
                                        % fam.
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {filasDistritoTerritorio.map((row) => {
                                      const pct =
                                        row.total > 0
                                          ? Math.round(
                                              (row.familiares / row.total) *
                                                100,
                                            )
                                          : 0;
                                      return (
                                        <tr
                                          key={row.key}
                                          className="border-b border-slate-100/80 transition-colors hover:bg-slate-50"
                                        >
                                          <td className="px-3 py-3 font-semibold uppercase text-slate-900 md:px-4">
                                            {row.lugarNombre}
                                          </td>
                                          <td className="px-3 py-3 text-right tabular-nums text-slate-800 md:px-4">
                                            {row.titulares}
                                          </td>
                                          <td className="px-3 py-3 text-right tabular-nums text-slate-800 md:px-4">
                                            {row.familiares}
                                          </td>
                                          <td className="px-3 py-3 text-right font-bold tabular-nums text-slate-950 md:px-4">
                                            {row.total}
                                          </td>
                                          <td className="px-3 py-3 text-right tabular-nums text-slate-600 md:px-4">
                                            {pct}%
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                  {pestañaReporte === "condicion_especial" && (
                    <>
                      <div className="rounded-lg border border-violet-200 bg-violet-50/40 px-3 py-2 text-xs leading-snug text-slate-700">
                        <span className="font-black uppercase text-violet-900">
                          Condición especial:
                        </span>{" "}
                        Personas con valor en el campo condición especial (Discapacidad, Desnutrición, Adulto mayor, Madre soltera), agrupadas por el texto registrado (
                        {!simulacionDatosActivada
                          ? "datos del sistema"
                          : "vista simulada"}
                        ). Una sola gráfica resume el conteo por tipo.
                      </div>
                      {afiliadosCondicionResumen.length === 0 ? (
                        <p className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500">
                          No hay afiliados con condición especial registrada.
                        </p>
                      ) : (
                        <>
                          <div className="rounded-2xl border border-slate-200 bg-white px-2 py-4 sm:p-4 md:p-5">
                            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
                              Personas por condición (barras horizontales)
                            </h3>
                            <div
                              className="w-full md:pt-2"
                              style={{ height: alturaBarCondicionEspecial }}
                            >
                              <ResponsiveContainer
                                width="100%"
                                height="100%"
                              >
                                <BarChart
                                  layout="vertical"
                                  data={condicionEspecialBarFilas}
                                  margin={{
                                    left: 4,
                                    right: vistaBarrasMovil ? 12 : 20,
                                    top: 8,
                                    bottom: 8,
                                  }}
                                >
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    horizontal={false}
                                    stroke="#e2e8f0"
                                  />
                                  <XAxis
                                    type="number"
                                    allowDecimals={false}
                                    tick={{ fontSize: 11 }}
                                  />
                                  <YAxis
                                    type="category"
                                    dataKey="etiqueta"
                                    hide
                                  />
                                  <Tooltip
                                    labelFormatter={(_, payloadArr) => {
                                      const p = payloadArr?.[0]?.payload as
                                        | { etiquetaCompleta?: string }
                                        | undefined;
                                      return (
                                        p?.etiquetaCompleta ??
                                        String(_ ?? "")
                                      );
                                    }}
                                    contentStyle={{
                                      borderRadius: 8,
                                      border: "1px solid #e2e8f0",
                                    }}
                                  />
                                  <Bar
                                    dataKey="cantidad"
                                    radius={[0, 8, 8, 0]}
                                    name="Personas"
                                    barSize={barSizeCondicionEspecial}
                                  >
                                    {condicionEspecialBarFilas.map(
                                      (_, idx) => (
                                        <Cell
                                          key={idx}
                                          fill={
                                            PALETA_CONDICION_ESPECIAL[
                                              idx %
                                                PALETA_CONDICION_ESPECIAL
                                                  .length
                                            ]
                                          }
                                        />
                                      ),
                                    )}
                                    <LabelList
                                      dataKey="etiquetaCompleta"
                                      content={(r) =>
                                        horizontalSingleSegmentLabel(
                                          r,
                                          condicionEspecialBarFilas,
                                        )
                                      }
                                    />
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                                Listado por condición
                              </h3>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={
                                  afiliadosCondicionResumen.length === 0
                                }
                                onClick={descargarExcelCondicionEspecial}
                                className={`h-9 w-full gap-1.5 border-slate-300 text-[10px] font-black uppercase sm:w-auto md:text-xs ${CLASS_BTN_EXCEL}`}
                                aria-label="Descargar Excel condición especial"
                              >
                                <FileSpreadsheet className="h-4 w-4 shrink-0" />
                                Excel
                              </Button>
                            </div>
                            {gruposCondicionEspecial.map((grupo) => (
                              <details
                                key={grupo.condicionLabel}
                                open
                                className="group/cond overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow open:shadow-md"
                              >
                                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-violet-50/80 px-4 py-3 md:px-5 [&::-webkit-details-marker]:hidden">
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-black uppercase leading-snug text-slate-900">
                                      {grupo.condicionLabel}
                                    </h4>
                                    <p className="mt-0.5 text-[11px] font-bold uppercase text-violet-800">
                                      {grupo.personas.length} persona
                                      {grupo.personas.length === 1 ? "" : "s"}
                                    </p>
                                  </div>
                                  <ChevronDown className="h-5 w-5 shrink-0 text-violet-800 transition-transform group-open/cond:rotate-180" />
                                </summary>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-slate-100 bg-slate-50/90 text-left text-[10px] font-black uppercase tracking-wide text-slate-500 md:text-xs">
                                        <th className="px-3 py-3 md:px-4">#</th>
                                        <th className="px-3 py-3 md:px-4">
                                          Nombre
                                        </th>
                                        <th className="px-3 py-3 md:px-4">
                                          DPI
                                        </th>
                                        <th className="px-3 py-3 md:px-4">
                                          Teléfono
                                        </th>
                                        <th className="px-3 py-3 md:px-4">
                                          Vínculo
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {grupo.personas.map((p, idx) => {
                                        const esFamiliar =
                                          !!p.familiar_de &&
                                          String(p.familiar_de).trim() !== "";
                                        return (
                                          <tr
                                            key={p.id}
                                            className="border-b border-slate-100/80 hover:bg-slate-50"
                                          >
                                            <td className="px-3 py-3 font-mono text-xs text-slate-400 md:px-4">
                                              {idx + 1}
                                            </td>
                                            <td className="px-3 py-3 font-semibold text-slate-900 md:px-4">
                                              {p.nombres} {p.apellidos}
                                            </td>
                                            <td className="px-3 py-3 font-mono text-xs text-slate-700 md:px-4">
                                              {p.dpi}
                                            </td>
                                            <td className="px-3 py-3 text-slate-700 md:px-4">
                                              <CeldaTelefonoWaGt
                                                nombreCompleto={`${p.nombres} ${p.apellidos}`}
                                                telefono={p.telefono}
                                              />
                                            </td>
                                            <td className="px-3 py-3 md:px-4">
                                              <span
                                                className={`text-[10px] font-black uppercase ${
                                                  esFamiliar
                                                    ? "text-violet-700"
                                                    : "text-emerald-700"
                                                }`}
                                              >
                                                {esFamiliar
                                                  ? "Familiar"
                                                  : "Titular"}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </details>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
