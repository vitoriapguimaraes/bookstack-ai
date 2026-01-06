import { useState, useEffect } from 'react'
import { Target, Save } from 'lucide-react'

export default function PreferencesSettings() {
  const [yearlyGoal, setYearlyGoal] = useState(20)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    const savedGoal = localStorage.getItem('yearlyReadingGoal')
    if (savedGoal) {
      setYearlyGoal(parseInt(savedGoal))
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem('yearlyReadingGoal', yearlyGoal.toString())
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  return (
    <div className="w-full animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Preferências</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Configure suas preferências pessoais
        </p>
      </div>

      {/* Reading Goal Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-slate-200 dark:border-neutral-800 p-6">
        <div className="flex flex-col md:grid md:grid-cols-12 gap-6">
          {/* Column 1 - Title and Description (42%) */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Target className="text-purple-600 dark:text-purple-400" size={20} />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-white leading-tight">
                Meta Anual de Leitura
              </h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-neutral-400">
              Defina quantos livros você deseja ler por ano.
            </p>
          </div>

          {/* Column 2 - Current Goal Display (25%) */}
          <div className="md:col-span-3">
            <div className="text-center p-4 bg-slate-50 dark:bg-neutral-800/50 rounded-lg border border-slate-200 dark:border-neutral-700">
              <p className="text-xs text-slate-500 dark:text-neutral-400 mb-1">Meta Atual</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {yearlyGoal}
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                {yearlyGoal === 1 ? 'livro' : 'livros'} por ano
              </p>
            </div>
          </div>

          {/* Column 3 - Input and Button (33%) */}
          <div className="md:col-span-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700 dark:text-neutral-300 whitespace-nowrap">
                  Nova meta
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={yearlyGoal}
                  onChange={(e) => setYearlyGoal(parseInt(e.target.value) || 1)}
                  className="flex-1 px-4 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                onClick={handleSave}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isSaved
                    ? 'bg-emerald-600 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                <Save size={16} />
                {isSaved ? 'Salvo!' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Future preferences placeholder */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-neutral-900/50 rounded-lg border border-slate-200 dark:border-neutral-800">
        <p className="text-sm text-slate-600 dark:text-neutral-400">
          Mais opções de preferências serão adicionadas em breve.
        </p>
      </div>
    </div>
  )
}
