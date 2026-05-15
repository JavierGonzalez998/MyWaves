import * as cheerio from "cheerio";
import type {
  Ubicacion,
  RespuestaMareas,
  DiaMareas,
  Marea,
} from "@/types/mareas";

function htmlEntities(s: string): string {
  return s
    .replace(/&Iacute;/g, "Í")
    .replace(/&iacute;/g, "í")
    .replace(/&Aacute;/g, "Á")
    .replace(/&aacute;/g, "á")
    .replace(/&Eacute;/g, "É")
    .replace(/&eacute;/g, "é")
    .replace(/&Oacute;/g, "Ó")
    .replace(/&oacute;/g, "ó")
    .replace(/&Uacute;/g, "Ú")
    .replace(/&uacute;/g, "ú")
    .replace(/&Ntilde;/g, "Ñ")
    .replace(/&ntilde;/g, "ñ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseFechaDDMMYYYY(s: string): string | null {
  const trimmed = s.trim();
  const sep = trimmed.includes("/") ? "/" : trimmed.includes("-") ? "-" : null;
  if (!sep) return null;

  const parts = trimmed.split(sep);
  if (parts.length !== 3) return null;

  let day: string, month: string, year: string;
  if (parts[2].length === 4) {
    [day, month, year] = parts;
  } else if (parts[0].length === 4) {
    [year, month, day] = parts;
  } else {
    return null;
  }

  const d = parseInt(day.trim(), 10);
  const m = parseInt(month.trim(), 10);
  const y = parseInt(year.trim(), 10);

  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 2000) return null;

  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parsearAlturaConTipo(s: string): [number, string] | null {
  const partes = s.trim().split(/\s+/);
  if (partes.length === 0) return null;

  const altura = parseFloat(partes[0].replace(",", "."));
  if (isNaN(altura)) return null;

  const tipoChar = partes[1]?.toUpperCase();
  const tipo =
    tipoChar === "P"
      ? "PLEAMAR"
      : tipoChar === "B"
        ? "BAJAMAR"
        : (tipoChar ?? "DESCONOCIDO");

  return [altura, tipo];
}

function normalizarHora(horaStr: string): string | null {
  const s = horaStr.trim().replace(".", ":");
  const parts = s.split(":");
  if (parts.length < 2) return null;

  const h = parseInt(parts[0].trim(), 10);
  const m = parseInt(parts[1].trim(), 10);

  if (isNaN(h) || isNaN(m) || h > 23 || m > 59) return null;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const DIAS_SEMANA = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function obtenerDiaSemana(fechaIso: string): string {
  const d = new Date(fechaIso + "T12:00:00Z");
  return DIAS_SEMANA[d.getUTCDay()] ?? "";
}

function parsearTablaHorizontal(
  $: cheerio.CheerioAPI,
  // cheerio.AnyNode no existe en todas las versiones; usamos el tipo genérico de elemento
  table: Parameters<ReturnType<typeof cheerio.load>>[0]
): DiaMareas[] {
  const dias: DiaMareas[] = [];

  $(table)
    .find("tr")
    .each((_, row) => {
      const cells: string[] = [];
      $(row)
        .find("td")
        .each((_, td) => {
          cells.push($(td).text().trim());
        });

      if (cells.length < 3) return;

      const fecha = parseFechaDDMMYYYY(cells[0]);
      if (!fecha) return;

      const mareas: Marea[] = [];
      let i = 1;
      while (i + 1 < cells.length) {
        const horaStr = cells[i].trim();
        const alturaStr = cells[i + 1].trim();

        if (horaStr && alturaStr) {
          const hora = normalizarHora(horaStr);
          const alturaConTipo = parsearAlturaConTipo(alturaStr);

          if (hora && alturaConTipo) {
            const [altura, tipo] = alturaConTipo;
            mareas.push({ tipo, hora, altura_metros: altura });
          }
        }
        i += 2;
      }

      if (mareas.length === 0) return;

      mareas.sort((a, b) => a.hora.localeCompare(b.hora));

      const altura_maxima = Math.max(...mareas.map((m) => m.altura_metros));
      const altura_minima = Math.min(...mareas.map((m) => m.altura_metros));

      dias.push({
        fecha,
        dia_semana: obtenerDiaSemana(fecha),
        mareas,
        altura_maxima,
        altura_minima,
      });
    });

  return dias.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export function parsearUbicaciones(html: string): Ubicacion[] {
  const $ = cheerio.load(html);
  const ubicaciones: Ubicacion[] = [];

  const selectors = [
    "select#local",
    'select[name="local"]',
    'select[name="estacion"]',
    'select[name="ubicacion"]',
  ];

  for (const sel of selectors) {
    const selectEl = $(sel).first();
    if (selectEl.length === 0) continue;

    selectEl.find("option").each((_, el) => {
      const value = $(el).attr("value")?.trim() ?? "";
      const nombre = htmlEntities($(el).text().trim());
      if (value && nombre) {
        ubicaciones.push({ codigo: value, nombre });
      }
    });

    if (ubicaciones.length > 0) return ubicaciones;
  }

  return ubicaciones;
}

export function parsearTresMeses(
  html: string,
  codigoUbicacion: string
): RespuestaMareas[] {
  const $ = cheerio.load(html);
  const meses: RespuestaMareas[] = [];

  let nombreEstacion = htmlEntities(
    $("select#local option[selected]").first().text().trim()
  );
  if (!nombreEstacion) {
    nombreEstacion =
      $("h2").first().text().trim() || codigoUbicacion;
  }

  const etiquetas: string[] = [];
  $("ul.tab-links li a").each((_, el) => {
    const texto = $(el).text().replace(/\s+/g, " ").trim();
    if (texto) etiquetas.push(texto);
  });

  const tabsConfig = [
    { id: "tab11", esActivo: false },
    { id: "tab22", esActivo: true },
    { id: "tab33", esActivo: false },
  ];

  tabsConfig.forEach(({ id, esActivo }, idx) => {
    const div = $(`div#${id}`).first();
    if (div.length === 0) return;

    const tableEl = div.find("table.table-mareas").first();
    if (tableEl.length === 0) return;

    const dias = parsearTablaHorizontal($, tableEl.get(0)!);
    if (dias.length === 0) return;

    const mesAnio = dias[0].fecha.substring(0, 7);
    const nombreMes = etiquetas[idx] ?? mesAnio;

    meses.push({
      ubicacion: nombreEstacion,
      codigo_ubicacion: codigoUbicacion,
      mes_consultado: mesAnio,
      nombre_mes: nombreMes,
      es_activo: esActivo,
      dias,
      fecha_consulta: 0,
    });
  });

  return meses;
}
