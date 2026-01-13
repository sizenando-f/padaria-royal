'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
    ArrowRight, Calendar, Clock, Wheat, 
    AlertTriangle, ClipboardList, Loader2, ArrowLeft, CheckCircle2
} from "lucide-react";

interface Producao {
    id: number;
    dataProducao: string;
    horaInicio: string;
    horaFim: string;
    tempoFermentacaoMinutos: number;
    farinhaKg: string;
};

export default function ListaPendentes(){
    const router = useRouter();
    const [pendentes, setPendentes] = useState<Producao[]>([])
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPendentes() {
            try{
                // Busca todas as produções e filtra no front ou usa rota específica se tiver
                // Assumindo que sua rota /producao retorna tudo, filtramos aqui ou usamos rota dedicada
                // Vou usar a rota padrão /producao e filtrar, ou a /pendentes se você criou ela
                const response = await fetch('http://localhost:3000/producao'); 
                const data = await response.json();
                
                // Filtra apenas as que NÃO tem avaliação
                const apenasPendentes = data.filter((p: any) => !p.avaliacao);
                
                setPendentes(apenasPendentes);
            } 
            catch(error){
                console.error("Erro:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchPendentes();
    }, []);

    const formatarHora = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-24 md:p-8">
            <div className="max-w-xl mx-auto">
                
                {/* CABEÇALHO */}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => router.push('/')} className="bg-white p-3 rounded-full border border-gray-200 shadow-sm text-gray-700 active:bg-gray-100">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Avaliações</h1>
                        <p className="text-xs text-gray-500 font-medium">Controle de qualidade</p>
                    </div>
                </div>

                {/* RESUMO DE PENDÊNCIAS */}
                {!loading && pendentes.length > 0 && (
                    <div className="bg-orange-100 border border-orange-200 text-orange-800 p-4 rounded-3xl mb-6 flex items-center gap-3">
                        <div className="bg-orange-200 p-2 rounded-full">
                            <AlertTriangle size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm">Atenção Necessária</p>
                            <p className="text-xs opacity-90">Você tem {pendentes.length} produções aguardando nota.</p>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
                        <Loader2 className="animate-spin text-orange-500" size={32} />
                        <p className="text-sm">Buscando pendências...</p>
                    </div>
                ) : pendentes.length === 0 ? (
                    // ESTADO VAZIO (TUDO OK)
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                        <div className="bg-green-100 text-green-600 p-6 rounded-full mb-4 shadow-sm">
                            <CheckCircle2 size={48} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Tudo em dia!</h3>
                        <p className="text-gray-500 text-sm max-w-xs mt-2">
                            Nenhuma produção pendente. Você pode ver o histórico completo ou iniciar uma nova.
                        </p>
                        <button onClick={() => router.push('/')} className="mt-6 text-orange-600 font-bold text-sm hover:underline">
                            Voltar ao Início
                        </button>
                    </div>
                ) : (
                    // LISTA DE CARDS
                    <div className="space-y-4">
                        {pendentes.map((prod) => (
                            <Link 
                                href={`/avaliacao/${prod.id}`} 
                                key={prod.id} 
                                className="block bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all active:scale-95 group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-yellow-50 text-yellow-600 p-2.5 rounded-2xl">
                                            <ClipboardList size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-lg group-hover:text-orange-600 transition-colors">
                                                Fornada #{prod.id}
                                            </h3>
                                            <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                                                <Calendar size={12} />
                                                {new Date(prod.dataProducao).toLocaleDateString('pt-BR')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">
                                        Pendente
                                    </div>
                                </div>

                                {/* GRID DE DETALHES */}
                                <div className="bg-gray-50 rounded-2xl p-3 grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] uppercase font-bold text-gray-400">Farinha</span>
                                        <div className="flex items-center gap-2 text-gray-700 font-bold">
                                            <Wheat size={16} className="text-yellow-500"/>
                                            {prod.farinhaKg}kg
                                        </div>
                                    </div>
                                    <div className="space-y-1 border-l border-gray-200 pl-4">
                                        <span className="text-[10px] uppercase font-bold text-gray-400">Horário</span>
                                        <div className="flex items-center gap-2 text-gray-700 font-bold">
                                            <Clock size={16} className="text-blue-400"/>
                                            {formatarHora(prod.horaInicio)} - {formatarHora(prod.horaFim)}
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-orange-100 shadow-lg group-hover:bg-orange-700 transition-colors">
                                    Avaliar Agora <ArrowRight size={16} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}