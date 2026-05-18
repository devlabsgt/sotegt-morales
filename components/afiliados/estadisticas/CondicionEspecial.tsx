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
import {
  maxBarRowThickness,
  verticalBarRowsHeight,
} from "../chartHorizontalUtils";
import { horizontalSingleSegmentLabel } from "../chartHorizontalStackedLabels";
import type { Afiliado } from "../esquemas";

interface Props {
  afiliados: Afiliado[];
}

export default function CondicionEspecial({ afiliados }: Props) {
  const conteo: Record<string, number> = {};

  afiliados.forEach((afiliado) => {
    const condicion = afiliado.condicion_especial || "Sin Especificar";
    conteo[condicion] = (conteo[condicion] || 0) + 1;
  });

  const datosRaw = Object.entries(conteo)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const datos =
    datosRaw.length > 0
      ? datosRaw
      : [{ name: "Sin registros", value: 1 }];

  const barThCondicion = maxBarRowThickness(datos.map((d) => d.name));
  const alturaGraficoCondicion = verticalBarRowsHeight(datos.length, barThCondicion);
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
      <div className="flex flex-col items-start mb-4 shrink-0">
        <h4 className="text-xl font-bold text-gray-800 uppercase">
          Condición Especial
        </h4>
        <p className="text-sm text-gray-500 italic">
          Distribución de condiciones especiales
        </p>
      </div>

      <div className="flex-1 w-full overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-gray-300">
        <div
          className="w-full md:min-w-[550px]"
          style={{ height: alturaGraficoCondicion }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={datos}
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
                      ? horizontalSingleSegmentLabel(raw, datos)
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
                    const total = afiliados.length;
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
