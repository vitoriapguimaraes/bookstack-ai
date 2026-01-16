import { useState, useEffect, useRef } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Loader2 } from "lucide-react";
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
import AvailabilitySettings from "./pages/Settings/AvailabilitySettings";
import PreferencesSettings from "./pages/Settings/PreferencesSettings";
import GuideSettings from "./pages/Guide";
import ScrollToTopBottom from "./components/ScrollToTopBottom";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import { useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ConfirmationProvider } from "./context/ConfirmationContext";
import PrivateRoute from "./components/PrivateRoute";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";

import { api } from "./services/api";
import { CONTACT_EMAIL } from "./utils/constants";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const mainRef = useRef(null);

  // Scroll to top on route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.pathname]);

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBook, setEditingBook] = useState(null);

  // Configure Axios Token
  useEffect(() => {
    if (session?.access_token) {
      api.defaults.headers.common["Authorization"] =
        `Bearer ${session.access_token}`;
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

  const isLoginPage = location.pathname === "/login";

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
      // Security Check: ensure token exists
      if (!session?.access_token) return;

      setLoading(true);

      // Explicitly pass token to avoid race conditions with interceptors/defaults
      const config = {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      };

      // Enforce a small minimum loading time to avoid "empty state" flash (reduced)
      const minLoadTime = new Promise((resolve) => setTimeout(resolve, 1500));
      const [res] = await Promise.all([
        api.get("/books/", config),
        minLoadTime,
      ]);

      setBooks(res.data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar livros:", err);
      setError("Falha de Conexão");
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

  const isDataRoute =
    !location.pathname.startsWith("/guide") &&
    !location.pathname.startsWith("/settings");
  const showLoader = (authLoading || (loading && isDataRoute)) && !isLoginPage;

  return (
    <ToastProvider>
      <ConfirmationProvider>
        <div
          className={
            // ...
            isLoginPage
              ? "min-h-screen w-full bg-slate-50 dark:bg-neutral-950"
              : "h-screen bg-slate-50 dark:bg-neutral-950 transition-colors duration-300 font-sans text-slate-900 dark:text-slate-100 flex flex-col md:flex-row overflow-hidden w-full"
          }
        >
          {/* Mobile Header (Visible < md) */}
          {!isLoginPage && (
            <PrivateRoute>
              <MobileHeader
                onMenuClick={() => setIsMobileMenuOpen(true)}
                onAddBook={() => handleOpenForm()}
              />
            </PrivateRoute>
          )}

          {/* Sidebar (Desktop Fixed / Mobile Drawer) */}
          {!isLoginPage && (
            <PrivateRoute>
              <Sidebar
                onAddBook={() => handleOpenForm()}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
              />
            </PrivateRoute>
          )}

          {/* Main Content Area - Scrollable */}
          <main
            ref={mainRef}
            className={
              isLoginPage
                ? "w-full h-full"
                : "flex-1 h-full overflow-y-auto overflow-x-hidden transition-all duration-300 w-full md:ml-20 ml-0 pt-16 md:pt-0"
            }
          >
            <div className={isLoginPage ? "h-full" : "w-full min-h-full"}>
              {error && !isLoginPage && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200 px-4 py-4 rounded-lg mb-6 flex items-start gap-3 animate-fade-in mx-4 mt-4">
                  <div className="text-xl">⚠️</div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-1">
                      Conexão Interrompida
                    </h3>
                    <p className="text-sm mb-2">
                      Não foi possível carregar seus livros no momento. Pode
                      haver uma instabilidade temporária no banco de dados.
                    </p>
                    <p className="text-xs opacity-80">
                      Aguarde um momento e recarregue a página. Se o erro
                      persistir, entre em contato:{" "}
                      <b className="select-all">{CONTACT_EMAIL}</b>
                    </p>
                  </div>
                </div>
              )}

              {showLoader && (
                <div className="flex flex-col items-center justify-center h-[50vh] animate-fade-in gap-4 text-center px-4">
                  <Loader2
                    className="animate-spin text-emerald-600 dark:text-emerald-400"
                    size={48}
                  />
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                      Carregando sua Biblioteca...
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
                      O servidor pode estar "acordando" se ficou inativo. Isso
                      pode levar até 1 minuto.
                      <br />
                      <span className="text-xs opacity-70 mt-1 block">
                        Agradecemos sua paciência! ☕
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {!showLoader ? (
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

                  {/* User Guide Route */}
                  <Route
                    path="/guide"
                    element={
                      <PrivateRoute>
                        <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-6">
                          <GuideSettings />
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
                    <Route
                      path="availability"
                      element={<AvailabilitySettings />}
                    />
                    <Route path="audit" element={<AuditSettings />} />

                    <Route
                      path="preferences"
                      element={<PreferencesSettings />}
                    />
                    <Route path="administrador" element={<Admin />} />
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
              ) : null}
            </div>
          </main>

          {/* Button Scroll to Top */}
          {!isLoginPage && (
            <ScrollToTopBottom
              containerRef={mainRef}
              currentPath={location.pathname}
            />
          )}

          {/* Minimalist Footer */}
          {!isLoginPage && (
            <div className="fixed bottom-2 left-1/2 text-[10px] text-slate-400 dark:text-slate-500 pointer-events-none z-50 opacity-80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-100 dark:border-neutral-800 shadow-sm">
              Desenvolvido por github.com/vitoriapguimaraes
            </div>
          )}

          <VercelAnalytics />
        </div>
      </ConfirmationProvider>
    </ToastProvider>
  );
}
