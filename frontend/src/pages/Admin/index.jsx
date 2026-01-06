import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { Shield, Users, Calendar, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Admin() {
    const { isAdmin, user } = useAuth()
    const navigate = useNavigate()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!isAdmin) {
            navigate('/')
            return
        }

        fetchUsers()
    }, [isAdmin, navigate])

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users')
            setUsers(response.data)
        } catch (err) {
            console.error(err)
            setError('Falha ao carregar usuários. Verifique se você tem permissão.')
        } finally {
            setLoading(false)
        }
    }

    if (!isAdmin) return null

    return (
        <div className="container mx-auto p-6 md:p-8 animate-fade-in max-w-6xl">
            <header className="mb-8 flex items-center gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
                    <Shield size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Painel Administrativo</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gerenciamento de usuários e sistema</p>
                </div>
            </header>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-slate-200 dark:border-neutral-800 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-neutral-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Users className="text-slate-400" size={20} />
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Usuários Cadastrados</h2>
                    </div>
                    <span className="text-sm font-medium px-3 py-1 bg-slate-100 dark:bg-neutral-800 rounded-full text-slate-600 dark:text-slate-400">
                        Total: {users.length}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-neutral-950/50 text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-medium">
                            <tr>
                                <th className="px-6 py-4">ID (UUID)</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Função</th>
                                <th className="px-6 py-4">Data de Cadastro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                        Nenhum usuário encontrado (além de você? estranho...)
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500 truncate max-w-[150px]" title={u.id}>
                                            {u.id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Mail size={16} className="text-slate-400" />
                                                <span className="text-slate-700 dark:text-slate-200 font-medium">{u.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                u.role === 'admin' 
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-slate-400" />
                                                <span>{new Date(u.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
