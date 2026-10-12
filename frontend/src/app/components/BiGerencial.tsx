"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wheat,
  FlaskConical,
  Droplets,
  Clock,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  formatarFarinha,
  formatarFermento,
  formatarEmulsificante,
  formatarMinutos,
} from "@/utils/formatters";
import { fetchWithFallback } from "@/utils/api";

interface BiStats {
  periodo: "todos" | "mes";
  totalFarinhaKg: number;
  totalFermentoGrama: number;
  totalEmulsificanteMl: number;
  totalFornadas: number;
  tempoMedioMinutos: number;
  mediaFarinhaPorFornada: number;
  proporcaoFermentoGramaPorKg: number;
  tendenciaFarinha: number | null;
  evolucaoFarinha: {
    name: string;
    farinhaKg: number;
    fornadas: number;
  }[];
}

export default function BiGerencial() {
  const [periodo, setPeriodo] = useState<"todos" | "mes">("todos");

  const { data, isLoading, isError, refetch } = useQuery<BiStats>({
    queryKey: ["bi-stats", periodo],
    queryFn: () =>
      fetchWithFallback<BiStats>(`/producao/bi-stats?periodo=${periodo}`),
    staleTime: 5 * 60 * 1000, // Cache de 5 minutos para performance máxima
  });

  return (
    <div className="mt-8 space-y-4 animate-fade-in">
      {/* Cabeçalho da Seção de BI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
              <Sparkles size={16} />
            </span>
            <h2 className="text-lg font-bold text-gray-900">
              Inteligência de Produção (BI)
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Métricas de insumos acumulados e médias operacionais
          </p>
        </div>

        {/* Seletor de Período (Abas) */}
        <div className="flex bg-gray-200/80 p-1 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setPeriodo("todos")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              periodo === "todos"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Todo o Histórico
          </button>
          <button
            onClick={() => setPeriodo("mes")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              periodo === "mes"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Neste Mês
          </button>
        </div>
      </div>

      {isLoading ? (
        /* Skeleton Loading para zero impacto visual de travamento */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-4xl border border-gray-100 shadow-sm animate-pulse h-36 flex flex-col justify-between"
              >
                <div className="flex justify-between items-center">
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                </div>
                <div className="w-32 h-8 bg-gray-200 rounded"></div>
                <div className="w-28 h-3 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm animate-pulse h-24"></div>
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm animate-pulse h-24"></div>
          </div>
          <div className="bg-white p-6 rounded-4xl border border-gray-100 shadow-sm animate-pulse h-60"></div>
        </div>
      ) : isError ? (
        <div className="bg-white p-6 rounded-4xl border border-dashed border-gray-200 shadow-sm text-center flex flex-col items-center justify-center gap-2">
          <p className="text-xs font-semibold text-gray-700">
            Não foi possível conectar à API de BI.
          </p>
          <p className="text-[11px] text-gray-400">
            Certifique-se de que o backend local está rodando em http://localhost:3000.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 active:scale-95 transition-all cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      ) : data ? (
        <>
          {/* Grid de Cards dos 3 Insumos Principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card Farinha */}
            {(() => {
              const farinha = formatarFarinha(data.totalFarinhaKg);
              return (
                <div className="bg-white p-5 rounded-4xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Farinha Total
                    </span>
                    <div className="p-2.5 bg-orange-50 text-orange-600 rounded-2xl">
                      <Wheat size={20} />
                    </div>
                  </div>

                  <div className="my-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-gray-900 tracking-tight">
                        {farinha.valor}
                      </span>
                      <span className="text-xs font-bold text-gray-500 uppercase">
                        {farinha.unidade}
                      </span>
                    </div>

                    {periodo === "mes" && data.tendenciaFarinha !== null && (
                      <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold">
                        {data.tendenciaFarinha >= 0 ? (
                          <span className="text-emerald-600 flex items-center gap-0.5">
                            <TrendingUp size={13} />+{data.tendenciaFarinha}%
                          </span>
                        ) : (
                          <span className="text-rose-600 flex items-center gap-0.5">
                            <TrendingDown size={13} />
                            {data.tendenciaFarinha}%
                          </span>
                        )}
                        <span className="text-gray-400 font-normal">
                          vs mês anterior
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-50 text-[11px] text-gray-400 flex items-center justify-between">
                    <span>Média por fornada:</span>
                    <span className="font-semibold text-gray-700">
                      {data.mediaFarinhaPorFornada.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Card Fermento */}
            {(() => {
              const fermento = formatarFermento(data.totalFermentoGrama);
              return (
                <div className="bg-white p-5 rounded-4xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Fermento Total
                    </span>
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                      <FlaskConical size={20} />
                    </div>
                  </div>

                  <div className="my-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-gray-900 tracking-tight">
                        {fermento.valor}
                      </span>
                      <span className="text-xs font-bold text-gray-500 uppercase">
                        {fermento.unidade}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Consumo acumulado no período
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-50 text-[11px] text-gray-400 flex items-center justify-between">
                    <span>Proporção média:</span>
                    <span className="font-semibold text-gray-700">
                      {data.proporcaoFermentoGramaPorKg.toLocaleString("pt-BR")}{" "}
                      g/kg
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Card Emulsificante */}
            {(() => {
              const emulsificante = formatarEmulsificante(
                data.totalEmulsificanteMl
              );
              return (
                <div className="bg-white p-5 rounded-4xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Emulsificante Total
                    </span>
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
                      <Droplets size={20} />
                    </div>
                  </div>

                  <div className="my-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-gray-900 tracking-tight">
                        {emulsificante.valor}
                      </span>
                      <span className="text-xs font-bold text-gray-500 uppercase">
                        {emulsificante.unidade}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Melhorador de maciez da massa
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-50 text-[11px] text-gray-400 flex items-center justify-between">
                    <span>Média por fornada:</span>
                    <span className="font-semibold text-gray-700">
                      {data.totalFornadas > 0
                        ? Math.round(
                            data.totalEmulsificanteMl / data.totalFornadas
                          )
                        : 0}{" "}
                      ml
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Indicadores Operacionais de Suporte */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                <Clock size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Tempo Médio de Fermentação
                </span>
                <span className="text-base font-extrabold text-gray-900">
                  {formatarMinutos(data.tempoMedioMinutos)}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Layers size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Total de Fornadas
                </span>
                <span className="text-base font-extrabold text-gray-900">
                  {data.totalFornadas.toLocaleString("pt-BR")}{" "}
                  {data.totalFornadas === 1 ? "fornada" : "fornadas"}
                </span>
              </div>
            </div>
          </div>

          {/* Gráfico de Evolução de Consumo de Farinha nos Últimos 6 Meses */}
          {data.evolucaoFarinha && data.evolucaoFarinha.length > 0 && (
            <div className="bg-white p-5 rounded-4xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                  <TrendingUp className="text-orange-500" size={18} />
                  Consumo de Farinha nos Últimos 6 Meses
                </h3>
                <span className="text-[10px] text-gray-400 font-medium">
                  Valores em kg
                </span>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.evolucaoFarinha}
                    margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                    />
                    <Tooltip
                      cursor={{ fill: "#fef3c7", opacity: 0.3, radius: 4 }}
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        borderRadius: "12px",
                        border: "none",
                        color: "#fff",
                      }}
                      itemStyle={{ color: "#fff", fontSize: "12px" }}
                      formatter={(val: any, name: any, item: any) => [
                        `${Number(val).toLocaleString("pt-BR")} kg (${item.payload.fornadas} fornadas)`,
                        "Farinha",
                      ]}
                    />
                    <Bar
                      dataKey="farinhaKg"
                      fill="#ea580c"
                      radius={[6, 6, 0, 0]}
                      barSize={24}
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
