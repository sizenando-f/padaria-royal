'use client';

import React, { useState, useEffect } from "react";
import { 
    Wand2, Loader2, ThermometerSun, Info, Wheat, 
    FlaskConical, CloudSun, Clock, Calendar, CheckCircle,
    MessageSquare, FileText, Thermometer, Star, Droplets
} from "lucide-react";
import Toast from "@/app/components/Toast";

export default function NovaProducao(){
    // Estados
    const [loading, setLoading] = useState(false);
    const [sugerindo, setSugerindo] = useState(false);
    const [provasIA, setProvasIA] = useState<any[] | null>(null);
    const [mensagemIA, setMensagemIA] = useState('');
    const [buscandoClima, setBuscandoClima] = useState(false);
    
    const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

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

    useEffect(() => {
        const agora = new Date();
        const formatarDataLocal = (data: Date) => {
            const offset = data.getTimezoneOffset() * 60000; 
            const dataLocal = new Date(data.getTime() - offset);
            return dataLocal.toISOString().slice(0, 16); 
        };

        const inicioSugestao = formatarDataLocal(agora);
        const futuro = new Date(agora.getTime() + 7 * 60 * 60 * 1000);
        const fimSugestao = formatarDataLocal(futuro);

        setFormData(prev => ({
            ...prev,
            horaInicio: inicioSugestao,
            horaFim: fimSugestao,
            dataProducao: new Date().toISOString().split('T')[0]
        }));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({ ...prev, [name]: value}));
    }

    const adicionarHoras = (horas: number) => {
        if (!formData.horaInicio) {
            setToast({ msg: 'Defina a hora de início primeiro.', type: 'error' });
            return;
        }
        const dataInicio = new Date(formData.horaInicio);
        dataInicio.setHours(dataInicio.getHours() + horas);
        
        const offset = dataInicio.getTimezoneOffset() * 60000;
        const isoLocal = new Date(dataInicio.getTime() - offset).toISOString().slice(0, 16);
        setFormData(prev => ({ ...prev, horaFim: isoLocal }));
    };

    async function buscarTemperaturas(){
        if(!formData.horaInicio || !formData.horaFim){
            setToast({ msg: "Preencha os horários de Início e Fim.", type: 'error' });
            return;
        }
        setBuscandoClima(true);
        try{
            const dInicio = new Date(formData.horaInicio);
            const dFim = new Date(formData.horaFim);

            const query = new URLSearchParams({
                inicio: dInicio.toISOString(),
                fim: dFim.toISOString()
            }).toString();

            const res = await fetch(`http://localhost:3000/producao/clima-previsao?${query}`);
            const data = await res.json();

            if(data && data.tempInicial !== null){
                setFormData(prev => ({
                    ...prev,
                    tempAmbienteInicial: data.tempInicial.toString(),
                    tempAmbienteFinal: data.tempFinal.toString()
                }));
            } else {
                setToast({ msg: data.aviso || "Sem previsão disponível.", type: 'error' });
            }
        } catch (error) {
            console.error(error);
            setToast({ msg: "Erro de conexão com API de clima.", type: 'error' });
        } finally{
            setBuscandoClima(false);
        }
    }

    async function pedirSugestao(){
        const farinhaStr = String(formData.farinhaKg);
        const farinha = Number(farinhaStr.replace(',', '.'));
        
        const tIni = formData.tempAmbienteInicial;
        const tFim = formData.tempAmbienteFinal;

        let minutosAlvo = undefined;
        if(formData.horaInicio && formData.horaFim) {
            const d1 = new Date(formData.horaInicio);
            const d2 = new Date(formData.horaFim);
            const diffMs = d2.getTime() - d1.getTime();
            if(diffMs > 0) minutosAlvo = Math.floor(diffMs / 60000);
        }

        if(!farinha || farinha <= 0) {
            setToast({ msg: 'Digite a quantidade de farinha primeiro.', type: 'error' });
            return;
        }

        setSugerindo(true);
        setProvasIA(null);

        try{
            let url = `http://localhost:3000/producao/sugestao?farinha=${farinha}`;
            if(tIni) url += `&temp=${tIni}`;
            if(tFim) url += `&tempFim=${tFim}`;
            if(minutosAlvo) url += `&minutos=${minutosAlvo}`;

            const res = await fetch(url);
            const data = await res.json();
            
            setFormData(prev => ({ ...prev, fermentoGrama: data.fermento }));
            setProvasIA(data.provas);
            setMensagemIA(data.mensagem);
        } catch (error) {
            console.error(error);
            setToast({ msg: "Erro ao buscar sugestão.", type: 'error' });
        } finally{
            setSugerindo(false);
        }
    }

    const safeParse = (valor: any) => {
        if (!valor) return 0;
        return Number(String(valor).replace(',', '.'));
    };

    async function handleSubmit(e: React.FormEvent){
        e.preventDefault();
        setLoading(true);
        try{
            const payload = {
                horaInicio: new Date(formData.horaInicio).toISOString(),
                horaFim: new Date(formData.horaFim).toISOString(),
                farinhaKg: safeParse(formData.farinhaKg),
                emulsificanteMl: safeParse(formData.emulsificanteMl),
                fermentoGrama: safeParse(formData.fermentoGrama),
                observacoes: formData.observacoes,
                tempAmbienteInicial: formData.tempAmbienteInicial ? safeParse(formData.tempAmbienteInicial) : null,
                tempAmbienteFinal: formData.tempAmbienteFinal ? safeParse(formData.tempAmbienteFinal) : null
            };

            const res = await fetch('http://localhost:3000/producao', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if(!res.ok) {
                throw new Error(data.message || 'Erro ao salvar');
            }
            
            setToast({ msg: 'Produção Iniciada com Sucesso!', type: 'success' });
            
            setTimeout(() => {
                window.location.href = '/'; 
            }, 1500);

        } catch (error: any) {
            console.error(error);
            setToast({ msg: error.message || 'Erro ao salvar produção.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-6 px-4 md:px-0">
            
            {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            
            <div className="w-full max-w-lg mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Nova Produção</h1>
                    <p className="text-sm text-gray-500">Planejamento inteligente</p>
                </div>
                <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Calendar size={14} /> {new Date().toLocaleDateString('pt-BR')}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-6 pb-24">
                
                {/* Card de tempo */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4 text-gray-800 font-bold">
                        <Clock className="text-orange-500" size={20} />
                        <h2>Cronograma</h2>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide ml-1">Início da Batida</label>
                            <input 
                                type="datetime-local" 
                                name="horaInicio"
                                required
                                value={formData.horaInicio}
                                onChange={handleChange}
                                className="w-full mt-1 bg-gray-50 border border-gray-200 text-gray-900 text-lg rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent p-3 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide ml-1">Previsão de Forno</label>
                            <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
                                {[7, 8, 12].map(h => (
                                    <button 
                                        key={h}
                                        type="button" 
                                        onClick={() => adicionarHoras(h)} 
                                        className="whitespace-nowrap flex-1 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:border-orange-500 hover:text-orange-600 active:bg-orange-50 transition-all"
                                    >
                                        +{h}h
                                    </button>
                                ))}
                            </div>
                            <input 
                                type="datetime-local" 
                                name="horaFim"
                                required
                                value={formData.horaFim}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-lg rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent p-3 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Card de clima */}
                <div className="bg-linear-to-br from-blue-50 to-white p-5 rounded-3xl shadow-sm border border-blue-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CloudSun size={100} className="text-blue-500"/>
                    </div>

                    <div className="flex justify-between items-center mb-4 relative z-10">
                        <div className="flex items-center gap-2 text-blue-900 font-bold">
                            <ThermometerSun size={20} />
                            <h2>Clima & Ambiente</h2>
                        </div>
                        <button 
                            type="button"
                            onClick={buscarTemperaturas}
                            disabled={buscandoClima}
                            className="bg-white/80 backdrop-blur text-blue-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm border border-blue-200 hover:bg-white transition-all flex items-center gap-2"
                        >
                            {buscandoClima ? <Loader2 className="animate-spin" size={14}/> : '🔄 Atualizar'}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="bg-white/60 p-3 rounded-2xl border border-blue-100">
                            <label className="text-[10px] font-bold text-blue-400 uppercase">Inicial</label>
                            <div className="flex items-end">
                                <input 
                                    type="number" 
                                    name="tempAmbienteInicial"
                                    placeholder="--"
                                    value={formData.tempAmbienteInicial}
                                    onChange={handleChange}
                                    className="bg-transparent w-full text-2xl font-bold text-blue-900 outline-none p-0"
                                />
                                <span className="text-sm text-blue-400 mb-1">°C</span>
                            </div>
                        </div>
                        <div className="bg-white/60 p-3 rounded-2xl border border-blue-100">
                            <label className="text-[10px] font-bold text-blue-400 uppercase">Final Prev.</label>
                            <div className="flex items-end">
                                <input 
                                    type="number" 
                                    name="tempAmbienteFinal"
                                    placeholder="--"
                                    value={formData.tempAmbienteFinal}
                                    onChange={handleChange}
                                    className="bg-transparent w-full text-2xl font-bold text-blue-900 outline-none p-0"
                                />
                                <span className="text-sm text-blue-400 mb-1">°C</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card de igrendientes e IA */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4 text-gray-800 font-bold">
                        <Wheat className="text-yellow-500" size={20} />
                        <h2>Receita Base</h2>
                    </div>

                    <div className="space-y-5">
                        {/* Farinha */}
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide ml-1">Farinha (Kg)</label>
                            <div className="flex gap-2 mt-1">
                                <input 
                                    type="number" 
                                    step="0.1"
                                    name="farinhaKg"
                                    required
                                    placeholder="Ex: 10"
                                    value={formData.farinhaKg}
                                    onChange={handleChange}
                                    className="flex-1 min-w-0 bg-gray-50 border border-gray-200 text-gray-900 text-xl font-medium rounded-2xl focus:ring-2 focus:ring-yellow-400 p-3 outline-none"
                                />
                                <button 
                                    type="button" 
                                    onClick={pedirSugestao}
                                    className="shrink-0 w-auto bg-purple-600 text-white px-4 rounded-2xl shadow-lg shadow-purple-200 hover:bg-purple-700 active:scale-95 transition-all flex flex-col items-center justify-center"
                                >
                                    {sugerindo ? <Loader2 className="animate-spin" size={20}/> : <Wand2 size={20}/>}
                                    <span className="text-[10px] font-bold mt-1">IA</span>
                                </button>
                            </div>
                        </div>

                        {/* Resultados inteligentes */}
                        {provasIA && (
                            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 animate-fade-in">
                                <div className="flex items-center gap-2 text-purple-900 font-bold mb-3 text-sm border-b border-purple-200 pb-2">
                                    <Info size={16} />
                                    <span>{mensagemIA}</span>
                                </div>
                                
                                <div className="space-y-3">
                                    {provasIA.map((prova) => (
                                        <div key={prova.id} className="bg-white p-3 rounded-xl border border-purple-100 shadow-sm flex flex-col gap-2 relative overflow-hidden">
                                            
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-800">Fornada #{prova.id}</span>
                                                {prova.nota === 5 && (
                                                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-200">
                                                        <Star size={10} fill="currentColor" /> Excelente
                                                    </span>
                                                )}
                                                {prova.nota === 4 && (
                                                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                                                        Bom
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                                                <div className="space-y-1 border-r border-gray-200 pr-2">
                                                    <div className="flex items-center gap-1">
                                                        <Thermometer size={12} className="text-red-400"/>
                                                        <span>{prova.tIni}° ➜ {prova.tFim}°</span>
                                                    </div>
                                                    {prova.tReal ? (
                                                        <div className="font-bold text-blue-600 bg-blue-50 px-1 rounded w-fit">
                                                            Real: {prova.tReal}°
                                                        </div>
                                                    ) : <span className="text-gray-400 text-[10px] italic">Sem temp. real</span>}
                                                </div>

                                                <div className="space-y-1 pl-1">
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={12} className="text-orange-400"/>
                                                        <span>{Math.floor(prova.tempo/60)}h{prova.tempo%60}m</span>
                                                    </div>
                                                    <div className="flex justify-between gap-1">
                                                        <div className="flex items-center gap-1" title="Farinha">
                                                            <Wheat size={12} className="text-yellow-500"/>
                                                            <span>{prova.farinha}kg</span>
                                                        </div>
                                                        <div className="flex items-center gap-1" title="Emulsificante">
                                                            <Droplets size={12} className="text-blue-400"/>
                                                            <span>{prova.emulsificante}ml</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-center bg-purple-100 text-purple-800 font-bold text-sm py-1 rounded-lg">
                                                Usou: {prova.fermento}g Fermento
                                            </div>

                                            {(prova.obs || prova.comentario) && (
                                                <div className="mt-1 pt-2 border-t border-gray-100 space-y-1.5">
                                                    {prova.obs && (
                                                        <div className="flex gap-1.5 items-start text-gray-500">
                                                            <FileText size={12} className="mt-0.5 shrink-0"/>
                                                            <span className="text-[10px] italic leading-tight">"{prova.obs}"</span>
                                                        </div>
                                                    )}
                                                    {prova.comentario && (
                                                        <div className="flex gap-1.5 items-start text-blue-600 bg-blue-50 p-1.5 rounded-md">
                                                            <MessageSquare size={12} className="mt-0.5 shrink-0"/>
                                                            <span className="text-[10px] font-medium leading-tight">Aval: "{prova.comentario}"</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide ml-1">Emulsificante (ml)</label>
                                <input 
                                    type="number" 
                                    name="emulsificanteMl"
                                    value={formData.emulsificanteMl}
                                    onChange={handleChange}
                                    className="w-full mt-1 bg-gray-50 border border-gray-200 text-gray-900 text-lg rounded-2xl focus:ring-2 focus:ring-blue-400 p-3 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide ml-1">Fermento (g)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        name="fermentoGrama"
                                        value={formData.fermentoGrama}
                                        onChange={handleChange}
                                        className={`w-full mt-1 bg-gray-50 border text-gray-900 text-lg rounded-2xl focus:ring-2 p-3 outline-none font-bold transition-all ${provasIA ? 'border-purple-300 ring-2 ring-purple-100 text-purple-900' : 'border-gray-200 focus:ring-purple-400'}`}
                                    />
                                    {provasIA && <span className="absolute right-3 top-4 text-[10px] font-bold text-purple-500 uppercase">Sugerido</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Observações */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                    <label className="text-gray-800 font-bold flex items-center gap-2 mb-2">
                        <Info size={20} className="text-gray-400" /> Observações
                    </label>
                    <textarea 
                        name="observacoes"
                        rows={3}
                        placeholder="Detalhes sobre a massa..."
                        value={formData.observacoes}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                    ></textarea>
                </div>

                {/* Botão final */}
                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-orange-200 hover:bg-orange-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <CheckCircle />}
                    Registrar Produção
                </button>

            </form>
        </div>
    )
}