"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Check, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import useUserData from "@/hooks/sesion/useUserData";
import { obtenerConfiguracionAction, actualizarConfiguracionAction } from "./actions/configuracion";

interface Props {
  showMetas?: boolean;
  allowEditing?: boolean;
  onClose?: () => void;
}

export default function ConfiguracionSistema({ 
  showMetas = true, 
  allowEditing = true,
  onClose
}: Props) {
  const { rol, cargando: cargandoRol } = useUserData();
  const queryClient = useQueryClient();
  const [guardando, setGuardando] = useState(false);
  
  const canEdit = (rol === "SUPER" || rol === "ADMINISTRADOR" || rol === "ADMIN") && allowEditing;

  const { data: config, isLoading } = useQuery({
    queryKey: ["config_sistema"],
    queryFn: () => obtenerConfiguracionAction(),
  });

  const [nombreCandidato, setNombreCandidato] = useState("");
  const [lugar, setLugar] = useState("");
  const [frase, setFrase] = useState("");
  const [objetivoTotal, setObjetivoTotal] = useState(0);
  const [metaPorLider, setMetaPorLider] = useState(0);

  const [initialized, setInitialized] = useState(false);

  // Sincronizar estados locales una sola vez al cargar o cuando cambie la config
  if (config && !initialized) {
    setNombreCandidato(config.nombre_candidato || "");
    setLugar(config.lugar || "");
    setFrase(config.frase || "");
    setObjetivoTotal(config.objetivo_total || 0);
    setMetaPorLider(config.meta_por_lider || 0);
    setInitialized(true);
  }

  const handleSaveTodo = async () => {
    try {
      setGuardando(true);
      if (!nombreCandidato || !lugar) {
        toast.warning("El nombre y lugar son obligatorios");
        return;
      }
      await actualizarConfiguracionAction(
        nombreCandidato, 
        lugar, 
        frase, 
        objetivoTotal, 
        metaPorLider
      );
      queryClient.invalidateQueries({ queryKey: ["config_sistema"] });
      toast.success("Configuración actualizada correctamente");
      if (onClose) onClose();
    } catch (error: any) {
      toast.error("Error al guardar: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

  if (isLoading || cargandoRol) return <div className="h-16 w-full bg-blue-50/50 animate-pulse rounded-xl mb-2" />;
  
  if (!config && !canEdit) return null;

  const currentConfig = config || { nombre_candidato: "", lugar: "", frase: "" };
  const isNew = !config;

  return (
    <div className="w-full mx-auto max-w-2xl">
      {canEdit ? (
        <div className="space-y-6">
          {/* SECCIÓN 1: INFORMACIÓN DEL CANDIDATO */}
          <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
              Información del Candidato
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-700 uppercase ml-1">Nombre Completo / Título</label>
                <Input
                  value={nombreCandidato}
                  onChange={(e) => setNombreCandidato(e.target.value)}
                  className="h-12 text-lg font-black text-blue-900 border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all bg-gray-50/30"
                  placeholder="Escribe aqui el nombre del candidato"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700 uppercase ml-1">Frase o Lema</label>
                  <Input
                    value={frase}
                    onChange={(e) => setFrase(e.target.value)}
                    className="h-12 text-base italic text-gray-700 border-gray-300 focus:border-blue-600 bg-gray-50/30"
                    placeholder="Escribe aqui tu frase o lema"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700 uppercase ml-1">Municipio / Ubicación</label>
                  <Input
                    value={lugar}
                    onChange={(e) => setLugar(e.target.value)}
                    className="h-12 text-base font-bold uppercase border-gray-300 focus:border-blue-600 bg-gray-50/30"
                    placeholder="Escribe aqui el lugar"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: METAS Y OBJETIVOS */}
          {showMetas && (
            <div className="bg-blue-50/50 p-6 rounded-2xl border-2 border-blue-200 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                Configuración de Metas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-blue-800 uppercase ml-1">Objetivo Total</label>
                  <Input
                    type="number"
                    value={objetivoTotal}
                    onChange={(e) => setObjetivoTotal(Number(e.target.value))}
                    className="h-12 text-2xl font-black text-blue-900 border-blue-300 focus:border-blue-600 bg-white text-center"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-blue-800 uppercase ml-1">Meta por Líder</label>
                  <Input
                    type="number"
                    value={metaPorLider}
                    onChange={(e) => setMetaPorLider(Number(e.target.value))}
                    className="h-12 text-2xl font-black text-blue-900 border-blue-300 focus:border-blue-600 bg-white text-center"
                  />
                </div>
              </div>

              {objetivoTotal > 0 && metaPorLider > 0 && (
                <div className="mt-4 p-5 bg-blue-600 rounded-2xl shadow-lg flex items-center justify-between text-white">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase opacity-80">Requerimiento de Células</span>
                    <span className="text-base font-bold">Líderes necesarios para la meta</span>
                  </div>
                  <div className="text-4xl font-black">
                    {Math.ceil(objetivoTotal / metaPorLider)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${showMetas ? "md:grid-cols-2 gap-8" : ""} items-stretch`}>
          <div className={`relative flex flex-col justify-center items-center select-none text-center h-full  pt-4 sm:pt-0 pb-2 sm:pb-4  transition-all duration-300 rounded-xl ${!showMetas ? "max-w-4xl mx-auto" : ""}`}>
            <AnimatePresence mode="wait">
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

                <div className="flex flex-col items-center mt-4 w-full">
                  <span className="text-sm md:text-base font-bold text-blue-300 uppercase tracking-widest flex items-center gap-2">
                    <span className="h-[1px] w-6 bg-blue-200"></span>
                    {currentConfig.lugar || "Sin lugar"}
                    <span className="h-[1px] w-6 bg-blue-200"></span>
                  </span>
                  
                  {(rol === "SUPER" || rol === "ADMINISTRADOR" || rol === "ADMIN") && currentConfig.objetivo_total > 0 && currentConfig.meta_por_lider > 0 && (
                    <div className="mt-2 bg-blue-50/50 px-4 py-1.5 rounded-full border border-blue-100/50">
                      <p className="text-xs md:text-lg font-black text-blue-900/60 uppercase tracking-tight">
                        Se requieren <span className="text-blue-600 text-sm md:text-2xl">{Math.ceil(currentConfig.objetivo_total / currentConfig.meta_por_lider)} líderes</span> para la meta
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {showMetas && (
            <div className="relative flex flex-col justify-center items-center select-none text-center h-full min-h-[140px] p-4 transition-all duration-300 rounded-xl cursor-default">
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
            </div>
          )}
        </div>
      )}

      {canEdit && (
        <div className="mt-8 flex gap-3">
          {onClose && (
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex-1 py-4 border-gray-300 text-gray-700 font-bold uppercase tracking-widest hover:bg-gray-100 transition-all rounded-lg"
            >
              Cerrar
            </Button>
          )}
          <Button 
            onClick={handleSaveTodo}
            disabled={guardando}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg shadow-md transition-all font-black uppercase tracking-widest"
          >
            {guardando ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      )}
    </div>
  );
}
