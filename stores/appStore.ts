"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  ubicacionSeleccionada: string | null;
  nombreUbicacion: string;
  /** Índice del mes seleccionado dentro de los 3 disponibles: 0=anterior, 1=actual, 2=siguiente */
  indiceMes: number;
  diaSeleccionado: string | null; // "YYYY-MM-DD"
  tema: "light" | "dark";

  setUbicacion: (codigo: string, nombre: string) => void;
  setIndiceMes: (indice: number) => void;
  setDia: (dia: string | null) => void;
  toggleTema: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ubicacionSeleccionada: null,
      nombreUbicacion: "",
      indiceMes: 1,
      diaSeleccionado: null,
      tema: "light",

      setUbicacion: (codigo, nombre) =>
        set({
          ubicacionSeleccionada: codigo,
          nombreUbicacion: nombre,
          indiceMes: 1,
          diaSeleccionado: null,
        }),

      setIndiceMes: (indice) => set({ indiceMes: indice, diaSeleccionado: null }),

      setDia: (dia) => set({ diaSeleccionado: dia }),

      toggleTema: () =>
        set((state) => ({ tema: state.tema === "light" ? "dark" : "light" })),
    }),
    {
      name: "mareas-app-storage",
    }
  )
);
