"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { useState, useEffect, useMemo } from "react";
import type { Afiliado } from "../esquemas";
import { Switch } from "@/components/ui/Switch";
import { AFILIADOS_DEMO_ESTADISTICAS } from "../demo/afiliadosEstadisticasDemo";

interface Props {
  afiliados: Afiliado[];
  mostrarSimular?: boolean;
}

export default function Edades({ afiliados, mostrarSimular = false }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [simular, setSimular] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const datos = mostrarSimular && simular ? AFILIADOS_DEMO_ESTADISTICAS : afiliados;

  const rangos = useMemo(() => {
    const buckets = [
      { name: "Jóvenes (18-30)", min: 18, max: 30, hombres: 0, mujeres: 0 },
      { name: "Adultos (31-60)", min: 31, max: 60, hombres: 0, mujeres: 0 },
      { name: "Mayores (61+)", min: 61, max: 150, hombres: 0, mujeres: 0 },
    ];
    datos.forEach((af) => {
      const nacimiento = new Date(af.nacimiento);
      const edad = new Date().getFullYear() - nacimiento.getFullYear();
      const rango = buckets.find((r) => edad >= r.min && edad <= r.max);
      if (rango) {
        if (af.sexo === "M") rango.hombres++;
        else rango.mujeres++;
      }
    });
    return buckets;
  }, [datos]);

  return (
    <div className="w-full h-full flex flex-col p-2">
      <div className="mb-4 shrink-0 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-xs md:text-lg font-bold text-gray-800 uppercase text-center md:text-left">
            Demografía del Grupo
          </h4>
          <p className="text-sm text-gray-500 text-center md:text-left">
            Distribución por rangos de edad y género
          </p>
          {mostrarSimular && simular && (
            <p className="text-sky-600 text-[10px] font-bold uppercase mt-1 md:text-left text-center">
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
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rangos}
            margin={{ top: 20, right: 10, left: -20, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fontWeight: 700, fill: "#374151" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "#9ca3af" }}
            />
            <Tooltip cursor={{ fill: "#f9fafb", radius: 8 }} />
            <Legend
              verticalAlign="top"
              height={40}
              iconType="circle"
              wrapperStyle={{ fontSize: "9px" }}
            />
            <Bar
              dataKey="hombres"
              name="Hombres"
              fill="#3b82f6"
              radius={[6, 6, 0, 0]}
              barSize={isMobile ? 20 : 40}
            >
              <LabelList
                dataKey="hombres"
                position="top"
                fill="#1e40af"
                fontSize={9}
                fontWeight="900"
              />
            </Bar>
            <Bar
              dataKey="mujeres"
              name="Mujeres"
              fill="#ec4899"
              radius={[6, 6, 0, 0]}
              barSize={isMobile ? 20 : 40}
            >
              <LabelList
                dataKey="mujeres"
                position="top"
                fill="#9d174d"
                fontSize={9}
                fontWeight="900"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
