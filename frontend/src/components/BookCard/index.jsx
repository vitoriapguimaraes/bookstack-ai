import { useState, useEffect } from "react";
import { Star, Pencil, Trash2, Info, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function BookCard({
  book,
  compact = false,
  onEdit,
  onRequestDelete,
}) {
  const { theme } = useTheme();
  const [showMotivation, setShowMotivation] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Handle animation states
  useEffect(() => {
    if (showMotivation) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 500); // Match fade-out duration
      return () => clearTimeout(timer);
    }
  }, [showMotivation, shouldRender]);

  // Auto-close popover after 5 seconds
  useEffect(() => {
    if (showMotivation) {
      const timer = setTimeout(() => {
        setShowMotivation(false);
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, [showMotivation]);
  // All covers are now external URLs from Google Books API, served via proxy

  // Dynamic placeholder colors based on theme
  const bgColor = theme === "dark" ? "171717" : "f1f5f9"; // neutral-900 : slate-100
  const textColor = theme === "dark" ? "a855f7" : "475569"; // purple-500 : slate-600

  // Robust Image URL Handling
  let coverUrl = `https://placehold.co/300x450/${bgColor}/${textColor}?text=${encodeURIComponent(
    book.title
  )}`;

  if (book.cover_image) {
    if (book.cover_image.startsWith("http")) {
      coverUrl = book.cover_image.replace(/^http:/, "https:");
    } else {
      coverUrl = `${API_URL}/proxy/image?url=${encodeURIComponent(
        book.cover_image
      )}`;
    }
  }

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (onRequestDelete) {
      onRequestDelete(book);
    } else {
      console.error("Delete handler not provided for BookCard");
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(book);
  };

  if (compact) {
    return (
      <div className="group relative bg-white dark:bg-neutral-900 rounded-md hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all duration-200 border border-slate-200 dark:border-neutral-800 hover:border-purple-300 dark:hover:border-purple-500/30 shadow-sm">
        {/* Order badge - top left */}
        {book.order && (
          <div className="absolute top-1 left-1 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded z-10">
            #{book.order}
          </div>
        )}

        {/* Score badge - top right */}
        {book.score > 0 && (
          <div className="absolute top-1 right-1 bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded z-10">
            {book.score.toFixed(0)}
          </div>
        )}

        <div className="flex gap-2 p-2">
          <img
            src={coverUrl}
            alt={book.title}
            className={`${
              compact ? "w-16 h-24" : "w-20 h-28"
            } object-cover rounded flex-shrink-0`}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://placehold.co/300x450/${bgColor}/${textColor}?text=${encodeURIComponent(
                book.title
              )}`;
            }}
          />

          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            {/* Section 1: Title + Author */}
            <div className="flex-1">
              <h4
                className={`font-medium ${
                  compact ? "text-xs line-clamp-1" : "text-sm line-clamp-2"
                } text-slate-800 dark:text-white leading-tight mb-0.5`}
                title={book.title}
              >
                {book.title}
              </h4>
              <p
                className={`text-[10px] text-slate-500 dark:text-neutral-400 truncate`}
              >
                {book.author}
              </p>
            </div>

            {/* Section 2: Rating */}
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
                <span className="text-[9px] text-slate-500 dark:text-neutral-500">
                  Minha
                </span>
              </div>
            )}

            {/* Section 3: Action Buttons */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
              {book.motivation && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMotivation(!showMotivation);
                  }}
                  className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-slate-400 dark:text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                  title="Ver motivação"
                >
                  <Info size={14} />
                </button>
              )}
              <button
                onClick={handleEditClick}
                className="p-1.5 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-slate-400 dark:text-neutral-500 hover:text-purple-600 dark:hover:text-purple-400 rounded transition-colors"
                title="Editar"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 text-slate-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                title="Excluir"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Motivation Popover - Compact Card */}
        {shouldRender && book.motivation && (
          <div
            className={`absolute right-0 top-full mt-2 w-64 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-blue-500/50 rounded-lg shadow-2xl p-3 z-30 ring-1 ring-black/5 ${
              isClosing ? "animate-fade-out" : "animate-fade-in"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Info size={12} /> Motivação
              </h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMotivation(false);
                }}
                className="text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-neutral-300 leading-relaxed max-h-40 overflow-y-auto">
              {book.motivation}
            </p>
            {/* Arrow pointing up to button */}
            <div className="absolute bottom-full right-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-white dark:border-b-blue-500/50"></div>
          </div>
        )}
      </div>
    );
  }

  // Main Card - Informative Design
  return (
    <div className="group relative bg-white dark:bg-neutral-900 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all duration-200 border border-slate-200 dark:border-neutral-800 hover:border-purple-300 dark:hover:border-purple-500/30 flex h-40 shadow-sm">
      {/* Cover Image */}
      <div className="w-28 flex-shrink-0 bg-slate-100 dark:bg-neutral-950 relative overflow-hidden rounded-l-lg">
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
              book.title
            )}`;
          }}
        />

        {/* Order badge - bottom left on cover */}
        {book.order && (
          <div className="absolute bottom-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg">
            #{book.order}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-2 flex flex-col gap-1 min-w-0">
        {/* Section 1: Title + Author */}
        <div className="h-14">
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

        {/* Section 2: Classification (Class + Category) */}
        <div className="h-8 flex flex-col gap-0 text-[9px]">
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

        {/* Section 3: Metrics (Score + Ratings) */}
        <div className="h-6 flex items-center gap-1 flex-wrap">
          {/* Score */}
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

          {/* Google Rating */}
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

          {/* Personal Rating */}
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

        {/* Section 4: Action Buttons - Fixed at Bottom */}
        <div className="flex items-center justify-end mt-auto">
          {/* Action Buttons */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {book.motivation && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMotivation(!showMotivation);
                }}
                className="p-1 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-slate-400 dark:text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                title="Ver motivação"
              >
                <Info size={14} />
              </button>
            )}
            <button
              onClick={handleEditClick}
              className="p-1 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-slate-400 dark:text-neutral-500 hover:text-purple-600 dark:hover:text-purple-400 rounded transition-colors"
              title="Editar"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-500/20 text-slate-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
              title="Excluir"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Motivation Popover - Regular Card */}
      {shouldRender && book.motivation && (
        <div
          className={`absolute right-0 top-full mt-2 w-72 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-blue-500/50 rounded-lg shadow-2xl p-3 z-30 ring-1 ring-black/5 ${
            isClosing ? "animate-fade-out" : "animate-fade-in"
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Info size={14} /> Motivação
            </h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMotivation(false);
              }}
              className="text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-[10px] text-slate-600 dark:text-neutral-300 leading-relaxed max-h-40 overflow-y-auto">
            {book.motivation}
          </p>
          {/* Arrow pointing up to button */}
          <div className="absolute bottom-full right-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-white dark:border-b-blue-500/50"></div>
        </div>
      )}
    </div>
  );
}
