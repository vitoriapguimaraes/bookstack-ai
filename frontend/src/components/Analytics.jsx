import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Book, Star, BookOpen, Library } from 'lucide-react'
import axios from 'axios'

const api = axios.create()

export default function Analytics() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get('/api/dashboard/stats')
        setStats(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <div className="p-10 text-center animate-pulse">Carregando dados...</div>
  if (!stats) return <div className="p-10 text-center text-red-500">Erro ao carregar análises.</div>

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1']

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Painel de Leitura</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
             <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
                 <Library size={24} />
             </div>
             <div>
                 <p className="text-sm text-slate-500 dark:text-slate-400">Total na Biblioteca</p>
                 <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</p>
             </div>
         </div>

         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
             <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg text-green-600 dark:text-green-300">
                 <BookOpen size={24} />
             </div>
             <div>
                 <p className="text-sm text-slate-500 dark:text-slate-400">Livros Lidos</p>
                 <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.by_status['Lido'] || 0}</p>
             </div>
         </div>

         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
             <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg text-orange-600 dark:text-orange-300">
                 <Book size={24} />
             </div>
             <div>
                 <p className="text-sm text-slate-500 dark:text-slate-400">Fila de Leitura</p>
                 <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.by_status['A Ler'] || 0}</p>
             </div>
         </div>

         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
             <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg text-yellow-600 dark:text-yellow-300">
                 <Star size={24} />
             </div>
             <div>
                 <p className="text-sm text-slate-500 dark:text-slate-400">Nota Média</p>
                 <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.rating_avg}</p>
             </div>
         </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Categories Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 h-96">
              <h3 className="text-lg font-semibold mb-6 text-slate-700 dark:text-slate-200">Livros por Categoria (Top 6)</h3>
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.by_category} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12, fill: '#888'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{fill: 'transparent'}}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {stats.by_category.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                  </BarChart>
              </ResponsiveContainer>
          </div>
          
          {/* Motivation/Progress Card (Placeholder for now, or maybe Reading Now list?) */}
           <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-xl shadow-lg text-white flex flex-col justify-between">
              <div>
                  <h3 className="text-xl font-bold mb-2">Continue Lendo! 🚀</h3>
                  <p className="opacity-90">
                      Você já leu <strong>{((stats.by_status['Lido']||0) / stats.total * 100).toFixed(0)}%</strong> da sua biblioteca.
                  </p>
                  <div className="w-full bg-white/20 rounded-full h-3 mt-4">
                      <div 
                        className="bg-white h-3 rounded-full transition-all duration-1000" 
                        style={{ width: `${((stats.by_status['Lido']||0) / stats.total * 100)}%` }}
                      ></div>
                  </div>
              </div>
              
              <div className="mt-8">
                  <p className="text-sm opacity-75 uppercase tracking-wider font-semibold">Status Atual</p>
                  <div className="flex gap-4 mt-2">
                      <div className="text-center">
                          <span className="block text-3xl font-bold">{stats.by_status['Lendo'] || 0}</span>
                          <span className="text-xs opacity-75">Em andamento</span>
                      </div>
                      <div className="w-px bg-white/30"></div>
                      <div className="text-center">
                          <span className="block text-3xl font-bold">{stats.by_status['A Ler'] || 0}</span>
                          <span className="text-xs opacity-75">Na fila</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  )
}
