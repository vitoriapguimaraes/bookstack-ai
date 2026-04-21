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

  // KNN via backend
  const [knnRecs, setKnnRecs] = useState(null); // null = ainda não buscou
  const [knnLoading, setKnnLoading] = useState(false);
  const [knnError, setKnnError] = useState(false);

  // Default to 'reading' if no status in URL
  const activeStatus = status || "reading";

  // Busca recomendações KNN do backend ao entrar na aba
  useEffect(() => {
    if (activeStatus !== "recommend") return;
    if (knnRecs !== null || knnLoading) return; // já buscou ou está buscando
    setKnnLoading(true);
    setKnnError(false);
    api
      .get("/books/recommendations?top_n=10")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        // normaliza match_score → matchScore para o front
        setKnnRecs(data.map((b) => ({ ...b, matchScore: b.match_score ?? 0 })));
      })
      .catch(() => {
        setKnnError(true);
        setKnnRecs([]); // assegura fallback JS
      })
      .finally(() => setKnnLoading(false));
  }, [activeStatus]); // eslint-disable-line react-hooks/exhaustive-deps

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
  // Constrói o perfil de leitura a partir dos lidos ≥ 4 estrelas.
  // Peso composto = nota (5★=2, 4★=1) × decaimento temporal exponencial.
  // λ=0.4 → meia-vida ~1.7 anos: leituras de 2025 valem ~5× mais que de 2020.
  const buildRecommendProfile = () => {
    const lidos = books.filter((b) => b.status === "Lido" && b.rating > 0);
    const lidosPos = lidos.filter((b) => b.rating >= 4);
    const lidosNeg = lidos.filter((b) => b.rating < 4);
    if (lidosPos.length < 2) return null;

    const now = Date.now();
    const MS_PER_YEAR = 365.25 * 24 * 3600 * 1000;
    const LAMBDA = 0.4;

    const buildProfileFor = (sourceBooks, isPositive) => {
      const clsF = {},
        catF = {},
        typF = {},
        authF = {};
      let scoreSum = 0,
        scoreCount = 0;

      sourceBooks.forEach((b) => {
        let ratingW = 1.0;
        if (isPositive) {
          ratingW = b.rating >= 5 ? 2 : 1;
        } else {
          ratingW = b.rating === 1 ? 2 : b.rating === 2 ? 1.5 : 0.5;
        }

        const yearsAgo = b.date_read
          ? (now - new Date(b.date_read).getTime()) / MS_PER_YEAR
          : 10;
        const decay = Math.exp(-LAMBDA * yearsAgo);
        const w = ratingW * decay;

        if (b.book_class) clsF[b.book_class] = (clsF[b.book_class] || 0) + w;
        if (b.category) catF[b.category] = (catF[b.category] || 0) + w;
        if (b.type) typF[b.type] = (typF[b.type] || 0) + w;
        if (b.author) authF[b.author] = (authF[b.author] || 0) + w;
        if (b.score > 0) {
          scoreSum += b.score * w;
          scoreCount += w;
        }
      });

      return {
        clsF,
        catF,
        typF,
        authF,
        maxCls: Math.max(...Object.values(clsF), 1),
        maxCat: Math.max(...Object.values(catF), 1),
        maxTyp: Math.max(...Object.values(typF), 1),
        maxAuth: Math.max(...Object.values(authF), 1),
      };
    };

    const maxQueueScore = Math.max(
      ...books
        .filter((b) => b.status === "A Ler" && b.score > 0)
        .map((b) => b.score),
      1,
    );

    return {
      pos: buildProfileFor(lidosPos, true),
      neg: lidosNeg.length > 0 ? buildProfileFor(lidosNeg, false) : null,
      maxQueueScore,
    };
  };

  const scoreOneBook = (b, profileObj) => {
    const { pos, neg, maxQueueScore } = profileObj;

    const calcSim = (p) => {
      if (!p) return 0;
      const cls = (p.clsF[b.book_class] || 0) / p.maxCls;
      const cat = (p.catF[b.category] || 0) / p.maxCat;
      const typ = (p.typF[b.type] || 0) / p.maxTyp;
      const auth = (p.authF[b.author] || 0) / p.maxAuth; // sems bônus de descoberta!
      const scr = b.score > 0 ? b.score / maxQueueScore : 0.5;
      return cls * 0.35 + cat * 0.25 + typ * 0.13 + auth * 0.12 + scr * 0.15;
    };

    const simPos = calcSim(pos);
    const simNeg = neg ? calcSim(neg) : 0;

    const adjusted = simPos - 0.35 * simNeg;
    return Math.max(1, Math.min(100, Math.round(adjusted * 100)));
  };

  // Retorna knnRecs do backend se já chegou; caso contrário usa algoritmo JS
  const getRecommendations = () => {
    if (knnRecs !== null && knnRecs.length > 0) return knnRecs;
    // fallback JS (usado enquanto backend carrega ou se falhou)
    const profile = buildRecommendProfile();
    if (!profile) return [];
    return books
      .filter((b) => b.status === "A Ler")
      .map((b) => ({ ...b, matchScore: scoreOneBook(b, profile) }))
      .filter((b) => b.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
  };

  // Histograma: pontua TODOS os livros 'A Ler' e distribui em bins de 10%
  const getScoreDistribution = () => {
    const profile = buildRecommendProfile();
    if (!profile) return [];
    const bins = Array.from({ length: 10 }, (_, i) => ({
      label: `${i * 10 + 1}–${(i + 1) * 10}%`,
      count: 0,
    }));
    books
      .filter((b) => b.status === "A Ler")
      .forEach((b) => {
        const s = scoreOneBook(b, profile);
        if (s <= 0) return;
        bins[Math.min(9, Math.floor((s - 1) / 10))].count++;
      });
    return bins.filter((bin) => bin.count > 0);
  };

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
          const bins = getScoreDistribution();
          const maxBinCount = Math.max(...bins.map((b) => b.count), 1);

          return (
            <section className="flex-1 min-h-0 flex flex-col gap-5">
              {/* ── Linha 1: Explicação + Histograma ── */}
              <div className="flex gap-4 items-stretch">
                {/* Painel explicativo */}
                <div className="flex gap-3 items-start bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-200 basis-1/3 shrink-0">
                  <Info size={15} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">Como funciona?</p>
                    <p className="opacity-90 leading-relaxed text-xs flex flex-col gap-1">
                      <span>
                        Lidos com <strong>4-5★</strong> criam seu Perfil
                        Positivo; <strong>1-3★</strong> o Perfil Negativo.
                      </span>
                      <span>
                        <strong>Leituras recentes pesam mais</strong> (meia-vida
                        de ~1.7 anos).
                      </span>
                    </p>
                    <div className="mt-2">
                      <p className="font-mono text-[10px] bg-blue-100 dark:bg-blue-900/40 px-2 py-1.5 rounded inline-block">
                        Match = Simil.(Positiva) - 35% × Simil.(Negativa)
                      </p>
                    </div>
                    <p className="mt-2 text-xs opacity-85 leading-tight">
                      <strong>Motor de IA (KNN):</strong> Analisa classe,
                      categoria, tipo, autor e score para encontrar vizinhos
                      próximos na sua fila.
                    </p>
                  </div>
                </div>

                {/* Histograma */}
                {bins.length > 0 && (
                  <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 basis-2/3 flex flex-col">
                    <p className="text-xs font-semibold text-slate-600 dark:text-neutral-300 mb-3 flex items-center gap-1.5">
                      <Sparkles size={12} className="text-fuchsia-500" />
                      Distribuição — Fila (A Ler)
                    </p>
                    <div className="flex flex-col justify-evenly flex-1 gap-1.5">
                      {[...bins].reverse().map((bin) => (
                        <div
                          key={bin.label}
                          className="flex items-center gap-2"
                        >
                          <span className="w-16 text-[10px] text-slate-400 dark:text-neutral-500 text-right flex-shrink-0">
                            {bin.label}
                          </span>
                          <div className="flex-1 bg-slate-100 dark:bg-neutral-800 rounded-full h-3 overflow-hidden">
                            <div
                              className="h-3 rounded-full bg-fuchsia-400 dark:bg-fuchsia-500 transition-all duration-500"
                              style={{
                                width: `${(bin.count / maxBinCount) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="w-6 text-[10px] font-bold text-slate-600 dark:text-neutral-300 text-right flex-shrink-0">
                            {bin.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Linha 2: Top 10 Cards — full width ── */}
              {recs.length > 0 ? (
                <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
                  {recs.map((book) => (
                    <div key={book.id} className="relative">
                      <span className="absolute top-2 right-2 z-10 text-[10px] font-bold text-fuchsia-600 dark:text-fuchsia-400 bg-white dark:bg-neutral-900 border border-fuchsia-200 dark:border-fuchsia-800 px-1.5 py-0.5 rounded-full shadow-sm">
                        ✨ {book.matchScore}%
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
