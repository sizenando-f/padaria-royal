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
  Scale,
  Thermometer,
  ShieldCheck,
  Award,
  Info,
  Flame,
  Snowflake,
  Sun,
  CloudSun,
  CheckCircle2,
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
  formatarPaes,
  formatarMassa,
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
    isMesAtual?: boolean;
    projecaoFechamentoKg?: number;
    projecaoRestanteKg?: number;
  }[];
  balancoMassa: {
    cenarioFarinha: {
      fatorConversao: number;
      paesEstimadosTotal: number;
      paesEstimadosPorFornada: number;
    };
    cenarioMassaCrua: {
      fatorMassa: number;
      massaCruaTotalKg: number;
      massaCruaPorFornadaKg: number;
      rendimentoPorKgMassa: number;
      paesEstimadosTotal: number;
      paesEstimadosPorFornada: number;
    };
    cenarioPaoAssado: {
      fatorAssado: number;
      paoAssadoTotalKg: number;
      paoAssadoPorFornadaKg: number;
      rendimentoPorKgAssado: number;
      taxaQuebraEvaporacao: number;
      perdaAguaTotalKg: number;
      paesEstimadosTotal: number;
      paesEstimadosPorFornada: number;
    };
  };
  auditoriaClima: {
    taxaAderenciaIdeal: number;
    notaMediaAderente: number;
    notaMediaDescalibrado: number;
    totalAderente: number;
    totalDescalibrado: number;
    faixasReferencia: {
      frio: { faixa: string; dosagemMediaNota5: number; fornadas: number; usouFallback?: boolean };
      ameno: { faixa: string; dosagemMediaNota5: number; fornadas: number; usouFallback?: boolean };
      quente: { faixa: string; dosagemMediaNota5: number; fornadas: number; usouFallback?: boolean };
    };
  };
  sensibilidadeTermica: {
    estavel: { total: number; notaMedia: number };
    oscilacao: { total: number; notaMedia: number };
  };
  zonaDeOuro: {
    totalNota5: number;
    percentualDoTotal: number;
    tempoMedioMinutos: number;
    tempMediaAmbiente: number;
  };
}

