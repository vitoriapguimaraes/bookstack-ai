import { Star, MoreVertical, Edit2, Trash2, Calendar } from 'lucide-react'
import { useState } from 'react'

export default function MobileBookItem({ book, onEdit, onDelete, onSelect, isSelected }) {
  const [showActions, setShowActions] = useState(false)

  // Robust Image URL Handling
  let coverUrl = null
  if (book.cover_image) {
      if (book.cover_image.startsWith('/')) {
          coverUrl = book.cover_image // Already absolute path (/uploads/...)
      } else if (book.cover_image.includes('uploads/')) {
          coverUrl = `/${book.cover_image}` // Fix missing leading slash
      } else {
          // External URL -> Use Proxy
          coverUrl = `/api/proxy/image?url=${encodeURIComponent(book.cover_image)}`
      }
  }

  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-lg p-3 border ${isSelected ? 'border-purple-500 ring-1 ring-purple-500' : 'border-slate-200 dark:border-neutral-800'} shadow-sm flex gap-3 relative transition-all active:scale-[0.99]`}>
      
      {/* Selection Overlay (Click anywhere to select if needed, or long press? For now simple checkbox or implicit) */}
      {/* We will stick to simple actions. Selection in mobile table might be tricky, let's keep it simple for now or use the checkbox */}
      
      {/* Capa */}
      <div className="shrink-0 w-16 h-24 bg-slate-100 dark:bg-neutral-800 rounded overflow-hidden relative">
          {coverUrl ? (
            <img src={coverUrl} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-neutral-800 dark:to-neutral-700">
               <span className="text-[10px] text-slate-500 text-center px-1">{book.title.slice(0, 10)}...</span>
            </div>
          )}
          
          {/* Status Badge Over Cover */}
          <div className={`absolute bottom-0 left-0 right-0 text-[9px] font-bold text-center py-0.5 
              ${book.status === 'Lendo' ? 'bg-purple-500 text-white' : 
                book.status === 'Lido' ? 'bg-emerald-500 text-white' : 
                'bg-amber-500 text-white'}`}>
              {book.status}
          </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
              <div className="flex justify-between items-start gap-2">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight line-clamp-2">{book.title}</h3>
                  <button onClick={() => onDelete(book.id)} className="text-slate-400 hover:text-red-500 p-1 -mt-1 -mr-2">
                      <Trash2 size={16} />
                  </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 truncate">{book.author}</p>
          </div>

          <div className="flex items-end justify-between mt-2">
              <div className="flex flex-col gap-0.5">
                 {/* Rating & Score */}
                 <div className="flex items-center gap-2">
                    {book.rating && (
                        <div className="flex items-center gap-0.5 text-amber-500">
                            <Star size={10} fill="currentColor" />
                            <span className="text-xs font-bold">{book.rating}</span>
                        </div>
                    )}
                    {book.score && (
                        <span className="text-[10px] px-1.5 py-0 rounded bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 font-mono">
                           Score: {book.score.toFixed(0)}
                        </span>
                    )}
                 </div>
                 
                 {/* Type/Class Tag */}
                 <div className="flex items-center gap-1 mt-1">
                     <span className="text-[10px] text-slate-400 bg-slate-50 dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 px-1 rounded">
                         {book.type}
                     </span>
                     <span className="text-[10px] text-slate-400 bg-slate-50 dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 px-1 rounded truncate max-w-[80px]">
                         {book.category}
                     </span>
                 </div>
              </div>

              <button 
                onClick={() => onEdit(book)}
                className="bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-lg text-xs font-semibold active:bg-purple-100 dark:active:bg-purple-500/20"
              >
                  Editar
              </button>
          </div>
      </div>
    </div>
  )
}
