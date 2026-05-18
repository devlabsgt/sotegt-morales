"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  CartesianGrid,
} from "recharts";
import { useMemo, useState } from "react";
import {
  maxBarRowThickness,
  verticalBarRowsHeight,
} from "../chartHorizontalUtils";
import { horizontalSingleSegmentLabel } from "../chartHorizontalStackedLabels";
import type { Afiliado } from "../esquemas";
import { Switch } from "@/components/ui/Switch";
import { AFILIADOS_DEMO_ESTADISTICAS } from "../demo/afiliadosEstadisticasDemo";

interface Props {
  afiliados: Afiliado[];
  mostrarSimular?: boolean;
}

export default function CondicionEspecial({
  afiliados,
  mostrarSimular = false,
}: Props) {
  const [simular, setSimular] = useState(false);

  const lista = mostrarSimular && simular ? AFILIADOS_DEMO_ESTADISTICAS : afiliados;

  const { datosRaw, datosChart, totalPersonas } = useMemo(() => {
    const conteo: Record<string, number> = {};
    lista.forEach((afiliado) => {
      const condicion = afiliado.condicion_especial || "Sin Especificar";
      conteo[condicion] = (conteo[condicion] || 0) + 1;
    });
    const raw = Object.entries(conteo)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const chart =
      raw.length > 0
        ? raw
        : [{ name: "Sin registros", value: 1 }];
    return {
      datosRaw: raw,
      datosChart: chart,
      totalPersonas: lista.length,
    };
  }, [lista]);

  const barThCondicion = maxBarRowThickness(datosChart.map((d) => d.name));
  const alturaGraficoCondicion = verticalBarRowsHeight(datosChart.length, barThCondicion);
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      if (payload[0].payload.name === "Sin registros") return null;

      return (
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-xl text-[9px] z-50">
          <p className="font-bold text-gray-800 mb-2 border-b pb-1 uppercase">
            {label}
          </p>
          <p className="flex items-center gap-2">
            <span className="text-gray-600">Personas:</span>
            <strong className="text-[#0d9488] text-xl">
              {payload[0].value}
            </strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col p-2">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4 shrink-0">
        <div>
          <h4 className="text-xl font-bold text-gray-800 uppercase">
            Condición Especial
          </h4>
          <p className="text-sm text-gray-500 italic">
            Distribución de condiciones especiales
          </p>
          {mostrarSimular && simular && (
            <p className="text-sky-600 text-[10px] font-bold uppercase mt-1">
              Vista simulada
            </p>
          )}
        </div>
        {mostrarSimular && (
          <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
            <span className="text-[10px] font-black uppercase text-gray-600">
              Simular
            </span>
            <Switch checked={simular} onCheckedChange={setSimular} />
          </label>
        )}
      </div>

      <div className="flex-1 w-full overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-gray-300">
        <div
          className="w-full md:min-w-[550px]"
          style={{ height: alturaGraficoCondicion }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={datosChart}
              margin={{ top: 10, right: 36, left: 0, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#e5e7eb"
              />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={10}
                tick={false}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "#f3f4f6", radius: 8 }}
              />
              <Bar
                dataKey="value"
                barSize={barThCondicion}
                fill={datosRaw.length > 0 ? "#0d9488" : "#e5e7eb"}
                radius={[0, 8, 8, 0]}
              >
                <LabelList
                  dataKey="name"
                  content={(raw: any) =>
                    datosRaw.length > 0
                      ? horizontalSingleSegmentLabel(raw, datosChart)
                      : null
                  }
                />
                <LabelList
                  dataKey="value"
                  content={(props: any) => {
                    if (datosRaw.length === 0) return null;
                    const {
                      x = 0,
                      y = 0,
                      width: bw = 0,
                      height: bh = 0,
                      value,
                    } = props;
                    const midY = y + bh / 2;
                    const total = totalPersonas;
                    const pct =
                      total > 0
                        ? (Number(value) / total) * 100
                        : 0;
                    return (
                      <text
                        x={x + bw + 6}
                        y={midY}
                        dominantBaseline="middle"
                        fill="#4b5563"
                        fontSize={10}
                        fontWeight={700}
                      >
                        {value} · {pct.toFixed(0)}%
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
