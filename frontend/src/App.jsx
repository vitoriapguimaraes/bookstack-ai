import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowUp, ArrowDown } from 'lucide-react'
import Sidebar from './components/Sidebar'
import MuralView from './views/MuralView'
import TableView from './views/TableView'
import AnalyticsView from './views/AnalyticsView'
import FormView from './views/FormView'
import SettingsLayout from './views/settings/SettingsLayout'
import OverviewSettings from './views/settings/OverviewSettings'
import AISettings from './views/settings/AISettings'
import FormulaSettings from './views/settings/FormulaSettings'
import ListSettings from './views/settings/ListSettings'

import axios from 'axios'

// Configura o Axios (sem baseURL fixa para usar o proxy do Vite)
const api = axios.create()

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingBook, setEditingBook] = useState(null)
  
  // Scroll States
  const [isAtTop, setIsAtTop] = useState(true)
  const [isAtBottom, setIsAtBottom] = useState(false)

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

  // Scroll to Top Logic
  useEffect(() => {
    const handleScroll = () => {
        const scrolled = window.scrollY
        setIsAtTop(scrolled < 100)
        
        // Detect bottom - also check if page is scrollable
        const scrollHeight = document.documentElement.scrollHeight
        const clientHeight = window.innerHeight
        const isScrollable = scrollHeight > clientHeight
        const isBottom = !isScrollable || (scrolled + clientHeight >= scrollHeight - 50)
        setIsAtBottom(isBottom)
    }

    // Adiciona listener no window e no main (caso o scroll seja interno)
    window.addEventListener('scroll', handleScroll)
    const mainElement = document.querySelector('main')
    if (mainElement) mainElement.addEventListener('scroll', handleScroll)
    
    // Initial check
    handleScroll()

    return () => {
        window.removeEventListener('scroll', handleScroll)
        if (mainElement) mainElement.removeEventListener('scroll', handleScroll)
    }
  }, [])
  
  // Recalculate scroll state when route changes
  useEffect(() => {
    const handleScroll = () => {
        const scrolled = window.scrollY
        setIsAtTop(scrolled < 100)
        
        const scrollHeight = document.documentElement.scrollHeight
        const clientHeight = window.innerHeight
        const isScrollable = scrollHeight > clientHeight
        const isBottom = !isScrollable || (scrolled + clientHeight >= scrollHeight - 50)
        setIsAtBottom(isBottom)
    }
    
    // Delay to ensure DOM has updated
    setTimeout(handleScroll, 100)
  }, [location.pathname])

  const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen font-sans flex transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar 
        onAddBook={() => { 
          setEditingBook(null)
          navigate('/create')
        }}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 ml-20 p-8 transition-all duration-300">
        <div className="w-full">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
                    <p>⚠️ {error}</p>
                    <p className="text-sm">Dica: Rode `uvicorn main:app --reload` na pasta backend.</p>
                </div>
            )}

            {loading && <p className="text-center mt-20 text-lg animate-pulse text-neutral-500">Carregando biblioteca...</p>}
            
            {!loading && (
              <Routes>
                {/* Default redirect to mural/reading */}
                <Route path="/" element={<Navigate to="/mural/reading" replace />} />
                
                {/* Mural routes with nested status routes */}
                <Route path="/mural/:status" element={
                  <MuralView 
                    books={books}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                } />
                <Route path="/mural" element={<Navigate to="/mural/reading" replace />} />
                
                {/* Table route */}
                <Route path="/table" element={
                  <TableView 
                    books={books}
                    onUpdate={fetchBooks}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    tableState={tableState}
                    setTableState={setTableState}
                  />
                } />
                
                {/* Analytics route */}
                <Route path="/analytics" element={
                  <AnalyticsView books={books} />
                } />
                
                {/* Settings Routes */}
                <Route path="/settings" element={<SettingsLayout />}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<OverviewSettings />} />
                    <Route path="ai" element={<AISettings />} />
                    <Route path="formula" element={<FormulaSettings />} />
                    <Route path="lists" element={<ListSettings />} />
                </Route>

                {/* Book Form routes */}
                <Route path="/create" element={
                  <FormView 
                    editingBook={null}
                    onFormSuccess={handleFormSuccess}
                    onCancel={() => { 
                      setEditingBook(null)
                      navigate(-1)
                    }}
                  />
                } />
                <Route path="/edit" element={
                  <FormView 
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


    </div>
  )
}

export default App
