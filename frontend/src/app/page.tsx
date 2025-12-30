'use client';

import Link from 'next/link';
import { 
  PlusCircle, 
  ClipboardCheck, 
  History, 
  ChefHat, 
  Award,
  TrendingUpDown
} from 'lucide-react';
import { useEffect, useState } from 'react';
import GraficoQualidade from './components/GraficoQualidade';

interface DashboardStats {
  totalProducoes: number;
  mediaNota: string;
  distribuicao: {name: string; value: number}[];
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch('http://localhost:3000/avaliacao/dashboard-stats').then(res => res.json()).then(data => setStats(data)).catch(err => console.error("Erro ao carregar stats", err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      
      {/* Cabeçalho */}
      <div className="text-center mb-8 mt-4">
        <div className="flex justify-center mb-3">
          <div className="bg-orange-100 p-3 rounded-full">
            <ChefHat size={40} className="text-orange-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Padaria Royal</h1>
        <p className="text-gray-500">Painel de Controle</p>
      </div>

      {/* === ÁREA DE KPIs e GRÁFICOS === */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        {/* KPI 1: Nota Média */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Award size={20} className="text-orange-500" />
            <span className="font-semibold text-sm uppercase">Qualidade Média</span>
          </div>
          <div className="text-5xl font-bold text-gray-800">{stats?.mediaNota || '--'}</div>
          <span className="text-xs text-gray-400 mt-2">de 5.0 estrelas</span>
        </div>

        {/* GRÁFICO: Distribuição */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 md:col-span-2 flex flex-col">
          <h3 className="text-gray-500 font-semibold text-sm uppercase mb-2 ml-2 flex items-center gap-2">
            <TrendingUpDown size={18} /> Distribuição de Qualidade
          </h3>
          <div className="flex-1">
             {/* Renderiza o gráfico apenas se tiver dados */}
             {stats && <GraficoQualidade dados={stats.distribuicao} />}
          </div>
        </div>
      </div>

      {/* Grid de Navegação (Mantido igual, apenas ajustado margens) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        <Link 
          href="/producao/novo"
          className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 hover:border-orange-200 flex flex-col items-center text-center"
        >
          <div className="bg-orange-50 p-3 rounded-xl mb-4 group-hover:bg-orange-600 transition-colors">
            <PlusCircle size={28} className="text-orange-600 group-hover:text-white transition-colors" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Nova Produção</h2>
        </Link>

        <Link 
          href="/avaliacao"
          className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 hover:border-yellow-200 flex flex-col items-center text-center"
        >
          <div className="bg-yellow-50 p-3 rounded-xl mb-4 group-hover:bg-yellow-500 transition-colors">
            <ClipboardCheck size={28} className="text-yellow-600 group-hover:text-white transition-colors" />
          </div>
          <div className="flex items-center gap-2">
             <h2 className="text-lg font-bold text-gray-800">Avaliações Pendentes</h2>
             {/* Badge de contador se precisar */}
          </div>
        </Link>

        <Link 
          href="/producao/historico"
          className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 hover:border-blue-200 flex flex-col items-center text-center"
        >
          <div className="bg-blue-50 p-3 rounded-xl mb-4 group-hover:bg-blue-600 transition-colors">
            <History size={28} className="text-blue-600 group-hover:text-white transition-colors" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Histórico Geral</h2>
        </Link>
      </div>

      <footer className="mt-12 text-gray-400 text-sm">
        Padaria Royal v2.1 • Desenvolvido por Você
      </footer>
    </div>
  );
}