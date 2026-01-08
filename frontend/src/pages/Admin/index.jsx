import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import {
  Shield,
  Users,
  Mail,
  List,
  Layers,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";

export default function Admin() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [statusModal, setStatusModal] = useState({ open: false, user: null });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }

    fetchUsers();
  }, [isAdmin, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/admin/users");
      setUsers(response.data);
    } catch (err) {
      console.error(err);
      setError("Falha ao carregar usuários. Verifique se você tem permissão.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal.user) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/users/${deleteModal.user.id}`);
      setUsers(users.filter((x) => x.id !== deleteModal.user.id));
      setDeleteModal({ open: false, user: null });
    } catch (e) {
      alert("Erro ao excluir usuário");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusModal.user) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/users/${statusModal.user.id}/toggle_active`);
      // Refresh
      const updatedUsers = users.map((u) =>
        u.id === statusModal.user.id ? { ...u, is_active: !u.is_active } : u
      );
      setUsers(updatedUsers);
      setStatusModal({ open: false, user: null });
    } catch (e) {
      alert("Erro ao alterar status");
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="w-full animate-fade-in space-y-6">
      {/* Header */}
      <div className="hidden md:block">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          Painel do Administrador
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Gerencie usuários, permissões e configurações globais do sistema.
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-700/30 p-4 rounded-lg flex gap-3">
        <Shield
          className="text-red-600 dark:text-red-500 flex-shrink-0"
          size={20}
        />
        <p className="text-sm text-red-800 dark:text-red-200">
          Acesso restrito a administradores. Aqui você pode visualizar e
          gerenciar os usuários cadastrados no sistema.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-slate-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-neutral-800 rounded-lg">
              <Users className="text-slate-600 dark:text-slate-400" size={20} />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-white leading-tight">
                Usuários do Sistema
              </h3>
              <p className="text-sm text-slate-500 dark:text-neutral-400">
                Listagem completa de registros
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-full text-slate-600 dark:text-slate-300">
            {users.length} usuários
          </span>
        </div>

        <div className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-neutral-800/50 text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-800">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">
                  ID (UUID)
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">
                  Status Setup
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">
                  Data de Cadastro
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-right min-w-[140px]">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-slate-500 animate-pulse"
                  >
                    Carregando dados...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors group"
                  >
                    <td
                      className="px-6 py-4 font-mono text-xs text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors truncate max-w-[120px]"
                      title={u.id}
                    >
                      {u.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 text-xs font-bold">
                          {u.email.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-slate-700 dark:text-slate-200 font-medium">
                          {u.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          u.role === "admin"
                            ? "bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-900/50 dark:text-purple-300"
                            : "bg-slate-100 border-slate-200 text-slate-600 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400"
                        }`}
                      >
                        {u.role === "admin" ? "Administrador" : "Usuário"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              u.has_api_keys
                                ? "bg-emerald-500 border-emerald-600"
                                : "bg-slate-100 border-slate-300"
                            }`}
                            title="API Configurada"
                          >
                            {u.has_api_keys && (
                              <Shield size={10} className="text-white" />
                            )}
                          </div>
                          <span className="text-[8px] text-slate-400 mt-0.5">
                            API
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              u.has_custom_prompts
                                ? "bg-blue-500 border-blue-600"
                                : "bg-slate-100 border-slate-300"
                            }`}
                            title="Prompts Customizados"
                          >
                            {u.has_custom_prompts && (
                              <Shield size={10} className="text-white" />
                            )}
                          </div>
                          <span className="text-[8px] text-slate-400 mt-0.5">
                            Prompt
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              u.has_custom_formula
                                ? "bg-amber-500 border-amber-600"
                                : "bg-slate-100 border-slate-300"
                            }`}
                            title="Fórmula Personalizada"
                          >
                            {u.has_custom_formula && (
                              <Shield size={10} className="text-white" />
                            )}
                          </div>
                          <span className="text-[8px] text-slate-400 mt-0.5">
                            Score
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              u.has_custom_classes
                                ? "bg-blue-500 border-blue-600"
                                : "bg-slate-100 border-slate-300"
                            }`}
                            title="Classes Customizadas"
                          >
                            {u.has_custom_classes && (
                              <List size={10} className="text-white" />
                            )}
                          </div>
                          <span className="text-[8px] text-slate-400 mt-0.5">
                            Classes
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              u.has_custom_availability
                                ? "bg-amber-500 border-amber-600"
                                : "bg-slate-100 border-slate-300"
                            }`}
                            title="Disponibilidade Personalizada"
                          >
                            {u.has_custom_availability && (
                              <Layers size={10} className="text-white" />
                            )}
                          </div>
                          <span className="text-[8px] text-slate-400 mt-0.5">
                            Disp.
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.email === "vipistori@gmail.com" ? (
                          <span className="text-[10px] text-slate-400 font-medium px-2 py-1 bg-slate-100 dark:bg-neutral-800 rounded border border-slate-200 dark:border-neutral-700">
                            Super Admin
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                setStatusModal({ open: true, user: u })
                              }
                              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-all ${
                                u.is_active
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                              }`}
                            >
                              {u.is_active ? "Ativo" : "Inativo"}
                            </button>
                            <button
                              onClick={() =>
                                setDeleteModal({ open: true, user: u })
                              }
                              className="w-8 h-8 flex items-center justify-center rounded bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                              title="Excluir Usuário"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL - PORTAL */}
      {deleteModal.open &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-red-100 dark:border-red-900/30 animate-scale-in">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle
                    size={32}
                    className="text-red-600 dark:text-red-400"
                  />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                    Excluir Usuário?
                  </h3>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2 p-2 bg-red-50 rounded">
                    {deleteModal.user?.email}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Essa ação apagará <strong>todos os livros</strong> e
                    configurações deste usuário. É irreversível.
                  </p>
                </div>

                <div className="flex gap-3 w-full mt-4">
                  <button
                    onClick={() => setDeleteModal({ open: false, user: null })}
                    className="flex-1 px-4 py-3 rounded-lg font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-all"
                    disabled={actionLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-3 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 transition-all shadow-lg shadow-red-500/30 flex items-center justify-center"
                  >
                    {actionLoading ? "Excluindo..." : "Sim, Excluir"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* TOGGLE STATUS CONFIRMATION MODAL - PORTAL */}
      {statusModal.open &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-neutral-800 animate-scale-in">
              <div className="flex flex-col items-center text-center gap-4">
                <div
                  className={`p-3 rounded-full ${
                    statusModal.user?.is_active
                      ? "bg-red-100 dark:bg-red-900/30 text-red-600"
                      : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                  }`}
                >
                  {statusModal.user?.is_active ? (
                    <AlertTriangle size={32} />
                  ) : (
                    <CheckCircle size={32} />
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                    {statusModal.user?.is_active
                      ? "Desativar Usuário?"
                      : "Reativar Usuário?"}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    O usuário <strong>{statusModal.user?.email}</strong> será{" "}
                    {statusModal.user?.is_active ? (
                      <span className="text-red-600 font-bold">bloqueado</span>
                    ) : (
                      <span className="text-emerald-600 font-bold">
                        desbloqueado
                      </span>
                    )}{" "}
                    e {statusModal.user?.is_active ? "perderá" : "terá"} acesso
                    ao sistema.
                  </p>
                </div>

                <div className="flex gap-3 w-full mt-4">
                  <button
                    onClick={() => setStatusModal({ open: false, user: null })}
                    className="flex-1 px-4 py-3 rounded-lg font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-all"
                    disabled={actionLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleToggleStatus}
                    disabled={actionLoading}
                    className={`flex-1 px-4 py-3 rounded-lg font-bold text-white transition-all shadow-lg flex items-center justify-center ${
                      statusModal.user?.is_active
                        ? "bg-red-600 hover:bg-red-700 shadow-red-500/30"
                        : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30"
                    }`}
                  >
                    {actionLoading
                      ? "Processando..."
                      : statusModal.user?.is_active
                      ? "Confirmar Bloqueio"
                      : "Confirmar Ativação"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
