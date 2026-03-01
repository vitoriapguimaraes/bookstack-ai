import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BookOpen,
  Library,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import BookCard from "../../components/BookCard";
import ScrollToTopBottom from "../../components/ScrollToTopBottom";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmationContext";
import { api } from "../../services/api";

const CARD_MIN_WIDTH = 280; // minmax do grid
const CARD_MIN_HEIGHT = 210; // altura estimada de cada card
const HEADER_OFFSET = 310; // cabeçalho + tabs + paginação + padding

export default function MuralView({
  books,
  onEdit,
  onDelete,
  muralState,
  setMuralState,
}) {
  const navigate = useNavigate();
  const { status } = useParams();
  const [yearlyGoal, setYearlyGoal] = useState(20);
  const containerRef = useRef(null); // mede a largura real do container

  const { addToast } = useToast();
  const { confirm } = useConfirm();

  // Default to 'reading' if no status in URL
  const activeStatus = status || "reading";

  // Get current page from lifted state, default to 1
  const currentPage = muralState ? muralState[activeStatus] : 1;

  const setCurrentPage = (newPageFuncOrValue) => {
    // Handle both value and function updates
    const newPage =
      typeof newPageFuncOrValue === "function"
        ? newPageFuncOrValue(currentPage)
        : newPageFuncOrValue;

    setMuralState((prev) => ({
      ...prev,
      [activeStatus]: newPage,
    }));
  };

  // Calcula items por página a partir da largura e altura reais da viewport
  const [itemsPerPage, setItemsPerPage] = useState(12);

  useEffect(() => {
    if (!containerRef.current) return;
    const calc = () => {
      const cols = Math.max(
        1,
        Math.floor(containerRef.current.clientWidth / CARD_MIN_WIDTH),
      );
      const rows = Math.max(
        1,
        Math.floor((window.innerHeight - HEADER_OFFSET) / CARD_MIN_HEIGHT),
      );
      setItemsPerPage(cols * rows);
    };
    const observer = new ResizeObserver(calc);
    observer.observe(containerRef.current);
    window.addEventListener("resize", calc);
    calc();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", calc);
    };
  }, []);

  // Load yearly goal from localStorage
  useEffect(() => {
    const savedGoal = localStorage.getItem("yearlyReadingGoal");
    if (savedGoal) {
      setYearlyGoal(parseInt(savedGoal));
    }
  }, []);

  // Filter books by status
  const getFilteredBooks = () => {
    switch (activeStatus) {
      case "reading":
        return books.filter((b) => b.status === "Lendo");
      case "to-read":
        return books.filter((b) => b.status === "A Ler");
      case "read":
        return books.filter((b) => b.status === "Lido");
      case "recommend":
        return []; // handled separately
      default:
        return [];
    }
  };

  const filteredBooks = getFilteredBooks().sort((a, b) => {
    if (activeStatus === "read") {
      // Sort by date_read descending (newest first)
      if (!a.date_read) return 1;
      if (!b.date_read) return -1;
      return b.date_read.localeCompare(a.date_read);
    }
    // Default sorting by order
    return (a.order || 999) - (b.order || 999);
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleStatusChange = (newStatus) => {
    navigate(`/mural/${newStatus}`);
  };

  const getStatusLabel = (s) => {
    switch (s) {
      case "reading":
        return "Lendo Agora";
      case "to-read":
        return "Próximos da Fila";
      case "read":
        return "Já Lidos";
      case "recommend":
        return "Recomendados";
      default:
        return "";
    }
  };

  // ── Recomendações ────────────────────────────────────────────────────────
  const getRecommendations = () => {
    const lidos = books.filter((b) => b.status === "Lido" && b.rating >= 4);
    const fila = books.filter((b) => b.status === "A Ler");
    if (lidos.length < 2 || fila.length === 0) return [];

    // Perfil ponderado pela nota real (5★ vale 2×, 4★ vale 1×)
    const classFreq = {};
    const catFreq = {};
    const typeFreq = {};
    lidos.forEach((b) => {
      const w = b.rating >= 5 ? 2 : 1;
      if (b.book_class)
        classFreq[b.book_class] = (classFreq[b.book_class] || 0) + w;
      if (b.category) catFreq[b.category] = (catFreq[b.category] || 0) + w;
      if (b.type) typeFreq[b.type] = (typeFreq[b.type] || 0) + w;
    });
    const maxCls = Math.max(...Object.values(classFreq), 1);
    const maxCat = Math.max(...Object.values(catFreq), 1);
    const maxType = Math.max(...Object.values(typeFreq), 1);

    // Média geométrica das 3 dimensões → todas precisam coincidir para 100%
    // class 50% · category 30% · type 20% → via potência ponderada
    return fila
      .map((b) => {
        const cls = (classFreq[b.book_class] || 0) / maxCls;
        const cat = (catFreq[b.category] || 0) / maxCat;
        const typ = (typeFreq[b.type] || 0) / maxType;
        // Média geométrica ponderada: cls^0.5 · cat^0.3 · typ^0.2
        const score =
          cls > 0 && cat > 0
            ? Math.pow(cls, 0.5) *
              Math.pow(cat, 0.3) *
              Math.pow(typ > 0 ? typ : 0.1, 0.2)
            : 0;
        return { ...b, matchScore: Math.round(score * 100) };
      })
      .filter((b) => b.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
  };

  // Calculate current year progress
  const currentYear = new Date().getFullYear();
  const currentYearBooks = books.filter(
    (b) =>
      b.status === "Lido" &&
      b.date_read &&
      new Date(b.date_read).getFullYear() === currentYear,
  ).length;
  const progressPercentage = Math.min(
    (currentYearBooks / yearlyGoal) * 100,
    100,
  );

  return (
    <div ref={containerRef} className="flex flex-col animate-fade-in w-full">
      {/* Header with Integrated Status Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 flex-shrink-0">
        <div>
          {/* Desktop Title & Status */}
          <div className="hidden md:flex items-center gap-2">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
              Mural de Livros
            </h1>
            <span className="text-slate-300 dark:text-neutral-600 text-3xl font-light mx-1">
              |
            </span>
            <span
              className={`text-2xl font-semibold ${
                activeStatus === "reading"
                  ? "text-purple-600 dark:text-purple-400"
                  : activeStatus === "to-read"
                    ? "text-amber-600 dark:text-amber-500"
                    : "text-emerald-600 dark:text-emerald-500"
              }`}
            >
              {getStatusLabel(activeStatus)}
            </span>
          </div>

          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-2">
            Visualização em grade da sua biblioteca.
          </p>

          {/* Mobile Status (Subtitle -> Status) */}
          <div className="flex md:hidden items-center gap-2">
            <span
              className={`text-xl font-semibold ${
                activeStatus === "reading"
                  ? "text-purple-600 dark:text-purple-400"
                  : activeStatus === "to-read"
                    ? "text-amber-600 dark:text-amber-500"
                    : "text-emerald-600 dark:text-emerald-500"
              }`}
            >
              {getStatusLabel(activeStatus)}
            </span>
          </div>
        </div>

        {/* Right-aligned Status Options */}
        <div className="flex gap-2 bg-slate-100 dark:bg-neutral-900 p-1 rounded-lg border border-slate-200 dark:border-neutral-800">
          <button
            onClick={() => handleStatusChange("reading")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeStatus === "reading"
                ? "bg-white dark:bg-neutral-800 text-purple-600 dark:text-purple-400 shadow-sm border border-slate-200 dark:border-neutral-700"
                : "text-slate-500 dark:text-neutral-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BookOpen size={14} /> Lendo
          </button>
          <button
            onClick={() => handleStatusChange("to-read")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeStatus === "to-read"
                ? "bg-white dark:bg-neutral-800 text-amber-600 dark:text-amber-500 shadow-sm border border-slate-200 dark:border-neutral-700"
                : "text-slate-500 dark:text-neutral-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Library size={14} /> Fila
          </button>
          <button
            onClick={() => handleStatusChange("read")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeStatus === "read"
                ? "bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-500 shadow-sm border border-slate-200 dark:border-neutral-700"
                : "text-slate-500 dark:text-neutral-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <CheckCircle2 size={14} /> Concluídos
          </button>
          <button
            onClick={() => handleStatusChange("recommend")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeStatus === "recommend"
                ? "bg-white dark:bg-neutral-800 text-fuchsia-600 dark:text-fuchsia-400 shadow-sm border border-slate-200 dark:border-neutral-700"
                : "text-slate-500 dark:text-neutral-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sparkles size={14} /> Recomendados
          </button>
        </div>
      </div>

      {/* Meta 2026 Card - Only show on 'reading' tab */}
      {activeStatus === "reading" && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-slate-200 dark:border-neutral-700 mb-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers
                size={18}
                className="text-orange-600 dark:text-orange-400"
              />
              <span className="text-base font-semibold text-slate-800 dark:text-white">
                Meta {new Date().getFullYear()}
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">
              {currentYearBooks}/{yearlyGoal}
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-neutral-700 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-2">
            {progressPercentage.toFixed(0)}% da meta anual concluída
          </p>
        </div>
      )}

      {/* Pagination Controls - Moved to Top */}
      {totalPages > 1 && (
        <div className="w-full flex justify-center items-center gap-2 mb-6 flex-shrink-0">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-full bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-600 dark:text-neutral-400 disabled:opacity-30 transition-colors"
            title="Primeira página"
          >
            <ChevronsLeft size={18} />
          </button>

          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-full bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-600 dark:text-neutral-400 disabled:opacity-30 transition-colors"
            title="Página anterior"
          >
            <ChevronLeft size={20} />
          </button>

          <span className="text-sm font-bold text-slate-500 dark:text-neutral-500 px-4">
            Página {currentPage} de {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-full bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-600 dark:text-neutral-400 disabled:opacity-30 transition-colors"
            title="Próxima página"
          >
            <ChevronRight size={20} />
          </button>

          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-full bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-600 dark:text-neutral-400 disabled:opacity-30 transition-colors"
            title="Última página"
          >
            <ChevronsRight size={20} />
          </button>
        </div>
      )}

      {/* Recomendações — aba especial, sem paginação */}
      {activeStatus === "recommend" &&
        (() => {
          const recs = getRecommendations();
          return (
            <section className="flex-1 min-h-0">
              {/* Painel explicativo do algoritmo */}
              <div className="flex gap-3 items-start bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 mb-5 text-sm text-blue-800 dark:text-blue-200">
                <Info size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">
                    Como funciona a recomendação?
                  </p>
                  <p className="opacity-90 leading-relaxed">
                    Analisamos os livros lidos com <strong>nota ≥ 4</strong> e
                    identificamos quais <em>classes</em> e <em>categorias</em>{" "}
                    aparecem mais no seu histórico. Cada livro da fila recebe
                    uma pontuação:
                  </p>
                  <p className="mt-1.5 font-mono text-xs bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded inline-block">
                    match = classe^0.5 × categoria^0.3 × tipo^0.2
                  </p>
                  <p className="mt-1.5 opacity-80">
                    Usamos <strong>média geométrica</strong> — as três dimensões
                    precisam coincidir para um score alto. 5★ nos lidos valem o
                    dobro de 4★. 100% significa match perfeito em classe,
                    categoria e tipo.
                  </p>
                </div>
              </div>

              {recs.length > 0 ? (
                <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
                  {recs.map((book) => (
                    <div key={book.id} className="relative">
                      {/* Badge de match sobre o card */}
                      <span className="absolute top-2 right-2 z-10 text-[10px] font-bold text-fuchsia-600 dark:text-fuchsia-400 bg-white dark:bg-neutral-900 border border-fuchsia-200 dark:border-fuchsia-800 px-1.5 py-0.5 rounded-full shadow-sm">
                        ✨ {Math.round(book.matchScore)}%
                      </span>
                      <BookCard
                        book={book}
                        compact={false}
                        onEdit={onEdit}
                        onRequestDelete={() => {
                          confirm({
                            title: "Excluir Livro",
                            description: `Deseja realmente excluir "${book.title}"?`,
                            confirmText: "Excluir",
                            isDanger: true,
                            onConfirm: async () => {
                              try {
                                await api.delete(`/books/${book.id}`);
                                onDelete(book.id);
                                addToast({
                                  type: "success",
                                  message: "Livro excuído com sucesso!",
                                });
                              } catch (err) {
                                console.error(err);
                                addToast({
                                  type: "error",
                                  message: "Erro ao excluir livro.",
                                });
                              }
                            },
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-neutral-600">
                  <Sparkles size={40} className="mb-3 opacity-40" />
                  <p className="text-sm">
                    Leia e avalie pelo menos 2 livros com nota ≥ 4 para ver
                    recomendações.
                  </p>
                </div>
              )}
            </section>
          );
        })()}

      {/* Content Grid — para as abas normais */}
      {activeStatus !== "recommend" && (
        <section className="flex-1 min-h-0">
          {paginatedBooks.length > 0 ? (
            <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
              {paginatedBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  compact={false}
                  onEdit={onEdit}
                  // Pass onRequestDelete instead of expecting BookCard to handle it
                  onRequestDelete={() => {
                    confirm({
                      title: "Excluir Livro",
                      description: `Deseja realmente excluir "${book.title}"?`,
                      confirmText: "Excluir",
                      isDanger: true,
                      onConfirm: async () => {
                        try {
                          await api.delete(`/books/${book.id}`);
                          onDelete(book.id); // Notify parent to update list
                          addToast({
                            type: "success",
                            message: "Livro excluído com sucesso!",
                          });
                        } catch (err) {
                          console.error(err);
                          addToast({
                            type: "error",
                            message: "Erro ao excluir livro.",
                          });
                        }
                      },
                    });
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center text-slate-400 dark:text-neutral-600 py-20">
              <p className="text-lg">
                Nenhum livro encontrado nesta categoria.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Footer scroll handled by main window now */}
      <ScrollToTopBottom />

      {/* Modal is now global */}
    </div>
  );
}
