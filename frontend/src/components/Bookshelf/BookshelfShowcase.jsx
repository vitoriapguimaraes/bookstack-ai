import { Star } from "lucide-react";

export default function BookshelfShowcase({ books, onExport }) {
  // Books are already filtered by parent (HomeView)
  const displayBooks = books.filter((b) => b.cover_image);

  return (
    <div className="flex flex-col">
      {/* Grid de Capas */}
      <div className="">
        <div className="grid grid-cols-3 sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 sm:gap-4 pb-8 transition-opacity duration-300">
          {displayBooks.map((book) => {
            // Robust Image URL Handling
            const API_URL =
              import.meta.env.VITE_API_URL || "http://localhost:8000";
            let coverUrl = null;
            if (book.cover_image) {
              if (book.cover_image.startsWith("http")) {
                coverUrl = book.cover_image.replace(/^http:/, "https:");
              } else {
                coverUrl = `${API_URL}/proxy/image?url=${encodeURIComponent(
                  book.cover_image
                )}`;
              }
            }

            return (
              <div
                key={book.id}
                className="group relative aspect-[2/3] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all hover:scale-105 bg-slate-100 dark:bg-neutral-800"
              >
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.target.onerror = null;
                      const bgColor = "f1f5f9";
                      const textColor = "475569";
                      e.target.src = `https://placehold.co/300x450/${bgColor}/${textColor}?text=${encodeURIComponent(
                        book.title
                      )}`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold text-center px-2">
                      {book.title}
                    </span>
                  </div>
                )}

                {/* Overlay com info ao hover */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <h4 className="text-white text-xs font-bold line-clamp-2 mb-1">
                    {book.title}
                  </h4>
                  <p className="text-white/80 text-[10px] line-clamp-1">
                    {book.author}
                  </p>
                  {book.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star
                        className="text-yellow-400 fill-yellow-400"
                        size={12}
                      />
                      <span className="text-white text-xs">{book.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {displayBooks.length === 0 && (
          <div className="flex items-center justify-center py-20 text-slate-400 dark:text-neutral-500">
            <p>Nenhum livro com capa encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
