"use client";

import {
  ArrowLeft,
  AlertTriangle,
  Thermometer,
  Save,
  Check,
  Loader2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Toast from "@/app/components/Toast";

export default function RevisaoAvaliacao() {
  const params = useParams();
  const router = useRouter();

  // Estados visuais
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Dados da Produção (Editáveis)
  const [prodData, setProdData] = useState({
    farinhaKg: "",
    fermentoGrama: "",
    emulsificanteMl: "",
    tempAmbienteInicial: "",
    tempAmbienteFinal: "",
  });

  // Dados da Avaliação
  const [avaliacaoId, setAvaliacaoId] = useState<number | null>(null);
  const [nota, setNota] = useState(0);
  const [tempFinalReal, setTempFinalReal] = useState("");
  const [comentario, setComentario] = useState("");

  const opcoesNota = [
    { valor: 1, label: "PÉSSIMO" },
    { valor: 2, label: "RUIM" },
    { valor: 3, label: "REGULAR" },
    { valor: 4, label: "BOM" },
    { valor: 5, label: "EXCELENTE" },
  ];

  useEffect(() => {
    async function fetchProducao() {
      try {
        const response = await fetch(
          `http://localhost:3000/producao/${params.id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("royal_token")}`,
            },
          },
        );
        if (!response.ok) throw new Error("Erro ao buscar produção");
        const data = await response.json();

        // Popula os dados existentes
        setProdData({
          farinhaKg: String(data.farinhaKg),
          fermentoGrama: String(data.fermentoGrama),
          emulsificanteMl: String(data.emulsificanteMl),
          tempAmbienteInicial: data.tempAmbienteInicial
            ? String(data.tempAmbienteInicial)
            : "",
          tempAmbienteFinal: data.tempAmbienteFinal
            ? String(data.tempAmbienteFinal)
            : "",
        });

        // Se já existir avaliação, popula também
        if (data.avaliacao) {
          setAvaliacaoId(data.avaliacao.id);
          setNota(data.avaliacao.nota);
          setTempFinalReal(
            data.avaliacao.tempAmbienteFinalReal
              ? String(data.avaliacao.tempAmbienteFinalReal)
              : "",
          );
          setComentario(data.avaliacao.comentario || "");
        }
      } catch (error) {
        console.error(error);
        setToast({ msg: "Erro ao carregar dados.", type: "error" });
        setTimeout(() => router.back(), 2000);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchProducao();
  }, [params.id, router]);

  async function handleFinalizar() {
    if (nota === 0) {
      setToast({ msg: "Por favor, selecione uma nota.", type: "error" });
      return;
    }

    setSalvando(true);
    try {
      // 1. Atualiza dados da produção (PATCH)
      await fetch(`http://localhost:3000/producao/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("royal_token")}`,
        },
        body: JSON.stringify({
          farinhaKg: Number(prodData.farinhaKg),
          fermentoGrama: Number(prodData.fermentoGrama),
          emulsificanteMl: Number(prodData.emulsificanteMl),
          tempAmbienteInicial: prodData.tempAmbienteInicial
            ? Number(prodData.tempAmbienteInicial)
            : null,
        }),
      });

      // 2. Salva/Atualiza Avaliação
      const payloadAvaliacao = {
        producaoId: Number(params.id),
        nota: nota,
        tempAmbienteFinalReal: tempFinalReal ? Number(tempFinalReal) : null,
        comentario: comentario,
      };

      const url = avaliacaoId
        ? `http://localhost:3000/avaliacao/${avaliacaoId}`
        : "http://localhost:3000/avaliacao";

      const method = avaliacaoId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("royal_token")}`,
        },
        body: JSON.stringify(payloadAvaliacao),
      });

      if (!res.ok) throw new Error("Falha ao salvar avaliação");

      setToast({ msg: "Avaliação registrada com sucesso!", type: "success" });

      // Redireciona após sucesso
      setTimeout(() => {
        router.push("/"); // Volta para o Dashboard
      }, 1500);
    } catch (error) {
      console.error(error);
      setToast({ msg: "Erro ao salvar. Tente novamente.", type: "error" });
    } finally {
      setSalvando(false);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24 flex justify-center">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pt-4">
          <button
            onClick={() => router.back()}
            className="bg-white p-3 rounded-full border border-gray-200 shadow-sm text-gray-700 active:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Avaliar Fornada</h1>
            <p className="text-xs text-gray-500">
              Confira os dados e dê sua nota
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Dados Técnicos */}
          <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-orange-600 font-bold border-b border-orange-100 pb-2">
              <AlertTriangle size={20} />
              <h2>Conferência de Produção</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Farinha */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                  Farinha (Kg)
                </label>
                <input
                  type="number"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-orange-200 transition-all"
                  value={prodData.farinhaKg}
                  onChange={(e) =>
                    setProdData({ ...prodData, farinhaKg: e.target.value })
                  }
                />
              </div>
              {/* Fermento */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                  Fermento (g)
                </label>
                <input
                  type="number"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-orange-200 transition-all"
                  value={prodData.fermentoGrama}
                  onChange={(e) =>
                    setProdData({ ...prodData, fermentoGrama: e.target.value })
                  }
                />
              </div>
              {/* Emulsificante */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                  Emulsificante (ml)
                </label>
                <input
                  type="number"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-orange-200 transition-all"
                  value={prodData.emulsificanteMl}
                  onChange={(e) =>
                    setProdData({
                      ...prodData,
                      emulsificanteMl: e.target.value,
                    })
                  }
                />
              </div>
              {/* Temp Inicial */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                  Temp. Inicial
                </label>
                <input
                  type="number"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-orange-200 transition-all"
                  value={prodData.tempAmbienteInicial}
                  onChange={(e) =>
                    setProdData({
                      ...prodData,
                      tempAmbienteInicial: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Temperatura Real */}
          <div className="bg-linear-to-br from-blue-600 to-blue-700 p-6 rounded-4xl shadow-xl shadow-blue-200 text-white relative overflow-hidden group">
            <Thermometer
              size={120}
              className="absolute -right-6 -bottom-6 text-white opacity-10 group-hover:scale-110 transition-transform duration-500"
            />

            <label className="font-bold text-blue-100 uppercase text-xs tracking-wider flex items-center gap-2">
              <Thermometer size={14} /> Temperatura Final Real
            </label>

            <div className="flex items-end mt-2 relative z-10">
              <input
                type="number"
                placeholder="--"
                className="bg-transparent text-6xl font-bold outline-none w-32 placeholder-blue-400/50"
                value={tempFinalReal}
                onChange={(e) => setTempFinalReal(e.target.value)}
              />
              <span className="text-2xl font-medium text-blue-200 mb-3">
                °C
              </span>
            </div>
          </div>

          {/* Nota */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 ml-2 text-sm uppercase tracking-wide opacity-70">
              Classificação
            </h3>
            <div className="flex flex-col gap-2">
              {opcoesNota.map((opt) => (
                <button
                  key={opt.valor}
                  onClick={() => setNota(opt.valor)}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all active:scale-95 duration-200 ${
                    nota === opt.valor
                      ? "bg-gray-900 text-white border-gray-900 shadow-lg ring-2 ring-offset-2 ring-gray-900"
                      : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50 hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${nota === opt.valor ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}
                    >
                      {opt.valor}
                    </span>
                    <span className="font-bold text-sm tracking-wide">
                      {opt.label}
                    </span>
                  </div>
                  {nota === opt.valor && (
                    <Check
                      size={20}
                      className="animate-in zoom-in spin-in-90 duration-300"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Comentário*/}
          <div className="bg-white p-5 rounded-4xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-orange-100 transition-all">
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
              Comentários Adicionais
            </label>
            <textarea
              placeholder="O que achou do crescimento? Cor? Textura?"
              className="w-full text-sm outline-none resize-none h-24 text-gray-700 placeholder-gray-300 bg-transparent"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
            />
          </div>

          {/* Botão final */}
          <button
            onClick={handleFinalizar}
            disabled={salvando}
            className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-orange-200 hover:bg-orange-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {salvando ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Save size={20} />
            )}
            {salvando ? "Salvando..." : "Concluir Avaliação"}
          </button>
        </div>
      </div>
    </div>
  );
}
