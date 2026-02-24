"use client";

import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function GestaoUsuario() {
    const router = useRouter();
    const { user, isGerente } = useAuth();

    const [usuario, setUsuario] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{msg: string, type: "success"|"error"} | null>(null);

    // Modal de novo usuário
    const [modalAberto, setModalAberto] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [formData, setFormData] = useState({
        nome: "",
        email: "",
        senha: "",
        cargo: "PADEIRO",
        podeRegistrar: true,
        podeAvaliar: true,
        podeVerHistorico: true,
        horarioEntrada: "05:00",
        horarioSaida: "19:00"
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
            setUsuario(data);
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

            setUsuario(prev => prev.filter(u => u.id !== id));
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

    async function handleSalvar(e: React.FormEvent){
        e.preventDefault();
        setSalvando(true);

        try {
            const res = await fetch("http://localhost:3000/usuario", {
                method: "POST",
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
                nome: "",
                email: "",
                senha: "",
                cargo: "PADEIRO",
                podeRegistrar: true,
                podeAvaliar: true,
                podeVerHistorico: true,
                horarioEntrada: "05:00",
                horarioSaida: "19:00"
            });
        } catch (error: any) {
            setToast({
                msg: error.message,
                type: "error"
            });
        } finally {
            setSalvando(false);
        }
    }

    if(loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-orange-500" size={32}/>
        </div>
    );

    
}