'use client';

import { useEffect, useState } from "react";

import { Calendar, Clock, Thermometer, Trash2, Edit, Wheat, Droplets, FlaskConical, Star } from "lucide-react";

interface Avaliacao {
    id: number;
    nota: number;
    status: string;
    comentario: string | null;
}

interface Producao {
    id: number;
    dataProducao: string;
    horaInicio: string;
    horaFim: string;
    tempoFermentacaoMinutos: number;
    farinhaKg: string;  // Backend manda decimal como string por causa da precisão
    fermentoGrama: string;
    emulsificanteMl: string;
    tempAmbienteInicial: string | null;
    tempAmbienteFinal: string | null;
    observacoes: string | null;
    avaliacao?: Avaliacao | null;   // Pode vir do backend
}

export default function HistoricoProducao() {
    const [producoes, setProducoes] = useState<Producao[]>([]);
    const [loading, setLoading] = useState(true);

    // Para buscar dados asssim que a tela carrega
    useEffect(() => {
        async function fetchProducoes(){
            try{
                const response = await fetch('http://localhost:3000/producao');
                const data: Producao[] = await response.json();
                const ordenado = data.sort((a, b) => b.id - a.id);
                setProducoes(ordenado);
            } catch (error){
                console.error('Erro ao buscar histórico: ', error);
                alert("Erro ao carregar dados.");
            } finally {
                setLoading(false);
            }
        }

        fetchProducoes();
    }, []);

    // Função para formatar data
    const formatarData = (isoString: string) => {
        if(!isoString) return '-';

        return new Date(isoString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
        }) + ' ' + new Date(isoString).toLocaleTimeString('pt-BR', {
            hour: '2-digit', 
            minute: '2-digit',
        });
    };

    // Função para formatar minutos em horas
    const formatarTempo = (minutos:number) => {
        const h = Math.floor(minutos/60);
        const m = minutos % 60;
        return `${h}h ${m > 0 ? `${m}m` : ''} ferment.`;
    };

    const handleDelete = async (id: number) => {
        // Confirma exclusão
        const confirmacao = confirm(`Tem certeza que deseja excluir a produção #${id}? Essa ação não pode ser desefeita.`);
        
        // Se recusar
        if(!confirmacao) return;

        try {
            // Chamada o backend
            const response = await fetch(`http://localhost:3000/producao/${id}`, {
                method: 'DELETE',
            });

            if(!response.ok){
                throw new Error('Erro ao excluir no servidor');
            }

            // Atualiza a lista na tela sem precisar atualizar a página (UI Optimistic Update)
            setProducoes((listaAtual) => listaAtual.filter((prod) => prod.id !== id));  // Função filtra, retornando todos as produções que não são o ID removido

            alert('Produção excluída com sucesso.');
        } catch (error) {
            console.log(error);
            alert("Erro ao excluir. Tente novamente");
        }
    }

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'EXCELENTE': return 'bg-green-100 text-green-700 border-green-200';
            case 'BOM': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'REGULAR': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'RUIM': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Histórico de Produção</h1>
                    <a href="/producao/novo" className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">+ Nova Produção</a>
                </div>
                {loading ? (
                    <p className="text-center text-gray-500 mt-10">Carregando dados...</p>) : producoes.length === 0 ? (
                        <div className="text-center p-10 bg-white rounded-lg shadow border border-gray-200">
                            <p className="text-gray-500 mb-4">Nenhuma produção registrada ainda.</p>
                            <a href="/producao/novo" className="text-orange-600 font-bold hover:underline">Começar agora</a>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {producoes.map((prod) => (
                                <div key={prod.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative">
                                    {/* Cabeçalho */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-800"> Fornada #{prod.id}</h3>
                                            {/* Badge de status */}
                                            {prod.avaliacao ? (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-xs px-2 py-1 rounded border font-bold ${getStatusColor(prod.avaliacao.status)}`}>
                                                        {prod.avaliacao.status}
                                                    </span>
                                                    <div className="flex items-center text-orange-500">
                                                        <Star size={14} fill="currentColor"/>
                                                        <span className="text-xs font-bold ml-1">
                                                            {prod.avaliacao.nota}/5
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="inline-block bg-gray-100 text-gray-500 border border-gray-200 text-xs px-2 py-1 rounded mt-1 font-medium">
                                                    Pendente Avaliação
                                                </span>
                                            )}
                                        </div>

                                        {/* Botões de ação */}
                                            <div className="flex gap-3">
                                                <button className="text-blue-500 hover:text-blue-700 transition-colors p-1" title="Editar">
                                                    <Edit size={20}/>
                                                </button>
                                                <button onClick={() => handleDelete(prod.id)} className="text-red-400 hover:text-red-600 transition-colors p-1" title="Excluir">
                                                    <Trash2 size={20}/>
                                                </button>
                                            </div>
                                    </div>
                                    {/* Info Principal */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-sm text-gray-600">
                                        {/* Coluna da esquerda */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-orange-500" />
                                                <span className="font-medium">{formatarData(prod.horaInicio)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} className="text-orange-500" />
                                                <span>{formatarTempo(prod.tempoFermentacaoMinutos)}</span>
                                            </div>
                                        </div>

                                        {/* Coluna direita */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Thermometer size={16} className="text-red-500" />
                                                <span>
                                                    {prod.tempAmbienteInicial ? `${prod.tempAmbienteInicial}°` : '--'}
                                                    {' ➜ '}
                                                    {prod.tempAmbienteFinal ? `${prod.tempAmbienteFinal}°` : '--'}
                                                </span>
                                            </div>
                                            {/* Exemplo de cálculo: g de fermento por kg */}
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <FlaskConical size={16} />
                                                <span>
                                                    {(Number(prod.fermentoGrama) / Number(prod.farinhaKg)).toFixed(1)}g ferm/kg
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rodapé */}
                                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                        <div className="flex items-center gap-1.5">
                                            <Wheat size={16} className="text-yellow-600" />
                                            <span className="font-semibold text-gray-700">Farinha:</span> {prod.farinhaKg}kg
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Droplets size={16} className="text-blue-400" />
                                            <span className="font-semibold text-gray-700">Emulsif.:</span> {prod.emulsificanteMl}ml
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <FlaskConical size={16} className="text-purple-500" />
                                            <span className="font-semibold text-gray-700">Fermento:</span> {prod.fermentoGrama}g
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
            </div>
        </div>
    )

}