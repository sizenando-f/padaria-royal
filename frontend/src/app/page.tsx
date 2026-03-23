"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Plus,
  History,
  ClipboardCheck,
  ChefHat,
  AlertTriangle,
  TrendingUp,
  Star,
  Award,
  LogOut,
  Icon,
  Calendar,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, CartesianGrid, XAxis, Bar, YAxis } from "recharts";
import { useAuth } from "@/context/AuthContext"; // Informações de login
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  // Informações do usuário
  const { user, logout } = useAuth();

  // Query para buscar as pendências
  const { data: pendentes = 0 } = useQuery({
    queryKey: ["pendentes"],
    queryFn: async () => {
      const token = localStorage.getItem("royal_token");
      if(!token) return 0;

      const res = await fetch("https://padaria-royal-api.onrender.com/producao/pendentes", {
        headers: {Authorization: `Bearer ${token}`}, 
      });

      if(!res.ok) return 0;
      const data = await res.json();
      return data.length || 0;
    },
  });

  // Query para buscar estatisticas do dashboard
  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const token = localStorage.getItem("royal_token");
      if (!token) return null;

      const res = await fetch("https://padaria-royal-api.onrender.com/avaliacao/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao buscar dashboard");
      return res.json();
    },
  });

  // Auxilair para o gráfico de rosca
  const DonutChart = ({ data, media, total, titulo, icon: Icon, colorIcon }: any) => (
    <div className="bg-white p-5 rounded-4xl shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
          <Icon className={colorIcon} size={18}/> {titulo}
        </h3>
        {total > 0 && (
          <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
            {total} {total === 1 ? 'produção' : 'produções'}
          </span>
        )}
      </div>

      {media > 0 ? (
        <div className="flex items-center flex-1">
          <div className="w-1/2 h-28 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={30}
                  outerRadius={45}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'}}
                  itemStyle={{fontSize: '12px', fontWeight: 'bold'}} 
                />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-lg font-bold text-gray-700">{media}</span>
            </div>
          </div>
          <div className="w-1/2 pl-1">
            <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Nota Média</span>
                  <div className="text-2xl font-bold text-gray-900 flex items-end gap-1 leading-none mb-1">
                    {media}
                    <span className="text-[10px] text-gray-400 font-medium mb-0.5">/ 5.0</span>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={10} className={`${star <= Math.round(Number(media)) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                      />
                    ))}
                  </div>
            </div>
          </div>
        </div>
      ) : (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl m-2">
        Sem dados
      </div> 
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-32 md:p-8">
      {/* Cabeçalho */}
      <header className="mb-6 flex justify-between items-center animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Olá, {user?.nome?.split(" ")[0] || "Visitante"}!
          </h1>
          <p className="text-sm text-gray-500">
            {user?.cargo === "GERENTE"
              ? "Painel Gerencial"
              : "Vamos produzir?"}
          </p>
        </div>

        <div className="flex gap-2">
          {/* Botão para sair */}
          <button
            onClick={logout}
            className="p-2.5 bg-white rounded-full text-gray-400 shadow-sm border border-gray-100 hover:text-red-500 transition-colors" title="Sair do sistema"
          >
            <LogOut size={18} />
          </button>
          {/* Ícone de Perfil / Gestão */}
          {user?.cargo === "GERENTE" ? (
            <Link href="/usuarios" className="p-2.5 bg-white rounded-full text-orange-600 shadow-sm border border-gray-100 hover:scale-105 transition-all cursor-pointer" title="Gestão de Equipe">
              <ChefHat size={22} />
            </Link>
          ) : (
            <div className="p-2.5 bg-white rounded-full text-orange-600 shadow-sm border border-gray-100 ">
              <ChefHat size={22} />
            </div>
          )}
        </div>
      </header>

      {/* Botão de ação principal */}
      <Link href="/producao/novo" className="block group mb-6">
        <div className="bg-linear-to-r from-orange-500 to-orange-600 rounded-4xl p-5 text-white shadow-lg shadow-orange-200 transform transition-all active:scale-95 group-hover:shadow-orange-300 relative overflow-hidden">
          {/* Efeito de fundo */}
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Plus size={100} />
          </div>

          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/10">
              <Plus size={24} />
            </div>
            <span className="bg-white/20 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md border border-white/10">
              Novo
            </span>
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold">Iniciar Produção</h2>
            <p className="text-orange-100 text-xs font-medium opacity-90">
              Registrar nova fornada
            </p>
          </div>
        </div>
      </Link>

      {/* Seção de BI */}
      {loading ? (
        <div className="py-10 text-center text-gray-400 text-sm">Carregando indicadores...</div>
      ) : stats && stats.geral && stats.mes ? (
        <div className="space-y-4 mb-6">
          {/* Dois donuts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DonutChart 
              data={stats.geral.distribuicao}
              media={stats.geral.media}
              total={stats.geral.total}
              titulo="Qualidade Geral"
              icon={Award}
              colorIcon="text-yellow-500"
            />
            <DonutChart 
              data={stats.mes.distribuicao}
              media={stats.mes.media}
              total={stats.mes.total}
              titulo="Neste Mês"
              icon={Calendar}
              colorIcon="text-blue-500"
            />
          </div>

          {/* Gráfico de barras */}
          <div className="bg-white p-5 rounded-4xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                        <TrendingUp className="text-green-500" size={18}/> Evolução Mensal
                    </h3>
                </div>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.historico} margin={{top: 10, right: 0, left: -25, bottom: 0}}>
                            {/* Linhas horizontais */}
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                            
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 10, fill: '#9ca3af'}} 
                                dy={10}
                            />
                            
                            {/* eixo y com 1, 2, 3, 4, 5 */}
                            <YAxis 
                                domain={[0, 5]} 
                                ticks={[1, 2, 3, 4, 5]} 
                                axisLine={false}
                                tickLine={false}
                                tick={{fontSize: 10, fill: '#9ca3af'}}
                            />
                            
                            <Tooltip 
                                cursor={{fill: '#f3f4f6', radius: 4}}
                                contentStyle={{backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff'}}
                                itemStyle={{color: '#fff', fontSize: '12px'}}
                            />
                            <Bar 
                                dataKey="media" 
                                fill="#3b82f6" 
                                radius={[4, 4, 0, 0]} 
                                barSize={24}
                                animationDuration={1000}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      ) : (
        <div className="py-10 mb-6 text-center text-gray-400 text-sm bg-white rounded-4xl border border-dashed border-gray-200 shadow-sm flex flex-col items-center justify-center gap-2">
          <TrendingUp size={32} className="text-gray-300"/>
          <p className="font-bold text-gray-500">Dashboard Vazio</p>
          <p>Faça sua primeira fornada e avalie para gerar as estatísticas!</p>
        </div>
      )}

      {/* Atalhos */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/avaliacao" className="bg-white p-4 rounded-4xl shadow-sm border border-gray-100 active:scale-95 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <div className={`p-2.5 rounded-2xl ${pendentes > 0 ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
              {pendentes > 0 ? <AlertTriangle size={20} /> : <ClipboardCheck size={20} />}
            </div>
            {pendentes > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                {pendentes}
              </span>
            )}
          </div>
          <h3 className="font-bold text-gray-800 text-sm">Avaliações</h3>
          <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
            {pendentes > 0 ? 'Pendentes.' : 'Em dia!'}
          </p>
        </Link>

        {(user?.cargo === 'GERENTE' || user?.permissoes?.historico) && (
          <Link href="/producao/historico" className="bg-white p-4 rounded-4xl shadow-sm border border-gray-100 active:scale-95 transition-transform">
          <div className="flex justify-between items-start mb-2">
              <div className="bg-blue-50 text-blue-600 p-2.5 rounded-2xl">
                <History size={20} />
              </div>
            </div>
            <h3 className="font-bold text-gray-800 text-sm">Histórico</h3>
            <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
              Ver todas.
            </p>
        </Link>
        )}
        
      </div>
    </div>
  );
}
