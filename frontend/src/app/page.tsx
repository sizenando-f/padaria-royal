import Link from "next/link";

export default function Home(){
  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-orange-900 mb-2">Padaria Royal</h1>
        <p className="text-orange-700">Sistema de Controle Inteligente</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Cartão 1: Nova Produção */}
        <Link href={"/producao/novo"} className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-l-4 border-orange-500 flex flex-col items-center group">
          <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">📝</span>
          <h2 className="text-xl font-bold text-gray-800">Registrar Produção</h2>
          <p className="text-gray-500 text-sm mt-2 text-center">Iniciar nova produção e registrar igredientes.</p>
        </Link>

        {/* Cartão 2: Histórico */}
        <Link 
          href="/producao/historico"
          className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-l-4 border-blue-500 flex flex-col items-center group"
        >
          <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">📜</span>
          <h2 className="text-xl font-bold text-gray-800">Histórico</h2>
          <p className="text-gray-500 text-sm mt-2 text-center">Visualizar produções passadas e avaliações.</p>
        </Link>
      </div>
    </div>
  )
}