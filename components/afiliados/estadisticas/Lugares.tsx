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
  Rectangle,
} from "recharts";
import { useMemo, useState, useEffect } from "react";
import type { Afiliado } from "../esquemas";
import { useQuery } from "@tanstack/react-query";
import { obtenerSectoresAction } from "../forms/afiliados/catalogos";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  afiliados: Afiliado[];
}

export default function Lugares({ afiliados }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({});

  const { data: sectores } = useQuery({
    queryKey: ["sectores"],
    queryFn: () => obtenerSectoresAction(),
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
    afiliados.forEach((af) => {
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
  }, [afiliados, sectores]);

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
      <div className="flex flex-col items-start mb-4 shrink-0">
        <h4 className="text-xl font-bold text-gray-800 uppercase">
          Ubicación de los Afiliados
        </h4>
        <p className="text-sm text-gray-500 italic">
          Lugares agrupados por sector
        </p>
      </div>

      <div className="flex-1 w-full overflow-y-auto pb-4 space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300">
        {datosPorSector.map((sectorData) => {
          const isExpanded = expandedSectors[sectorData.sectorName] ?? false;
          return (
            <div key={sectorData.sectorName} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <button
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
                          style={{ height: Math.max(sectorData.lugares.length * 55 + 30, 100) }}
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              layout="vertical"
                              data={sectorData.lugares}
                              margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
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
                                barSize={20}
                                shape={(props: any) => {
                                  const { x, y, width, height } = props;
                                  return (
                                    <Rectangle
                                      x={x}
                                      y={y - 12}
                                      width={width}
                                      height={height}
                                      fill="#6366f1"
                                      radius={[0, 8, 8, 0]}
                                    />
                                  );
                                }}
                              >
                                <LabelList
                                  dataKey="name"
                                  content={(props: any) => {
                                    const { x, y, index } = props;
                                    const item = sectorData.lugares[index];

                                    if (!item) return null;

                                    const percent = (item.value / sectorData.totalReal) * 100;

                                    return (
                                      <text
                                        x={x}
                                        y={y + 22}
                                        fill="#6b7280"
                                        fontSize={9}
                                        className="uppercase"
                                        textAnchor="start"
                                      >
                                        <>
                                          <tspan fontSize={13} fontWeight="900" fill="#6366f1">
                                            ({item.value}
                                          </tspan>
                                          <tspan fontWeight="400" fontSize={10} fill="#9ca3af">
                                            {" "}| {percent.toFixed(0)}%)
                                          </tspan>
                                        </>
                                        <tspan dx={5} fontWeight="600"> {item.name}</tspan>
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
