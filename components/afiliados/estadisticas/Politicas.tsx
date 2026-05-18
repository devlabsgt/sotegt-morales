"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import { useState, useEffect, useMemo } from "react";
import type { Afiliado } from "../esquemas";
import { obtenerPoliticasConSubsAction } from "../forms/afiliados/catalogos";
import { Switch } from "@/components/ui/Switch";

const COLORES_SUB = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6",
  "#06b6d4", "#f97316", "#84cc16", "#ef4444", "#14b8a6",
];

interface Props {
  afiliados: Afiliado[];
  mostrarSimular?: boolean;
}

type CatalogoPolitica = { politica: string; subs: string[] };

function MiniPolitica({
  titulo,
  datos,
  total,
}: {
  titulo: string;
  datos: { name: string; value: number; color: string }[];
  total: number;
}) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-xl text-xs z-50">
          <p className="font-black text-gray-800 mb-1 uppercase text-sm">{payload[0].payload.name}</p>
          <p className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: payload[0].payload.color }}
            />
            <strong className="text-xl text-gray-900">{payload[0].value}</strong>
            <span className="text-gray-400">
              ({total > 0 ? ((payload[0].value / total) * 100).toFixed(0) : 0}%)
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm flex flex-col w-full">
      <h5 className="text-sm font-black text-gray-700 uppercase mb-1">
        {titulo}
      </h5>
      <p className="text-xs text-gray-400 font-bold mb-3">
        Total: {total}
      </p>

      <div className="w-full h-[200px] md:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={datos}
            margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="name"
              tick={false}
              axisLine={false}
              tickLine={false}
              interval={0}
              height={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              allowDecimals={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "#f9fafb", radius: 6 }}
            />
            <Bar dataKey="value" barSize={32} radius={[6, 6, 0, 0]}>
              {datos.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
              <LabelList
                dataKey="value"
                position="top"
                fontSize={12}
                fontWeight="900"
                fill="#374151"
                formatter={(v: number) => (v > 0 ? v : "")}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 border-t pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {datos.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-gray-600 flex-1 leading-tight">{d.name}</span>
            <span className="font-black text-gray-800">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Politicas({
  afiliados,
  mostrarSimular = false,
}: Props) {
  const [catalogo, setCatalogo] = useState<CatalogoPolitica[]>([]);
  const [simular, setSimular] = useState(false);

  useEffect(() => {
    obtenerPoliticasConSubsAction().then(setCatalogo);
  }, []);

  const { chartDataMap, sinDefinir, totalEvaluados } = useMemo(() => {
    if (mostrarSimular && simular && catalogo.length > 0) {
      const fake: Record<
        string,
        { datos: { name: string; value: number; color: string }[]; total: number }
      > = {};
      catalogo.forEach((pol, pi) => {
        const subsFromDB = pol.subs.length > 0 ? pol.subs : ["Sin sub-programa"];
        let total = 0;
        const datos = subsFromDB.map((sub, i) => {
          const value = 8 + ((pi * 19 + i * 23) % 42);
          total += value;
          return {
            name: sub,
            value,
            color: COLORES_SUB[i % COLORES_SUB.length],
          };
        });
        fake[pol.politica] = { datos, total };
      });
      const sumTotal = Object.values(fake).reduce((s, x) => s + x.total, 0);
      return { chartDataMap: fake, sinDefinir: 0, totalEvaluados: sumTotal };
    }

    const conteo: Record<string, Record<string, number>> = {};
    let sinDefinir = 0;

    afiliados.forEach((af) => {
      const politica = af.politica || null;
      if (!politica) {
        sinDefinir++;
        return;
      }
      const sub = af.sub_politica || "Sin sub-programa";
      if (!conteo[politica]) conteo[politica] = {};
      conteo[politica][sub] = (conteo[politica][sub] || 0) + 1;
    });

    const chartDataMap: Record<
      string,
      { datos: { name: string; value: number; color: string }[]; total: number }
    > = {};

    catalogo.forEach((pol) => {
      const subsFromDB = pol.subs.length > 0 ? pol.subs : ["Sin sub-programa"];
      const conteoForPol = conteo[pol.politica] || {};

      const extraSubs = Object.keys(conteoForPol).filter(
        (s) => !subsFromDB.includes(s),
      );
      const allSubs = [...subsFromDB, ...extraSubs];

      let total = 0;
      const datos = allSubs.map((sub, i) => {
        const value = conteoForPol[sub] || 0;
        total += value;
        return { name: sub, value, color: COLORES_SUB[i % COLORES_SUB.length] };
      });

      chartDataMap[pol.politica] = { datos, total };
    });

    return {
      chartDataMap,
      sinDefinir,
      totalEvaluados: afiliados.length,
    };
  }, [afiliados, catalogo, mostrarSimular, simular]);

  const allPoliticaNames = catalogo.map((c) => c.politica);

  const renderChart = (key: string) => {
    const data = chartDataMap[key] || { datos: [], total: 0 };
    return (
      <MiniPolitica
        key={key}
        titulo={key}
        datos={data.datos}
        total={data.total}
      />
    );
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-h-[1.25rem]">
          {mostrarSimular && simular && catalogo.length > 0 && (
            <p className="text-sky-600 text-[10px] font-bold uppercase">
              Vista simulada · programas según catálogo
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

      {catalogo.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-gray-300 font-bold uppercase animate-pulse">
            Cargando catálogos...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 w-full">
          {allPoliticaNames.map(renderChart)}
        </div>
      )}

      <div className="text-center text-[10px] text-gray-400 uppercase font-bold border-t border-gray-100 pt-3">
        <p className="text-gray-500 mb-1">
          Total de registros evaluados: {totalEvaluados}
        </p>
        {!simular && sinDefinir > 0 && (
          <span>(Sin programa seleccionado: {sinDefinir})</span>
        )}
      </div>
    </div>
  );
}
