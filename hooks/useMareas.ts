"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { useAppStore } from "@/stores/appStore";
import { toast } from "sonner";
import type { RespuestaMareas } from "@/types/mareas";

export function useUbicaciones() {
  return useQuery({
    queryKey: ["ubicaciones"],
    queryFn: apiService.obtenerUbicaciones,
    staleTime: 1000 * 60 * 60 * 24,
    retry: 2,
  });
}

export function useMesesMareas() {
  const { ubicacionSeleccionada } = useAppStore();

  return useQuery({
    queryKey: ["mareas", ubicacionSeleccionada],
    queryFn: () => apiService.obtenerMareas(ubicacionSeleccionada!),
    enabled: !!ubicacionSeleccionada,
    staleTime: Infinity,
    retry: 2,
  });
}

export function useMareasMesActual(): RespuestaMareas | undefined {
  const { indiceMes } = useAppStore();
  const { data: meses } = useMesesMareas();
  if (!meses || meses.length === 0) return undefined;
  return meses[Math.min(indiceMes, meses.length - 1)];
}

export function useActualizarMareas() {
  const queryClient = useQueryClient();
  const { ubicacionSeleccionada } = useAppStore();

  return useMutation({
    mutationFn: () => apiService.actualizarMareas(ubicacionSeleccionada!),
    onSuccess: (nuevosDatos) => {
      queryClient.setQueryData(
        ["mareas", ubicacionSeleccionada],
        nuevosDatos
      );
      toast.success("Datos actualizados desde SHOA");
    },
    onError: (err) => toast.error(`Error al actualizar: ${err}`),
  });
}

export function useGuardarConsulta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiService.guardarConsulta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historial"] });
      toast.success("Consulta guardada");
    },
    onError: (err) => toast.error(`Error al guardar: ${err}`),
  });
}

export function useLimpiarCache() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiService.limpiarCache,
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Caché limpiado — próxima consulta hará scraping");
    },
    onError: (err) => toast.error(`Error: ${err}`),
  });
}

export function useHistorial(limit?: number) {
  return useQuery({
    queryKey: ["historial", limit],
    queryFn: () => apiService.obtenerHistorial(limit),
    staleTime: 1000 * 60 * 5,
  });
}

export function useFavoritos() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["favoritos"],
    queryFn: apiService.obtenerFavoritos,
    staleTime: 1000 * 60 * 60,
  });

  const agregar = useMutation({
    mutationFn: ({ codigo, nombre }: { codigo: string; nombre: string }) =>
      apiService.agregarFavorito(codigo, nombre),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favoritos"] });
      toast.success("Añadido a favoritos");
    },
  });

  const eliminar = useMutation({
    mutationFn: (codigo: string) => apiService.eliminarFavorito(codigo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favoritos"] });
      toast.info("Eliminado de favoritos");
    },
  });

  return { query, agregar, eliminar };
}
