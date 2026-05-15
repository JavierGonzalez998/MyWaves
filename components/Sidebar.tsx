"use client";

import { useState } from "react";
import { useHistorial, useFavoritos, useLimpiarCache } from "@/hooks/useMareas";
import { useAppStore } from "@/stores/appStore";
import type { HistorialConsulta } from "@/types/mareas";

type Panel = "historial" | "favoritos";

interface SidebarItemProps {
  icon: string;
  label: string;
  isActive?: boolean;
  badge?: number;
  onClick?: () => void;
}

function SidebarItem({ icon, label, isActive, badge, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg transition-colors text-sm
        ${
          isActive
            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
    >
      <span className="text-lg flex-shrink-0 w-8 text-center relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[9px] rounded-full flex items-center justify-center">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium">
        {label}
      </span>
    </button>
  );
}

export function Sidebar() {
  const [panelActivo, setPanelActivo] = useState<Panel | null>(null);
  const { tema, toggleTema, ubicacionSeleccionada, nombreUbicacion, setUbicacion } =
    useAppStore();
  const { data: historial } = useHistorial(10);
  const { query: favoritos, agregar, eliminar } = useFavoritos();
  const limpiarCache = useLimpiarCache();

  const esFavorito =
    favoritos.data?.some((f) => f.codigo === ubicacionSeleccionada) ?? false;

  function handleHistorialClick(item: HistorialConsulta) {
    setUbicacion(item.codigo_ubicacion, item.ubicacion);
    setPanelActivo(null);
  }

  return (
    <aside className="w-14 hover:w-64 transition-all duration-300 overflow-hidden bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col group">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">🌊</span>
        <span className="text-sm font-bold text-gray-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Mareas SHOA
        </span>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        <SidebarItem
          icon="⭐"
          label="Favoritos"
          isActive={panelActivo === "favoritos"}
          badge={favoritos.data?.length}
          onClick={() =>
            setPanelActivo((p) => (p === "favoritos" ? null : "favoritos"))
          }
        />

        <SidebarItem
          icon="🕒"
          label="Historial"
          isActive={panelActivo === "historial"}
          badge={historial?.length}
          onClick={() =>
            setPanelActivo((p) => (p === "historial" ? null : "historial"))
          }
        />

        {panelActivo && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity mx-2 mt-1 mb-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-xs">
            {panelActivo === "favoritos" && (
              <div>
                <div className="font-semibold text-gray-600 dark:text-gray-400 mb-2 px-1">
                  Favoritos
                </div>
                {favoritos.data?.length === 0 && (
                  <p className="text-gray-400 dark:text-gray-500 px-1">
                    Sin favoritos aún
                  </p>
                )}
                {favoritos.data?.map((f) => (
                  <button
                    key={f.codigo}
                    onClick={() => {
                      setUbicacion(f.codigo, f.nombre);
                      setPanelActivo(null);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 truncate"
                  >
                    {f.nombre}
                  </button>
                ))}
              </div>
            )}

            {panelActivo === "historial" && (
              <div>
                <div className="font-semibold text-gray-600 dark:text-gray-400 mb-2 px-1">
                  Recientes
                </div>
                {(!historial || historial.length === 0) && (
                  <p className="text-gray-400 dark:text-gray-500 px-1">
                    Sin consultas guardadas
                  </p>
                )}
                {historial?.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => handleHistorialClick(h)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="text-gray-700 dark:text-gray-300 truncate">
                      {h.ubicacion}
                    </div>
                    <div className="text-gray-400 dark:text-gray-500">
                      {h.mes}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {ubicacionSeleccionada && (
          <SidebarItem
            icon={esFavorito ? "💛" : "🤍"}
            label={esFavorito ? "Quitar favorito" : "Añadir favorito"}
            onClick={() => {
              if (esFavorito) {
                eliminar.mutate(ubicacionSeleccionada);
              } else {
                agregar.mutate({
                  codigo: ubicacionSeleccionada,
                  nombre: nombreUbicacion,
                });
              }
            }}
          />
        )}
      </nav>

      <div className="border-t border-gray-200 dark:border-gray-700 py-2">
        <SidebarItem
          icon={tema === "dark" ? "☀️" : "🌙"}
          label={tema === "dark" ? "Modo claro" : "Modo oscuro"}
          onClick={toggleTema}
        />
        <SidebarItem
          icon="🗑"
          label="Limpiar caché"
          onClick={() => limpiarCache.mutate()}
        />
      </div>
    </aside>
  );
}