export default function BiGerencial() {
  const [periodo, setPeriodo] = useState<"todos" | "mes">("todos");
  const [cenarioAtivo, setCenarioAtivo] = useState<"farinha" | "massa" | "assado">("farinha");
  const [showBalancoInfo, setShowBalancoInfo] = useState(false);

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
            Métricas de insumos, estimativas de pães, auditoria climática e médias operacionais
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
          <div className="bg-white p-6 rounded-4xl border border-gray-100 shadow-sm animate-pulse h-52"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-4xl border border-gray-100 shadow-sm animate-pulse h-48"></div>
            <div className="bg-white p-5 rounded-4xl border border-gray-100 shadow-sm animate-pulse h-48"></div>
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
            Certifique-se de que o backend está ativo e acessível.
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

          {/* MÓDULO 1: Balanço de Massa e Estimativa de Produção (Os 3 Cenários) */}
          <div className="bg-white p-5 sm:p-6 rounded-4xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100/70 text-amber-700 rounded-2xl">
                  <Scale size={20} />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">
                    Balanço de Massa & Estimativa de Produção
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowBalancoInfo(!showBalancoInfo)}
                    className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                      showBalancoInfo
                        ? "bg-amber-100 text-amber-700 shadow-2xs"
                        : "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                    }`}
                    title="Ver premissas e regras de cálculo da receita"
                  >
                    <Info size={15} />
                  </button>
                </div>
              </div>

              {/* Seletor dos 3 Cenários */}
              <div className="flex bg-gray-100 p-1 rounded-2xl self-start sm:self-auto text-xs font-semibold">
                <button
                  onClick={() => setCenarioAtivo("farinha")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    cenarioAtivo === "farinha"
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  1. Por Farinha (21,25 un/kg)
                </button>
                <button
                  onClick={() => setCenarioAtivo("massa")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    cenarioAtivo === "massa"
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  2. Massa Crua (14 un/kg)
                </button>
                <button
                  onClick={() => setCenarioAtivo("assado")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    cenarioAtivo === "assado"
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  3. Pão Assado (18 un/kg)
                </button>
              </div>
            </div>

            {/* Painel Informativo Discreto de Premissas (Exibido sob demanda) */}
            {showBalancoInfo && (
              <div className="mb-4 p-4 bg-amber-50/70 border border-amber-200/60 rounded-3xl text-xs text-amber-950 animate-fade-in flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-amber-900">
                    <Info size={15} className="text-amber-600" />
                    Premissas Fixas da Receita Padrão
                  </span>
                  <button
                    onClick={() => setShowBalancoInfo(false)}
                    className="text-[11px] text-amber-700 hover:text-amber-950 font-semibold cursor-pointer underline underline-offset-2"
                  >
                    Fechar
                  </button>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  <strong>Batida de Referência:</strong> 40 kg farinha + 20 kg água + 100 g sal + 100 g melhorador = <strong>60,2 kg de massa crua</strong> (fator multiplicador de 1,505x trigo).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-amber-200/50 text-[11px] text-amber-900">
                  <div className="bg-white/60 p-2.5 rounded-2xl border border-amber-100">
                    <strong className="block text-amber-950">1. Por Farinha:</strong>
                    850 pães por batida de 40 kg (~21 a 22 pães/kg de farinha).
                  </div>
                  <div className="bg-white/60 p-2.5 rounded-2xl border border-amber-100">
                    <strong className="block text-amber-950">2. Massa Crua (Divisora):</strong>
                    Unidade crua regulada em ~70,82 g (~14 pães/kg de massa).
                  </div>
                  <div className="bg-white/60 p-2.5 rounded-2xl border border-amber-100">
                    <strong className="block text-amber-950">3. Pão Assado (Balcão):</strong>
                    22,3% de quebra térmica por evaporação no forno (46,75 kg assados / batida de 55 g cada).
                  </div>
                </div>
              </div>
            )}

            {/* Conteúdo Dinâmico nos 3 Cenários (Pães Estimados, Média por Fornada e Peso Físico) */}
            {cenarioAtivo === "farinha" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-orange-50/50 rounded-3xl border border-orange-100/60">
                <div className="bg-white p-4 rounded-2xl shadow-2xs border border-orange-100/50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Pães Estimados (Base Trigo)
                    </span>
                    <span className="text-2xl font-black text-gray-900 mt-1 block">
                      {formatarPaes(data.balancoMassa.cenarioFarinha.paesEstimadosTotal).legivel}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-2 block">
                    De 21 a 22 pães/kg (~{formatarPaes(data.totalFarinhaKg * 21).legivel} a ~{formatarPaes(data.totalFarinhaKg * 22).legivel})
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-2xs border border-orange-100/50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Média por Fornada
                    </span>
                    <span className="text-2xl font-black text-gray-900 mt-1 block">
                      {data.balancoMassa.cenarioFarinha.paesEstimadosPorFornada.toLocaleString("pt-BR")} pães
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-2 block">
                    Baseada em {data.mediaFarinhaPorFornada} kg de trigo por batida
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-2xs border border-orange-100/50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Farinha Consumida
                    </span>
                    <span className="text-2xl font-black text-gray-900 mt-1 block">
                      {formatarFarinha(data.totalFarinhaKg).legivel}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-2 block">
                    Insumo base acumulado no período
                  </span>
                </div>
              </div>
            )}

            {cenarioAtivo === "massa" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-blue-50/50 rounded-3xl border border-blue-100/60">
                <div className="bg-white p-4 rounded-2xl shadow-2xs border border-blue-100/50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Pães Estimados (Divisora)
                    </span>
                    <span className="text-2xl font-black text-gray-900 mt-1 block">
                      {formatarPaes(data.balancoMassa.cenarioMassaCrua.paesEstimadosTotal).legivel}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-2 block">
                    Rendimento: 14 pães/kg de massa crua (~70,82 g cru)
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-2xs border border-blue-100/50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Média por Fornada
                    </span>
                    <span className="text-2xl font-black text-gray-900 mt-1 block">
                      {data.balancoMassa.cenarioMassaCrua.paesEstimadosPorFornada.toLocaleString("pt-BR")} pães
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-2 block">
                    Corte na divisora regulada a ~70,82 g
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-2xs border border-blue-100/50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Massa Crua Processada
                    </span>
                    <span className="text-2xl font-black text-gray-900 mt-1 block">
                      {formatarMassa(data.balancoMassa.cenarioMassaCrua.massaCruaTotalKg).legivel}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-2 block">
                    Multiplicador: 1,505x peso da farinha ({data.balancoMassa.cenarioMassaCrua.massaCruaPorFornadaKg} kg/fornada)
                  </span>
                </div>
              </div>
            )}

            {cenarioAtivo === "assado" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-emerald-50/50 rounded-3xl border border-emerald-100/60">
                <div className="bg-white p-4 rounded-2xl shadow-2xs border border-emerald-100/50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Pães Assados no Balcão
                    </span>
                    <span className="text-2xl font-black text-gray-900 mt-1 block">
                      {formatarPaes(data.balancoMassa.cenarioPaoAssado.paesEstimadosTotal).legivel}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-2 block">
                    Rendimento: 18 pães/kg assado (pão pronto de 55 g)
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-2xs border border-emerald-100/50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Média por Fornada
                    </span>
                    <span className="text-2xl font-black text-gray-900 mt-1 block">
                      {data.balancoMassa.cenarioPaoAssado.paesEstimadosPorFornada.toLocaleString("pt-BR")} pães
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-2 block">
                    Média de {data.balancoMassa.cenarioPaoAssado.paoAssadoPorFornadaKg} kg assados por fornada
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-2xs border border-emerald-100/50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Pão Pronto & Quebra Forno
                    </span>
                    <span className="text-2xl font-black text-gray-900 mt-1 block">
                      {formatarMassa(data.balancoMassa.cenarioPaoAssado.paoAssadoTotalKg).legivel}
                    </span>
                  </div>
                  <span className="text-[10px] text-rose-600 font-semibold mt-2 block">
                    Quebra térmica: -{formatarMassa(data.balancoMassa.cenarioPaoAssado.perdaAguaTotalKg).legivel} (22,3% evaporação)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* MÓDULO 2: Auditoria Climática de Dosagem (Opção B) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Card Aderência Climática */}
            <div className="bg-white p-5 sm:p-6 rounded-4xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        Auditoria Climática de Dosagem
                      </h3>
                      <p className="text-[10px] text-gray-400">
                        Comparativo de aderência à faixa ideal para o clima do dia (±10%)
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold">
                    {data.auditoriaClima.taxaAderenciaIdeal}% calibrado
                  </span>
                </div>

                {/* Comparativo de Nota Média */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Dosagem no Clima
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xl font-black text-emerald-700">
                        ★ {data.auditoriaClima.notaMediaAderente}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        média
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-600 block mt-0.5">
                      {data.auditoriaClima.totalAderente} {data.auditoriaClima.totalAderente === 1 ? "fornada" : "fornadas"}
                    </span>
                  </div>

                  <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-100">
                    <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                      Fora da Faixa Ideal
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xl font-black text-rose-700">
                        ★ {data.auditoriaClima.notaMediaDescalibrado}
                      </span>
                      <span className="text-[10px] text-rose-600 font-semibold">
                        média
                      </span>
                    </div>
                    <span className="text-[10px] text-rose-600 block mt-0.5">
                      {data.auditoriaClima.totalDescalibrado} {data.auditoriaClima.totalDescalibrado === 1 ? "fornada" : "fornadas"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-50 text-[11px] text-gray-500 mt-4 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span>
                  Fornadas na dosagem ideal do clima têm nota média <strong>+{Number((data.auditoriaClima.notaMediaAderente - data.auditoriaClima.notaMediaDescalibrado).toFixed(2))}</strong> maior.
                </span>
              </div>
            </div>

            {/* Card Faixas de Referência por Clima (Zona de Ouro) */}
            <div className="bg-white p-5 sm:p-6 rounded-4xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-2xl">
                    <Thermometer size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Zona de Ouro por Clima (Nota 5)
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      Dosagens de referência extraídas das melhores fornadas históricas
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 mt-4">
                  {/* Frio */}
                  <div className="flex items-center justify-between p-2.5 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                    <div className="flex items-center gap-2">
                      <Snowflake size={16} className="text-blue-500" />
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">
                          Clima Frio (&lt; 20°C)
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {data.auditoriaClima.faixasReferencia.frio.fornadas} fornadas Nota 5 {data.auditoriaClima.faixasReferencia.frio.usouFallback ? "(histórico)" : ""}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-blue-700 bg-white px-2.5 py-1 rounded-xl shadow-2xs border border-blue-100">
                      {data.auditoriaClima.faixasReferencia.frio.dosagemMediaNota5} g/kg
                    </span>
                  </div>

                  {/* Ameno */}
                  <div className="flex items-center justify-between p-2.5 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                    <div className="flex items-center gap-2">
                      <CloudSun size={16} className="text-amber-500" />
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">
                          Clima Ameno (20°C a 26°C)
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {data.auditoriaClima.faixasReferencia.ameno.fornadas} fornadas Nota 5 {data.auditoriaClima.faixasReferencia.ameno.usouFallback ? "(histórico)" : ""}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-amber-700 bg-white px-2.5 py-1 rounded-xl shadow-2xs border border-amber-100">
                      {data.auditoriaClima.faixasReferencia.ameno.dosagemMediaNota5} g/kg
                    </span>
                  </div>

                  {/* Quente */}
                  <div className="flex items-center justify-between p-2.5 bg-rose-50/50 rounded-2xl border border-rose-100/50">
                    <div className="flex items-center gap-2">
                      <Sun size={16} className="text-rose-500" />
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">
                          Clima Quente (&gt; 26°C)
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {data.auditoriaClima.faixasReferencia.quente.fornadas} fornadas Nota 5 {data.auditoriaClima.faixasReferencia.quente.usouFallback ? "(histórico)" : ""}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-rose-700 bg-white px-2.5 py-1 rounded-xl shadow-2xs border border-rose-100">
                      {data.auditoriaClima.faixasReferencia.quente.dosagemMediaNota5} g/kg
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-gray-400 mt-3">
                * Tolerância calculada em ±10% sobre a proporção média observada na faixa climática.
              </p>
            </div>
          </div>

          {/* MÓDULO 3: Estabilidade Térmica (Delta T) & Perfil Nota 5 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sensibilidade de Amplitude Térmica */}
            <div className="bg-white p-5 rounded-4xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-2xl">
                    <Thermometer size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Estabilidade Térmica (ΔT)
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      Impacto da variação de temperatura entre o início e o fim da fermentação
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Estável (ΔT ≤ 4°C)
                    </span>
                    <span className="text-lg font-black text-gray-900 mt-0.5 block">
                      ★ {data.sensibilidadeTermica.estavel.notaMedia}
                    </span>
                    <span className="text-[10px] text-gray-400 block">
                      {data.sensibilidadeTermica.estavel.total} fornadas
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Oscilação (ΔT &gt; 4°C)
                    </span>
                    <span className="text-lg font-black text-gray-900 mt-0.5 block">
                      ★ {data.sensibilidadeTermica.oscilacao.notaMedia}
                    </span>
                    <span className="text-[10px] text-gray-400 block">
                      {data.sensibilidadeTermica.oscilacao.total} fornadas
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-gray-50 text-[10px] text-gray-400 mt-3 flex items-center justify-between">
                <span>Variações bruscas de temperatura tendem a impactar a regularidade da nota.</span>
              </div>
            </div>

            {/* Perfil Nota 5 (Zona de Ouro) */}
            <div className="bg-white p-5 rounded-4xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-yellow-50 text-yellow-600 rounded-2xl">
                    <Award size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Perfil das Fornadas Nota 5
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      Parâmetros médios consolidados das fornadas de qualidade máxima
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="p-2.5 bg-yellow-50/50 rounded-2xl border border-yellow-100/50 text-center">
                    <span className="text-[9px] font-bold text-yellow-800 uppercase tracking-wider block">
                      Total Nota 5
                    </span>
                    <span className="text-base font-black text-gray-900 mt-0.5 block">
                      {data.zonaDeOuro.totalNota5}
                    </span>
                    <span className="text-[9px] text-yellow-700 block">
                      {data.zonaDeOuro.percentualDoTotal}% avaliações
                    </span>
                  </div>

                  <div className="p-2.5 bg-yellow-50/50 rounded-2xl border border-yellow-100/50 text-center">
                    <span className="text-[9px] font-bold text-yellow-800 uppercase tracking-wider block">
                      Tempo Médio
                    </span>
                    <span className="text-base font-black text-gray-900 mt-0.5 block">
                      {formatarMinutos(data.zonaDeOuro.tempoMedioMinutos)}
                    </span>
                    <span className="text-[9px] text-yellow-700 block">
                      fermentação
                    </span>
                  </div>

                  <div className="p-2.5 bg-yellow-50/50 rounded-2xl border border-yellow-100/50 text-center">
                    <span className="text-[9px] font-bold text-yellow-800 uppercase tracking-wider block">
                      Temp Média
                    </span>
                    <span className="text-base font-black text-gray-900 mt-0.5 block">
                      {data.zonaDeOuro.tempMediaAmbiente}°C
                    </span>
                    <span className="text-[9px] text-yellow-700 block">
                      ambiente
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-gray-50 text-[10px] text-gray-400 mt-3 flex items-center justify-between">
                <span>Padrão ouro de operação da padaria</span>
              </div>
            </div>
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

          {/* Gráfico de Evolução de Consumo de Farinha nos Últimos 6 Meses com Projeção Run-Rate */}
          {data.evolucaoFarinha && data.evolucaoFarinha.length > 0 && (
            <div className="bg-white p-5 rounded-4xl shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
                <div>
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                    <TrendingUp className="text-orange-500" size={18} />
                    Consumo de Farinha nos Últimos 6 Meses
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Mês corrente inclui projeção de fechamento linear (run-rate diário)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium self-start sm:self-auto">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-orange-600 rounded-xs inline-block"></span>
                    Realizado
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-orange-200 border border-orange-400 border-dashed rounded-xs inline-block"></span>
                    Projeção Mês Atual
                  </span>
                </div>
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
                      formatter={(val: any, name: any, item: any) => {
                        if (name === "projecaoRestanteKg") {
                          return null; // Oculta a linha da barra adicional no tooltip
                        }
                        if (item.payload.isMesAtual) {
                          return [
                            `${Number(item.payload.farinhaKg).toLocaleString("pt-BR")} kg realizados | Projeção: ~${Number(item.payload.projecaoFechamentoKg).toLocaleString("pt-BR")} kg (${item.payload.fornadas} fornadas)`,
                            "Consumo",
                          ];
                        }
                        return [
                          `${Number(item.payload.farinhaKg).toLocaleString("pt-BR")} kg (${item.payload.fornadas} fornadas)`,
                          "Farinha",
                        ];
                      }}
                    />
                    {/* Barra de Farinha Realizada */}
                    <Bar
                      dataKey="farinhaKg"
                      stackId="consumo"
                      fill="#ea580c"
                      radius={[4, 4, 0, 0]}
                      barSize={24}
                      animationDuration={1000}
                    />
                    {/* EDGE CASE 4: Barra Empilhada com a diferença restante para a projeção */}
                    <Bar
                      dataKey="projecaoRestanteKg"
                      stackId="consumo"
                      fill="#fed7aa"
                      stroke="#ea580c"
                      strokeDasharray="2 2"
                      radius={[4, 4, 0, 0]}
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
