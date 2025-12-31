'use client';

import React, { useState, useEffect } from "react";
import { Wand2, Loader2, ThermometerSun, Info, Thermometer, Wheat, FlaskConical, Droplets} from "lucide-react";

export default function NovaProducao(){
    // Memória para salvar estado de carregamento 
    const [loading, setLoading] = useState(false);
    // Para a sugestão inteligente
    const [sugerindo, setSugerindo] = useState(false);

    // Para mostrar as "Provas"
    const [provasIA, setProvasIA] = useState<any[] | null>(null);
    const [mensagemIA, setMensagemIA] = useState('');

    // É a memória do componente que salva o que o usuário digita
    const [formData, setFormData] = useState({
        dataProducao: '',
        horaInicio: '',
        horaFim: '',
        farinhaKg: '',
        emulsificanteMl: '',
        fermentoGrama: '',
        observacoes: '',
        tempAmbienteInicial: '',
        tempAmbienteFinal: '',
    });

    // Para a visualização do tempo
    const [tempoEstimado, setTempoEstimado] = useState<string | null>(null);

    // Pré-preenchimento ao carregar a tela
    useEffect(() => {
        const agora = new Date();

        //Pegamos o horário local formatado corretamente
        const formatarDataLocal = (data: Date) => {
            const offset = data.getTimezoneOffset() * 60000; // Diferença MS -> UTC em milisegundos
            const dataLocal = new Date(data.getTime() - offset);
            return dataLocal.toISOString().slice(0, 16); // Pega só YYY-MM-DDTHH:MM
        };

        const inicioSugestao = formatarDataLocal(agora);

        // Sugere fim para 6 horas depois
        const futuro = new Date(agora.getTime() + 6 * 60 * 60 * 1000);
        const fimSugestao = formatarDataLocal(futuro);

        setFormData(prev => ({
            ...prev,
            horaInicio: inicioSugestao,
            horaFim: fimSugestao,
            dataProducao: new Date().toISOString().split('T')[0] // Apenas YYYY-MM-DD
        }));
    }, []); // Rodar apenas uma vez quando a tela abrir

    useEffect(() => {
        if(formData.horaInicio && formData.horaFim){
            const inicio = new Date(formData.horaInicio);
            const fim = new Date(formData.horaFim);

            const diffMs = fim.getTime() - inicio.getTime();

            if(diffMs > 0){
                const totalMinutos = Math.floor(diffMs / 60000);
                const horas = Math.floor(totalMinutos / 60);
                const minutos = totalMinutos % 60;
                setTempoEstimado(`${horas}h ${minutos}min`);
            } else {
                setTempoEstimado('Horário inválido (Fim antes do ínicio)');
            }
        }
    }, [formData.horaInicio, formData.horaFim]); // Roda sempre que essas variáveis mudarem

    // Função para lidar quando o usário fazer o submit do formulário
    async function handleSubmit(e: React.FormEvent){
        e.preventDefault(); // Pra não atualizar a página
        setLoading(true);   // Inicia o carregamento

        // Try porque vai lidar com fetch
        try{
            // O input datetime-local do HTML retorna num formato incorreto
            // Como o backend espera o formato ISO, fazemos a conversão
            const dataInicioISO = new Date(formData.horaInicio).toISOString();
            const dataFimISO = new Date(formData.horaFim).toISOString();

            // Preparamos o "recheio" para enviar
            const payload = {
                horaInicio: dataInicioISO,
                horaFim: dataFimISO,
                farinhaKg: Number(String(formData.farinhaKg).replace(',', '.')), // Replace pra garantir que seja ponto
                emulsificanteMl: Number(String(formData.emulsificanteMl).replace(',', '.')),
                fermentoGrama: Number(String(formData.fermentoGrama).replace(',','.')),
                observacoes: formData.observacoes,
                tempAmbienteInicial: formData.tempAmbienteInicial ? Number(formData.tempAmbienteInicial.replace(',', '.')) : null,
                tempAmbienteFinal: formData.tempAmbienteFinal ? Number(formData.tempAmbienteFinal.replace(',', '.')) : null
            };

            // Aqui o Frontend liga para o backend
            const response = await fetch('http://localhost:3000/producao', {
                // Método para enviar
                method: 'POST',
                // Avisando que é do tipo JSON
                headers: {
                    'Content-Type': 'application/json',
                },
                // O "recheio" é convertido para string no body
                body: JSON.stringify(payload),
            });

            // Se vier resposta negativa então deu errado
            if(!response.ok){
                // Joga o erro
                throw new Error('Erro ao registrar produção');
            }

            // Caso contrário deu certo
            alert('Produção registrada com sucesso!');

            // Reinicia o formulário por usabilidade
            setFormData((prev) => ({
                dataProducao: prev.dataProducao,
                horaInicio: prev.horaInicio,
                horaFim: prev.horaFim,
                farinhaKg: '',
                emulsificanteMl: '',
                fermentoGrama: '',
                observacoes: '',
                tempAmbienteInicial: '',
                tempAmbienteFinal: '',
            }));

        // Mostra o erro caso ocorra
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar. Verifique se o Backend está rodando.');
        
        // Executa independente se deu certo ou não
        } finally {
            // Para o carregamento
            setLoading(false);
        }
    }

    // Função genérica para atualizar os inputs enquanto digita
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        // pega o nome e o valor do input qualquer
        const {name, value} = e.target;
        // Atualiza apenas aquele que mudou mantendo os antigos intactos
        setFormData(prev => ({ ...prev, [name]: value}));
    }

    // Lógica de sugestão inteligente
    async function pedirSugestao(){
        const farinha = Number(formData.farinhaKg.replace(',', '.'));
        const tIni = formData.tempAmbienteInicial ? Number(formData.tempAmbienteInicial) : undefined;
        const tFim = formData.tempAmbienteFinal ? Number(formData.tempAmbienteFinal) : undefined;


        if(!farinha || farinha < 0){
            alert('Digite a quantidade de farinha primeiro.');
            return;
        }

        setSugerindo(true);
        setProvasIA(null);

        try{
            let url = `http://localhost:3000/producao/sugestao?farinha=${farinha}`;
            if(tIni) url += `&temp=${tIni}`;
            if(tFim) url += `&tempFim=${tFim}`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.base === 0) {
                alert('Ainda não temos históricos "Excelentes" suficientes para sugerir.');
                return;
            }

            // Aplica alteração no fermento
            setFormData(prev => ({
                ...prev,
                fermentoGrama: data.fermento,
            }));

            setProvasIA(data.provas);
            setMensagemIA(data.mensagem);

        } catch (error) {
            console.error(error);
        } finally{
            setSugerindo(false);
        }
    }

    return (
        <div className="min-h-screen bg-amber-50 p-8 flex justify-center items-start">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg border border-amber-100">
                <h1 className="text-2xl font-bold text-orange-800 mb-6">Nova Produção</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Data de Referência</label>
                        <input type="date" name="dataProducao"
                        value={formData.dataProducao}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-gray-600 bg-gray-50"/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Início Real</label>
                            <input type="datetime-local" name="horaInicio"
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                            value={formData.horaInicio}
                            onChange={handleChange}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fim (Previsão)</label>
                            <input type="datetime-local" 
                            name="horaFim"
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                            value={formData.horaFim}
                            onChange={handleChange}/>
                        </div>
                    </div>

                    {/* BLOCO VISUAL DE CÁLCULO */}
                    {tempoEstimado && (
                        <div className={`p-3 rounded-lg text-center font-medium border ${tempoEstimado.includes('inválido') ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>Tempo de Fermentação: {tempoEstimado}</div>
                    )}

                    {/* CAMPO DE TEMPERATURA */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <label className="flex items-center gap-2 text-sm font-bold text-blue-800 mb-1">
                                <ThermometerSun size={18} /> Temp. Inicial (°C)
                            </label>
                            <input type="number" name="tempAmbienteInicial"
                            className="w-full rounded-md border border-blue-200 p-2 text-blue-900 focus:ring-blue-500 outline-none"
                            placeholder="Ex: 29"
                            value={formData.tempAmbienteInicial}
                            onChange={handleChange} />
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <label className="flex items-center gap-2 text-sm font-bold text-blue-800 mb-1">
                                <ThermometerSun size={18} /> Temp. Final (°C)
                            </label>
                            <input type="number" name="tempAmbienteFinal"
                                className="w-full rounded-md border border-blue-200 p-2 text-blue-900 focus:ring-blue-500 outline-none"
                                placeholder="Ex: 32"
                                value={formData.tempAmbienteFinal}
                                onChange={handleChange} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Farinha (Kg)</label>
                        <div className="flex gap-2">
                            <input type="text" inputMode="decimal"
                            step={0.1}
                            name="farinhaKg"
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 outline-none focus:border-orange-500"
                            placeholder="Ex: 10.5"
                            value={formData.farinhaKg}
                            onChange={handleChange}
                            />

                            {/* Botão de susgestão inteligente */}
                            <button type="button" onClick={pedirSugestao}
                            className="mt-1 bg-purple-600 text-white px-4 rounded-md border border-purple-200 hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-bold whitespace-nowrap shadow-sm"
                            title="Calcular fermento ideal para este clima">
                                {sugerindo ? <Loader2 className="animate-spin" size={18}/> : <Wand2 size={18}/>}
                                Sugestão IA
                            </button>
                        </div>
                    </div>

                    {/* Bloco para as provas */}
                    {provasIA && provasIA.length > 0 && (
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-sm animate-fade-in mt-2">
                            {/* Mensagem do Backend */}
                            <div className="flex items-center gap-2 text-purple-800 font-bold mb-3 border-b border-purple-200 pb-2">
                                <Info size={18} />
                                <span>{mensagemIA}</span>
                            </div>
                            
                            <p className="text-xs text-purple-600 mb-3 font-medium uppercase tracking-wide">Top 3 registros usados:</p>

                            <div className="grid grid-cols-1 gap-2">
                                {provasIA.map((prova) => (
                                    <div key={prova.id} className="bg-white p-3 rounded-lg border border-purple-200 shadow-sm flex justify-between items-center hover:bg-purple-50 transition-colors">
                                        <div>
                                            <span className="font-bold text-purple-900 block">Fornada #{prova.id}</span>
                                            <div className="flex gap-1.5">
                                                <Thermometer size={16}/>
                                            <span className="text-xs text-gray-500">{prova.tIni}°C ➜ {prova.tFim ? `${prova.tFim}°C` : '?'}</span>
                                            </div>
                                            
                                        </div>
                                        <div className="text-right text-xs text-gray-600 space-y-1">
                                            <div className="flex gap-1.5">
                                                <Wheat size={16}/> {prova.farinha}kg Farinha
                                            </div>
                                            <div className="flex gap-1.5 font-bold text-purple-700">
                                                <FlaskConical size={16}/> {prova.fermento}g Fermento
                                            </div>
                                            <div className="flex gap-1.5">
                                                <Droplets size={16} /> {prova.emulsificante}ml Emulsif.
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Digite a farinha e clique na varinha para calcular o fermento</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Emulsificante (ml)</label>
                            <input type="number" 
                            name="emulsificanteMl"
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 outline-none focus:border-orange-500"
                            value={formData.emulsificanteMl}
                            onChange={handleChange}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fermento (g)</label>
                            <div className="relative">
                                <input type="number" 
                                name="fermentoGrama"
                                className={`mt-1 block w-full rounded-md border transition-all p-2 outline-none ${provasIA ? 'border-purple-400 bg-purple-50 font-bold text-purple-900' : 'border-gray-300'}`}
                                value={formData.fermentoGrama}
                                onChange={handleChange}/>
                                {provasIA && <span className="absolute right-2 top-3 text-xs text-purple-500 font-bold">Sugerido</span>}
                            </div>     
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Observações</label>
                        <textarea name="observacoes"
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 outline-none focus:border-orange-500"
                        rows={3}
                        placeholder="Ex: Massa ficou um pouco mole..."
                        value={formData.observacoes}
                        onChange={handleChange}></textarea>
                    </div>
                    
                    <button type="submit"
                    disabled={loading}
                    className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition-colors disabled:opacity-50">
                        {loading ? 'Salvando...' : 'Registrar Produção'}
                    </button>
                </form>
            </div>
        </div>
    )
} 
