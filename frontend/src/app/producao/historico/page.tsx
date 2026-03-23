"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Thermometer,
  Trash2,
  Edit,
  Wheat,
  FlaskConical,
  Download,
  Upload,
  Loader2,
  ArrowLeft,
  Droplets,
  Star,
  MessageSquare,
  Filter,
  X,
  ThermometerSun,
  ArrowRight,
} from "lucide-react";
import Toast from "@/app/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

export default function HistoricoProducao() {
  const router = useRouter();
  const { user, isGerente } = useAuth();

  const [pagina, setPagina] = useState(1);
  const LIMIT = 20;

  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [importando, setImportando] = useState(false);

   // Filtro
  const filtrosIniciais = {
    dataInicio: '', dataFim: '',
    nota: '',
    farinhaMin: '', farinhaMax: '',
    tempRealMin: '', tempRealMax: '',
    fermentoMin: '', fermentoMax: '',
    emulsificanteMin: '', emulsificanteMax: '',
    tempoHoraMin: '', tempoHoraMax: '',
    tempPrevMin: '', tempPrevMax: ''
  };

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtros, setFiltros] = useState(filtrosIniciais); // Modal
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtrosIniciais);

   const handleChangeFiltro = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const limparFiltros = () => {
    setFiltros(filtrosIniciais);
    setFiltrosAplicados(filtrosIniciais); 
    setPagina(1);
    setMostrarFiltros(false);
  };

  const handleAplicarFiltros = () => {
    setFiltrosAplicados(filtros); 
    setPagina(1);
    setMostrarFiltros(false);
    showToast('Filtros aplicados', 'success');
  };

  // Converte o estado local para os nomes de query esperados pelo backend.
  const buildQueryString = () => {
    const params = new URLSearchParams();

    if (filtrosAplicados.dataInicio) params.append("dataInicio", filtrosAplicados.dataInicio);
    if (filtrosAplicados.dataFim) params.append("dataFim", filtrosAplicados.dataFim);
    if (filtrosAplicados.nota) params.append("nota", filtrosAplicados.nota);

    if (filtrosAplicados.farinhaMin) params.append("farinhaMin", filtrosAplicados.farinhaMin);
    if (filtrosAplicados.farinhaMax) params.append("farinhaMax", filtrosAplicados.farinhaMax);
    if (filtrosAplicados.fermentoMin) params.append("fermentoMin", filtrosAplicados.fermentoMin);
    if (filtrosAplicados.fermentoMax) params.append("fermentoMax", filtrosAplicados.fermentoMax);
    if (filtrosAplicados.emulsificanteMin) params.append("emulsificanteMin", filtrosAplicados.emulsificanteMin);
    if (filtrosAplicados.emulsificanteMax) params.append("emulsificanteMax", filtrosAplicados.emulsificanteMax);

    // Conversão de horas para minutos no payload final.
    if (filtrosAplicados.tempoHoraMin) {
      params.append("tempoMin", String(Number(filtrosAplicados.tempoHoraMin) * 60));
    }
    if (filtrosAplicados.tempoHoraMax) {
      params.append("tempoMax", String(Number(filtrosAplicados.tempoHoraMax) * 60));
    }

    // No backend atual, a temperatura prevista final usa tempFimPrevMin/Max.
    if (filtrosAplicados.tempPrevMin) params.append("tempFimPrevMin", filtrosAplicados.tempPrevMin);
    if (filtrosAplicados.tempPrevMax) params.append("tempFimPrevMax", filtrosAplicados.tempPrevMax);

    if (filtrosAplicados.tempRealMin) params.append("tempRealMin", filtrosAplicados.tempRealMin);
    if (filtrosAplicados.tempRealMax) params.append("tempRealMax", filtrosAplicados.tempRealMax);

    return params.toString();
  };

const { data, isLoading, isFetching, refetch} = useQuery({
  queryKey: ["historico", pagina, filtrosAplicados],
  queryFn: async () => {
      const token = localStorage.getItem("royal_token");
        if (!token) throw new Error("Não autorizado");

        const qs = buildQueryString();
        const filtrosAtivos = qs.length > 0;
        const baseUrl = filtrosAtivos
          ? "https://padaria-royal-api.onrender.com/producao/filtrar"
          : "https://padaria-royal-api.onrender.com/producao";
        const paginacao = filtrosAtivos ? "" : `page=${pagina}&limit=${LIMIT}&`;
        const url = `${baseUrl}?${paginacao}${qs}`;

        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error("Erro ao buscar histórico");
        return res.json(); 
    },
    placeholderData: keepPreviousData,
  });

  const retornoFiltrado = Array.isArray(data);
  const listaCompleta = retornoFiltrado ? data : data?.dados || [];
  const total = retornoFiltrado ? listaCompleta.length : data?.total || 0;
  const totalPaginas = retornoFiltrado
    ? Math.max(1, Math.ceil(total / LIMIT))
    : data?.totalPaginas || 1;
  const inicioPaginacao = (pagina - 1) * LIMIT;
  const producoes = retornoFiltrado
    ? listaCompleta.slice(inicioPaginacao, inicioPaginacao + LIMIT)
    : listaCompleta;

  // Para pegar o header
  const getHeaders = () => {
    const token = localStorage.getItem("royal_token");
    return { Authorization: `Bearer ${token}` };
  };

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
  };

  // Blob
  const handleExportar = async () => {
    try {
      const res = await fetch("https://padaria-royal-api.onrender.com/producao/exportar", {
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
      const res = await fetch("https://padaria-royal-api.onrender.com/producao/importar", {
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
      const res = await fetch(`https://padaria-royal-api.onrender.com/producao/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!res.ok) throw new Error();

      refetch();

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
      year: '2-digit'
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
            {Object.values(filtrosAplicados).some(x => x !== '') && (
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
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Loader2 className="animate-spin text-orange-500" size={32} />
            <p className="text-gray-400 text-sm">Carregando histórico...</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {producoes.map((prod: any) => (
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
                    {(user?.cargo === 'GERENTE' || user?.permissoes?.editar) && (
                      <button
                        onClick={() => router.push(`/avaliacao/${prod.id}`)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                        title="Editar / Avaliar"
                      >
                        <Edit size={18} />
                      </button>
                    )}
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
            {/* Paginação que só aparece quando o filtro não está ativo */}
            {!isLoading && totalPaginas > 1 && (
            <div className="flex items-center justify-between pt-2 pb-4">
              <span className="text-xs text-gray-400 font-medium">
                {total} fornadas - página {pagina} de {totalPaginas}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagina <= 1}
                  onClick={() => {
                    setPagina(pagina - 1);
                    scrollTo({top: 0, behavior: 'smooth'});
                  }}
                  className="px-4 py-2 text-sm font-bold rounded-xl border border-gray-200 bg-white text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft size={14} />
                </button>
                <button
                  disabled={pagina >= totalPaginas}
                  onClick={() => {
                    const p = pagina + 1;
                    setPagina(p);
                    scrollTo({top: 0, behavior: 'smooth'});
                  }}
                  className="px-4 py-2 text-sm font-bold rounded-xl border border-gray-200 bg-white text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
