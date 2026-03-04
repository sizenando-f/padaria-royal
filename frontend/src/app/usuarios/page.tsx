"use client";

import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, CheckCircle2, Clock, Loader2, Pencil, ShieldCheck, Trash2, UserPlus, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Toast from "../components/Toast";

export default function GestaoUsuario() {
    const router = useRouter();
    const { user, isGerente } = useAuth();

    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{msg: string, type: "success"|"error"} | null>(null);

    // Modal de novo usuário
    const [modalAberto, setModalAberto] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [usuarioEditando, setUsuarioEditando] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        nome: "", email: "", senha: "", cargo: "PADEIRO",
        podeRegistrar: true, podeAvaliar: true, podeVerHistorico: true,
        podeEditar: true, podeExcluir: true,
        horarioEntrada: "05:00", horarioSaida: "19:00"
    });


    const getHeaders = () => ({
        "Authorization": `Bearer ${localStorage.getItem('royal_token')}`,
        "Content-Type": 'application/json'
    });

    useEffect(() => {
        // Manda embora se não for gerente
        if(user && !isGerente){
            router.push("/");
            return;
        }

        carregarUsuarios();
    }, [user, isGerente, router]);

    async function carregarUsuarios() {
        try {
            const res = await fetch("http://localhost:3000/usuario",
                {
                    headers: getHeaders()
                }
            );

            if(!res.ok) {
                throw new Error("Erro ao buscar");
            }

            const data = await res.json();
            setUsuarios(data);
        } catch (error) {
            setToast({
                msg: "Erro ao carregar a equipe.",
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleExcluir(id: Number, nome: string){
        if(!confirm(`Tem certeza que deseja demitir/excluir o acesso de ${nome}?`)) return;

        try {
            const res = await fetch(`http://localhost:3000/usuario/${id}`, {
                method: "DELETE",
                headers: getHeaders()
            });

            if(!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Erro");
            }

            setUsuarios(prev => prev.filter(u => u.id !== id));
            setToast({
                msg: "Usuário removido com sucesso",
                type: "success"
            });
        } catch (error: any) {
            setToast({
                msg: error.message,
                type: "error"
            });
        }
    }

    function abrirModalEdicao(u: any){
        setUsuarioEditando(u.id);
        setFormData({
            nome: u.nome, email: u.email, senha: "", cargo: u.cargo,
            podeRegistrar: u.podeRegistrar, podeAvaliar: u.podeAvaliar,
            podeVerHistorico: u.podeVerHistorico, podeEditar: u.podeEditar || false,
            podeExcluir: u.podeExcluir || false,
            horarioEntrada: u.horarioEntrada || "05:00",
            horarioSaida: u.horarioSaida || "19:00"
        });
        setModalAberto(true);
    }

    function abrirModalNovo(){
        setUsuarioEditando(null);

        setFormData({
            nome: "", email: "", senha: "", cargo: "PADEIRO",
            podeRegistrar: false, podeAvaliar: false,
            podeVerHistorico: false, podeEditar: false,
            podeExcluir: false,
            horarioEntrada: "05:00",
            horarioSaida: "19:00"
        });

        setModalAberto(true);
    }

    async function handleSalvar(e: React.FormEvent){
        e.preventDefault();
        setSalvando(true);

        try {
            const url = usuarioEditando ? `http://localhost:3000/usuario/${usuarioEditando}`
            : "http://localhost:3000/usuario";

            const method = usuarioEditando ? "PATCH" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: getHeaders(),
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if(!res.ok) throw new Error(data.nessage || "Erro ao salvar");

            setToast({
                msg: "Usuário cadastrado com sucesso!",
                type: "success"
            });
            setModalAberto(false);
            carregarUsuarios(); // Recarrega a lista

            // Reseta o formulário
            setFormData({
                nome: "", email: "", senha: "", cargo: "PADEIRO",
                podeRegistrar: true, podeAvaliar: true, podeVerHistorico: true,
                podeEditar: true, podeExcluir: true,
                horarioEntrada: "05:00", horarioSaida: "19:00"
            });
        } catch (error: any) {
            setToast({
                msg: error.message,
                type: "error"
            });
        } finally {
            setSalvando(false);
            setUsuarioEditando(null);
        }
    }

    if(loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-orange-500" size={32}/>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-24 md:p-8 flex justify-center">
            {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
            
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pt-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push("/")}
                            className="bg-white p-3 rounded-full border border-gray-200 shadow-sm text-gray-700 hover:bg-gray-50"
                            >
                            <ArrowLeft size={20}/>
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Equipe</h1>
                            <p className="text-xs text-gray-500 font-medium">Gestão de acessos e permissões</p>
                        </div>
                    </div>
                    <button
                        onClick={abrirModalNovo}
                        className="bg-orange-600 text-white px-4 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-orange-200 hover:bg-orange-700 active:scale-95 transition-all"
                    >
                        <UserPlus size={18}/> Novo Acesso
                    </button>
                </div>

                {/* Lista de usuários */}
                <div className="space-y-4 animate-fade-in">
                    {usuarios.map(u => (
                        <div key={u.id} className="bg-white p-5 rounded-4xl shadow-sm border border-gray-100 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-2xl ${u.cargo === 'GERENTE' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {u.cargo === "GERENTE" ? <ShieldCheck size={24}/> : <Users size={24}/>}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg leading-tight">
                                            {u.nome}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            {u.email}
                                        </p>
                                    </div>
                                </div>
                                {user?.id !== u.id && (
                                    <div className="flex gap-2">
                                        <button onClick={() => abrirModalEdicao(u)}
                                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors" title="Editar usuário"    
                                        >
                                            <Pencil size={18}/>
                                        </button>
                                        <button onClick={() => handleExcluir(u.id, u.nome)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Remover acesso"
                                        >
                                            <Trash2 size={18}/>
                                        </button>
                                    </div>
                                    
                                )}
                            </div>

                            {/* Informações de Permissões e Horários */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase block">
                                        Permissões de Sistema
                                    </span>
                                    <div className="flex gap-1 flex-wrap">
                                        {u.cargo === "GERENTE" ? (
                                            <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-1 rounded-md border border-purple-100">
                                                Acesso Total
                                            </span>
                                        ) : ( 
                                        <>
                                            {u.podeRegistrar && 
                                            <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 rounded-md border border-green-100">
                                                Produção
                                            </span>
                                            }
                                            {u.podeAvaliar && 
                                            <span className="bg-orange-50 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-md border border-orange-100">
                                                Avaliação
                                            </span>
                                            }
                                            {u.podeVerHistorico && 
                                            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-md border border-blue-100">
                                                Histórico
                                            </span>
                                            }
                                            {u.podeEditar && 
                                            <span className="bg-yellow-50 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-md border border-yellow-100">
                                                Editar
                                            </span>
                                            }
                                            {u.podeExcluir && 
                                            <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-1 rounded-md border border-red-100">
                                                Excluir
                                            </span>
                                            }
                                            {!u.podeRegistrar && !u.podeAvaliar && !u.podeVerHistorico &&
                                            <span className="text-xs text-gray-400">
                                                Sem Permissões
                                            </span>
                                            }
                                        </> )}
                                    </div>
                                </div>
                                {u.cargo !== "GERENTE" && u.horarioEntrada && (
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase  flex items-center gap-1">
                                            <Clock size={12} /> Horário Permitido
                                        </span>
                                        <div className="text-sm font-bold text-gray-700 bg-gray-50 px-3 py-1 rounded-lg inline-block border border-gray-100">
                                            {u.horarioEntrada} às {u.horarioSaida}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modal para novo usuário */}
                {modalAberto && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-start p-4 animate-fade-in">
                        <div className="bg-white w-full max-w-md rounded-4xl shadow-2xl overflow-hidden animate-slide-up max-h-[85vh] flex flex-col">
                            <div className="p-5 flex justify-between items-center border-b border-gray-100 bg-gray-50/50">
                                <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                    <UserPlus size={20} className="text-orange-500"/> Novo Funcionário
                                </h2>
                                <button onClick={() => {
                                    setModalAberto(false);
                                    setUsuarioEditando(null)
                                    }} className="p-2 bg-white rounded-full text-gray-400 hover:bg-gray-100 border border-gray-200">
                                    <X size={18}/>
                                </button>
                            </div>

                            <form onSubmit={handleSalvar} className="p-6 space-y-5 overflow-y-auto">
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">
                                            Nome Completo
                                        </label>
                                        <input required type="text" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-orange-400" value={formData.nome} 
                                        onChange={e => setFormData({...formData, nome: e.target.value})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">
                                            E-mail (Login)
                                        </label>
                                        <input required type="email" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-orange-400" value={formData.email} 
                                        onChange={e => setFormData({...formData, email: e.target.value})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">
                                            Senha
                                        </label>
                                        <input required={!usuarioEditando} type="password" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-orange-400" value={formData.senha} 
                                        onChange={e => setFormData({...formData, senha: e.target.value})} placeholder={usuarioEditando ? "Deixe vazio para manter a senha" : ""}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">
                                        Tipo de Acesso
                                    </label>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setFormData({...formData, cargo: "PADEIRO"})}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${formData.cargo === "PADEIRO" ? "bg-blue-50 border-blue-400 text-blue-700" : "bg-white border-gray-200 text-gray-500"}`}
                                            >
                                            Operacional
                                        </button>
                                        <button type="button" onClick={() => setFormData({...formData, cargo: "GERENTE"})}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${formData.cargo === "GERENTE" ? "bg-purple-50 border-purple-400 text-purple-700" : "bg-white border-gray-200 text-gray-500"}`}
                                            >
                                            Gerência
                                        </button>
                                    </div>
                                </div>

                                {formData.cargo === "PADEIRO" && (
                                    <div className="animate-fade-in space-y-5 border-t border-gray-100 pt-5">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase ml-1  mb-1 flex items-center gap-1">
                                                <Clock size={14}/> Horário de Trabalho
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input type="time" required className="flex-1 bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-orange-400"
                                                value={formData.horarioEntrada} onChange={e => setFormData({...formData, horarioEntrada: e.target.value})}
                                                />
                                                <span className="text-gray-400">
                                                    até
                                                </span>
                                                <input type="time" required className="flex-1 bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-orange-400"
                                                value={formData.horarioSaida} onChange={e => setFormData({...formData, horarioSaida: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-2">Permissões Específicas</label>
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer">
                                                    <input type="checkbox" className="w-4 h-4 text-orange-600 rounded" checked={formData.podeRegistrar} onChange={e => setFormData({...formData, podeRegistrar: e.target.checked})}/>
                                                    <span className="text-sm font-bold text-gray-700">
                                                        Lançar Nova Produção
                                                    </span>
                                                </label>
                                                <label className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer">
                                                    <input type="checkbox" className="w-4 h-4 text-orange-600 rounded" checked={formData.podeAvaliar} onChange={e => setFormData({...formData, podeAvaliar: e.target.checked})}/>
                                                    <span className="text-sm font-bold text-gray-700">
                                                        Avaliar Qualidade
                                                    </span>
                                                </label>
                                                <label className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer">
                                                    <input type="checkbox" className="w-4 h-4 text-orange-600 rounded" checked={formData.podeVerHistorico} onChange={e => setFormData({...formData, podeVerHistorico: e.target.checked})}/>
                                                    <span className="text-sm font-bold text-gray-700">
                                                        Visualizar Histórico Geral
                                                    </span>
                                                </label>
                                                <label className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer">
                                                    <input type="checkbox" className="w-4 h-4 text-orange-600 rounded" checked={formData.podeEditar} onChange={e => setFormData({...formData, podeEditar: e.target.checked})}/>
                                                    <span className="text-sm font-bold text-gray-700">
                                                        Editar Produções
                                                    </span>
                                                </label>
                                                <label className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer">
                                                    <input type="checkbox" className="w-4 h-4 text-orange-600 rounded" checked={formData.podeExcluir} onChange={e => setFormData({...formData, podeExcluir: e.target.checked})}/>
                                                    <span className="text-sm font-bold text-gray-700">
                                                        Excluir Produção
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button disabled={salvando} type="submit" className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-orange-200 hover:bg-orange-700 active:scale-95 transition-all flex justify-center items-center gap-2 mt-4">
                                    {salvando ? <Loader2 size={18} className="animate-spin"/> :
                                    <CheckCircle2 size={18}/>}
                                    {salvando ? "Salvando..." : usuarioEditando ? "Salvar Alterações" : "Cadastrar Usuário"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}