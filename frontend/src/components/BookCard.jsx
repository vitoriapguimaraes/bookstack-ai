import { Star, Pencil, Trash2 } from 'lucide-react'
import axios from 'axios'

const api = axios.create()

export default function BookCard({ book, compact = false, onEdit, onDelete }) {
  // Use proxy for external URLs (Google Books), direct path for local files
  const coverUrl = book.cover_image 
      ? (book.cover_image.startsWith('http') 
          ? `/api/proxy/image?url=${encodeURIComponent(book.cover_image)}`
          : `http://127.0.0.1:8000${book.cover_image}`)
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

  // Main Card - Horizontal Minimalist
  return (
    <div className="group relative bg-neutral-900 rounded-lg overflow-hidden hover:bg-neutral-800 transition-all duration-200 border border-neutral-800 hover:border-purple-500/30 flex h-32">
      {/* Cover Image */}
      <div className="w-20 flex-shrink-0 bg-neutral-950 relative overflow-hidden">
         <img src={coverUrl} alt={book.title} className="w-full h-full object-cover" />
         
         {/* Order badge - bottom left on cover */}
         {book.order && (
           <div className="absolute bottom-1 left-1 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg">
             #{book.order}
           </div>
         )}
      </div>
      
      {/* Content */}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
         <div>
            <div className="flex items-start justify-between gap-2 mb-1">
               <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 flex-1" title={book.title}>
                  {book.title}
               </h3>
               <div className="flex flex-col gap-1 items-end">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${status.bg} ${status.color} ${status.border} border font-medium uppercase tracking-wide whitespace-nowrap`}>
                     {book.status}
                  </span>
                  {/* Score badge below status */}
                  {book.score > 0 && (
                     <div className="bg-purple-600/20 border border-purple-500/30 text-purple-300 text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
                        Score: {book.score.toFixed(0)}
                     </div>
                  )}
               </div>
            </div>
            <p className="text-xs text-neutral-400 truncate">{book.author}</p>
         </div>
         
         <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-500 truncate max-w-[120px]" title={book.category}>
               {book.category}
            </span>
            
            <div className="flex items-center gap-2">
               {book.rating > 0 && (
                  <div className="flex items-center gap-1">
                     <Star size={12} fill="#fbbf24" className="text-amber-400" />
                     <span className="text-xs text-amber-400 font-medium">{book.rating}</span>
                  </div>
               )}
               
               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                     onClick={handleEditClick} 
                     className="p-1 hover:bg-purple-500/20 hover:text-purple-400 text-neutral-500 rounded transition-colors"
                     title="Editar">
                     <Pencil size={14} />
                  </button>
                  <button 
                     onClick={handleDelete} 
                     className="p-1 hover:bg-red-500/20 hover:text-red-400 text-neutral-500 rounded transition-colors"
                     title="Excluir">
                     <Trash2 size={14} />
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
