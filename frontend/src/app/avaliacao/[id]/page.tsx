'use client'

import { ArrowLeft, AlertTriangle, Thermometer, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RevisaoAvaliacao() {
    const params = useParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [salvando, setSalvando] = useState(false);

    const [avaliacaoId, setAvaliacaoId] = useState<number | null>(null);

    const [prodData, setProdData] = useState({
        farinhaKg: '',
        fermentoGrama: '',
        emulsificanteMl: '',
        tempAmbienteInicial: '',
        tempAmbienteFinal: '',
    });

    // Estados da avaliação
    const [nota, setNota] = useState(0);
    const [tempFinalReal, setTempFinalReal] = useState('');
    const [comentario, setComentario] = useState('');

    // Opções de nota
    const opcoesNota = [
        { valor: 1, label: 'PÉSSIMO', color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' },
        { valor: 2, label: 'RUIM', color: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200' },
        { valor: 3, label: 'REGULAR', color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200' },
        { valor: 4, label: 'BOM', color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' },
        { valor: 5, label: 'EXCELENTE', color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' },
    ];

    useEffect(() => {
        async function fetchProducao() {
            try {
                const response = await fetch(`http://localhost:3000/producao/${params.id}`);
                if(!response) throw new Error('Erro ao fazer o fetch da produção');
                const data = await response.json();

                // Preenche os campos editáveis com o que já estava
                setProdData({
                    farinhaKg: data.farinhaKg,
                    fermentoGrama: data.fermentoGrama,
                    emulsificanteMl: data.emulsificanteMl,
                    tempAmbienteInicial: data.tempAmbienteInicial || '',
                    tempAmbienteFinal: data.tempAmbienteFinal || '',
                });

                // Se já tem avaliação
                if(data.avaliacao){
                    setAvaliacaoId(data.avaliacao.id);
                    setNota(data.avaliacao.nota);
                    setTempFinalReal(data.avaliacao.tempAmbienteFinalReal || '');
                    setComentario(data.avaliacao.comentario || '');
                }

            } catch (error) {
                alert('Produção não encontrada');
                router.back();
            } finally {
                setLoading(false);
            }
        }
        fetchProducao();
    }, [params.id, router]);

    async function handleFinalizar(){
        if(nota === 0) return alert('Selecione uma nota de classificação.');

        setSalvando(true);
        try {
            // Atualiza os dados da produção para caso tenham editado
            await fetch(`http://localhost:3000/producao/${params.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    farinhaKg: Number(prodData.farinhaKg),
                    fermentoGrama: Number(prodData.fermentoGrama),
                    emulsificanteMl: Number(prodData.emulsificanteMl),
                    tempAmbienteInicial: Number(prodData.tempAmbienteInicial),
                }),
            });

            // Cria a avaliação
            const payloadAvaliacao = {
                producaoId: Number(params.id),
                nota: nota,
                tempAmbienteFinalReal: Number(tempFinalReal),
                comentario: comentario,
            };

            let res;
            if(avaliacaoId){
                // Está editando
                res = await fetch(`http://localhost:3000/avaliacao/${avaliacaoId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payloadAvaliacao),
                });
            } else {
                // Está criando
                res = await fetch('http://localhost:3000/avaliacao', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payloadAvaliacao),
                });
            }
            
            if(!res.ok) throw new Error('Erro ao salvar avaliação');

            alert(avaliacaoId ? 'Avaliação atualizada com sucesso' : 'Avaliação registrada com sucesso');
            
            if(avaliacaoId){
                router.push('/producao/historico');
            } else {
                router.push('/avaliacao');
            }

        } catch (error) {
            console.error(error);
            alert('Erro ao processar');
        } finally {
            setSalvando(false);
        }
    }

    if(loading) return <div className="p-8 text-center text-gray-500">Carregando dados...</div>

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-20">
            <div className="max-w-xl mx-auto space-y-6">
                {/* Header para voltar */}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => router.back()} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Revisão & Avaliação</h1>
                </div>

                {/* Card para edição de dados */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4 text-orange-700 font-bold border-b border-orange-100 pb-2">
                        <AlertTriangle size={18} />
                        <h2>Conferência de Produção</h2>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">Se os valores reais utilizados foram diferentes do planejado, corrija abaixo antes de avaliar.</p>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Farinha (Kg)</label>
                            <input type="number" 
                                value={prodData.farinhaKg}
                                onChange={e => setProdData({...prodData, farinhaKg: e.target.value})}
                                className="w-full border-b border-gray-300 py-1 focus:border-orange-500 outline-none font-medium text-gray-800"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Fermento (g)</label>
                            <input type="number" 
                            value={prodData.fermentoGrama}
                            onChange={e => setProdData({ ...prodData, fermentoGrama: e.target.value})}
                            className="w-full border-b border-gray-300 py-1 focus:border-orange-500 outline-none font-medium text-gray-800"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Temp. Inicial (°C)</label>
                            <input type="number" 
                                value={prodData.tempAmbienteInicial}
                                onChange={e => setProdData({...prodData, tempAmbienteInicial: e.target.value})}
                                className="w-full border-b border-gray-300 py-1 focus:border-orange-500 outline-none font-medium text-gray-800"
                            />
                        </div>
                        <div>
                            {/* Apenas visualização da previsão */}
                            <label className="text-xs font-bold text-gray-400 uppercase">Previsão Final</label>
                            <div className="py-1 text-gray-400">{prodData.tempAmbienteFinal}°C</div>
                        </div>
                    </div>
                </div>

                {/* Temperatura Final Real */}
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                    <label className="flex items-center gap-2 text-blue-900 font-bold mb-2">
                        <Thermometer size={20} />
                        Temperatura Final Real (°C)
                    </label>
                    <input type="number" 
                        placeholder="Ex: 32"
                        value={tempFinalReal}
                        onChange={e => setTempFinalReal(e.target.value)}
                        className="w-full p-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-xl font-bold text-blue-900"
                    />
                    <p className="text-xs text-blue-500 mt-2">
                        Verfique a temperatura real na finalização
                    </p>
                </div>

                {/* Avaliação */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="font-bold text-gray-800 mb-4">Classificação de Qualidade</h2>
                    <div className="flex flex-col gap-2">
                        {opcoesNota.map((opcao) => (
                            <button key={opcao.valor}
                                onClick={() => setNota(opcao.valor)}
                                className={`p-3 rounded-lg font-bold text-sm border transition-all flex justify-between items-center
                                    ${nota === opcao.valor
                                        ? `${opcao.color} ring-2 ring-offset-1 ring-gray-300` : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}
                                    `}
                            >
                                <span>{opcao.valor}. {opcao.label}</span>
                                {nota === opcao.valor && <span>✔</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Observações */}
                <div>
                    <label className="block text-sm font-bold text-gray-500 mb-2">Comentários Finais</label>
                    <textarea className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    rows={3}
                    placeholder="Algum detalhe extra..."
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    ></textarea>
                </div>
                <button onClick={handleFinalizar}
                    disabled = {salvando}
                    className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-orange-700 transition-all disabled:opacity-50"
                >
                    {salvando ? 'Salvando...' : (avaliacaoId ? 'Atualizar Avaliação' : 'Finalizar Avaliação')}
                </button>
            </div>
        </div>
    )
}


// interface Producao {
//     id: number;
//     dataProducao: string;
//     horaInicio: string;
//     horaFim: string;
//     tempoFermentacaoMinutos: number;
//     farinhaKg: string;
//     observacoes: string | null;
// }

// export default function FormularAvaliacao(){
//     const params = useParams();
//     const router = useRouter();

//     const [producao, setProducao] = useState<Producao | null>(null);
//     const [loading, setLoading] = useState(true);

//     // Por que está criando um estado para cada campo do formulário?
//     const [nota, setNota] = useState(0);
//     const [status, setStatus] = useState('');
//     const [comentario, setComentario] = useState('');
//     const [salvando, setSalvando] = useState(false);

//     useEffect(() => {
//         async function fetchProducao(){
//             try{
                
//                 const response = await fetch(`http://localhost:3000/producao/${params.id}`);
//                 if(!response.ok) throw new Error("Erro ao buscar");
//                 const data = await response.json();
//                 setProducao(data);
//             } catch(error){
//                 alert("Produção não encontrada");
//                 router.push('/avaliacao');
//             } finally {
//                 setLoading(false);
//             }
//         }
//         fetchProducao();
//     }, [params.id, router]) // Muda quando o ID mudar mas por que rotuer?

//     async function handleSalvar(){
//         if(nota === 0 || !status){
//             alert('Por favor, selecione uma nota e um status');
//             return;
//         }

//         setSalvando(true);
//         try{
//             const payload = {
//                 producaoId: Number(params.id),
//                 nota: nota,
//                 status: status,
//                 comentario: comentario,
//             };

//             const response = await fetch('http://localhost:3000/avaliacao', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify(payload),
//             });

//             if(!response.ok){
//                 const erro = await response.json();
//                 throw new Error(erro.message || 'Erro ao salvar');
//             }

//             alert('Avaliação registrada com sucesso!');
//             router.push("/avaliacao");
//         } catch (error: any) {  // Não é má prática dizer que é do tipo any?
//             alert(error.message);
//         } finally {
//             setSalvando(true);
//         }
//     }

//     const opcoesStatus = [
//         {
//             label: 'RUIM', color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
//         },
//         {
//             label: 'REGULAR', color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200'
//         },
//         {
//             label: 'BOM', color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
//         },
//         {
//             label: 'EXCELENTE', color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
//         },
//     ];

//     if(loading) return <div className="p-10 text-center text-gray-500">Carregando formulário...</div>;

//     return (
//         <div className="min-h-screen bg-gray-50 p-4 flex justify-center items-start">
//             <div className="bg-white w-full max-w-lg rounded-xl shadow-lg border border-gray-100 overflow-hidden">
//                 {/* Cabeçalho */}
//                 <div className="bg-orange-600 p-6 text-white">
//                     <button onClick={() => router.back()} className="flex items-center gap-1 text-orange-100 hover:text-white mb-4 text-sm font-bold cursor-pointer">
//                         <ArrowLeft size={16} /> Voltar
//                     </button>
//                     <h1 className="text-2xl">Avaliar Fornada #{producao?.id}</h1>
//                     <div className="mt-2 flex gap-4 text-orange-100 text-sm opacity-90">
//                         <span className="flex items-center gap-1">
//                             <Calendar size={14} /> {new Date(producao?.horaInicio || '').toLocaleDateString('pt-BR')}
//                         </span>
//                         <span className="flex items-center gap-1">
//                             <Clock size={14} /> {producao?.tempoFermentacaoMinutos} min ferment.
//                         </span>
//                     </div>
//                 </div>

//                 <div className="p-6 space-y-8">
//                     {/* Seleção da nota */}
//                     <div className="text-center">
//                         <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Qualidade Geral</label>
//                         <div className="flex justify-center gap-2">
//                             {[1, 2, 3, 4, 5].map((valor) => (
//                                 <button key={valor} onClick={() => setNota(valor)} className="transition-transform hover:scale-110 focus:outline-none cursor-pointer">
//                                     <Star size={42} fill={valor <= nota ? "#F59E0B" : "none"} className={valor <= nota ? "text-orange-500" : "text-gray-300"}/>
//                                 </button>
//                             ))}
//                         </div>
//                         <p className="text-sm text-gray-400 mt-1 font-medium">
//                             {nota === 0 ? 'Toque para avaliar' : `${nota} de 5 estrelas`}
//                         </p>
//                     </div>
//                     <hr className="border-gray-100"/>

//                     {/* Seleção de status */}
//                     <div>
//                         <label className="block text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">Classificação</label>
//                         <div className="grid grid-cols-2 gap-3">
//                             {opcoesStatus.map((opcao) => (
//                                 <button key={opcao.label} onClick={() => setStatus(opcao.label)} 
//                                 className={`py-3 rounded-lg font-bold text-sm border-2 cursor-pointer transition-all ${status === opcao.label ? `${opcao.color} ring-2 ring-offset-1 ring-gray-300 scale-105` : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>
//                                     {opcao.label}
//                                 </button>
//                             ))}
//                         </div>
//                     </div>

//                     {/* Comentários */}
//                     <div>
//                         <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Observações Visuais</label>
//                         <textarea className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
//                         rows={3} placeholder="Ex.: Pão ficou um pouco cascudo, cor muito clara..." value={comentario} onChange={(e) => setComentario(e.target.value)}/>
//                     </div>

//                     {/* Botão de salvar */}
//                     <button onClick={handleSalvar} disabled={salvando} className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-orange-200 disabled:opacity-50 cursor-pointer">
//                         {salvando ? 'Salvando...' : (
//                             <>
//                                 <Save size={20} /> Confirmar Avaliação
//                             </>
//                         )}
//                     </button>
//                 </div>
//             </div>
//         </div>
//     )
// }