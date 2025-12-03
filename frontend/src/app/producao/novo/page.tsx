'use client';

import React, { useState, useEffect } from "react";

export default function NovaProducao(){
    // Memória para salvar estado de carregamento 
    const [loading, setLoading] = useState(false);

    // É a memória do componente que salva o que o usuário digita
    const [formData, setFormData] = useState({
        dataProducao: '',
        horaInicio: '',
        horaFim: '',
        farinhaKg: '',
        emulsificanteMl: '',
        fermentoGrama: '',
        observacoes: '',
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
            setFormData({
                dataProducao: '',
                horaInicio: '',
                horaFim: '',
                farinhaKg: '',
                emulsificanteMl: '',
                fermentoGrama: '',
                observacoes: '',
            });

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
        setFormData((prev) => ({ ...prev, [name]: value}));
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
                    <div className="grid grid-cols-2 gap-4">
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Farinha (Kg)</label>
                        <input type="number"
                        step={0.1}
                        name="farinhaKg"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 outline-none focus:border-orange-500"
                        placeholder="Ex: 10.5"
                        value={formData.farinhaKg}
                        onChange={handleChange}/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Emulsificante (ml)</label>
                            <input type="number" 
                            name="emulsificanteMl"
                            className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none focus:border-orange-500"
                            value={formData.emulsificanteMl}
                            onChange={handleChange}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fermento (g)</label>
                            <input type="number" 
                            name="fermentoGrama"
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 outline-none focus:border-orange-500"
                            value={formData.fermentoGrama}
                            onChange={handleChange}/>
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
