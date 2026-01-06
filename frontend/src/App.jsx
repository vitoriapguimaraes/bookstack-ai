import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import MobileHeader from './components/Layout/MobileHeader'
import Mural from './pages/Mural'
import BooksList from './pages/BooksList'
import Analytics from './pages/Analytics'
import BookFormPage from './pages/BookForm'
import Home from './pages/Home'
import SettingsLayout from './pages/Settings/SettingsLayout'
import OverviewSettings from './pages/Settings/OverviewSettings'
import AISettings from './pages/Settings/AISettings'
import FormulaSettings from './pages/Settings/FormulaSettings'
import ListSettings from './pages/Settings/ListSettings'
import PreferencesSettings from './pages/Settings/PreferencesSettings'
import ScrollToTopBottom from './components/ScrollToTopBottom'

import axios from 'axios'
import { ThemeProvider } from './context/ThemeContext'

// Configura o Axios (sem baseURL fixa para usar o proxy do Vite)
const api = axios.create()

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingBook, setEditingBook] = useState(null)

  // Table Persistence State
  const [tableState, setTableState] = useState({
      sortConfig: { key: 'order', direction: 'asc' },
      searchTerm: '',
      selectedClasses: [],
      selectedCategories: [],
      selectedStatuses: [],
      selectedPriorities: [],
      selectedAvailabilities: [],
      yearRange: null 
  })

  // Mural Persistence State
  // Mural Persistence State
  const [muralState, setMuralState] = useState(() => {
      const saved = localStorage.getItem('muralState')
      return saved ? JSON.parse(saved) : { reading: 1, 'to-read': 1, read: 1 }
  })

  // Persist Mural State
  useEffect(() => {
      localStorage.setItem('muralState', JSON.stringify(muralState))
  }, [muralState])
  
  // --- Mobile Menu State ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // --- Theme Context ---
  // States for Sidebar Filters
  useEffect(() => {
    fetchBooks()
  }, [])

  const fetchBooks = async () => {
    try {
      console.log("Fetching books from /api/books/...")
      const res = await api.get('/api/books/')
      setBooks(res.data)
      setError(null)
    } catch (err) {
      console.error("Erro ao buscar livros:", err)
      setError("Não foi possível conectar ao backend python. Detalhes no console.")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (book) => {
    setEditingBook(book)
    navigate('/edit')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (id) => {
    setBooks(prev => prev.filter(b => b.id !== id))
  }

  const handleFormSuccess = () => {
    setEditingBook(null)
    fetchBooks()
    navigate(-1) // Go back to previous route
  }

  const handleOpenForm = () => {
    setEditingBook(null)
    navigate('/create')
  }


  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 transition-colors duration-300 font-sans text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
        
        {/* Mobile Header (Visible < md) */}
        <MobileHeader 
            onMenuClick={() => setIsMobileMenuOpen(true)} 
            onAddBook={() => handleOpenForm()} // Opens form mode=new
        />

        {/* Sidebar (Desktop Fixed / Mobile Drawer) */}
        <Sidebar 
            onAddBook={() => handleOpenForm()} 
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className={`flex-1 transition-all duration-300 w-full md:ml-20 ml-0 pt-16 md:pt-0`}>
          <div className="w-full h-full">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
                    <p>⚠️ {error}</p>
                    <p className="text-sm">Dica: Rode `uvicorn main:app --reload` na pasta backend.</p>
                </div>
            )}

            {loading && <p className="text-center mt-20 text-lg animate-pulse text-neutral-500">Carregando biblioteca...</p>}
            
            {!loading && (
              <Routes>
                {/* Home Dashboard */}
                <Route path="/" element={<div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-6"><Home books={books} /></div>} />
                
                {/* Mural routes with nested status routes */}
                <Route path="/mural/:status" element={
                  <Mural 
                    books={books}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    muralState={muralState}
                    setMuralState={setMuralState}
                  />
                } />
                <Route path="/mural" element={<Navigate to="/mural/reading" replace />} />
                
                {/* Table route */}
                <Route path="/table" element={
                  <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-6">
                  <BooksList 
                    books={books}
                    onUpdate={fetchBooks}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    tableState={tableState}
                    setTableState={setTableState}
                  />
                  </div>
                } />
                
                {/* Analytics route */}
                <Route path="/analytics" element={
                  <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-6">
                  <Analytics books={books} />
                  </div>
                } />
                
                {/* Settings Routes */}
                <Route path="/settings" element={<SettingsLayout />}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<OverviewSettings />} />
                    <Route path="ai" element={<AISettings />} />
                    <Route path="formula" element={<FormulaSettings />} />
                    <Route path="lists" element={<ListSettings />} />
                    <Route path="preferences" element={<PreferencesSettings />} />
                </Route>

                {/* Book Form routes */}
                <Route path="/create" element={
                  <BookFormPage 
                    editingBook={null}
                    onFormSuccess={handleFormSuccess}
                    onCancel={() => { 
                      setEditingBook(null)
                      navigate(-1)
                    }}
                  />
                } />
                <Route path="/edit" element={
                  <BookFormPage 
                    editingBook={editingBook}
                    onFormSuccess={handleFormSuccess}
                    onCancel={() => { 
                      setEditingBook(null)
                      navigate(-1)
                    }}
                  />
                } />
              </Routes>
            )}
        </div>
      </main>

      {/* Button Scroll to Top */}
      <ScrollToTopBottom />

    </div>
    </ThemeProvider>
  )
}

export default App
