import { Star, Pencil, Trash2 } from 'lucide-react'
import axios from 'axios'

const api = axios.create()

export default function BookCard({ book, compact = false, onEdit, onDelete }) {
  // All covers are now external URLs from Google Books API, served via proxy
  const coverUrl = book.cover_image 
      ? `/api/proxy/image?url=${encodeURIComponent(book.cover_image)}`
      : `https://placehold.co/300x450/1a1a1a/6b21a8?text=${encodeURIComponent(book.title)}`
  
  const statusConfig = {
     'Lendo': { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
     'A Ler': { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
     'Lido': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
  }
  
  const status = statusConfig[book.status] || { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' }

  const handleDelete = async (e) => {
      e.stopPropagation()
      if (window.confirm(`Tem certeza que deseja apagar "${book.title}"?`)) {
          try {
             await api.delete(`/api/books/${book.id}`)
             onDelete(book.id)
          } catch(err) {
             alert('Erro ao deletar')
             console.error(err)
          }
      }
  }

  const handleEditClick = (e) => {
      e.stopPropagation()
      onEdit(book)
  }

  if (compact) {
     return (
       <div className="group relative bg-neutral-900 rounded-md overflow-hidden hover:bg-neutral-800 transition-all duration-200 border border-neutral-800 hover:border-purple-500/30">
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
          
          <div className="flex items-center gap-3 p-2">
             <img src={coverUrl} alt={book.title} className="w-12 h-16 object-cover rounded" />
             <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-white truncate" title={book.title}>{book.title}</h4>
                <p className="text-xs text-neutral-400 truncate">{book.author}</p>
                {book.rating > 0 && (
                   <div className="flex items-center gap-1 mt-1">
                      <Star size={10} fill="#fbbf24" className="text-amber-400" />
                      <span className="text-xs text-amber-400">{book.rating}</span>
                   </div>
                )}
             </div>
             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={handleEditClick} className="p-1 hover:text-purple-400 text-neutral-500"><Pencil size={14} /></button>
                <button onClick={handleDelete} className="p-1 hover:text-red-400 text-neutral-500"><Trash2 size={14} /></button>
             </div>
          </div>
       </div>
     )
  }

  // Main Card - Informative Design
  return (
    <div className="group relative bg-neutral-900 rounded-lg overflow-hidden hover:bg-neutral-800 transition-all duration-200 border border-neutral-800 hover:border-purple-500/30 flex h-40">
      {/* Cover Image */}
      <div className="w-28 flex-shrink-0 bg-neutral-950 relative overflow-hidden">
         <img src={coverUrl} alt={book.title} className="w-full h-full object-cover" />
         
         {/* Order badge - bottom left on cover */}
         {book.order && (
           <div className="absolute bottom-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
             #{book.order}
           </div>
         )}
      </div>
      
      {/* Content */}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
         {/* Header: Title + Status */}
         <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-1.5">
               <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm leading-snug mb-1" title={book.title}>
                     {book.title}
                  </h3>
                  <p className="text-xs text-neutral-400">{book.author}</p>
               </div>
               <span className={`text-[10px] px-1.5 py-0.5 rounded ${status.bg} ${status.color} ${status.border} border font-medium uppercase tracking-wide whitespace-nowrap h-fit flex-shrink-0`}>
                  {book.status}
               </span>
            </div>
            
            {/* Classification: Class + Category */}
            <div className="flex items-center gap-1.5 text-[11px] mb-2">
               <span className="text-purple-300 font-medium" title={book.book_class}>
                  {book.book_class}
               </span>
               <span className="text-neutral-600">›</span>
               <span className="text-neutral-400" title={book.category}>
                  {book.category}
               </span>
            </div>
         </div>
         
         {/* Footer: Metrics + Actions */}
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               {/* Score */}
               {book.score > 0 && (
                  <div className="flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                     <span className="text-xs text-purple-400 font-bold">{book.score.toFixed(0)}</span>
                     <span className="text-[9px] text-neutral-500">Score</span>
                  </div>
               )}
               
               {/* Ratings Comparison - Always show both when available */}
               {(book.google_rating || book.rating > 0) && (
                  <div className="flex items-center gap-2">
                     {/* Google Rating */}
                     {book.google_rating && (
                        <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                           <Star size={10} fill="#fbbf24" className="text-amber-400" />
                           <span className="text-xs text-amber-400 font-medium">{book.google_rating.toFixed(1)}</span>
                           <span className="text-[9px] text-neutral-500">Google</span>
                        </div>
                     )}
                     
                     {/* Personal Rating */}
                     {book.rating > 0 && (
                        <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                           <Star size={12} fill="#fbbf24" className="text-amber-400" />
                           <span className="text-xs text-amber-400 font-bold">{book.rating}</span>
                           <span className="text-[9px] text-neutral-500">Minha</span>
                        </div>
                     )}
                  </div>
               )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                  onClick={handleEditClick} 
                  className="p-1.5 hover:bg-purple-500/20 hover:text-purple-400 text-neutral-500 rounded transition-colors"
                  title="Editar">
                  <Pencil size={16} />
               </button>
               <button 
                  onClick={handleDelete} 
                  className="p-1.5 hover:bg-red-500/20 hover:text-red-400 text-neutral-500 rounded transition-colors"
                  title="Excluir">
                  <Trash2 size={16} />
               </button>
            </div>
         </div>
      </div>
    </div>
  )
}
