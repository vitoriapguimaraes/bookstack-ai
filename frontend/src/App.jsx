import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Sidebar from "./components/Sidebar";
import MobileHeader from "./components/Layout/MobileHeader";
import Mural from "./pages/Mural";
import BooksList from "./pages/BooksList";
import Analytics from "./pages/Analytics";
import BookFormPage from "./pages/BookForm";
import Home from "./pages/Home";
import SettingsLayout from "./pages/Settings/SettingsLayout";
import OverviewSettings from "./pages/Settings/OverviewSettings";
import AISettings from "./pages/Settings/AISettings";
import FormulaSettings from "./pages/Settings/FormulaSettings";
import AuditSettings from "./pages/Settings/AuditSettings";
import ListSettings from "./pages/Settings/ListSettings";
import PreferencesSettings from "./pages/Settings/PreferencesSettings";
import GuideSettings from "./pages/Settings/GuideSettings";
import ScrollToTopBottom from "./components/ScrollToTopBottom";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import { useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext"; // NEW
import PrivateRoute from "./components/PrivateRoute";

import axios from "axios";
import { api } from "./services/api";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBook, setEditingBook] = useState(null);

  // Configure Axios Token
  useEffect(() => {
    if (session?.access_token) {
      api.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${session.access_token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [session]);

  // Table Persistence State
  const [tableState, setTableState] = useState({
    sortConfig: { key: "order", direction: "asc" },
    searchTerm: "",
    selectedClasses: [],
    selectedCategories: [],
    selectedStatuses: [],
    selectedPriorities: [],
    selectedAvailabilities: [],
    yearRange: null,
  });

  // Mural Persistence State
  const [muralState, setMuralState] = useState(() => {
    const saved = localStorage.getItem("muralState");
    return saved ? JSON.parse(saved) : { reading: 1, "to-read": 1, read: 1 };
  });

  // Persist Mural State
  useEffect(() => {
    localStorage.setItem("muralState", JSON.stringify(muralState));
  }, [muralState]);

  // --- Mobile Menu State ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch books only when session is ready
  useEffect(() => {
    if (!authLoading && session) {
      fetchBooks();
    } else if (!authLoading && !session) {
      setLoading(false);
    }
  }, [authLoading, session]);

  const fetchBooks = async () => {
    try {
      console.log("Fetching books from /books/...");
      const res = await api.get("/books/");
      setBooks(res.data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar livros:", err);
      setError(
        "Não foi possível conectar ao backend python. Detalhes no console."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    navigate("/edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleFormSuccess = () => {
    setEditingBook(null);
    fetchBooks();
    navigate(-1);
  };

  const handleOpenForm = () => {
    setEditingBook(null);
    navigate("/create");
  };

  return (
    <ToastProvider>
      <div className="h-screen bg-slate-50 dark:bg-neutral-950 transition-colors duration-300 font-sans text-slate-900 dark:text-slate-100 flex flex-col md:flex-row overflow-hidden w-full">
        {/* Mobile Header (Visible < md) */}
        <PrivateRoute>
          <MobileHeader
            onMenuClick={() => setIsMobileMenuOpen(true)}
            onAddBook={() => handleOpenForm()}
          />
        </PrivateRoute>

        {/* Sidebar (Desktop Fixed / Mobile Drawer) */}
        <PrivateRoute>
          <Sidebar
            onAddBook={() => handleOpenForm()}
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          />
        </PrivateRoute>

        {/* Main Content Area - Scrollable */}
        <main
          className={`flex-1 h-full overflow-y-auto overflow-x-hidden transition-all duration-300 w-full md:ml-20 ml-0 pt-16 md:pt-0`}
        >
          <div className="w-full min-h-full">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
                <p>⚠️ {error}</p>
                <p className="text-sm">
                  Dica: Rode `uvicorn main:app --reload` na pasta backend.
                </p>
              </div>
            )}

            {(loading || authLoading) && (
              <p className="text-center mt-20 text-lg animate-pulse text-neutral-500">
                Carregando biblioteca...
              </p>
            )}

            {!loading && !authLoading && (
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />

                {/* Dashboard Protected Routes */}
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <div className="max-w-[1600px] mx-auto">
                        <Home books={books} />
                      </div>
                    </PrivateRoute>
                  }
                />

                {/* Mural routes with nested status routes */}
                <Route
                  path="/mural/:status"
                  element={
                    <PrivateRoute>
                      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-6">
                        <Mural
                          books={books}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          muralState={muralState}
                          setMuralState={setMuralState}
                        />
                      </div>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/mural"
                  element={<Navigate to="/mural/reading" replace />}
                />

                {/* Table route */}
                <Route
                  path="/table"
                  element={
                    <PrivateRoute>
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
                    </PrivateRoute>
                  }
                />

                {/* Analytics route */}
                <Route
                  path="/analytics"
                  element={
                    <PrivateRoute>
                      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-6">
                        <Analytics books={books} />
                      </div>
                    </PrivateRoute>
                  }
                />

                {/* Settings Routes */}
                <Route
                  path="/settings"
                  element={
                    <PrivateRoute>
                      <SettingsLayout onEdit={handleEdit} />
                    </PrivateRoute>
                  }
                >
                  <Route index element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<OverviewSettings />} />
                  <Route path="ai" element={<AISettings />} />
                  <Route path="formula" element={<FormulaSettings />} />
                  <Route path="lists" element={<ListSettings />} />
                  <Route path="audit" element={<AuditSettings />} />
                  <Route path="guide" element={<GuideSettings />} />
                  <Route path="preferences" element={<PreferencesSettings />} />
                  <Route path="admin" element={<Admin />} />
                </Route>

                {/* Book Form routes */}
                <Route
                  path="/create"
                  element={
                    <PrivateRoute>
                      <BookFormPage
                        editingBook={null}
                        onFormSuccess={handleFormSuccess}
                        onCancel={() => {
                          setEditingBook(null);
                          navigate(-1);
                        }}
                      />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/edit"
                  element={
                    <PrivateRoute>
                      <BookFormPage
                        editingBook={editingBook}
                        onFormSuccess={handleFormSuccess}
                        onCancel={() => {
                          setEditingBook(null);
                          navigate(-1);
                        }}
                      />
                    </PrivateRoute>
                  }
                />
              </Routes>
            )}
          </div>
        </main>

        {/* Button Scroll to Top */}
        <ScrollToTopBottom currentPath={location.pathname} />
      </div>
    </ToastProvider>
  );
}
