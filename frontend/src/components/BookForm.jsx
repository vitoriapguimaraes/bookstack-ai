import { useState, useEffect } from 'react'
import { Upload, Save, X, Sparkles, Download } from 'lucide-react'
import axios from 'axios'

const api = axios.create()

// Hierarchical classification mapping
const CLASS_CATEGORIES = {
  "Tecnologia & IA": ["Análise de Dados", "Data Science", "IA", "Visão Computacional", "Machine Learning", "Programação", "Sistemas de IA & LLMs"],
  "Engenharia & Arquitetura": ["Arquitetura", "Arquitetura da Mente (Mindset)", "Engenharia de Dados", "MLOps", "Engenharia de ML & MLOps", "Artesanato de Software (Clean Code)"],
  "Conhecimento & Ciências": ["Conhecimento Geral", "Estatística", "Estatística & Incerteza", "Cosmologia & Fronteiras da Ciência"],
  "Negócios & Finanças": ["Finanças Pessoais", "Negócios", "Liberdade Econômica & Finanças"],
  "Literatura & Cultura": ["Diversidade e Inclusão", "História/Ficção", "Literatura Brasileira", "Literatura Brasileira Clássica", "Épicos & Ficção Reflexiva", "Justiça Social & Interseccionalidade"],
  "Desenvolvimento Pessoal": ["Bem-estar", "Comunicação", "Criatividade", "Desenvolvimento Pessoal", "Inteligência Emocional", "Liderança", "Liderança & Pensamento Estratégico", "Produtividade", "Biohacking & Existência", "Storytelling & Visualização", "Geral"]
}

