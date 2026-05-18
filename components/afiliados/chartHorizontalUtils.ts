/** Grosor vertical de cada fila en barras horizontales (Recharts `barSize`). */

export function barRowThicknessFromLabel(label: string): number {
  const t = String(label ?? "").trim();
  if (!t) return 28;
  const words = t.split(/\s+/).filter(Boolean).length;
  return Math.max(
    26,
    Math.min(
      76,
      14 + words * 13 + Math.min(20, Math.floor(t.length / 12) * 3),
    ),
  );
}

export function maxBarRowThickness(labels: string[]): number {
  if (!labels.length) return 32;
  let m = 28;
  for (const l of labels) {
    m = Math.max(m, barRowThicknessFromLabel(l));
  }
  return m;
}

/** Altura del contenedor para `BarChart` con `layout="vertical"` (filas × grosor). */
export function verticalBarRowsHeight(
  rowCount: number,
  barSize: number,
  pad = 56,
): number {
  if (rowCount <= 0) return 200;
  const between = 12;
  return Math.max(200, rowCount * (barSize + between) + pad);
}
