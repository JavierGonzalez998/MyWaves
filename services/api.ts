import type {
  Ubicacion,
  RespuestaMareas,
  HistorialConsulta,
} from "@/types/mareas";

async function apiFetch<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const msg = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const apiService = {
  obtenerUbicaciones(): Promise<Ubicacion[]> {
    return apiFetch("/api/ubicaciones");
  },

  /** BD primero; scraping solo si no hay datos */
  obtenerMareas(codigoUbicacion: string): Promise<RespuestaMareas[]> {
    return apiFetch(`/api/mareas/${encodeURIComponent(codigoUbicacion)}`);
  },

  /** Fuerza scraping desde SHOA y actualiza la BD */
  actualizarMareas(codigoUbicacion: string): Promise<RespuestaMareas[]> {
    return apiFetch(
      `/api/mareas/${encodeURIComponent(codigoUbicacion)}/actualizar`,
      { method: "POST" }
    );
  },

  limpiarCacheEstacion(codigoUbicacion: string): Promise<void> {
    return apiFetch(
      `/api/mareas/${encodeURIComponent(codigoUbicacion)}/cache`,
      { method: "DELETE" }
    );
  },

  limpiarCache(): Promise<void> {
    return apiFetch("/api/cache", { method: "DELETE" });
  },

  async guardarConsulta(datos: RespuestaMareas): Promise<number> {
    const data = await apiFetch<{ id: number }>("/api/historial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    return data.id;
  },

  obtenerHistorial(limit?: number): Promise<HistorialConsulta[]> {
    const url = limit ? `/api/historial?limit=${limit}` : "/api/historial";
    return apiFetch(url);
  },

  obtenerConsultaGuardada(id: number): Promise<RespuestaMareas | null> {
    return apiFetch(`/api/historial/${id}`);
  },

  agregarFavorito(codigo: string, nombre: string): Promise<void> {
    return apiFetch("/api/favoritos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo, nombre }),
    });
  },

  eliminarFavorito(codigo: string): Promise<void> {
    return apiFetch(`/api/favoritos/${encodeURIComponent(codigo)}`, {
      method: "DELETE",
    });
  },

  obtenerFavoritos(): Promise<Ubicacion[]> {
    return apiFetch("/api/favoritos");
  },
};
