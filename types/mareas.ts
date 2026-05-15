export interface Marea {
  tipo: "PLEAMAR" | "BAJAMAR" | string;
  hora: string; // HH:MM
  altura_metros: number;
}

export interface DiaMareas {
  fecha: string; // YYYY-MM-DD
  dia_semana: string;
  mareas: Marea[];
  altura_maxima: number;
  altura_minima: number;
}

export interface Ubicacion {
  codigo: string;
  nombre: string;
}

export interface RespuestaMareas {
  ubicacion: string;
  codigo_ubicacion: string;
  /** "YYYY-MM" */
  mes_consultado: string;
  /** Nombre legible: "Mayo 2026" */
  nombre_mes: string;
  /** true = tab activo del servidor (mes actual) */
  es_activo: boolean;
  dias: DiaMareas[];
  fecha_consulta: number;
}

export interface HistorialConsulta {
  id: number;
  ubicacion: string;
  codigo_ubicacion: string;
  mes: string;
  fecha_consulta: number;
}
