"use client";

import { useAuth } from "@/context/AuthContext";
import { AlertTriangle, ArrowLeft, History, Loader2, Mail, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Toast from "../components/Toast";

export default function PainelGerencial() {
    const router = useRouter();
    const { user, isGerente } = useAuth();

    const [logs, setLogs] = useState<any[]>([]);
    const [emailBackup, setEmailBackup] = useState("");
    const [loading, setLoading] = useState(true);
    const [salvandoEmail, setSalvandoEmail] = useState(false);
    const [toast, setToast] = useState<{msg: string, type: "success"|"error"} | null>(null);

    const getHeaders = () => ({
        "Authorization": `Bearer ${localStorage.getItem('royal_token')}`,
        "Content-Type": 'application/json'
    });

    useEffect(() => {
        if(user && !isGerente){
            router.push("/");
            return;
        }
        carregarDados();
    }, [user, isGerente, router]);

    async function carregarDados() {
        try {
            // Busca o email atual
            const resEmail = await fetch("http://localhost:3000/admin/config/email",
                { headers: getHeaders()}
            );
            const dataEmail = await resEmail.json();
            if(dataEmail.email) setEmailBackup(dataEmail.email);

            // Busca os logs
            const resLogs = await fetch("http://localhost:3000/admin/logs", { headers: getHeaders()});
            const dataLogs = await resLogs.json();
            setLogs(dataLogs);

        } catch (error) {
            setToast({
                msg: "Erro ao carregar os dados",
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleSalvarEmail(e: React.FormEvent) {
        e.preventDefault();
        setSalvandoEmail(true);

        try {
            const res = await fetch("http://localhost:3000/admin/config/email", {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify({ email: emailBackup })
            });

            if(!res.ok) throw new Error("Erro ao salvar email");

            setToast({
                msg: "E-mail de backup atualizado.",
                type: "success"
            })
        } catch (error) {
            setToast({
                msg: "Erro ao salvar",
                type: "error"
            });
        } finally{
            setSalvandoEmail(false);
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
        
            <div className="w-full max-w-2xl space-y-8">
                {/* Headers */}
                <div className="flex items-center gap-4 pt-4">
                    <button onClick={() => router.push("/usuarios")}
                        className="bg-white p-3 rounded-full border border-gray-200 shadow-sm text-gray-700 hover:bg-gray-50"
                        >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Painel Gerencial</h1>
                        <p className="text-xs text-gray-500 font-medium">Configurações e Auditoria</p>
                    </div>
                </div>

                {/* Configuração de Email de Backup */}
                <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                            <Mail size={24} />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 text-lg">Backup Diário</h2>
                            <p className="text-xs text-gray-500">Destinatário do arquivo de segurança</p>
                        </div>
                    </div>
                    
                    <form onSubmit={handleSalvarEmail} className="flex flex-col sm:flex-row gap-3">
                        <input type="text" required
                        className="flex-1 bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus::border-blue-400"
                        value={emailBackup}
                        onChange={e => setEmailBackup(e.target.value)}
                        placeholder="gerente@email.com"
                        />
                        <button disabled={salvandoEmail} type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex justify-center items-center gap-2">
                            {salvandoEmail ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}
                            Salvar
                        </button>
                    </form>
                </div>

                {/* Logs */}
                <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                            <History size={24} />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 text-lg">Registro de Exclusões</h2>
                            <p className="text-xs text-gray-500">Auditoria de fornadas apagadas</p>
                        </div>
                    </div>
                    
                    {logs.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-gray-400 text-sm font-bold">Nenhum registro apagado.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {logs.map((log: any) => (
                                <div key={log.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <AlertTriangle size={14} className="text-red-400"/>
                                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">Fornada #{log.producaoId}</span>
                                        </div>
                                        <p className="text-sm font-bold text-gray-800">Apagado por: <span className="text-orange-600">{log.usuarioNome}</span></p>
                                    </div>
                                    <div className="text-right text-xs text-gray-500 font-medium space-y-1">
                                        <p>{new Date(log.dataExclusao).toLocaleDateString('pt-BR')}</p>
                                        <p>{new Date(log.dataExclusao).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </div>
    )

}