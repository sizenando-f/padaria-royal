'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { 
  Plus, History, ClipboardCheck, ChefHat, 
  AlertTriangle, TrendingUp, Star, Award
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function Home() {
  // --- CONFIGURAÇÃO DE USUÁRIO (Futuro Login) ---
  const [nomeUsuario, setNomeUsuario] = useState('Sizenando'); // Mude aqui para testar

  // --- ESTADOS ---
  const [stats, setStats] = useState<any>(null);
  const [pendentes, setPendentes] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- BUSCA DADOS ---
  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Busca Pendências
        const resProd = await fetch('http://localhost:3000/producao');
        const dataProd = await resProd.json();
        const countPendentes = dataProd.filter((p: any) => !p.avaliacao).length;
        setPendentes(countPendentes);

        // 2. Busca Estatísticas do Gráfico
        const resStats = await fetch('http://localhost:3000/avaliacao/dashboard');
        const dataStats = await resStats.json();
        setStats(dataStats);

      } catch (error) {
        console.error("Erro ao carregar dashboard", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-32">
      
      {/* CABEÇALHO PERSONALIZADO */}
      <header className="mb-8 flex justify-between items-center animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Olá, {nomeUsuario}! 👋</h1>
          <p className="text-sm text-gray-500">Vamos produzir excelência hoje?</p>
        </div>
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-orange-600 shadow-sm border border-gray-100">
          <ChefHat size={24} />
        </div>
      </header>

      {/* 1. BOTÃO DE AÇÃO PRINCIPAL (Destacado) */}
      <Link href="/producao/novo" className="block group mb-6">
        <div className="bg-linear-to-r from-orange-500 to-orange-600 rounded-4xl p-6 text-white shadow-xl shadow-orange-200 transform transition-all active:scale-95 group-hover:shadow-orange-300 relative overflow-hidden">
          {/* Efeito de fundo */}
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Plus size={120} />
          </div>

          <div className="relative z-10 flex justify-between items-start mb-6">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/10">
              <Plus size={28} />
            </div>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/10">
              Agora
            </span>
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-1">Iniciar Produção</h2>
            <p className="text-orange-100 text-sm font-medium opacity-90">Registrar nova fornada</p>
          </div>
        </div>
      </Link>

      {/* 2. GRÁFICO DE DESEMPENHO (Novo) */}
      <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100 mb-6">
         <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Award className="text-yellow-500" size={20}/> Qualidade Geral
            </h3>
            {stats && stats.media > 0 && (
                <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
                    {stats.total} avaliações
                </span>
            )}
         </div>

         {loading ? (
             <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Carregando dados...</div>
         ) : stats && stats.media > 0 ? (
             <div className="flex items-center">
                 {/* Lado Esquerdo: Gráfico */}
                 <div className="w-1/2 h-32 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats.distribuicao}
                                innerRadius={35}
                                outerRadius={55}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {stats.distribuicao.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Nota no meio do gráfico */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xl font-bold text-gray-700">{stats.media}</span>
                    </div>
                 </div>

                 {/* Lado Direito: Legenda / Resumo */}
                 <div className="w-1/2 pl-2">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wide">Média (1-5)</span>
                        <div className="text-3xl font-bold text-gray-900 flex items-end gap-1">
                            {stats.media}
                            <span className="text-sm text-gray-400 mb-1 font-medium">/ 5.0</span>
                        </div>
                        <div className="flex gap-1 mt-1">
                            {[1,2,3,4,5].map((star) => (
                                <Star 
                                    key={star} 
                                    size={12} 
                                    className={`${star <= Math.round(Number(stats.media)) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                                />
                            ))}
                        </div>
                    </div>
                 </div>
             </div>
         ) : (
             <div className="h-32 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                 <p className="text-sm">Sem dados suficientes.</p>
                 <p className="text-xs opacity-70">Avalie produções para ver o gráfico.</p>
             </div>
         )}
      </div>

      {/* 3. ATALHOS DE STATUS */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Pendências */}
        <Link href="/avaliacao" className="bg-white p-5 rounded-4xl shadow-sm border border-gray-100 active:scale-95 transition-transform">
          <div className="flex justify-between items-start mb-3">
            <div className={`p-3 rounded-2xl ${pendentes > 0 ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
              {pendentes > 0 ? <AlertTriangle size={22} /> : <ClipboardCheck size={22} />}
            </div>
            {pendentes > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm shadow-red-200">
                {pendentes}
              </span>
            )}
          </div>
          <h3 className="font-bold text-gray-800">Avaliações</h3>
          <p className="text-[11px] text-gray-500 mt-1 font-medium leading-tight">
            {pendentes > 0 ? 'Fornadas aguardando sua análise.' : 'Tudo analisado!'}
          </p>
        </Link>

        {/* Histórico */}
        <Link href="/producao/historico" className="bg-white p-5 rounded-4xl shadow-sm border border-gray-100 active:scale-95 transition-transform">
          <div className="flex justify-between items-start mb-3">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
              <History size={22} />
            </div>
          </div>
          <h3 className="font-bold text-gray-800">Histórico</h3>
          <p className="text-[11px] text-gray-500 mt-1 font-medium leading-tight">
            Consulte dados de produções passadas.
          </p>
        </Link>
      </div>

      {/* DICA DE SISTEMA (RODAPÉ) */}
      <div className="mt-6 flex gap-3 items-center px-2 opacity-60">
        <TrendingUp size={16} className="text-gray-500" />
        <p className="text-[10px] text-gray-500 font-medium">
            Dica: Avalie como "Excelente" para ensinar a IA.
        </p>
      </div>

    </div>
  );
}