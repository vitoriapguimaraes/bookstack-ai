import { useState, useEffect, useRef } from "react";
import { Star, ImageOff, Info } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { getCoverUrl } from "../../utils/imageUtils";

export default function BookCard({ book, compact = false, onEdit }) {
  const { theme } = useTheme();
  const [coverLoadFailed, setCoverLoadFailed] = useState(false);
  const [mobileMotivation, setMobileMotivation] = useState(false);
  const autoHideRef = useRef(null);

  const showMobileMotivation = (e) => {
    e.stopPropagation(); // não aciona o onClick do card
    setMobileMotivation(true);
    clearTimeout(autoHideRef.current);
    autoHideRef.current = setTimeout(() => setMobileMotivation(false), 4000);
  };

  const hideMobileMotivation = (e) => {
    e.stopPropagation();
    clearTimeout(autoHideRef.current);
    setMobileMotivation(false);
  };

  // Dynamic placeholder colors based on theme
  const bgColor = theme === "dark" ? "171717" : "f1f5f9";
  const textColor = theme === "dark" ? "a855f7" : "475569";

  const placeholderUrl = `https://placehold.co/300x450/${bgColor}/${textColor}?text=${encodeURIComponent(book.title)}`;
  const coverUrl = getCoverUrl(book.cover_image) ?? placeholderUrl;

  const handleClick = () => {
    if (onEdit) onEdit(book);
  };

  // ── Compact card (used in Mural grid) ──────────────────────────────────────
  if (compact) {
    return (
      <div
        onClick={handleClick}
        className="group relative bg-white dark:bg-neutral-900 rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all duration-200 border border-slate-200 dark:border-neutral-800 hover:border-purple-300 dark:hover:border-purple-500/30 shadow-sm"
      >
        {/* Order badge — hide for Lido */}
        {Number(book.order) > 0 && book.status !== "Lido" && (
          <div className="absolute top-1 left-1 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded z-10">
            #{book.order}
          </div>
        )}

        {/* Score badge — hide for Lido */}
        {book.score > 0 && book.status !== "Lido" && (
          <div className="absolute top-1 right-1 bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded z-10">
            {book.score.toFixed(0)}
          </div>
        )}

        <div className="flex gap-2 p-2">
          {/* Cover */}
          <div className="w-16 h-22 relative flex-shrink-0">
            <img
              src={coverUrl}
              alt={book.title}
              className="w-full h-full object-cover rounded"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://placehold.co/300x450/${bgColor}/${textColor}?text=${encodeURIComponent(
                  book.title,
                )}`;
                setCoverLoadFailed(true);
              }}
            />
            {coverLoadFailed && book.cover_image && (
              <div
                className="absolute bottom-0.5 right-0.5 bg-amber-500 rounded-full p-0.5"
                title="Capa não disponível"
              >
                <ImageOff size={8} className="text-white" />
              </div>
            )}
          </div>

          {/* Text area — motivation overlay sits here */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5 relative overflow-hidden">
            {/* Title + Author */}
            <div className="flex-1">
              <h4
                className="font-medium text-xs line-clamp-1 text-slate-800 dark:text-white leading-tight mb-0.5"
                title={book.title}
              >
                {book.title}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-neutral-400 truncate">
                {book.author}
              </p>
              {(book.book_class || book.category) && (
                <div className="flex flex-col gap-0 mt-0.5">
                  {book.book_class && (
                    <span
                      className="text-[8px] text-slate-400 dark:text-neutral-500 truncate"
                      title={book.book_class}
                    >
                      {book.book_class}
                    </span>
                  )}
                  {book.category && book.category !== book.book_class && (
                    <span
                      className="text-[8px] text-slate-300 dark:text-neutral-600 truncate"
                      title={book.category}
                    >
                      {book.category}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Rating */}
            {book.rating > 0 && (
              <div className="flex items-center gap-1 w-max bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <Star
                  size={10}
                  fill="#fbbf24"
                  className="text-amber-500 dark:text-amber-400"
                />
                <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                  {book.rating}
                </span>
              </div>
            )}

            {/* Motivation overlay — desktop: hover | mobile: botão ℹ */}
            {book.motivation && (
              <>
                {/* Botão info — só mobile */}
                <button
                  onPointerDown={mobileMotivation ? hideMobileMotivation : showMobileMotivation}
                  className="md:hidden absolute top-0 right-0 p-1 text-slate-400 dark:text-neutral-500 z-20"
                  title="Ver motivação"
                >
                  <Info size={12} />
                </button>

                {/* Overlay desktop (hover) */}
                <div className="hidden md:flex absolute inset-0 bg-white/92 dark:bg-neutral-900/92 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded items-center p-1.5 pointer-events-none">
                  <p className="text-[9px] text-slate-600 dark:text-neutral-300 leading-relaxed line-clamp-6">
                    {book.motivation}
                  </p>
                </div>

                {/* Overlay mobile (tap no ℹ) */}
                {mobileMotivation && (
                  <div
                    onPointerDown={hideMobileMotivation}
                    className="md:hidden absolute inset-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-[2px] rounded flex items-center p-1.5 z-10 animate-fade-in"
                  >
                    <p className="text-[9px] text-slate-600 dark:text-neutral-300 leading-relaxed line-clamp-6">
                      {book.motivation}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Main card (used in Mural full view) ────────────────────────────────────
  return (
    <div
      onClick={handleClick}
      className="group relative bg-white dark:bg-neutral-900 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all duration-200 border border-slate-200 dark:border-neutral-800 hover:border-purple-300 dark:hover:border-purple-500/30 flex h-36 shadow-sm"
    >
      {/* Cover Image */}
      <div className="w-24 flex-shrink-0 bg-slate-100 dark:bg-neutral-950 relative overflow-hidden rounded-l-lg">
        <img
          src={coverUrl}
          alt={book.title}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://placehold.co/300x450/${bgColor}/${textColor}?text=${encodeURIComponent(
              book.title,
            )}`;
            setCoverLoadFailed(true);
          }}
        />

        {coverLoadFailed && book.cover_image && (
          <div
            className="absolute top-1 right-1 bg-amber-500/90 rounded px-1 py-0.5 flex items-center gap-0.5"
            title="Capa não disponível — imagem pode ter expirado"
          >
            <ImageOff size={9} className="text-white" />
          </div>
        )}

        {/* Order badge — hide for Lido */}
        {Number(book.order) > 0 && book.status !== "Lido" && (
          <div className="absolute bottom-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg">
            #{book.order}
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 p-2 flex flex-col gap-1 min-w-0 relative overflow-hidden">
        {/* Title + Author */}
        <div className="h-12">
          <h3
            className="font-semibold text-slate-800 dark:text-white text-xs leading-snug mb-0.5 line-clamp-2"
            title={book.title}
          >
            {book.title}
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-neutral-400 truncate">
            {book.author}
          </p>
        </div>

        {/* Classification */}
        <div className="h-7 flex flex-col gap-0 text-[9px]">
          <span
            className="text-slate-500 dark:text-neutral-400 font-medium truncate"
            title={book.book_class}
          >
            {book.book_class}
          </span>
          <span
            className="text-slate-400 dark:text-neutral-400 truncate"
            title={book.category}
          >
            {book.category}
          </span>
        </div>

        {/* Metrics */}
        <div className="h-6 flex items-center gap-1 flex-wrap">
          {book.score > 0 && (
            <div className="flex items-center gap-0.5 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                {book.score.toFixed(0)}
              </span>
              <span className="text-[8px] text-slate-500 dark:text-neutral-500">
                Score
              </span>
            </div>
          )}

          {book.google_rating && (
            <div className="flex items-center gap-0.5 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              <Star
                size={8}
                fill="#fbbf24"
                className="text-amber-500 dark:text-amber-400"
              />
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                {book.google_rating.toFixed(1)}
              </span>
              <span className="text-[8px] text-slate-500 dark:text-neutral-500">
                Google
              </span>
            </div>
          )}

          {book.rating > 0 && (
            <div className="flex items-center gap-0.5 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              <Star
                size={10}
                fill="#fbbf24"
                className="text-amber-500 dark:text-amber-400"
              />
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                {book.rating}
              </span>
            </div>
          )}
        </div>

        {/* Motivation overlay — desktop: hover | mobile: botão ℹ */}
        {book.motivation && (
          <>
            {/* Botão info — só mobile */}
            <button
              onPointerDown={mobileMotivation ? hideMobileMotivation : showMobileMotivation}
              className="md:hidden absolute top-1 right-1 p-1.5 bg-white/80 dark:bg-neutral-900/80 rounded-full text-slate-400 dark:text-neutral-500 z-20 shadow-sm"
              title="Ver motivação"
            >
              <Info size={14} />
            </button>

            {/* Overlay desktop (hover) */}
            <div className="hidden md:flex absolute inset-0 bg-white/92 dark:bg-neutral-900/92 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-col justify-center p-3 pointer-events-none">
              <p className="text-[10px] text-slate-700 dark:text-neutral-200 leading-relaxed line-clamp-6 italic">
                "{book.motivation}"
              </p>
            </div>

            {/* Overlay mobile (tap no ℹ) */}
            {mobileMotivation && (
              <div
                onPointerDown={hideMobileMotivation}
                className="md:hidden absolute inset-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-[2px] rounded-lg flex flex-col justify-center p-3 z-10 animate-fade-in"
              >
                <p className="text-[10px] text-slate-700 dark:text-neutral-200 leading-relaxed line-clamp-6 italic">
                  "{book.motivation}"
                </p>
                <p className="text-[8px] text-slate-400 dark:text-neutral-500 mt-2 text-right">
                  toque para fechar
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