export default function BookForm({ bookToEdit, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    title: '', original_title: '', author: '', status: 'A Ler', book_class: 'Desenvolvimento Pessoal', category: 'Geral',
    priority: '2 - Média', availability: 'Estante', type: 'Não Técnico',
    year: new Date().getFullYear(), rating: 0, order: null, google_rating: null,
    motivation: '', cover_image: null, date_read: ''
  })
  const [coverFile, setCoverFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [suggestedCoverUrl, setSuggestedCoverUrl] = useState(null)
  const [googleRating, setGoogleRating] = useState(null) // {rating: 4.5, count: 1234}

  useEffect(() => {
    if (bookToEdit) {
      setFormData({
         ...bookToEdit,
         cover_image: bookToEdit.cover_image,
         date_read: bookToEdit.date_read || '',
         order: bookToEdit.order || null,
         rating: bookToEdit.rating || 0
      })
    }
  }, [bookToEdit])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleClassChange = (e) => {
    const newClass = e.target.value
    const firstCategory = CLASS_CATEGORIES[newClass][0]
    setFormData(prev => ({ ...prev, book_class: newClass, category: firstCategory }))
  }

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setCoverFile(e.target.files[0])
    }
  }

  const handleAiSuggest = async () => {
      if (!formData.title) return alert("Digite um título primeiro!")
      
      setAiLoading(true)
      setSuggestedCoverUrl(null)
      try {
          const res = await api.post('/api/books/suggest', { title: formData.title })
          const suggestion = res.data
          if (suggestion) {
              setFormData(prev => ({
                  ...prev,
                  author: suggestion.author || prev.author,
                  year: suggestion.year || prev.year,
                  type: suggestion.type || prev.type,
                  category: suggestion.category || prev.category,
                  motivation: suggestion.motivation || prev.motivation,
                  original_title: suggestion.original_title || prev.original_title,
                  google_rating: suggestion.google_rating || null
              }))
              
              // Armazena URL da capa sugerida
              if (suggestion.cover_url) {
                  setSuggestedCoverUrl(suggestion.cover_url)
              }
              
              // Armazena nota do Google Books
              if (suggestion.google_rating) {
                  setGoogleRating({
                      rating: suggestion.google_rating,
                      count: suggestion.google_ratings_count || 0
                  })
              }
          }
      } catch (err) {
          console.error(err)
          alert("Não foi possível obter sugestão. Verifique a conexão.")
      } finally {
          setAiLoading(false)
      }
  }

  const handleUseSuggestedCover = () => {
    if (suggestedCoverUrl) {
      setFormData(prev => ({ ...prev, cover_image: suggestedCoverUrl }))
      setSuggestedCoverUrl(null)
      alert("✅ Capa da API adicionada! Será exibida via URL (sem ocupar espaço no servidor).")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let savedBook
      if (bookToEdit) {
        const res = await api.put(`/api/books/${bookToEdit.id}`, formData)
        savedBook = res.data
      } else {
        const res = await api.post('/api/books/', formData)
        savedBook = res.data
      }

      // Only upload file if user selected a local file
      if (coverFile && savedBook.id) {
         const formDataUpload = new FormData()
         formDataUpload.append('file', coverFile)
         await api.post(`/api/books/${savedBook.id}/cover`, formDataUpload, {
            headers: { 'Content-Type': 'multipart/form-data' }
         })
      }
      
      onSuccess()
    } catch (err) {
      alert("Erro ao salvar livro.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-neutral-900 rounded-lg shadow-lg border border-neutral-800 max-w-7xl mx-auto">
       {/* Header */}
       <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white">
             {bookToEdit ? '✏️ Editar Livro' : '➕ Novo Livro'}
          </h2>
          <div className="flex gap-2">
             <button 
                type="submit" 
                disabled={loading} 
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50 transition-colors text-sm"
             >
                <Save size={16} /> {loading ? 'Salvando...' : 'Salvar'}
             </button>
             {onCancel && (
               <button 
                  type="button" 
                  onClick={onCancel} 
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-neutral-300 rounded hover:bg-neutral-700 transition-colors text-sm"
               >
                  <X size={16} /> Cancelar
               </button>
             )}
          </div>
       </div>

       <div className="p-6 space-y-6">
          {/* Required Fields Section */}
          <div>
             <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-600 rounded"></span>
                Campos Obrigatórios
             </h3>
             <div className="grid grid-cols-6 gap-3">
                {/* Título - Full width */}
                <div className="col-span-6">
                   <label className="block text-xs font-medium text-neutral-300 mb-1">Título *</label>
                   <input 
                      required 
                      name="title" 
                      value={formData.title} 
                      onChange={handleChange} 
                      className="w-full rounded bg-neutral-800 border-neutral-700 text-white text-sm p-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500" 
                      placeholder="Ex: Hábitos Atômicos"
                   />
                </div>

                {/* Status - 2 cols */}
                <div className="col-span-2">
                   <label className="block text-xs font-medium text-neutral-300 mb-1">Status</label>
                   <select 
                      name="status" 
                      value={formData.status} 
                      onChange={handleChange} 
                      className="w-full rounded bg-neutral-800 border-neutral-700 text-white text-sm p-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                   >
                      <option>A Ler</option>
                      <option>Lendo</option>
                      <option>Lido</option>
                   </select>
                </div>

                {/* Prioridade - 2 cols */}
                <div className="col-span-2">
                   <label className="block text-xs font-medium text-neutral-300 mb-1">Prioridade</label>
                   <select 
                      name="priority" 
                      value={formData.priority} 
                      onChange={handleChange} 
                      className="w-full rounded bg-neutral-800 border-neutral-700 text-white text-sm p-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                   >
                      <option>1 - Baixa</option>
                      <option>2 - Média</option>
                      <option>3 - Média-Alta</option>
                      <option>4 - Alta</option>
                   </select>
                </div>

                {/* Disponibilidade - 2 cols */}
                <div className="col-span-2">
                   <label className="block text-xs font-medium text-neutral-300 mb-1">Disponível em</label>
                   <select 
                      name="availability" 
                      value={formData.availability} 
                      onChange={handleChange} 
                      className="w-full rounded bg-neutral-800 border-neutral-700 text-white text-sm p-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                   >
                      <option value="Estante">Estante</option>
                      <option value="PDF">PDF</option>
                      <option value="Kindle">Kindle</option>
                      <option value="Audiobook">Audiobook</option>
                      <option value="Biblioteca">Biblioteca</option>
                      <option value="Emprestado">Emprestado</option>
                      <option value="A Comprar">A Comprar</option>
                      <option value="Online">Online</option>
                   </select>
                </div>

                {/* Ordem - Only show if not "Lido" */}
                {formData.status !== "Lido" && (
                  <div>
                     <label className="block text-xs font-medium text-neutral-300 mb-1">Ordem</label>
                     <input 
                        type="number"
                        name="order" 
                        value={formData.order || ''} 
                        onChange={handleChange} 
                        className="w-full rounded bg-neutral-800 border-neutral-700 text-white text-sm p-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500" 
                        placeholder="#"
                     />
                  </div>
                )}

                {/* Nota */}
                <div>
                   <label className="block text-xs font-medium text-neutral-300 mb-1">Nota (1-5)</label>
                   <input 
                      type="number"
                      min="0"
                      max="5"
                      name="rating" 
                      value={formData.rating || ''} 
                      onChange={handleChange} 
                      className="w-full rounded bg-neutral-800 border-neutral-700 text-white text-sm p-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500" 
                   />
                   {googleRating ? (
                      <div className="mt-1.5 text-xs text-amber-400 flex items-center gap-1">
                         <span>⭐ Google: {googleRating.rating.toFixed(1)}/5</span>
                         <span className="text-neutral-500">({googleRating.count.toLocaleString()} avaliações)</span>
                      </div>
                   ) : formData.google_rating ? (
                      <div className="mt-1.5 text-xs text-amber-400">
                         ⭐ Google: {formData.google_rating.toFixed(1)}/5
                      </div>
                   ) : null}
                </div>

                {/* Data de Leitura - Only show if "Lido" */}
                {formData.status === "Lido" && (
                  <div>
                     <label className="block text-xs font-medium text-neutral-300 mb-1">Lido em</label>
                     <input 
                        type="text"
                        name="date_read" 
                        value={formData.date_read || ''} 
                        onChange={handleChange} 
                        className="w-full rounded bg-neutral-800 border-neutral-700 text-white text-sm p-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500" 
                        placeholder="2025/01"
                     />
                  </div>
                )}

                {/* Capa - 2 cols */}
                <div className="col-span-2">
                   <label className="block text-xs font-medium text-neutral-300 mb-1">Capa</label>
                   <div className="flex gap-2">
                      <input 
                         type="file" 
                         onChange={handleFileChange} 
                         accept="image/*" 
                         className="flex-1 text-xs text-neutral-400 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-neutral-700 file:text-white hover:file:bg-neutral-600" 
                      />
                      {suggestedCoverUrl && (
                        <button
                          type="button"
                          onClick={handleUseSuggestedCover}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs whitespace-nowrap"
                          title="Usar capa da API"
                        >
                          <Download size={14} /> Usar API
                        </button>
                      )}
                   </div>
                   {formData.cover_image && <p className="text-xs text-emerald-400 mt-1">✓ Capa definida</p>}
                </div>
             </div>
          </div>

          {/* AI-Suggested Fields Section */}
          <div>
             <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                   <span className="w-1 h-4 bg-amber-600 rounded"></span>
                   Campos Sugeridos por IA
                </h3>
                <button 
                   type="button" 
                   onClick={handleAiSuggest}
                   disabled={aiLoading || !formData.title}
                   className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50 transition-all shadow-lg shadow-purple-500/30"
                >
                   <Sparkles size={14} /> {aiLoading ? 'Buscando...' : 'Completar com IA'}
                </button>
             </div>
             <div className="grid grid-cols-6 gap-3">
                {/* Título Original (IA) - 6 cols */}
                <div className="col-span-6">
                   <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Título Original 
                      <span className="text-neutral-500 ml-1 text-[10px]">(Auto-completar IA)</span>
                   </label>
                   <input 
                      name="original_title" 
                      value={formData.original_title || ''} 
                      onChange={handleChange} 
                      className="w-full rounded bg-neutral-800 border-neutral-700 text-white text-sm p-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500" 
                      placeholder="Preenchido automaticamente..."
                   />
                </div>

                {/* Autor - 2 cols */}
                <div className="col-span-2">
                   <label className="block text-xs font-medium text-neutral-300 mb-1">Autor</label>
                   <input 
                      name="author" 
                      value={formData.author} 
                      onChange={handleChange} 
                      className="w-full rounded bg-neutral-800 border-neutral-700 text-white text-sm p-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500" 
                   />
                </div>

                {/* Ano */}
                <div>
                   <label className="block text-xs font-medium text-neutral-300 mb-1">Ano</label>
                   <input 
                      type="number"
                      name="year" 
                      value={formData.year} 
                      onChange={handleChange} 
                      className="w-full rounded bg-neutral-800 border-neutral-700 text-white text-sm p-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500" 
                   />
                </div>

                {/* Tipo */}
                <div>
                   <label className="block text-xs font-medium text-neutral-300 mb-1">Tipo</label>
                   <select 
                      name="type" 
                      value={formData.type} 
                      onChange={handleChange} 
                      className="w-full rounded bg-neutral-800 border-neutral-700 text-white text-sm p-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                   >
                      <option>Não Técnico</option>
                      <option>Técnico</option>
                   </select>
                </div>

                {/* Classe - 2 cols */}
                <div className="col-span-2">
                   <label className="block text-xs font-medium text-neutral-300 mb-1">Classe</label>
                   <select 
                      name="book_class" 
                      value={formData.book_class} 
                      onChange={handleClassChange} 
                      className="w-full rounded bg-neutral-800 border-neutral-700 text-white text-sm p-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                   >
                      {Object.keys(CLASS_CATEGORIES).map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                   </select>
                </div>

                {/* Categoria - 2 cols (dinâmico baseado na classe) */}
                <div className="col-span-2">
                   <label className="block text-xs font-medium text-neutral-300 mb-1">Categoria</label>
                   <select 
                      name="category" 
                      value={formData.category} 
                      onChange={handleChange} 
                      className="w-full rounded bg-neutral-800 border-neutral-700 text-white text-sm p-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                   >
                      {CLASS_CATEGORIES[formData.book_class].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                   </select>
                </div>

                {/* Motivação - 6 cols (full width) */}
                <div className="col-span-6">
                   <label className="block text-xs font-medium text-neutral-300 mb-1">Motivação / Resumo</label>
                   <textarea 
                      name="motivation" 
                      value={formData.motivation} 
                      onChange={handleChange} 
                      rows={2}
                      className="w-full rounded bg-neutral-800 border-neutral-700 text-white text-sm p-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500" 
                      placeholder="Por que ler este livro?"
                   />
                </div>
             </div>
          </div>
       </div>
    </form>
  )
}
