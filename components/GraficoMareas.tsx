"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { DiaMareas } from "@/types/mareas";

interface PuntoGrafico {
  hora: string;
  altura: number;
  tipo: string;
}

function interpolarCurva(mareas: DiaMareas["mareas"]): PuntoGrafico[] {
  if (mareas.length === 0) return [];
  if (mareas.length === 1) {
    return [
      {
        hora: mareas[0].hora,
        altura: mareas[0].altura_metros,
        tipo: mareas[0].tipo,
      },
    ];
  }

  const horaAMinutos = (hora: string) => {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
  };
  const minutosAHora = (min: number) => {
    const h = Math.floor(min / 60) % 24;
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const datos = mareas.map((m) => ({
    min: horaAMinutos(m.hora),
    altura: m.altura_metros,
    tipo: m.tipo,
  }));

  const puntos: PuntoGrafico[] = [];
  const PASOS = 10;

  for (let i = 0; i < datos.length - 1; i++) {
    const a = datos[i];
    const b = datos[i + 1];
    for (let j = 0; j <= PASOS; j++) {
      const t = j / PASOS;
      const cosT = (1 - Math.cos(Math.PI * t)) / 2;
      const altura = a.altura + (b.altura - a.altura) * cosT;
      const min = a.min + (b.min - a.min) * t;
      puntos.push({
        hora: minutosAHora(Math.round(min)),
        altura: Math.round(altura * 100) / 100,
        tipo: j === 0 ? a.tipo : j === PASOS ? b.tipo : "",
      });
    }
  }

  return puntos;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: PuntoGrafico }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-300">{d.hora}</p>
      <p className="text-blue-600 dark:text-blue-400">{d.altura.toFixed(2)} m</p>
      {d.tipo && (
        <p
          className={`font-medium ${d.tipo === "PLEAMAR" ? "text-red-500" : "text-teal-500"}`}
        >
          {d.tipo}
        </p>
      )}
    </div>
  );
}

export function GraficoMareas({ dia }: { dia: DiaMareas }) {
  const datos = interpolarCurva(dia.mareas);
  const alturaMedia = (dia.altura_maxima + dia.altura_minima) / 2;

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="colorAgua" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="hora"
            tick={{ fontSize: 10 }}
            tickLine={false}
            interval={9}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickLine={false}
            width={35}
            tickFormatter={(v) => `${v}m`}
            domain={["auto", "auto"]}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={alturaMedia}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            label={{
              value: "Media",
              position: "insideRight",
              fontSize: 9,
              fill: "#94a3b8",
            }}
          />
          <Area
            type="monotone"
            dataKey="altura"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorAgua)"
            dot={false}
            activeDot={{ r: 4, fill: "#3b82f6" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
