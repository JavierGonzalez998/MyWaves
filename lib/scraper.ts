import { parsearUbicaciones, parsearTresMeses } from "./parser";
import type { Ubicacion, RespuestaMareas } from "@/types/mareas";

const SHOA_URL = "https://www.shoa.cl/php/mareas.php";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-CL,es;q=0.9",
  Referer: SHOA_URL,
  Origin: "https://www.shoa.cl",
};

export async function obtenerUbicaciones(): Promise<Ubicacion[]> {
  const response = await fetch(SHOA_URL, { headers: HEADERS, cache: "no-store" });
  if (!response.ok) throw new Error(`SHOA HTTP ${response.status}`);
  return parsearUbicaciones(await response.text());
}

export async function scrapeMareas(codigo: string): Promise<RespuestaMareas[]> {
  const body = new URLSearchParams({ local: codigo, idioma: "es" });

  const response = await fetch(SHOA_URL, {
    method: "POST",
    headers: {
      ...HEADERS,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`SHOA HTTP ${response.status}`);

  const ahora = Math.floor(Date.now() / 1000);
  const meses = parsearTresMeses(await response.text(), codigo);

  return meses.map((m) => ({ ...m, fecha_consulta: ahora }));
}
