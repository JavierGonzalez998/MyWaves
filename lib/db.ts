import { createClient, type Client } from "@libsql/client";
import type {
  RespuestaMareas,
  HistorialConsulta,
  Ubicacion,
  DiaMareas,
} from "@/types/mareas";

const globalForDb = global as typeof globalThis & {
  _mareas_client?: Client;
  _mareas_init?: Promise<void>;
};

function buildClient(): Client {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

async function initSchema(client: Client): Promise<void> {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS mareas_cache (
      codigo_ubicacion TEXT NOT NULL,
      mes              TEXT NOT NULL,
      nombre_mes       TEXT NOT NULL,
      es_activo        INTEGER NOT NULL DEFAULT 0,
      ubicacion        TEXT NOT NULL,
      datos_json       TEXT NOT NULL,
      scraped_at       INTEGER NOT NULL,
      PRIMARY KEY (codigo_ubicacion, mes)
    );

    CREATE TABLE IF NOT EXISTS consultas (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      ubicacion        TEXT NOT NULL,
      codigo_ubicacion TEXT NOT NULL,
      mes              TEXT NOT NULL,
      datos_json       TEXT NOT NULL,
      fecha_consulta   INTEGER NOT NULL,
      created_at       INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_consultas_ubicacion ON consultas(codigo_ubicacion);
    CREATE INDEX IF NOT EXISTS idx_consultas_mes       ON consultas(mes);

    CREATE TABLE IF NOT EXISTS favoritos (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo_ubicacion TEXT NOT NULL UNIQUE,
      nombre_ubicacion TEXT NOT NULL,
      created_at       INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);
}

async function getDb(): Promise<Client> {
  if (!globalForDb._mareas_client) {
    globalForDb._mareas_client = buildClient();
    globalForDb._mareas_init = initSchema(globalForDb._mareas_client);
  }
  await globalForDb._mareas_init;
  return globalForDb._mareas_client;
}

// ─── mareas_cache ──────────────────────────────────────────────────────────

export async function obtenerCache(codigo: string): Promise<RespuestaMareas[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT codigo_ubicacion, mes, nombre_mes, es_activo, ubicacion, datos_json
          FROM mareas_cache
          WHERE codigo_ubicacion = ?
          ORDER BY mes ASC`,
    args: [codigo],
  });

  return result.rows.map((row) => ({
    codigo_ubicacion: row.codigo_ubicacion as string,
    mes_consultado: row.mes as string,
    nombre_mes: row.nombre_mes as string,
    es_activo: row.es_activo !== 0,
    ubicacion: row.ubicacion as string,
    dias: JSON.parse(row.datos_json as string) as DiaMareas[],
    fecha_consulta: 0,
  }));
}

export async function upsertCache(respuesta: RespuestaMareas): Promise<void> {
  const db = await getDb();
  const ahora = Math.floor(Date.now() / 1000);
  await db.execute({
    sql: `INSERT INTO mareas_cache
            (codigo_ubicacion, mes, nombre_mes, es_activo, ubicacion, datos_json, scraped_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(codigo_ubicacion, mes) DO UPDATE SET
            nombre_mes = excluded.nombre_mes,
            es_activo  = excluded.es_activo,
            ubicacion  = excluded.ubicacion,
            datos_json = excluded.datos_json,
            scraped_at = excluded.scraped_at`,
    args: [
      respuesta.codigo_ubicacion,
      respuesta.mes_consultado,
      respuesta.nombre_mes,
      respuesta.es_activo ? 1 : 0,
      respuesta.ubicacion,
      JSON.stringify(respuesta.dias),
      ahora,
    ],
  });
}

export async function limpiarCacheEstacion(codigo: string): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "DELETE FROM mareas_cache WHERE codigo_ubicacion = ?",
    args: [codigo],
  });
}

export async function limpiarCacheCompleto(): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM mareas_cache", args: [] });
}

// ─── consultas guardadas ───────────────────────────────────────────────────

export async function guardarConsulta(datos: RespuestaMareas): Promise<number> {
  const db = await getDb();
  const result = await db.execute({
    sql: `INSERT INTO consultas (ubicacion, codigo_ubicacion, mes, datos_json, fecha_consulta)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      datos.ubicacion,
      datos.codigo_ubicacion,
      datos.mes_consultado,
      JSON.stringify(datos),
      datos.fecha_consulta,
    ],
  });
  return Number(result.lastInsertRowid);
}

export async function obtenerHistorial(limit = 50): Promise<HistorialConsulta[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT id, ubicacion, codigo_ubicacion, mes, fecha_consulta
          FROM consultas
          ORDER BY created_at DESC
          LIMIT ?`,
    args: [limit],
  });
  return result.rows as unknown as HistorialConsulta[];
}

export async function obtenerConsulta(id: number): Promise<RespuestaMareas | null> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT datos_json FROM consultas WHERE id = ?",
    args: [id],
  });
  const row = result.rows[0];
  return row ? (JSON.parse(row.datos_json as string) as RespuestaMareas) : null;
}

// ─── favoritos ────────────────────────────────────────────────────────────

export async function agregarFavorito(codigo: string, nombre: string): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "INSERT OR REPLACE INTO favoritos (codigo_ubicacion, nombre_ubicacion) VALUES (?, ?)",
    args: [codigo, nombre],
  });
}

export async function eliminarFavorito(codigo: string): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "DELETE FROM favoritos WHERE codigo_ubicacion = ?",
    args: [codigo],
  });
}

export async function obtenerFavoritos(): Promise<Ubicacion[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT codigo_ubicacion AS codigo, nombre_ubicacion AS nombre
          FROM favoritos ORDER BY created_at DESC`,
    args: [],
  });
  return result.rows as unknown as Ubicacion[];
}
