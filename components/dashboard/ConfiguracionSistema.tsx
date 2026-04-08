"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import useUserData from "@/hooks/sesion/useUserData";
import { obtenerConfiguracionAction, actualizarConfiguracionAction } from "./actions/configuracion";

export default function ConfiguracionSistema() {
  const { rol, cargando: cargandoRol } = useUserData();
  const queryClient = useQueryClient();
  const [isEditingLider, setIsEditingLider] = useState(false);
  const [isEditingMetas, setIsEditingMetas] = useState(false);
  
  const canEdit = rol === "SUPER" || rol === "ADMIN";

  const { data: config, isLoading } = useQuery({
    queryKey: ["config_sistema"],
    queryFn: () => obtenerConfiguracionAction(),
  });

  const [nombreCandidato, setNombreCandidato] = useState("");
  const [lugar, setLugar] = useState("");
  const [frase, setFrase] = useState("");
  const [objetivoTotal, setObjetivoTotal] = useState(0);
  const [metaPorLider, setMetaPorLider] = useState(0);

  const handleEditLider = () => {
    if (config) {
      setNombreCandidato(config.nombre_candidato);
      setLugar(config.lugar);
      setFrase(config.frase || "");
    }
    setIsEditingLider(true);
  };

  const handleEditMetas = () => {
    if (config) {
      setObjetivoTotal(config.objetivo_total || 0);
      setMetaPorLider(config.meta_por_lider || 0);
    }
    setIsEditingMetas(true);
  };

  const handleSaveLider = async () => {
    try {
      if (!nombreCandidato || !lugar) {
        toast.warning("Complete los campos obligatorios");
        return;
      }
      await actualizarConfiguracionAction(
        nombreCandidato, 
        lugar, 
        frase, 
        config?.objetivo_total || 0, 
        config?.meta_por_lider || 0
      );
      queryClient.invalidateQueries({ queryKey: ["config_sistema"] });
      setIsEditingLider(false);
      toast.success("Líder actualizado");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  const handleSaveMetas = async () => {
    try {
      if (!objetivoTotal || !metaPorLider) {
        toast.warning("Complete los valores de metas");
        return;
      }
      await actualizarConfiguracionAction(
        config?.nombre_candidato || "Sin nombre", 
        config?.lugar || "Sin lugar", 
        config?.frase || "", 
        objetivoTotal, 
        metaPorLider
      );
      queryClient.invalidateQueries({ queryKey: ["config_sistema"] });
      setIsEditingMetas(false);
      toast.success("Metas actualizadas");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  if (isLoading || cargandoRol) return <div className="h-16 w-full bg-blue-50/50 animate-pulse rounded-xl mb-2" />;
  
  if (!config && !canEdit) return null;

  const currentConfig = config || { nombre_candidato: "", lugar: "", frase: "" };
  const isNew = !config;

  return (
    <div className=" w-full max-w-7xl mx-auto transition-all duration-300">
      <div className={`grid grid-cols-1 ${canEdit ? "md:grid-cols-2" : ""} gap-6 items-stretch`}>
        
        <div 
          onClick={() => !isEditingLider && canEdit && handleEditLider()}
          className={`relative flex flex-col justify-center items-center select-none text-center h-full min-h-[140px] ${!canEdit ? "max-w-3xl mx-auto w-full" : "cursor-pointer hover:bg-gray-50/50 transition-all duration-300 rounded-xl p-4 active:scale-[0.98]"}`}
        >
          <AnimatePresence mode="wait">
            {isEditingLider || (isNew && canEdit) ? (
              <motion.div 
                key="edit-lider"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center gap-3 w-full max-w-sm" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-full space-y-2">
                  <Input
                    defaultValue={currentConfig.nombre_candidato}
                    onChange={(e) => setNombreCandidato(e.target.value)}
                    className="h-10 text-center font-bold text-blue-900 border-blue-100 focus:border-blue-300 transition-colors"
                    placeholder="NOMBRE DEL CANDIDATO"
                  />
                  <Input
                    defaultValue={currentConfig.frase}
                    onChange={(e) => setFrase(e.target.value)}
                    className="h-9 text-center text-sm italic text-gray-500 border-blue-50/50"
                    placeholder="Frase o lema"
                  />
                  <Input
                    defaultValue={currentConfig.lugar}
                    onChange={(e) => setLugar(e.target.value)}
                    className="h-9 text-center text-sm font-semibold uppercase tracking-widest border-blue-50/50"
                    placeholder="Lugar"
                  />
                </div>
                <div className="flex gap-2 justify-center mt-1">
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingLider(false)} className="h-8 px-3 text-gray-400 hover:text-red-500 hover:bg-red-50">
                    <X size={16} className="mr-1" /> Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSaveLider} className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                    <Check size={16} className="mr-1" /> Guardar
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="view-lider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col relative w-full items-center"
              >
                <h1 className="text-2xl md:text-4xl font-bold text-center leading-tight bg-gradient-to-r from-blue-800 via-blue-400 to-blue-800 bg-[length:200%_auto] text-transparent bg-clip-text animate-text-shine">
                  {currentConfig.nombre_candidato || "Sin nombre asignado"}
                </h1>
                
                {currentConfig.frase && (
                  <p className="mt-2 text-base md:text-lg text-blue-500 font-medium italic opacity-80 text-center">
                    "{currentConfig.frase}"
                  </p>
                )}

                <div className="flex justify-center mt-3 w-full">
                  <span className="text-sm font-bold text-blue-300 uppercase tracking-widest flex items-center gap-2">
                    <span className="h-[1px] w-6 bg-blue-200"></span>
                    {currentConfig.lugar || "Sin lugar"}
                    <span className="h-[1px] w-6 bg-blue-200"></span>
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* COLUMNA DERECHA: METAS (SOLO ADMIN/SUPER) */}
        {canEdit && (
          <div 
            onClick={() => !isEditingMetas && handleEditMetas()}
            className="relative flex flex-col justify-center items-center select-none text-center h-full min-h-[140px] cursor-pointer hover:bg-gray-50/50 transition-all duration-300 rounded-xl p-4 active:scale-[0.98]"
          >
            <AnimatePresence mode="wait">
              {isEditingMetas ? (
                <motion.div 
                  key="edit-metas"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center gap-4 w-full max-w-sm" 
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-row items-end gap-6 w-full">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Objetivo Total</label>
                      <Input
                        type="number"
                        defaultValue={currentConfig.objetivo_total || 0}
                        onChange={(e) => setObjetivoTotal(Number(e.target.value))}
                        className="h-9 font-bold text-blue-900 text-center border-blue-50/50"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Meta por Líder</label>
                      <Input
                        type="number"
                        defaultValue={currentConfig.meta_por_lider || 0}
                        onChange={(e) => setMetaPorLider(Number(e.target.value))}
                        className="h-9 font-bold text-blue-900 text-center border-blue-50/50"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" variant="ghost" onClick={() => setIsEditingMetas(false)} className="h-8 px-3 text-gray-400 hover:text-red-500 hover:bg-red-50">
                      <X size={16} className="mr-1" /> Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSaveMetas} className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                      <Check size={16} className="mr-1" /> Guardar
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center">
                  <motion.div 
                    key="view-metas"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-row relative w-full items-center justify-center gap-12"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-gray-500 uppercase mb-1">Objetivo Total</span>
                      <span className="text-xl md:text-2xl font-black text-blue-700">
                        {currentConfig.objetivo_total ? currentConfig.objetivo_total.toLocaleString() : "0"}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-gray-500 uppercase mb-1">Meta por Líder</span>
                      <span className="text-xl md:text-2xl font-black text-blue-500">
                        {currentConfig.meta_por_lider ? currentConfig.meta_por_lider.toLocaleString() : "0"}
                      </span>
                    </div>
                  </motion.div>
                  {currentConfig.objetivo_total > 0 && currentConfig.meta_por_lider > 0 && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 text-xs font-bold text-blue-900 uppercase tracking-widest"
                    >
                      {Math.ceil(currentConfig.objetivo_total / currentConfig.meta_por_lider)} <span className="text-gray-500">líderes nesesarios</span>
                    </motion.p>
                  )}
                </div>
              )}
            </AnimatePresence>
        </div>
        )}

      </div>
    </div>
  );
}
