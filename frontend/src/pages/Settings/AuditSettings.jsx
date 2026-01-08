import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  Edit3,
  Trash,
  X as CloseIcon,
} from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import BulkEditModal from "../../components/BulkEditModal";
import { useToast } from "../../context/ToastContext";

// Levenshtein distance for fuzzy matching
const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

const DEFAULT_AVAILABILITY_OPTIONS = [
  "Físico",
  "Virtual",
  "Desejado",
  "Emprestado",
  "N/A",
];

export default function AuditSettings() {
  const [books, setBooks] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);
  const [filter, setFilter] = useState("all"); // all, class, category
  const navigate = useNavigate();
  const { onEdit } = useOutletContext();
  const { addToast } = useToast();

  const [selectedIssues, setSelectedIssues] = useState([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Clear selection when filter changes
  useEffect(() => {
    setSelectedIssues([]);
  }, [filter, issues]);

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
      const availOptions =
        configRes.data?.availability_options || DEFAULT_AVAILABILITY_OPTIONS;

      setConfig(classCats);
      runAudit(booksRes.data, classCats, availOptions);
    } catch (err) {
      console.error("Erro na auditoria:", err);
    } finally {
      setLoading(false);
    }
  };

  const runAudit = (allBooks, classCats, availOptions) => {
    const foundIssues = [];

    // 1. Check Metadata (Class, Category, Availability)
    allBooks.forEach((book) => {
      const bookClass = book.book_class || "";
      const category = book.category || "";
      const availability = book.availability || "";

      const validClasses = Object.keys(classCats);
      const isClassValid = validClasses.includes(bookClass);

      let isCategoryValid = true;
      if (isClassValid) {
        const validCategories = classCats[bookClass] || [];
        isCategoryValid = validCategories.includes(category);
      } else {
        isCategoryValid = false;
      }

      // Check Availability
      const isAvailabilityValid = availOptions.includes(availability);

      if (!isClassValid || !isCategoryValid) {
        foundIssues.push({
          ...book,
          issueId: crypto.randomUUID(),
          issueType: !isClassValid ? "class" : "category",
          reason: !isClassValid
            ? `Classe "${bookClass}" não existe no sistema.`
            : `Categoria "${category}" não existe na classe "${bookClass}".`,
        });
      }

      if (!isAvailabilityValid) {
        foundIssues.push({
          ...book,
          issueId: crypto.randomUUID(),
          issueType: "availability",
          reason: `Status "${availability}" não está na lista permitida.`,
        });
      }
    });

    // 2. Check Duplicates (Fuzzy Matching)
    // We compare every pair. For 1000 books, this is ~500k ops, which is fine in client JS.
    const processedPairs = new Set();

    for (let i = 0; i < allBooks.length; i++) {
      for (let j = i + 1; j < allBooks.length; j++) {
        const b1 = allBooks[i];
        const b2 = allBooks[j];

        // Skip if already flagged in metadata check? No, can be both.

        // Normalize for comparison
        const t1 = b1.title.toLowerCase().trim();
        const t2 = b2.title.toLowerCase().trim();

        if (t1.length < 3 || t2.length < 3) continue; // too short

        // Exact match
        if (t1 === t2) {
          foundIssues.push({
            ...b1,
            issueId: crypto.randomUUID(),
            issueType: "duplicate",
            reason: `Título idêntico a "${b2.title}" (ID: ${b2.id})`,
          });
          continue;
        }

        // Fuzzy match
        // Heuristic: If similarity is > 80% or distance < 3
        const dist = levenshteinDistance(t1, t2);
        const maxLength = Math.max(t1.length, t2.length);
        const similarity = 1 - dist / maxLength;

        if (similarity > 0.85 || (dist <= 2 && maxLength > 5)) {
          foundIssues.push({
            ...b1,
            issueId: crypto.randomUUID(),
            issueType: "duplicate",
            reason: `Possível duplicata de "${b2.title}" (${(
              similarity * 100
            ).toFixed(0)}% similar)`,
          });
        }
      }
    }

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

  // Auto-clear selectedReason if it no longer exists in aggregatedIssues
  useEffect(() => {
    if (selectedReason && !aggregatedIssues[selectedReason]) {
      setSelectedReason(null);
    }
  }, [aggregatedIssues, selectedReason]);

  const filteredIssues = issues.filter((issue) => {
    // If a specific reason is selected from the summary, show only that reason (ignore tabs)
    if (selectedReason) return issue.reason === selectedReason;

    // Otherwise respect the tab filter
    if (filter !== "all") return issue.issueType === filter;

    return true;
  });

  const handleSetFilter = (newFilter) => {
    setFilter(newFilter);
    setSelectedReason(null); // Clear specific selection when changing tabs
  };

  const toggleSelectIssue = (id) => {
    setSelectedIssues((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIssues.length === filteredIssues.length) {
      setSelectedIssues([]);
    } else {
      setSelectedIssues(filteredIssues.map((i) => i.id));
    }
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Tem certeza que deseja apagar ${selectedIssues.length} livros? Esta ação não pode ser desfeita.`
      )
    )
      return;

    setIsBulkProcessing(true);
    try {
      for (const id of selectedIssues) {
        await api.delete(`/books/${id}`);
      }
      addToast({ type: "success", message: "Livros apagados com sucesso!" });
      fetchData(); // Refresh to run audit again
      setSelectedIssues([]);
    } catch (err) {
      console.error(err);
      addToast({ type: "error", message: "Erro ao apagar alguns livros." });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkSave = async (updates) => {
    setShowBulkEdit(false);
    setIsBulkProcessing(true);
    try {
      const booksToUpdate = issues.filter((i) => selectedIssues.includes(i.id));

      for (const book of booksToUpdate) {
        const { issueType, reason, ...bookData } = book;
        const updatedBook = { ...bookData, ...updates };
        await api.put(`/books/${book.id}`, updatedBook);
      }

      addToast({ type: "success", message: "Atualização em massa concluída!" });
      fetchData();
      setSelectedIssues([]);
    } catch (err) {
      console.error(err);
      addToast({ type: "error", message: "Erro ao atualizar livros." });
    } finally {
      setIsBulkProcessing(false);
    }
  };

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
            {Object.values(aggregatedIssues)
              .sort((a, b) => b.count - a.count)
              .map((agg, idx) => (
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
                          : agg.type === "category"
                          ? "bg-orange-50 text-orange-500"
                          : agg.type === "availability"
                          ? "bg-cyan-50 text-cyan-500"
                          : "bg-blue-50 text-blue-500"
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

      {/* Detailed Issues Table Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-white uppercase tracking-wider">
            Registros para Correção
          </h3>

          <div className="flex bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl w-full md:w-auto">
            {[
              { id: "all", label: "Tudo" },
              { id: "class", label: "Classes" },
              { id: "category", label: "Categorias" },
              { id: "availability", label: "Disponib." },
              { id: "duplicate", label: "Duplicatas" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => handleSetFilter(t.id)}
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
                  <th className="px-4 py-4 w-[40px]">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      checked={
                        filteredIssues.length > 0 &&
                        selectedIssues.length === filteredIssues.length
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-4 w-[45%] truncate">Livro</th>
                  <th className="px-4 py-4 w-[12%] truncate">Valores</th>
                  <th className="px-4 py-4 w-[32%] truncate">Diagnóstico</th>
                  <th className="px-4 py-4 w-[8%] text-right truncate">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {filteredIssues.map((issue) => (
                  <tr
                    key={issue.issueId}
                    className={`group hover:bg-slate-50/30 dark:hover:bg-neutral-800/30 transition-all font-medium ${
                      selectedIssues.includes(issue.id)
                        ? "bg-purple-50/50 dark:bg-purple-900/10"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        checked={selectedIssues.includes(issue.id)}
                        onChange={() => toggleSelectIssue(issue.id)}
                      />
                    </td>
                    <td className="px-4 py-4 min-w-0">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-12 bg-slate-100 dark:bg-neutral-800 rounded flex-shrink-0 border border-slate-200 dark:border-neutral-700 flex items-center justify-center font-black text-[10px] text-slate-300 overflow-hidden shadow-sm">
                          {(() => {
                            const API_URL =
                              import.meta.env.VITE_API_URL ||
                              "http://localhost:8000";
                            let coverUrl = null;
                            const cover = issue.cover_image;

                            if (cover) {
                              if (cover.startsWith("http")) {
                                coverUrl = cover.replace(/^http:/, "https:");
                              } else {
                                // Assume relative or needs proxy if not http?
                                // Actually BooksTable logic says: if NOT http, use proxy.
                                // But if it's a relative path "/foo.jpg", proxy?url=/foo.jpg fails.
                                // Let's try direct usage if it starts with /
                                if (cover.startsWith("/")) coverUrl = cover;
                                else
                                  coverUrl = `${API_URL}/proxy/image?url=${encodeURIComponent(
                                    cover
                                  )}`;
                              }
                            }

                            return coverUrl ? (
                              <img
                                src={coverUrl}
                                alt={issue.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.parentNode.innerText =
                                    issue.title[0];
                                }}
                              />
                            ) : (
                              issue.title[0]
                            );
                          })()}
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
                        {/* Status Tag for Availability */}
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold truncate ${
                              issue.issueType === "availability"
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : "bg-slate-50 text-slate-500 border border-slate-100 dark:bg-neutral-800 dark:text-slate-400 dark:border-neutral-700"
                            }`}
                          >
                            {issue.availability || "Status Nulo"}
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
                        onClick={() => onEdit(issue)}
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

      {/* Floating Bulk Action Bar */}
      {selectedIssues.length > 0 && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-full px-6 py-3 shadow-2xl flex items-center gap-6 z-50 animate-bounce-in">
          <span className="text-white font-bold text-sm bg-purple-600 px-3 py-1 rounded-full">
            {selectedIssues.length} selecionados
          </span>

          <div className="h-4 w-px bg-slate-200 dark:bg-neutral-700"></div>

          <button
            onClick={() => setShowBulkEdit(true)}
            className="flex items-center gap-2 text-slate-600 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm font-bold uppercase tracking-wider"
          >
            <Edit3 size={16} />
            Corrigir em Massa
          </button>

          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 text-slate-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 transition-colors text-sm font-bold uppercase tracking-wider"
          >
            <Trash size={16} />
            Excluir
          </button>

          <button
            onClick={() => setSelectedIssues([])}
            className="ml-2 text-slate-400 dark:text-neutral-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            title="Cancelar Seleção"
          >
            <CloseIcon size={16} />
          </button>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEdit &&
        createPortal(
          <BulkEditModal
            count={selectedIssues.length}
            onClose={() => setShowBulkEdit(false)}
            onSave={handleBulkSave}
          />,
          document.body
        )}

      {isBulkProcessing &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center animate-fade-in">
            <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-5 border border-slate-200 dark:border-neutral-800 scale-110">
              <div className="relative">
                <RefreshCw className="animate-spin text-purple-600" size={40} />
                <div className="absolute inset-0 blur-lg bg-purple-500/20 animate-pulse rounded-full"></div>
              </div>
              <div className="text-center">
                <p className="font-black text-slate-800 dark:text-white text-lg">
                  Processando alterações
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Sincronizando {selectedIssues.length} livros com o servidor...
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
