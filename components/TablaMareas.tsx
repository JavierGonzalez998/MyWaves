"use client";

import type { DiaMareas } from "@/types/mareas";

interface Props {
  dia: DiaMareas;
}

export function TablaMareas({ dia }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-400">
              Hora
            </th>
            <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-400">
              Evento
            </th>
            <th className="text-right py-2 px-3 font-semibold text-gray-600 dark:text-gray-400">
              Altura
            </th>
          </tr>
        </thead>
        <tbody>
          {dia.mareas.map((marea, i) => (
            <tr
              key={i}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td className="py-2 px-3 font-mono text-gray-800 dark:text-gray-200">
                {marea.hora}
              </td>
              <td className="py-2 px-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium
                    ${
                      marea.tipo === "PLEAMAR"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                    }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${marea.tipo === "PLEAMAR" ? "bg-red-500" : "bg-teal-500"}`}
                  />
                  {marea.tipo === "PLEAMAR" ? "↑ Pleamar" : "↓ Bajamar"}
                </span>
              </td>
              <td className="py-2 px-3 text-right">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {marea.altura_metros.toFixed(2)}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">m</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex gap-4 px-3 pb-1 text-xs text-gray-500 dark:text-gray-400">
        <span>
          Máx:{" "}
          <strong className="text-red-600 dark:text-red-400">
            {dia.altura_maxima.toFixed(2)} m
          </strong>
        </span>
        <span>
          Mín:{" "}
          <strong className="text-teal-600 dark:text-teal-400">
            {dia.altura_minima.toFixed(2)} m
          </strong>
        </span>
        <span>
          Rango:{" "}
          <strong className="text-gray-700 dark:text-gray-300">
            {(dia.altura_maxima - dia.altura_minima).toFixed(2)} m
          </strong>
        </span>
      </div>
    </div>
  );
}
