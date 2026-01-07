import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Shield, Users, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (!isAdmin) return null;

  return (
    <div className="w-full animate-fade-in space-y-6">
      {/* Header */}
      <div className="hidden md:block">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          Painel Admin
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {loading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-slate-500 animate-pulse"
                  >
                    Carregando dados...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
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
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
