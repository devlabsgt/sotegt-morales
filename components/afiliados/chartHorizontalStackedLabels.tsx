"use client";

import type { ReactNode } from "react";

const MIN_INNER_PX = 52;

/** Recharts filtra `payload` al armar props del Label; suele quedar `index`. */
function resolveBarRowPayload(
  raw: any,
  rows?: readonly unknown[] | null,
): unknown {
  const p = raw?.payload;
  if (p && typeof p === "object") return p;
  const idx = raw?.index;
  if (rows != null && typeof idx === "number" && rows[idx] != null) {
    return rows[idx];
  }
  const tip = raw?.tooltipPayload?.[0]?.payload;
  if (tip && typeof tip === "object") return tip;
  return {};
}

function nombreDesdePayload(payload: unknown): string {
  const p = payload as {
    nombre?: string;
    etiqueta?: string;
    etiquetaCompleta?: string;
    name?: string;
  } | null;
  return String(
    p?.nombre ??
      p?.etiquetaCompleta ??
      p?.etiqueta ??
      p?.name ??
      "",
  ).trim();
}

/** Etiqueta de categoría en el primer tramo apilado (titulares), si aplica. */
export function stackedTitularesCategoriaLabel(
  raw: any,
  rows?: readonly unknown[] | null,
): ReactNode {
  const { x = 0, y = 0, width: w = 0, height: h = 0 } = raw;
  const payload = resolveBarRowPayload(raw, rows);
  const nombre = nombreDesdePayload(payload);
  if (!nombre) return null;
  const tit = Number(
    (payload as { titulares?: number })?.titulares ?? 0,
  );
  const fam = Number(
    (payload as { familiares?: number })?.familiares ?? 0,
  );
  if (tit <= 0 || w < MIN_INNER_PX) return null;
  if (fam > 0 && tit < fam) return null;
  const midY = y + h / 2;
  return (
    <text
      x={x + 8}
      y={midY}
      dominantBaseline="middle"
      fill="#ffffff"
      fontSize={11}
      fontWeight={800}
      style={{ textShadow: "0 0 3px rgba(0,0,0,.45)" }}
    >
      {nombre}
    </text>
  );
}

/** Etiqueta en el segundo tramo cuando titulares es menor o es 0. */
export function stackedFamiliaresCategoriaLabel(
  raw: any,
  rows?: readonly unknown[] | null,
): ReactNode {
  const { x = 0, y = 0, width: w = 0, height: h = 0 } = raw;
  const payload = resolveBarRowPayload(raw, rows);
  const nombre = nombreDesdePayload(payload);
  if (!nombre) return null;
  const tit = Number(
    (payload as { titulares?: number })?.titulares ?? 0,
  );
  const fam = Number(
    (payload as { familiares?: number })?.familiares ?? 0,
  );
  if (fam <= 0 || w < MIN_INNER_PX) return null;
  if (tit > 0 && tit >= fam) return null;
  const midY = y + h / 2;
  return (
    <text
      x={x + 8}
      y={midY}
      dominantBaseline="middle"
      fill="#ffffff"
      fontSize={11}
      fontWeight={800}
      style={{ textShadow: "0 0 3px rgba(0,0,0,.45)" }}
    >
      {nombre}
    </text>
  );
}

/** Una sola barra coloreada (p. ej. condición especial, lugar). */
export function horizontalSingleSegmentLabel(
  raw: any,
  rows?: readonly unknown[] | null,
): ReactNode {
  const { x = 0, y = 0, width: barW = 0, height: h = 0, value } = raw;
  const payload = resolveBarRowPayload(raw, rows);
  const label =
    nombreDesdePayload(payload) ||
    (typeof value === "string" ? value : "") ||
    String((payload as { name?: string })?.name ?? "").trim();
  if (!label) return null;
  const midY = y + h / 2;
  const inside = barW >= MIN_INNER_PX;
  return (
    <text
      x={inside ? x + 8 : x + barW + 6}
      y={midY}
      dominantBaseline="middle"
      fill={inside ? "#ffffff" : "#334155"}
      fontSize={11}
      fontWeight={800}
      style={
        inside ? { textShadow: "0 0 3px rgba(0,0,0,.45)" } : undefined
      }
    >
      {label}
    </text>
  );
}
