"use client";

import { useAuth } from "@/context/AuthContext";
import React, { useState } from "react";
import Toast from "../components/Toast";
import { ArrowRight, ChefHat, Loader2, Lock, User } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<any>(null);

  const [form, setForm] = useState({
    email: "",
    senha: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Erro ao entrar");

      login(data.access_token, data.usuario);
    } catch (error: any) {
      setToast({
        msg: "Email ou senha inválidos.",
        type: "error",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200 border border-gray-100">
        {/* Cabeçalho */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <ChefHat size={40} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Padaria Royal</h1>
          <p className="text-sm text-gray-500">
            Sistema de Controle de Qualidade
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase ml-3">
              Email
            </label>
            <div className="relative">
              <User
                className="absolute left-4 top-3.5 text-gray-400"
                size={20}
              />
              <input
                type="email"
                placeholder="seu@email.com"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-12 pr-4 text-gray-800 outline-none focus:ring-2 focus:ring-orange-200 transition-all font-medium"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase ml-3">
              Senha
            </label>
            <div className="relative">
              <Lock
                className="absolute left-4 top-3.5 text-gray-400"
                size={20}
              />
              <input
                type="password"
                placeholder="******"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-12 pr-4 text-gray-800 outline-none focus:ring-2 focus:ring-orange-200 transition-all font-medium"
                onChange={(e) =>
                  setForm({
                    ...form,
                    senha: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-orange-200 hover:bg-orange-700 active:scale-95 transition-all flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                Entrar <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8">
          © 2026 Padaria Royal System v1.0
        </p>
      </div>
    </div>
  );
}
