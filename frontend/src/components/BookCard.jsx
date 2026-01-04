import { useState, useEffect } from 'react'
import { Star, Pencil, Trash2, Info, X } from 'lucide-react'
import axios from 'axios'

const api = axios.create()

export default function BookCard({ book, compact = false, onEdit, onDelete }) {
  const [showMotivation, setShowMotivation] = useState(false)
  
  // Auto-close popover after 8 seconds
  useEffect(() => {
    if (showMotivation) {
      const timer = setTimeout(() => {
        setShowMotivation(false)
      }, 8000) // 8 seconds
      
      return () => clearTimeout(timer)
    }
  }, [showMotivation])
  // All covers are now external URLs from Google Books API, served via proxy
  const coverUrl = book.cover_image 
      ? `/api/proxy/image?url=${encodeURIComponent(book.cover_image)}`
      : `https://placehold.co/300x450/1a1a1a/6b21a8?text=${encodeURIComponent(book.title)}`
  
  
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
       <div className="group relative bg-neutral-900 rounded-md hover:bg-neutral-800 transition-all duration-200 border border-neutral-800 hover:border-purple-500/30">
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
             <img src={coverUrl} alt={book.title} className="w-20 h-28 object-cover rounded flex-shrink-0" loading="lazy" decoding="async" />
             
             <div className="flex-1 min-w-0 flex flex-col gap-2">
                {/* Section 1: Title + Author */}
                <div className="flex-1">
                    <h4 className="font-medium text-sm text-white line-clamp-2 leading-tight mb-0.5" title={book.title}>{book.title}</h4>
                    <p className="text-xs text-neutral-400 truncate">{book.author}</p>
                </div>
                
                {/* Section 2: Rating */}
                {book.rating > 0 && (
                   <div className="flex items-center gap-1 w-max bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Star size={10} fill="#fbbf24" className="text-amber-400" />
                      <span className="text-xs text-amber-400 font-bold">{book.rating}</span>
                      <span className="text-[9px] text-neutral-500">Minha</span>
                   </div>
                )}
                
                {/* Section 3: Action Buttons */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                   {book.motivation && (
                     <button
                       onClick={(e) => { e.stopPropagation(); setShowMotivation(!showMotivation); }}
                       className="p-1.5 hover:bg-blue-500/20 hover:text-blue-400 text-neutral-500 rounded transition-colors"
                       title="Ver motivação"
                     >
                       <Info size={14} />
                     </button>
                   )}
                   <button 
                     onClick={handleEditClick} 
                     className="p-1.5 hover:bg-purple-500/20 hover:text-purple-400 text-neutral-500 rounded transition-colors"
                     title="Editar">
                     <Pencil size={14} />
                   </button>
                   <button 
                     onClick={handleDelete} 
                     className="p-1.5 hover:bg-red-500/20 hover:text-red-400 text-neutral-500 rounded transition-colors"
                     title="Excluir">
                     <Trash2 size={14} />
                   </button>
                 </div>
             </div>
          </div>
           
           {/* Motivation Popover - Compact Card */}
           {showMotivation && book.motivation && (
             <div className="absolute right-0 top-full mt-2 w-64 bg-neutral-900 border border-blue-500/50 rounded-lg shadow-2xl p-3 z-30 animate-fade-in">
               <div className="flex justify-between items-start mb-2">
                 <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1">
                   <Info size={12} /> Motivação
                 </h4>
                 <button
                   onClick={(e) => { e.stopPropagation(); setShowMotivation(false); }}
                   className="text-neutral-400 hover:text-white transition-colors"
                 >
                   <X size={14} />
                 </button>
               </div>
               <p className="text-[10px] text-neutral-300 leading-relaxed max-h-40 overflow-y-auto">
                 {book.motivation}
               </p>
               {/* Arrow pointing up to button */}
               <div className="absolute bottom-full right-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-blue-500/50"></div>
             </div>
           )}
        </div>
     )
  }

  // Main Card - Informative Design
  return (
    <div className="group relative bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-all duration-200 border border-neutral-800 hover:border-purple-500/30 flex h-56">
      {/* Cover Image */}
      <div className="w-36 flex-shrink-0 bg-neutral-950 relative overflow-hidden">
         <img src={coverUrl} alt={book.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
         
         {/* Order badge - bottom left on cover */}
         {book.order && (
           <div className="absolute bottom-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
             #{book.order}
           </div>
         )}
      </div>
      
      {/* Content */}
      <div className="flex-1 p-3 flex flex-col gap-3 min-w-0">
         {/* Section 1: Title + Author - Fixed Height */}
         <div className="h-20">
            <h3 className="font-semibold text-white text-sm leading-snug mb-1 line-clamp-3" title={book.title}>
               {book.title}
            </h3>
            <p className="text-xs text-neutral-400 truncate">{book.author}</p>
         </div>
         
         {/* Section 2: Classification (Class + Category) - Fixed Height */}
         <div className="h-10 flex flex-col gap-0.5 text-[10px]">
            <span className="text-neutral-400 font-medium" title={book.book_class}>
               {book.book_class}
            </span>
            <span className="text-neutral-400" title={book.category}>
               {book.category}
            </span>
         </div>
         
         {/* Section 3: Metrics (Score + Ratings) - Fixed Height */}
         <div className="h-6 flex items-center gap-2 flex-wrap">
            {/* Score */}
            {book.score > 0 && (
               <div className="flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  <span className="text-xs text-purple-400 font-bold">{book.score.toFixed(0)}</span>
                  <span className="text-[9px] text-neutral-500">Score</span>
               </div>
            )}
            
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
         
         {/* Section 4: Action Buttons - Fixed at Bottom */}
         <div className="flex items-center justify-end mt-auto">
             {/* Action Buttons */}
             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {book.motivation && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowMotivation(!showMotivation); }}
                    className="p-1.5 hover:bg-blue-500/20 hover:text-blue-400 text-neutral-500 rounded transition-colors"
                    title="Ver motivação">
                    <Info size={16} />
                  </button>
                )}
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
       
       {/* Motivation Popover - Regular Card */}
       {showMotivation && book.motivation && (
         <div className="absolute right-0 top-full mt-2 w-80 bg-neutral-900 border border-blue-500/50 rounded-lg shadow-2xl p-4 z-30 animate-fade-in">
           <div className="flex justify-between items-start mb-3">
             <h4 className="text-sm font-bold text-blue-400 flex items-center gap-1.5">
               <Info size={16} /> Motivação
             </h4>
             <button
               onClick={(e) => { e.stopPropagation(); setShowMotivation(false); }}
               className="text-neutral-400 hover:text-white transition-colors"
             >
               <X size={16} />
             </button>
           </div>
           <p className="text-xs text-neutral-300 leading-relaxed max-h-48 overflow-y-auto">
             {book.motivation}
           </p>
           {/* Arrow pointing up to button */}
           <div className="absolute bottom-full right-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-blue-500/50"></div>
         </div>
       )}
     </div>
  )
}
