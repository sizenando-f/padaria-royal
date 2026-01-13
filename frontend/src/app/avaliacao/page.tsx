'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, Clock10, Flame, Wheat } from "lucide-react";

interface Producao {
    id: number;
    dataProducao: string;
    horaInicio: string;
    horaFim: string;
    tempoFermentacaoMinutos: number;
    farinhaKg: string;
};

export default function ListaPendentes(){
    const [pendentes, setPendentes] = useState<Producao[]>([])
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPendentes() {
            try{
                const response = await fetch('http://localhost:3000/producao/pendentes');
                const data = await response.json();
                setPendentes(data);
            } 
            catch(error){
                console.error("Erro:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchPendentes();
    }, []);

    const formatarData = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
        }) + ' ' + new Date(isoString).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        })
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Avaliação de Qualidade</h1>
                <p className="text-gray-500 mb-6">Você tem <strong className="text-orange-600">{pendentes.length}</strong> produções aguardando análise.</p>

                {loading ? (
                    <p className="text-center text-gray-400">Carregando...</p>
                ) : pendentes.length === 0 ? (
                    <div className="bg-white p-10 rounded-xl shadow text-center">
                        <h3 className="text-lg font-bold text-gray-700">Tudo em dia</h3>
                        <p className="text-gray-500">Nenhuma produção pendente de avaliação.</p>
                        <Link href={"/"} className="inline-block mt-4 text-orange-600 font-bold hover:underline">Voltar ao Início</Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pendentes.map((prod) => (
                            <div key={prod.id} className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-yellow-400 hover:shadow-md transition-all">
                                <div className="flex justify-between items-center">
                                    {/* Informações resumidas */}
                                    <div className="w-full">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-lg text-gray-800">Fornada #{prod.id}</h3>
                                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                                                {new Date(prod.dataProducao).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                        {/* Com detalhes extras */}
                                        <div className="flex gap-4">
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <p className="flex gap-1 items-center">
                                                    <Wheat size={16}/>
                                                    <span className="font-medium">Farinha:</span>
                                                    {prod.farinhaKg}kg
                                                </p>
                                                <p className="flex gap-1 items-center">
                                                    <Clock size={16}/>
                                                    <span className="font-medium">Início:</span>
                                                    {new Date(prod.horaInicio).toLocaleTimeString('pt-BR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <p className="flex gap-1 items-center">
                                                    <Flame size={16}/>
                                                    <span className="font-medium">Temp. Fermentação:</span>
                                                    {prod.tempoFermentacaoMinutos / 60}h {prod.tempoFermentacaoMinutos % 60}m
                                                </p>
                                                <p className="flex gap-1 items-center">
                                                    <Clock10 size={16}/>
                                                    <span className="font-medium">Fim:</span>
                                                    {new Date(prod.horaFim).toLocaleTimeString('pt-BR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botão que leva pro formulário */}
                                    <Link href={`/avaliacao/${prod.id}`} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-700 transition-colors flex items-center gap-2"
                                    >Avaliar <ArrowRight size={18}/></Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}