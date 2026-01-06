import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import {
  AlertTriangle,
  CheckCircle,
  Search,
  Edit2,
  ArrowRight,
  Filter,
  RefreshCw,
  Trash2,
  Layers,
  Tag,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AuditSettings() {
  const [books, setBooks] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);
  const [filter, setFilter] = useState("all"); // all, class, category
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [booksRes, configRes] = await Promise.all([
        api.get("/books/"),
        api.get("/preferences/"),
      ]);
      setBooks(booksRes.data);
      const classCats = configRes.data?.class_categories || {};
      setConfig(classCats);
      runAudit(booksRes.data, classCats);
    } catch (err) {
      console.error("Erro na auditoria:", err);
    } finally {
      setLoading(false);
    }
  };

  const runAudit = (allBooks, classCats) => {
    const foundIssues = [];

    allBooks.forEach((book) => {
      const bookClass = book.book_class || "";
      const category = book.category || "";

      const validClasses = Object.keys(classCats);
      const isClassValid = validClasses.includes(bookClass);

      let isCategoryValid = true;
      if (isClassValid) {
        const validCategories = classCats[bookClass] || [];
        isCategoryValid = validCategories.includes(category);
      } else {
        isCategoryValid = false; // If class is invalid, category is implicitly problematic
      }

      if (!isClassValid || !isCategoryValid) {
        foundIssues.push({
          ...book,
          issueType: !isClassValid ? "class" : "category",
          reason: !isClassValid
            ? `Classe "${bookClass}" não existe no sistema.`
            : `Categoria "${category}" não existe na classe "${bookClass}".`,
        });
      }
    });

    setIssues(foundIssues);
  };

  // Aggregation logic
  const aggregatedIssues = issues.reduce((acc, current) => {
    const key = current.reason;
    if (!acc[key]) {
      acc[key] = {
        reason: key,
        count: 0,
        type: current.issueType,
        example: current,
      };
    }
    acc[key].count += 1;
    return acc;
  }, {});

  const [selectedReason, setSelectedReason] = useState(null);

  const filteredIssues = issues.filter((issue) => {
    let matchesType = true;
    if (filter !== "all") matchesType = issue.issueType === filter;

    let matchesReason = true;
    if (selectedReason) matchesReason = issue.reason === selectedReason;

    return matchesType && matchesReason;
  });

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 animate-pulse">
        <RefreshCw className="animate-spin text-purple-500" size={32} />
        <p className="text-slate-500 font-medium">
          Analisando integridade dos dados...
        </p>
      </div>
    );

  // Calculate detailed metrics
  const classErrorCount = issues.filter((i) => i.issueType === "class").length;
  const catErrorCount = issues.filter((i) => i.issueType === "category").length;
  const problematicClasses = [
    ...new Set(issues.map((i) => i.book_class)),
  ].filter(Boolean);

  return (
    <div className="w-full animate-fade-in space-y-6 pb-20">
      <div className="hidden md:block">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          Auditoria de Dados
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Analise a integridade e consistência das informações da sua
          biblioteca.
        </p>
      </div>

      {/* Header Dashboard / Top Metrics & Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-2 text-slate-500 dark:text-slate-400">
            <Search size={18} />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total de Livros
            </span>
          </div>
          <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
            {books.length}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm border-l-4 border-l-red-500 transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-2 text-red-500">
            <AlertTriangle size={18} />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Inconsistências
            </span>
          </div>
          <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
            {issues.length}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm border-l-4 border-l-emerald-500 transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-2 text-emerald-500">
            <CheckCircle size={18} />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Saúde da Base
            </span>
          </div>
          <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
            {books.length > 0
              ? (((books.length - issues.length) / books.length) * 100).toFixed(
                  1
                )
              : 100}
            %
          </div>
        </div>

        {/* Integrated Tips Card */}
        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex flex-col gap-2 relative overflow-hidden group">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Filter size={14} />
            <span className="text-[10px] font-black uppercase tracking-wider">
              Dica de Manutenção
            </span>
          </div>
          <p className="text-[11px] text-blue-700/80 dark:text-blue-400/80 leading-snug font-medium">
            Use esta página para garantir que o seu Score seja calculado sempre
            com base em dados válidos.
          </p>
        </div>
      </div>

      {/* Aggregated Errors Card */}
      {issues.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 dark:text-white uppercase tracking-wider">
              Sumário por Tipo de Erro
            </h3>
            {selectedReason && (
              <button
                onClick={() => setSelectedReason(null)}
                className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest hover:bg-purple-50 dark:hover:bg-purple-900/30 px-2 py-1 rounded-md transition-all"
              >
                Limpar Filtro
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-neutral-800">
            {Object.values(aggregatedIssues).map((agg, idx) => (
              <button
                key={idx}
                onClick={() =>
                  setSelectedReason(
                    agg.reason === selectedReason ? null : agg.reason
                  )
                }
                className={`w-full flex items-center justify-between px-6 py-4 transition-all text-left group ${
                  selectedReason === agg.reason
                    ? "bg-purple-50/50 dark:bg-purple-900/10"
                    : "hover:bg-slate-50/50 dark:hover:bg-neutral-800/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-xl scale-90 ${
                      agg.type === "class"
                        ? "bg-red-50 text-red-500"
                        : "bg-orange-50 text-orange-500"
                    } dark:bg-neutral-800`}
                  >
                    <AlertTriangle size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`text-[13px] font-bold ${
                        selectedReason === agg.reason
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-slate-700 dark:text-slate-300"
                      } leading-tight`}
                    >
                      {agg.reason}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Clique para filtrar os registros abaixo
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-black px-3 py-1 rounded-full border transition-all ${
                      selectedReason === agg.reason
                        ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-200 dark:shadow-none"
                        : "bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-500 group-hover:border-slate-300"
                    }`}
                  >
                    {agg.count} livros
                  </span>
                  <ArrowRight
                    size={14}
                    className={`text-slate-300 group-hover:text-purple-400 transition-all ${
                      selectedReason === agg.reason
                        ? "translate-x-1 opacity-100"
                        : "opacity-0 -translate-x-2"
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm transition-all">
        <div className="px-6 py-6 border-b border-slate-100 dark:border-neutral-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/30 dark:bg-neutral-800/20">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">
              Registros para Correção
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
              Livros com valores que não correspondem às regras atuais.
            </p>
          </div>

          <div className="flex bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl w-full md:w-auto">
            {[
              { id: "all", label: "Tudo" },
              { id: "class", label: "Classes" },
              { id: "category", label: "Categorias" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  filter === t.id
                    ? "bg-white dark:bg-neutral-700 shadow-sm text-purple-600 dark:text-purple-400"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredIssues.length > 0 ? (
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-neutral-800/30 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-neutral-800">
                  <th className="px-4 py-4 w-[48%] truncate">Livro</th>
                  <th className="px-4 py-4 w-[12%] truncate">Valores</th>
                  <th className="px-4 py-4 w-[32%] truncate">Diagnóstico</th>
                  <th className="px-4 py-4 w-[8%] text-right truncate">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {filteredIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    className="group hover:bg-slate-50/30 dark:hover:bg-neutral-800/30 transition-all font-medium"
                  >
                    <td className="px-4 py-4 min-w-0">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-12 bg-slate-100 dark:bg-neutral-800 rounded flex-shrink-0 border border-slate-200 dark:border-neutral-700 flex items-center justify-center font-black text-[10px] text-slate-300 overflow-hidden shadow-sm">
                          {issue.cover_image ? (
                            <img
                              src={
                                issue.cover_image.startsWith("http")
                                  ? `/api/proxy/image?url=${encodeURIComponent(
                                      issue.cover_image
                                    )}`
                                  : issue.cover_image.startsWith("/")
                                  ? issue.cover_image
                                  : `/${issue.cover_image}`
                              }
                              alt={issue.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = "none";
                                e.target.parentNode.innerHTML = issue.title[0];
                              }}
                            />
                          ) : (
                            issue.title[0]
                          )}
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                            {issue.title}
                          </div>
                          <div className="text-[9px] text-slate-400 truncate pr-2">
                            {issue.author}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 min-w-0 overflow-hidden">
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold truncate ${
                              issue.issueType === "class"
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : "bg-slate-50 text-slate-500 border border-slate-100 dark:bg-neutral-800 dark:text-slate-400 dark:border-neutral-700"
                            }`}
                          >
                            {issue.book_class || "Nula"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold truncate ${
                              issue.issueType === "category"
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : "bg-slate-50 text-slate-500 border border-slate-100 dark:bg-neutral-800 dark:text-slate-400 dark:border-neutral-700"
                            }`}
                          >
                            {issue.category || "Nula"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 min-w-0">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 leading-snug whitespace-normal break-words">
                          {issue.reason}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() =>
                          navigate(
                            `/mural/all?search=${encodeURIComponent(
                              issue.title
                            )}`
                          )
                        }
                        className="inline-flex items-center justify-center w-8 h-8 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-600 hover:text-white transition-all border border-purple-100 dark:border-purple-500/20 shadow-sm"
                        title="Corrigir"
                      >
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div
              className="px-8 flex flex-col items-center justify-center text-center gap-2 w-full"
              style={{ paddingTop: "20px", paddingBottom: "20px" }}
            >
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-500 mb-2">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Tudo em ordem!
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Todos os seus livros estão categorizados corretamente de acordo
                com as regras do sistema.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
