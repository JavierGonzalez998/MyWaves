"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  useMesesMareas,
  useMareasMesActual,
  useGuardarConsulta,
  useActualizarMareas,
} from "@/hooks/useMareas";
import { useAppStore } from "@/stores/appStore";
import { GraficoMareas } from "./GraficoMareas";
import { TablaMareas } from "./TablaMareas";
import type { DiaMareas } from "@/types/mareas";

function DiaSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
      <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
      <div className="h-48 bg-gray-100 dark:bg-gray-700/50 rounded mb-3" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-100 dark:bg-gray-700/50 rounded" />
        <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-700/50 rounded" />
      </div>
    </div>
  );
}

function TarjetaDia({
  dia,
  isSelected,
  onClick,
}: {
  dia: DiaMareas;
  isSelected: boolean;
  onClick: () => void;
}) {
  const fecha = parseISO(dia.fecha);
  const esHoy = format(new Date(), "yyyy-MM-dd") === dia.fecha;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border transition-all cursor-pointer
        ${
          isSelected
            ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
            : "border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-sm"
        }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 dark:text-white capitalize">
              {format(fecha, "EEEE", { locale: es })}
            </span>
            {esHoy && (
              <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-2 py-0.5 rounded-full">
                Hoy
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {format(fecha, "d 'de' MMMM", { locale: es })}
          </span>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 dark:text-gray-400">Mareas</div>
          <div className="font-bold text-2xl text-blue-600 dark:text-blue-400">
            {dia.mareas.length}
          </div>
        </div>
      </div>

      <div className="px-2">
        <GraficoMareas dia={dia} />
      </div>

      <div className="px-4 pb-3 pt-1 flex gap-4 text-xs">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Máx</span>
          <div className="font-semibold text-red-600 dark:text-red-400">
            {dia.altura_maxima.toFixed(2)} m
          </div>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Mín</span>
          <div className="font-semibold text-teal-600 dark:text-teal-400">
            {dia.altura_minima.toFixed(2)} m
          </div>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Rango</span>
          <div className="font-semibold text-gray-700 dark:text-gray-300">
            {(dia.altura_maxima - dia.altura_minima).toFixed(2)} m
          </div>
        </div>
      </div>

      {isSelected && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 pb-4 pt-3">
          <TablaMareas dia={dia} />
        </div>
      )}
    </div>
  );
}

export function DashboardDias() {
  const { ubicacionSeleccionada, diaSeleccionado, setDia } = useAppStore();
  const { isLoading, isError, error } = useMesesMareas();
  const respuesta = useMareasMesActual();
  const guardar = useGuardarConsulta();
  const actualizar = useActualizarMareas();

  function handleDiaClick(fecha: string) {
    setDia(diaSeleccionado === fecha ? null : fecha);
  }

  if (!ubicacionSeleccionada) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <div className="text-6xl mb-4">🌊</div>
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
          Consulta las mareas de Chile
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
          Selecciona una estación mareográfica para ver el pronóstico de mareas
          del mes actual, anterior y siguiente.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Cargando datos de mareas desde SHOA...
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <DiaSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
          Error al obtener datos
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md text-sm">
          {String(error) ||
            "No se pudo conectar con shoa.cl. Verifica tu conexión a internet."}
        </p>
      </div>
    );
  }

  if (!respuesta || respuesta.dias.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <div className="text-5xl mb-4">📭</div>
        <p className="text-gray-500 dark:text-gray-400">
          No se encontraron datos para este período.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {respuesta.ubicacion}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {respuesta.nombre_mes} · {respuesta.dias.length} días
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => actualizar.mutate()}
            disabled={actualizar.isPending}
            className="text-sm px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700
                       dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-400
                       transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {actualizar.isPending ? (
              <>
                <span className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin inline-block" />{" "}
                Actualizando...
              </>
            ) : (
              "↻ Actualizar"
            )}
          </button>
          <button
            onClick={() => guardar.mutate(respuesta)}
            disabled={guardar.isPending}
            className="text-sm px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700
                       dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400
                       transition-colors disabled:opacity-50"
          >
            {guardar.isPending ? "Guardando..." : "💾 Guardar"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {respuesta.dias.map((dia) => (
          <TarjetaDia
            key={dia.fecha}
            dia={dia}
            isSelected={diaSeleccionado === dia.fecha}
            onClick={() => handleDiaClick(dia.fecha)}
          />
        ))}
      </div>
    </div>
  );
}
