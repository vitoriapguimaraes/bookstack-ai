import { useState, useEffect } from "react";
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
} from "lucide-react";
import BookCard from "../../components/BookCard";
import ScrollToTopBottom from "../../components/ScrollToTopBottom";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmationContext";
import { api } from "../../services/api";

const ITEMS_PER_PAGE = 12;

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

  const itemsPerPage = ITEMS_PER_PAGE;

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

    // Perfil: frequência de book_class e category nos lidos favoritos
    const classFreq = {};
    const catFreq = {};
    lidos.forEach((b) => {
      if (b.book_class)
        classFreq[b.book_class] = (classFreq[b.book_class] || 0) + 1;
      if (b.category) catFreq[b.category] = (catFreq[b.category] || 0) + 1;
    });
    const maxCls = Math.max(...Object.values(classFreq), 1);
    const maxCat = Math.max(...Object.values(catFreq), 1);

    // Pontua cada livro da fila
    return fila
      .map((b) => ({
        ...b,
        matchScore:
          ((classFreq[b.book_class] || 0) / maxCls) * 60 +
          ((catFreq[b.category] || 0) / maxCat) * 40,
      }))
      .filter((b) => b.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20);
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
    <div className="flex flex-col animate-fade-in w-full">
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
              {recs.length > 0 ? (
                <>
                  <p className="text-xs text-slate-400 dark:text-neutral-500 mb-4">
                    Baseado nos livros que você leu com nota ≥ 4 — ordenado por
                    similaridade de classe e categoria.
                  </p>
                  <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
                    {recs.map((book) => (
                      <div
                        key={book.id}
                        className="flex flex-col gap-1 p-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl hover:border-fuchsia-300 dark:hover:border-fuchsia-800 transition-all shadow-sm cursor-pointer"
                        onClick={() => onEdit(book)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className="text-sm font-semibold text-slate-800 dark:text-white leading-snug line-clamp-2"
                            title={book.title}
                          >
                            {book.title}
                          </p>
                          <span className="flex-shrink-0 text-xs font-bold text-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20 px-2 py-0.5 rounded-full">
                            {Math.round(book.matchScore)}%
                          </span>
                        </div>
                        {book.author && (
                          <p className="text-xs text-slate-500 dark:text-neutral-400 truncate">
                            {book.author}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {book.book_class && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400">
                              {book.book_class}
                            </span>
                          )}
                          {book.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400">
                              {book.category}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
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
