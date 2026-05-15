"use client";

import { useState, useMemo } from "react";
import { useUbicaciones, useMesesMareas } from "@/hooks/useMareas";
import { useAppStore } from "@/stores/appStore";

export function LocationSelector() {
  const { data: ubicaciones, isLoading, isError } = useUbicaciones();
  const { data: meses } = useMesesMareas();
  const { ubicacionSeleccionada, indiceMes, setUbicacion, setIndiceMes } =
    useAppStore();
  const [busqueda, setBusqueda] = useState("");

  const ubicacionesFiltradas = useMemo(() => {
    if (!ubicaciones) return [];
    if (!busqueda.trim()) return ubicaciones;
    const q = busqueda.toLowerCase();
    return ubicaciones.filter((u) => u.nombre.toLowerCase().includes(q));
  }, [ubicaciones, busqueda]);

  function handleUbicacionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const codigo = e.target.value;
    const ub = ubicaciones?.find((u) => u.codigo === codigo);
    if (ub) setUbicacion(ub.codigo, ub.nombre);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Estación
        </label>
        <div className="relative flex gap-2">
          {isLoading && (
            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <select
            value={ubicacionSeleccionada ?? ""}
            onChange={handleUbicacionChange}
            disabled={isLoading}
            className="min-w-[220px] px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       disabled:opacity-50 text-sm"
          >
            <option value="">
              {isError
                ? "⚠ Error cargando"
                : isLoading
                  ? "Cargando..."
                  : "Seleccionar estación..."}
            </option>
            {ubicacionesFiltradas.map((u) => (
              <option key={u.codigo} value={u.codigo}>
                {u.nombre}
              </option>
            ))}
          </select>

          {ubicaciones && ubicaciones.length > 10 && (
            <input
              type="text"
              placeholder="Filtrar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-28 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          )}
        </div>
      </div>

      {meses && meses.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Período
          </label>
          <div className="flex gap-1">
            {meses.map((m, i) => (
              <button
                key={m.mes_consultado}
                onClick={() => setIndiceMes(i)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    indiceMes === i
                      ? "bg-blue-600 text-white shadow"
                      : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  }`}
              >
                {m.nombre_mes}
                {m.es_activo && indiceMes !== i && (
                  <span className="ml-1 text-xs text-blue-400">●</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
