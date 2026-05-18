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
import type { Afiliado } from "../esquemas";
import { useQuery } from "@tanstack/react-query";
import { obtenerSectoresAction } from "../forms/afiliados/catalogos";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  maxBarRowThickness,
  verticalBarRowsHeight,
} from "../chartHorizontalUtils";
import { horizontalSingleSegmentLabel } from "../chartHorizontalStackedLabels";
import { Switch } from "@/components/ui/Switch";
import { AFILIADOS_DEMO_ESTADISTICAS } from "../demo/afiliadosEstadisticasDemo";

interface Props {
  afiliados: Afiliado[];
  mostrarSimular?: boolean;
}

export default function Lugares({
  afiliados,
  mostrarSimular = false,
}: Props) {
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>(
    {},
  );
  const [simular, setSimular] = useState(false);

  const datos = mostrarSimular && simular ? AFILIADOS_DEMO_ESTADISTICAS : afiliados;

  const { data: sectores } = useQuery({
    queryKey: ["sectores"],
    queryFn: () => obtenerSectoresAction(),
  });

  const toggleSector = (sectorName: string) => {
    setExpandedSectors((prev) => ({
      ...prev,
      [sectorName]: !prev[sectorName],
    }));
  };

  const datosPorSector = useMemo(() => {
    const porSector: Record<string, { name: string; value: number; sector_id: number }[]> = {};
    const sectorIds: Record<string, number> = {};

    if (sectores) {
      sectores.forEach((s) => {
        porSector[s.nombre] = [];
        sectorIds[s.nombre] = s.id;
      });
    }

    const conteo: Record<string, { count: number; sector: string; sector_id: number }> = {};
    datos.forEach((af) => {
      const lugar = af.lugar_nombre || "Sin Especificar";
      const sector = af.sector_nombre || "Sin Clasificar";
      const sector_id = af.sector_id ?? 0;
      if (!conteo[lugar]) conteo[lugar] = { count: 0, sector, sector_id };
      conteo[lugar].count++;
    });

    Object.entries(conteo).forEach(([lugar, { count, sector, sector_id }]) => {
      if (!porSector[sector]) {
        porSector[sector] = [];
        sectorIds[sector] = sector_id;
      }
      porSector[sector].push({ name: lugar, value: count, sector_id });
    });

    const sectoresOrdenados = Object.keys(porSector).sort((a, b) => {
      const idA = sectorIds[a] ?? 0;
      const idB = sectorIds[b] ?? 0;
      if (idA === 0 && idB !== 0) return 1;
      if (idB === 0 && idA !== 0) return -1;
      return idA - idB;
    });

    return sectoresOrdenados.map((sectorName) => {
      const lugaresDelSector = porSector[sectorName];
      const sectorId = sectorIds[sectorName] ?? 0;
      const totalReal = lugaresDelSector.reduce((s, l) => s + l.value, 0);

      lugaresDelSector.sort((a, b) => b.value - a.value);

      return {
        sectorName,
        sectorId,
        totalReal,
        lugares: lugaresDelSector,
      };
    });
  }, [datos, sectores]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-xl text-[9px] z-50">
          <p className="font-bold text-gray-800 mb-2 border-b pb-1 uppercase">
            {label}
          </p>
          <p className="flex items-center gap-2">
            <span className="text-gray-600">Personas:</span>
            <strong className="text-[#6366f1] text-xl">
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
            Ubicación de los Afiliados
          </h4>
          <p className="text-sm text-gray-500 italic">
            Lugares agrupados por sector
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

      <div className="flex-1 w-full overflow-y-auto pb-4 space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300">
        {datosPorSector.map((sectorData) => {
          const isExpanded = expandedSectors[sectorData.sectorName] ?? false;
          return (
            <div key={sectorData.sectorName} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <button
                type="button"
                onClick={() => toggleSector(sectorData.sectorName)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="text-gray-800 text-sm md:text-base">
                    {sectorData.sectorId === 0 ? (
                      <span className="text-blue-600 font-bold uppercase">{sectorData.sectorName}</span>
                    ) : (
                      <>
                        <span className="text-blue-600 font-bold uppercase">Sector {sectorData.sectorId}: </span>
                        <span className="text-gray-800">{sectorData.sectorName}</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="p-2 bg-white rounded-full shadow-sm">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="border-t border-gray-100 overflow-hidden"
                  >
                    <div className="p-4 overflow-x-auto">
                      {sectorData.lugares.length > 0 ? (
                        <div
                          className="w-full md:min-w-[550px]"
                          style={{
                            height: verticalBarRowsHeight(
                              sectorData.lugares.length,
                              maxBarRowThickness(
                                sectorData.lugares.map((l) => l.name),
                              ),
                            ),
                          }}
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              layout="vertical"
                              data={sectorData.lugares}
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
                                barSize={maxBarRowThickness(
                                  sectorData.lugares.map((l) => l.name),
                                )}
                                fill="#6366f1"
                                radius={[0, 8, 8, 0]}
                              >
                                <LabelList
                                  dataKey="name"
                                  content={(r) =>
                                    horizontalSingleSegmentLabel(
                                      r,
                                      sectorData.lugares,
                                    )
                                  }
                                />
                                <LabelList
                                  dataKey="value"
                                  content={(props: any) => {
                                    const {
                                      x = 0,
                                      y = 0,
                                      width: bw = 0,
                                      height: bh = 0,
                                      value,
                                    } = props;
                                    const item =
                                      sectorData.lugares[props.index];
                                    if (!item) return null;
                                    const pct =
                                      sectorData.totalReal > 0
                                        ? (item.value / sectorData.totalReal) *
                                          100
                                        : 0;
                                    const midY = y + bh / 2;
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
                      ) : (
                        <div className="py-8 text-center text-gray-400 italic text-sm">
                          No hay registros en este sector
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
