'use client'

import { ArrowLeft, Calendar, Clock, Save, Star } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Producao {
    id: number;
    dataProducao: string;
    horaInicio: string;
    horaFim: string;
    tempoFermentacaoMinutos: number;
    farinhaKg: string;
    observacoes: string | null;
}

export default function FormularAvaliacao(){
    const params = useParams();
    const router = useRouter();

    const [producao, setProducao] = useState<Producao | null>(null);
    const [loading, setLoading] = useState(true);

    // Por que está criando um estado para cada campo do formulário?
    const [nota, setNota] = useState(0);
    const [status, setStatus] = useState('');
    const [comentario, setComentario] = useState('');
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        async function fetchProducao(){
            try{
                
                const response = await fetch(`http://localhost:3000/producao/${params.id}`);
                if(!response.ok) throw new Error("Erro ao buscar");
                const data = await response.json();
                setProducao(data);
            } catch(error){
                alert("Produção não encontrada");
                router.push('/avaliacao');
            } finally {
                setLoading(false);
            }
        }
        fetchProducao();
    }, [params.id, router]) // Muda quando o ID mudar mas por que rotuer?

    async function handleSalvar(){
        if(nota === 0 || !status){
            alert('Por favor, selecione uma nota e um status');
            return;
        }

        setSalvando(true);
        try{
            const payload = {
                producaoId: Number(params.id),
                nota: nota,
                status: status,
                comentario: comentario,
            };

            const response = await fetch('http://localhost:3000/avaliacao', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
            });

            if(!response.ok){
                const erro = await response.json();
                throw new Error(erro.message || 'Erro ao salvar');
            }

            alert('Avaliação registrada com sucesso!');
            router.push("/avaliacao");
        } catch (error: any) {  // Não é má prática dizer que é do tipo any?
            alert(error.message);
        } finally {
            setSalvando(true);
        }
    }

    const opcoesStatus = [
        {
            label: 'RUIM', color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
        },
        {
            label: 'REGULAR', color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200'
        },
        {
            label: 'BOM', color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
        },
        {
            label: 'EXCELENTE', color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
        },
    ];

    if(loading) return <div className="p-10 text-center text-gray-500">Carregando formulário...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 flex justify-center items-start">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Cabeçalho */}
                <div className="bg-orange-600 p-6 text-white">
                    <button onClick={() => router.back()} className="flex items-center gap-1 text-orange-100 hover:text-white mb-4 text-sm font-bold">
                        <ArrowLeft size={16} /> Voltar
                    </button>
                    <h1 className="text-2xl">Avaliar Fornada #{producao?.id}</h1>
                    <div className="mt-2 flex gap-4 text-orange-100 text-sm opacity-90">
                        <span className="flex items-center gap-1">
                            <Calendar size={14} /> {new Date(producao?.horaInicio || '').toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock size={14} /> {producao?.tempoFermentacaoMinutos} min ferment.
                        </span>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Seleção da nota */}
                    <div className="text-center">
                        <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Qualidade Geral</label>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((valor) => (
                                <button key={valor} onClick={() => setNota(valor)} className="transition-transform hover:scale-110 focus:outline-none">
                                    <Star size={42} fill={valor <= nota ? "#F59E0B" : "none"} className={valor <= nota ? "text-orange-500" : "text-gray-300"}/>
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-gray-400 mt-1 font-medium">
                            {nota === 0 ? 'Toque para avaliar' : `${nota} de 5 estrelas`}
                        </p>
                    </div>
                    <hr className="border-gray-100"/>

                    {/* Seleção de status */}
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">Classificação</label>
                        <div className="grid grid-cols-2 gap-3">
                            {opcoesStatus.map((opcao) => (
                                <button key={opcao.label} onClick={() => setStatus(opcao.label)} 
                                className={`py-3 rounded-lg font-bold text-sm border-2 transition-all ${status === opcao.label ? `${opcao.color} ring-2 ring-offset-1 ring-gray-300 scale-105` : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>
                                    {opcao.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comentários */}
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Observações Visuais</label>
                        <textarea className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                        rows={3} placeholder="Ex.: Pão ficou um pouco cascudo, cor muito clara..." value={comentario} onChange={(e) => setComentario(e.target.value)}/>
                    </div>

                    {/* Botão de salvar */}
                    <button onClick={handleSalvar} disabled={salvando} className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-orange-200 disabled:opacity-50">
                        {salvando ? 'Salvando...' : (
                            <>
                                <Save size={20} /> Confirmar Avaliação
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}