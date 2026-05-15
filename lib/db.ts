import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type {
  RespuestaMareas,
  HistorialConsulta,
  Ubicacion,
  DiaMareas,
} from "@/types/mareas";

// Singleton con soporte para hot-reload de Next.js dev
const globalForDb = global as typeof globalThis & {
  _mareas_db?: Database.Database;
};

function getDb(): Database.Database {
  if (globalForDb._mareas_db) return globalForDb._mareas_db;

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(path.join(dataDir, "mareas.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
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

  globalForDb._mareas_db = db;
  return db;
}

// ─── mareas_cache ──────────────────────────────────────────────────────────

export function obtenerCache(codigo: string): RespuestaMareas[] {
  type Row = {
    codigo_ubicacion: string;
    mes: string;
    nombre_mes: string;
    es_activo: number;
    ubicacion: string;
    datos_json: string;
  };

  const rows = getDb()
    .prepare(
      `SELECT codigo_ubicacion, mes, nombre_mes, es_activo, ubicacion, datos_json
       FROM mareas_cache
       WHERE codigo_ubicacion = ?
       ORDER BY mes ASC`
    )
    .all(codigo) as Row[];

  return rows.map((row) => ({
    codigo_ubicacion: row.codigo_ubicacion,
    mes_consultado: row.mes,
    nombre_mes: row.nombre_mes,
    es_activo: row.es_activo !== 0,
    ubicacion: row.ubicacion,
    dias: JSON.parse(row.datos_json) as DiaMareas[],
    fecha_consulta: 0,
  }));
}

export function upsertCache(respuesta: RespuestaMareas): void {
  const ahora = Math.floor(Date.now() / 1000);
  getDb()
    .prepare(
      `INSERT INTO mareas_cache
         (codigo_ubicacion, mes, nombre_mes, es_activo, ubicacion, datos_json, scraped_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(codigo_ubicacion, mes) DO UPDATE SET
         nombre_mes = excluded.nombre_mes,
         es_activo  = excluded.es_activo,
         ubicacion  = excluded.ubicacion,
         datos_json = excluded.datos_json,
         scraped_at = excluded.scraped_at`
    )
    .run(
      respuesta.codigo_ubicacion,
      respuesta.mes_consultado,
      respuesta.nombre_mes,
      respuesta.es_activo ? 1 : 0,
      respuesta.ubicacion,
      JSON.stringify(respuesta.dias),
      ahora
    );
}

export function limpiarCacheEstacion(codigo: string): void {
  getDb()
    .prepare("DELETE FROM mareas_cache WHERE codigo_ubicacion = ?")
    .run(codigo);
}

export function limpiarCacheCompleto(): void {
  getDb().prepare("DELETE FROM mareas_cache").run();
}

// ─── consultas guardadas ───────────────────────────────────────────────────

export function guardarConsulta(datos: RespuestaMareas): number {
  const result = getDb()
    .prepare(
      `INSERT INTO consultas (ubicacion, codigo_ubicacion, mes, datos_json, fecha_consulta)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      datos.ubicacion,
      datos.codigo_ubicacion,
      datos.mes_consultado,
      JSON.stringify(datos),
      datos.fecha_consulta
    );
  return Number(result.lastInsertRowid);
}

export function obtenerHistorial(limit = 50): HistorialConsulta[] {
  return getDb()
    .prepare(
      `SELECT id, ubicacion, codigo_ubicacion, mes, fecha_consulta
       FROM consultas
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(limit) as HistorialConsulta[];
}

export function obtenerConsulta(id: number): RespuestaMareas | null {
  const row = getDb()
    .prepare("SELECT datos_json FROM consultas WHERE id = ?")
    .get(id) as { datos_json: string } | undefined;

  return row ? (JSON.parse(row.datos_json) as RespuestaMareas) : null;
}

// ─── favoritos ────────────────────────────────────────────────────────────

export function agregarFavorito(codigo: string, nombre: string): void {
  getDb()
    .prepare(
      "INSERT OR REPLACE INTO favoritos (codigo_ubicacion, nombre_ubicacion) VALUES (?, ?)"
    )
    .run(codigo, nombre);
}

export function eliminarFavorito(codigo: string): void {
  getDb()
    .prepare("DELETE FROM favoritos WHERE codigo_ubicacion = ?")
    .run(codigo);
}

export function obtenerFavoritos(): Ubicacion[] {
  return getDb()
    .prepare(
      `SELECT codigo_ubicacion AS codigo, nombre_ubicacion AS nombre
       FROM favoritos ORDER BY created_at DESC`
    )
    .all() as Ubicacion[];
}
