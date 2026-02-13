"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Thermometer,
  Trash2,
  Edit,
  Wheat,
  FlaskConical,
  Download,
  Upload,
  Loader2,
  Search,
  ArrowLeft,
  Droplets,
  Star,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Key,
  Filter,
  X,
  ThermometerSun,
} from "lucide-react";
import Toast from "@/app/components/Toast";
import { useAuth } from "@/context/AuthContext";

export default function HistoricoProducao() {
  const router = useRouter();
  const { isGerente } = useAuth();

  const [producoes, setProducoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importando, setImportando] = useState(false);

  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // Filtro
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtros, setFiltros] = useState({
    dataInicio: '', dataFim: '',
    nota: '',
    farinhaMin: '', farinhaMax: '',
    tempRealMin: '', tempRealMax: '',
    fermentoMin: '', fermentoMax: '',
    emulsificanteMin: '', emulsificanteMax: '',
    tempoHoraMin: '', tempoHoraMax: '',
    tempPrevMin: '', tempPrevMax: ''
  });

  useEffect(() => {
    carregarDados();
  }, []);

  // Para pegar o header
  const getHeaders = () => {
    const token = localStorage.getItem("royal_token");
    return { Authorization: `Bearer ${token}` };
  };

  async function carregarDados(queryParams = '') {
    setLoading(true);
    
    try {
      const url = queryParams ? `http://localhost:3000/producao/filtrar?${queryParams}`
      : 'http://localhost:3000/producao';

      const res = await fetch(url, {
        headers: getHeaders(),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        // Ordena por ID decrescente (mais recentes primeiro)
        const lista = queryParams ? data : data.sort((a: any, b: any) => b.id - a.id);
        setProducoes(lista);
      }
    } catch (error) {
      showToast("Erro ao carregar dados.", "error");
    } finally {
      setLoading(false);
    }
  }

  const handleAplicarFiltros = () => {
    const params = new URLSearchParams();

    Object.entries(filtros).forEach(([Key, value]) => {
      if(value) params.append(Key, value);
    });

    // Conversão: Horas -> Minutos para o Backend
    if(filtros.tempoHoraMin) params.append('tempoMin', String(Number(filtros.tempoHoraMin) * 60));
    if(filtros.tempoHoraMax) params.append('tempoMax', String(Number(filtros.tempoHoraMax) * 60));

    carregarDados(params.toString());
    setMostrarFiltros(false);
    showToast('Filtros aplicados', 'success');
  };

  const limparFiltros = () => {
    setFiltros({
        dataInicio: '', dataFim: '',
        nota: '',
        farinhaMin: '', farinhaMax: '',
        tempRealMin: '', tempRealMax: '',
        fermentoMin: '', fermentoMax: '',
        emulsificanteMin: '', emulsificanteMax: '',
        tempoHoraMin: '', tempoHoraMax: '',
        tempPrevMin: '', tempPrevMax: ''
      });
      carregarDados();
      setMostrarFiltros(false);
  }

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
  };

  // Blob
  const handleExportar = async () => {
    try {
      const res = await fetch("http://localhost:3000/producao/exportar", {
        method: "GET",
        headers: getHeaders(), // Envia o token
      });

      if (!res.ok) throw new Error("Erro na exportação");

      // Transforma em arquivo virtual
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      // Cria link invisível e clica nele
      const a = document.createElement("a");
      a.href = url;
      a.download = `producao_royal_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      showToast("Download concluído!", "success");
    } catch (error) {
      showToast("Erro ao exportar", "error");
    }
  };

  const handleImportar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setImportando(true);

    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    try {
      const token = localStorage.getItem("royal_token");
      const res = await fetch("http://localhost:3000/producao/importar", {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast(data.mensagem || "Importação concluída!", "success");
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      showToast("Erro ao importar arquivo.", "error");
    } finally {
      setImportando(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir a fornada #" + id + "?"))
      return;
    try {
      const res = await fetch(`http://localhost:3000/producao/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!res.ok) throw new Error();
      setProducoes((prev) => prev.filter((p) => p.id !== id));
      showToast("Produção excluída.", "success");
    } catch {
      showToast("Erro ao excluir.", "error");
    }
  };

  // Funções Auxiliares de Formatação
  const formatHora = (iso: string) =>
    new Date(iso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const formatData = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });

  // Para renderizar Badge de Nota
  const renderBadgeNota = (avaliacao: any) => {
    if(!avaliacao) return <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">Pendente</span>;
    const map: any = { 5: 'bg-green-100 text-green-700', 4: 'bg-blue-100 text-blue-700', 3: 'bg-yellow-100 text-yellow-700', 2: 'bg-orange-100 text-orange-700', 1: 'bg-red-100 text-red-700' };
    const label: any = { 5: 'Excelente', 4: 'Bom', 3: 'Regular', 2: 'Ruim', 1: 'Péssimo' };
    return <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${map[avaliacao.nota] || map[3]}`}><Star size={10} fill="currentColor"/> {label[avaliacao.nota]}</span>;
  };

  const opcoesQualidade = [
    { valor: 5, label: 'Excelente', color: 'bg-green-100 text-green-700 border-green-200' },
    { valor: 4, label: 'Bom', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { valor: 3, label: 'Regular', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { valor: 2, label: 'Ruim', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { valor: 1, label: 'Péssimo', color: 'bg-red-100 text-red-700 border-red-200' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24 md:pb-10 flex justify-center">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="w-full max-w-2xl">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => router.push("/")}
              className="bg-white p-3 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Histórico</h1>
              <p className="text-xs text-gray-500">
                Todas as suas produções registradas
              </p>
            </div>
          </div>
          {/* Botão de filtro */}
          <button
            onClick={() => setMostrarFiltros(true)}
            className="bg-white p-3 rounded-2xl border border-gray-200 text-blue-600 shadow-sm hover:bg-blue-50 active:scale-95 transition-all relative cursor-pointer"
          >
            <div className="flex gap-2">
              <Filter size={20} />
              <span className="text-sm font-bold ">Filtros Avançados</span>
            </div>
            {/* Bolinha para mostrar se filtro está ativo */}
            {Object.values(filtros).some(x => x !== '') && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {/* Barra de ferramentas (import/export) */}
          {isGerente && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={handleExportar}
                className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-700 shadow-sm active:bg-gray-50 whitespace-nowrap cursor-pointer"
              >
                <Download size={16} /> Exportar CSV
              </button>

              <label className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-700 shadow-sm active:bg-gray-50 whitespace-nowrap cursor-pointer hover:bg-gray-50 transition-colors">
                {importando ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                {importando ? "Importando..." : "Importar CSV"}
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImportar}
                  disabled={importando}
                />
              </label>
            </div>
          )}
        </div>

        {/* Filtros */}
        {mostrarFiltros && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-fade-in">
            <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto animate-slide-in-right">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Filter size={20} className="text-blue-600" /> Filtros Avançados
                </h2>
                <button onClick={() => setMostrarFiltros(false)} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20}/></button>
              </div>

              <div className="space-y-6 pb-20">
                {/* Data */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Período</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" className="bg-gray-50 border p-3 rounded-xl text-sm" value={filtros.dataInicio} onChange={e => setFiltros({...filtros, dataInicio: e.target.value})}/>
                    <input type="date" className="bg-gray-50 border p-3 rounded-xl text-sm" value={filtros.dataFim} onChange={e => setFiltros({...filtros, dataFim: e.target.value})}/>
                  </div>
                </div>

                {/* Qualidade */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Qualidade</label>
                  <div className="flex flex-wrap gap-2">
                    {opcoesQualidade.map(op => (
                      <button key={op.valor} onClick={() => setFiltros({...filtros, nota: filtros.nota === String(op.valor) ? '' : String(op.valor)})}
                      className={`px-3 py-2 rounded-xl cursor-pointer text-xs font-bold border transition-all ${filtros.nota === String(op.valor) ? op.color + ' ring-2 ring-offset-1 ring-gray-200' : 'bg-white border-gray-200 text-gray-500'}`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tempo de Fermentação */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1"><Clock size={14}/> Tempo (Horas)</label>
                    <div className="flex items-center gap-2">
                      <input type="number" placeholder="Min" className="w-full bg-gray-50 border p-3 rounded-xl text-sm" value={filtros.tempoHoraMin} onChange={e => setFiltros({...filtros, tempoHoraMin: e.target.value})}/>
                      <span className="text-gray-300">-</span>
                      <input type="number" placeholder="Max" className="w-full bg-gray-50 border p-3 rounded-xl text-sm" value={filtros.tempoHoraMax} onChange={e => setFiltros({...filtros, tempoHoraMax: e.target.value})}/>
                    </div>
                </div>

                <hr className="border-gray-100"/>

                {/* Insumo */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Farinha (Kg)</label>
                    <div className="flex items-center gap-2">
                      <input type="number" placeholder="Min" className="w-full bg-gray-50 border p-3 rounded-xl text-sm" value={filtros.farinhaMin} onChange={e => setFiltros({...filtros, farinhaMin: e.target.value})}/>
                      <span className="text-gray-300">-</span>
                      <input type="number" placeholder="Max" className="w-full bg-gray-50 border p-3 rounded-xl text-sm" value={filtros.farinhaMax} onChange={e => setFiltros({...filtros, farinhaMax: e.target.value})}/>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Fermento (g)</label>
                    <div className="flex items-center gap-2">
                      <input type="number" placeholder="Min" className="w-full bg-gray-50 border p-3 rounded-xl text-sm" value={filtros.fermentoMin} onChange={e => setFiltros({...filtros, fermentoMin: e.target.value})}/>
                      <span className="text-gray-300">-</span>
                      <input type="number" placeholder="Max" className="w-full bg-gray-50 border p-3 rounded-xl text-sm" value={filtros.fermentoMax} onChange={e => setFiltros({...filtros, fermentoMax: e.target.value})}/>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Emulsificante (ml)</label>
                    <div className="flex items-center gap-2">
                      <input type="number" placeholder="Min" className="w-full bg-gray-50 border p-3 rounded-xl text-sm" value={filtros.emulsificanteMin} onChange={e => setFiltros({...filtros, emulsificanteMin: e.target.value})}/>
                      <span className="text-gray-300">-</span>
                      <input type="number" placeholder="Max" className="w-full bg-gray-50 border p-3 rounded-xl text-sm" value={filtros.emulsificanteMax} onChange={e => setFiltros({...filtros, emulsificanteMax: e.target.value})}/>
                    </div>
                </div>

                <hr className="border-gray-100"/>

                {/* Temperatura Prevista */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1"><ThermometerSun size={14} />Temp. Prevista (°C)</label>
                    <div className="flex items-center gap-2">
                      <input type="number" placeholder="Min" className="w-full bg-gray-50 border p-3 rounded-xl text-sm" value={filtros.tempPrevMin} onChange={e => setFiltros({...filtros, tempPrevMin: e.target.value})}/>
                      <span className="text-gray-200">-</span>
                      <input type="number" placeholder="Max" className="w-full bg-gray-50 border p-3 rounded-xl text-sm" value={filtros.tempPrevMax} onChange={e => setFiltros({...filtros, tempPrevMax: e.target.value})}/>
                    </div>
                </div>

                {/* Temperatura Real */}
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 space-y-2">
                    <label className="text-xs font-bold text-blue-500 uppercase flex items-center gap-1"><Thermometer size={14} />Temp. Final Real (°C)</label>
                    <div className="flex items-center gap-2">
                      <input type="number" placeholder="Min" className="w-full bg-white border border-blue-100 p-3 rounded-xl text-sm" value={filtros.tempRealMin} onChange={e => setFiltros({...filtros, tempRealMin: e.target.value})}/>
                      <span className="text-blue-200">-</span>
                      <input type="number" placeholder="Max" className="w-full bg-white border border-blue-100 p-3 rounded-xl text-sm" value={filtros.tempRealMax} onChange={e => setFiltros({...filtros, tempRealMax: e.target.value})}/>
                    </div>
                </div>
                
                {/* Botões */}
                <div className="pt-4 flex gap-3">
                    <button onClick={limparFiltros} className="flex-1 py-4 text-gray-500 font-bold text-sm hover:bg-gray-50 rounded-2xl cursor-pointer">Limpar</button>
                    <button onClick={handleAplicarFiltros} className="flex-2 bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 cursor-pointer">Aplicar Filtros</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Loader2 className="animate-spin text-orange-500" size={32} />
            <p className="text-gray-400 text-sm">Carregando histórico...</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {producoes.map((prod) => (
              <div
                key={prod.id}
                className="bg-white p-5 rounded-4xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
              >
                {/* Cabeçalho */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-50 text-orange-600 font-bold p-3 rounded-2xl text-lg min-w-14 text-center">
                      #{prod.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-gray-800 text-sm">
                          {formatData(prod.horaInicio)}
                        </h3>
                        {renderBadgeNota(prod.avaliacao)}
                      </div>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={12} /> {formatHora(prod.horaInicio)} -{" "}
                        {formatHora(prod.horaFim)}
                      </p>
                    </div>
                  </div>

                  {/* Ações (editar/excluir) */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => router.push(`/avaliacao/${prod.id}`)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                      title="Editar / Avaliar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Detalhes Técnicos */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Ingredientes */}
                  <div className="bg-gray-50 p-3 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">
                      Receita
                    </span>

                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <Wheat size={14} className="text-yellow-500" /> Farinha
                      </span>
                      <span className="font-bold text-gray-800">
                        {Number(prod.farinhaKg)}kg
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <FlaskConical size={14} className="text-purple-500" />{" "}
                        Fermento
                      </span>
                      <span className="font-bold text-gray-800">
                        {Number(prod.fermentoGrama)}g
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <Droplets size={14} className="text-blue-400" />{" "}
                        Emulsif.
                      </span>
                      <span className="font-bold text-gray-800">
                        {Number(prod.emulsificanteMl)}ml
                      </span>
                    </div>
                  </div>

                  {/* Clima e Tempo */}
                  <div className="bg-blue-50/50 p-3 rounded-2xl space-y-2 border border-blue-50">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide block mb-1">
                      Processo
                    </span>

                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <Clock size={14} className="text-orange-400" /> Tempo
                      </span>
                      <span className="font-bold text-gray-800">
                        {Math.floor(prod.tempoFermentacaoMinutos / 60)}h
                        {prod.tempoFermentacaoMinutos % 60}m
                      </span>
                    </div>

                    <div className="pt-1 border-t border-blue-100 mt-1">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-gray-500 flex gap-1">
                          <Thermometer size={12} /> Prev.
                        </span>
                        <span className="font-medium text-gray-800">
                          {prod.tempAmbienteInicial}° ➜ {prod.tempAmbienteFinal}
                          °
                        </span>
                      </div>
                      {prod.avaliacao?.tempAmbienteFinalReal && (
                        <div className="flex justify-between items-center text-xs bg-blue-100 p-1 rounded-md">
                          <span className="text-blue-700 font-bold flex gap-1">
                            Real
                          </span>
                          <span className="font-bold text-blue-900">
                            {prod.avaliacao.tempAmbienteFinalReal}°C
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Observações e comentários */}
                {(prod.observacoes || prod.avaliacao?.comentario) && (
                  <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                    {prod.observacoes && (
                      <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg italic flex gap-2">
                        <span className="font-bold not-italic text-gray-400 text-[10px] uppercase">
                          Obs:
                        </span>
                        {prod.observacoes}
                      </p>
                    )}
                    {prod.avaliacao?.comentario && (
                      <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded-lg flex gap-2 border border-blue-100">
                        <MessageSquare size={14} className="shrink-0 mt-0.5" />
                        <span>{prod.avaliacao.comentario}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
