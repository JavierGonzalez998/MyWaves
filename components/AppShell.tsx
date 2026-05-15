"use client";

import { Providers } from "./Providers";
import { Sidebar } from "./Sidebar";
import { LocationSelector } from "./LocationSelector";
import { DashboardDias } from "./DashboardDias";
import { useAppStore } from "@/stores/appStore";

function AppContent() {
  const { tema } = useAppStore();

  return (
    <div className={tema === "dark" ? "dark" : ""}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex-shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Mareas SHOA Chile
                </h1>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                  Armada de Chile
                </span>
              </div>
              <LocationSelector />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <DashboardDias />
          </main>

          <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-2 flex-shrink-0">
            <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
              Datos del Servicio Hidrográfico y Oceanográfico de la Armada de
              Chile (SHOA)
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export function AppShell() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  );
}
