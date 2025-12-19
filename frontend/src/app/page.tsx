import Link from 'next/link';
import { 
  PlusCircle, 
  ClipboardCheck, 
  History, 
  ChefHat 
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      
      {/* Cabeçalho */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="flex justify-center mb-4">
          <div className="bg-orange-100 p-4 rounded-full">
            <ChefHat size={48} className="text-orange-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Padaria Royal</h1>
        <p className="text-gray-500 text-lg">Sistema de Controle de Qualidade</p>
      </div>

      {/* Grid de Navegação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        
        {/* Nova Produção */}
        <Link 
          href="/producao/novo"
          className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 hover:border-orange-200 flex flex-col items-center text-center"
        >
          <div className="bg-orange-50 p-4 rounded-xl mb-6 group-hover:bg-orange-600 transition-colors">
            <PlusCircle size={32} className="text-orange-600 group-hover:text-white transition-colors" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Nova Produção</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Iniciar o registro de uma nova fornada, calculando tempos e registrando ingredientes.
          </p>
        </Link>

        {/* Avaliações Pendentes */}
        <Link 
          href="/avaliacao"
          className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 hover:border-yellow-200 flex flex-col items-center text-center"
        >
          <div className="bg-yellow-50 p-4 rounded-xl mb-6 group-hover:bg-yellow-500 transition-colors">
            <ClipboardCheck size={32} className="text-yellow-600 group-hover:text-white transition-colors" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Avaliações Pendentes</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Dar notas e feedback para as produções que acabaram de sair do forno.
          </p>
        </Link>

        {/* Histórico Completo */}
        <Link 
          href="/producao/historico"
          className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 hover:border-blue-200 flex flex-col items-center text-center"
        >
          <div className="bg-blue-50 p-4 rounded-xl mb-6 group-hover:bg-blue-600 transition-colors">
            <History size={32} className="text-blue-600 group-hover:text-white transition-colors" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Histórico Geral</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Consultar banco de dados de produções passadas e métricas de qualidade.
          </p>
        </Link>

      </div>

      {/* Rodapé simples */}
      <footer className="mt-16 text-gray-400 text-sm">
        Padaria Royal v2.0 • Desenvolvido com NestJS & Next.js
      </footer>
    </div>
  );
}