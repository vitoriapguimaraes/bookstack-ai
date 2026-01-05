import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BookOpen, Library, CheckCircle2 } from 'lucide-react'
import BookCard from '../components/BookCard'

export default function MuralView({ books, onEdit, onDelete }) {
  const navigate = useNavigate()
  const { status } = useParams()
  
  // Default to 'lendo' if no status in URL
  const activeStatus = status || 'lendo'
  
  // Filter books by status
  const reading = books.filter(b => b.status === 'Lendo')
  const toRead = books.filter(b => b.status === 'A Ler')
  const read = books.filter(b => b.status === 'Lido')
  
  const handleStatusChange = (newStatus) => {
    navigate(`/mural/${newStatus}`)
  }
  
  return (
    <div className="pb-20 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white">Mural de Livros</h2>
          <p className="text-slate-400 text-sm mt-1">Acompanhe visualmente o progresso das suas leituras.</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="sticky top-0 z-10 bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-800 mb-8 -mx-8 px-8 py-4">
        <div className="flex gap-2">
          <button
            onClick={() => handleStatusChange('lendo')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeStatus === 'lendo'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
            }`}
          >
            <BookOpen size={18} className="inline-block mr-1.5" /> Lendo Agora {reading.length > 0 && `(${reading.length})`}
          </button>
          <button
            onClick={() => handleStatusChange('a-ler')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeStatus === 'a-ler'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
            }`}
          >
            <Library size={18} className="inline-block mr-1.5" /> Próximos da Fila {toRead.length > 0 && `(${toRead.length})`}
          </button>
          <button
            onClick={() => handleStatusChange('lido')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeStatus === 'lido'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
            }`}
          >
            <CheckCircle2 size={18} className="inline-block mr-1.5" /> Já Lidos {read.length > 0 && `(${read.length})`}
          </button>
        </div>
      </div>

      <div>
        {/* Lendo Agora */}
        {activeStatus === 'lendo' && (
          <section>
            {reading.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {reading
                  .sort((a,b) => (a.order||999) - (b.order||999))
                  .map(book => <BookCard key={book.id} book={book} onEdit={onEdit} onDelete={onDelete} />)}
              </div>
            ) : (
              <div className="text-center py-20 text-neutral-500">
                <p className="text-lg">Nenhum livro sendo lido no momento</p>
              </div>
            )}
          </section>
        )}

        {/* A Ler (Fila) */}
        {activeStatus === 'a-ler' && (
          <section>
            {toRead.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {toRead
                  .sort((a,b) => (a.order||999) - (b.order||999))
                  .map(book => (
                    <BookCard key={book.id} book={book} onEdit={onEdit} onDelete={onDelete} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-20 text-neutral-500">
                <p className="text-lg">Nenhum livro na fila</p>
              </div>
            )}
          </section>
        )}

        {/* Lidos */}
        {activeStatus === 'lido' && (
          <section>
            {read.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {read
                  .sort((a,b) => new Date(b.date_read || 0) - new Date(a.date_read || 0))
                  .map(book => (
                    <BookCard key={book.id} book={book} compact onEdit={onEdit} onDelete={onDelete} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-20 text-neutral-500">
                <p className="text-lg">Nenhum livro lido ainda</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
