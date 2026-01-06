import { useState, useEffect } from 'react'
import { Filter, Database, Star, Calendar, Award, RotateCcw, Save, Calculator, ArrowRight, Settings2 } from "lucide-react"
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'

const DEFAULT_CONFIG = {
    type: { "Técnico": 4, "default": 2 },
    availability: { "Estante": 2, "default": 0 },
    priority: { "1 - Baixa": 1, "2 - Média": 4, "3 - Média-Alta": 7, "4 - Alta": 10 },
    year: {
        ranges: [
            { max: 2005, weight: 4, label: "Antigos (≤ 2005)" },
            { min: 2006, max: 2021, weight: 7, label: "Intermediários (2006-2021)" },
            { min: 2022, weight: 9, label: "Recentes (≥ 2022)" }
        ]
    },
    book_class: {
        "Tecnologia & IA": 0,
        "Desenvolvimento Pessoal": 0,
        "Negócios & Finanças": 0,
        "Conhecimento & Ciências": 0,
        "Literatura & Cultura": 0,
        "Engenharia & Arquitetura": 0
    },
    category: {
        "Produtividade": 5, "Liderança": 7, "Inteligência emocional": 7, "Desenvolvimento pessoal": 5, 
        "Criatividade": 3, "Comunicação": 5, "Bem-estar": 5, "Literatura brasileira": 5, 
        "Literatura Brasileira Clássica": 5, "História/Ficção": 7, "Diversidade e inclusão": 3, 
        "Negócios": 2, "Finanças pessoais": 4, "Conhecimento geral": 7, "Estatística": 7, 
        "MLOps": 5, "Engenharia de dados": 5, "Arquitetura": 1, "Programação": 3, 
        "Machine learning": 7, "Visão computacional": 7, "IA": 6, "Data science": 7, 
        "Análise de Dados": 5, "Liderança & Pensamento Estratégico": 7, "Arquitetura da Mente (Mindset)": 7, 
        "Artesanato de Software (Clean Code)": 6, "Sistemas de IA & LLMs": 6, "Storytelling & Visualização": 5, 
        "Biohacking & Existência": 5, "Épicos & Ficção Reflexiva": 7, "Justiça Social & Interseccionalidade": 3, 
        "Liberdade Econômica & Finanças": 4, "Cosmologia & Fronteiras da Ciência": 7, 
        "Estatística & Incerteza": 7, "Engenharia de ML & MLOps": 5
    }
}

export default function FormulaSettings() {
  const { addToast } = useToast()
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Simulation State
  const [simBook, setSimBook] = useState({
      type: "Técnico",
      availability: "Estante",
      priority: "4 - Alta",
      year: new Date().getFullYear(),
      book_class: "Tecnologia & IA",
      category: "IA"
  })

  // Helper for Year Score
  const getYearScore = (y) => {
      if(!config || !config.year || !config.year.ranges) return 0
      for(let r of config.year.ranges) {
        if(r.min && r.max) {
            if(y >= r.min && y <= r.max) return r.weight
        } else if(r.max) {
            if(y <= r.max) return r.weight
        } else if(r.min) {
            if(y >= r.min) return r.weight
        }
      }
      return 0
  }

  // Calculate live score for simulator
  const calculateSimScore = () => {
      if(!config) return 0
      let score = 0
      
      // Type
      score += config.type[simBook.type] || config.type.default || 0
      // Availability
      score += config.availability[simBook.availability] || config.availability.default || 0
      // Priority
      score += config.priority[simBook.priority] || 0
      
      // Class
      score += config.book_class?.[simBook.book_class] || 0

      // Category
      let catScore = config.category?.[simBook.category] || 0
      if(catScore === 0 && simBook.category) {
           for(let k of Object.keys(config.category || {})) {
               if(simBook.category.toLowerCase().includes(k.toLowerCase())) {
                   catScore = config.category[k];
                   break;
               }
           }
      }
      score += catScore

      // Year
      score += getYearScore(simBook.year)
      
      return score
  }

  const simScore = calculateSimScore()


  useEffect(() => { fetchConfig() }, [])

  const fetchConfig = async () => {
    try {
        const res = await api.get('/preferences/')
        if (res.data?.formula_config && Object.keys(res.data.formula_config).length > 0) {
            // Merge retrieved config with default config structure to ensure all keys exist
            setConfig(prev => {
                const loaded = res.data.formula_config
                return {
                    ...prev,
                    ...loaded,
                    type: { ...prev.type, ...(loaded.type || {}) },
                    availability: { ...prev.availability, ...(loaded.availability || {}) },
                    priority: { ...prev.priority, ...(loaded.priority || {}) },
                    year: { ...prev.year, ...(loaded.year || {}) },
                    book_class: { ...prev.book_class, ...(loaded.book_class || {}) },
                    category: { ...prev.category, ...(loaded.category || {}) },
                }
            })
        }
    } catch (err) {
        console.error("Erro:", err)
    } finally {
        setLoading(false)
    }
  }

  const handleSave = async () => {
      setSaving(true)
      try {
          const res = await api.get('/preferences/')
          await api.put('/preferences/', { ...res.data, formula_config: config })
          addToast({ type: 'success', message: 'Fórmula atualizada!' })
      } catch (err) {
          addToast({ type: 'error', message: 'Erro ao salvar.' })
      } finally {
          setSaving(false)
      }
  }

  const handleReset = () => {
      if(window.confirm("Restaurar padrão?")) setConfig(DEFAULT_CONFIG)
  }

  // Update Helpers
  const updateType = (k, v) => setConfig(p => ({ ...p, type: { ...p.type, [k]: parseInt(v) || 0 } }))
  const updateAvail = (k, v) => setConfig(p => ({ ...p, availability: { ...p.availability, [k]: parseInt(v) || 0 } }))
  const updatePriority = (k, v) => setConfig(p => ({ ...p, priority: { ...p.priority, [k]: parseInt(v) || 0 } }))
  const updateYear = (i, v) => {
      const r = [...config.year.ranges]
      r[i] = { ...r[i], weight: parseInt(v) || 0 }
      setConfig(p => ({ ...p, year: { ...p.year, ranges: r } }))
  }

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-400">Carregando editor...</div>

  return (
    <div className="w-full animate-fade-in pb-20 md:pb-0 font-sans">
      
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Editor de Fórmula
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Ajuste os pesos para calibrar o algoritmo de priorização.
            </p>
        </div>

        <div className="flex items-center gap-3">
             <button onClick={handleReset} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" title="Restaurar Padrão">
                <RotateCcw size={20} />
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-neutral-800"></div>
            <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Save size={18} />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
        </div>
      </div>

      <div className="flex flex-col gap-8 items-start">
          
          {/* TOP: Simulator Panel (Now Single Column) */}
          <div className="w-full space-y-6">
              
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                  <div className="p-6 text-slate-800 dark:text-slate-100">
                      
                      <div className="flex items-center gap-3 mb-6 opacity-80">
                          <Calculator size={20} />
                          <h3 className="font-bold tracking-wide uppercase text-xs">Simulador em Tempo Real</h3>
                      </div>

                      {/* Grid Container (Split Layout) */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                          
                          {/* Left: Total Score Display */}
                          <div className="md:col-span-4 flex flex-col items-center justify-center py-6 md:border-r border-slate-300 dark:border-neutral-700 h-full">
                              <span className="text-6xl font-black font-mono tracking-tighter block mb-2">
                                  {simScore}
                              </span>
                              <span className="text-sm font-medium opacity-60 bg-white/10 dark:bg-black/5 px-3 py-1 rounded-full">
                                  Pontuação Final
                              </span>
                          </div>

                          {/* Right: Simulator Controls */}
                          <div className="md:col-span-8 space-y-4">
                              <p className="text-xs font-bold uppercase opacity-50 mb-2">Configurar Parâmetros</p>

                              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                 {/* Type */}
                                 <div className="bg-slate-100/80 dark:bg-neutral-800 rounded-xl p-3 flex flex-col gap-2 border border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600 transition-colors">
                                     <div className="flex justify-between items-center">
                                         <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">Tipo</span>
                                         <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                                             +{config.type[simBook.type] || config.type.default || 0}
                                         </span>
                                     </div>
                                     <Select 
                                        value={simBook.type} 
                                        onChange={v => setSimBook({...simBook, type: v})}
                                        options={["Técnico", "Não Técnico"]} 
                                     />
                                 </div>

                                 {/* Availability */}
                                 <div className="bg-slate-100/80 dark:bg-neutral-800 rounded-xl p-3 flex flex-col gap-2 border border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600 transition-colors">
                                     <div className="flex justify-between items-center">
                                         <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">Disponível em</span>
                                         <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                                             +{config.availability[simBook.availability] || config.availability.default || 0}
                                         </span>
                                     </div>
                                     <Select 
                                        value={simBook.availability} 
                                        onChange={v => setSimBook({...simBook, availability: v})}
                                        options={["Estante", "Kindle/PDF"]} 
                                     />
                                 </div>

                                 {/* Priority */}
                                 <div className="bg-slate-100/80 dark:bg-neutral-800 rounded-xl p-3 flex flex-col gap-2 border border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600 transition-colors">
                                     <div className="flex justify-between items-center">
                                         <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">Prioridade</span>
                                         <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                                             +{config.priority[simBook.priority] || 0}
                                     </span>
                                     </div>
                                     <Select 
                                        value={simBook.priority} 
                                        onChange={v => setSimBook({...simBook, priority: v})}
                                        options={["1 - Baixa", "2 - Média", "3 - Média-Alta", "4 - Alta"]} 
                                     />
                                 </div>
                                 
                                 {/* Year */}
                                 <div className="bg-slate-100/80 dark:bg-neutral-800 rounded-xl p-3 flex flex-col gap-2 border border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600 transition-colors">
                                     <div className="flex justify-between items-center">
                                         <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">Ano</span>
                                         <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                                             +{getYearScore(simBook.year)}
                                         </span>
                                     </div>
                                     <input 
                                        type="number" 
                                        value={simBook.year}
                                        onChange={e => setSimBook({...simBook, year: parseInt(e.target.value)})}
                                        className="bg-white/10 dark:bg-black/5 border-none rounded-lg px-2 py-2 text-center font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none w-full placeholder-slate-400"
                                        placeholder="Ano"
                                     />
                                 </div>

                                 {/* Class */}
                                 <div className="bg-slate-100/80 dark:bg-neutral-800 rounded-xl p-3 flex flex-col gap-2 border border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600 transition-colors">
                                     <div className="flex justify-between items-center">
                                         <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">Classe</span>
                                         <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                                             +{config.book_class?.[simBook.book_class] || 0}
                                         </span>
                                     </div>
                                     <Select 
                                        value={simBook.book_class}
                                        onChange={v => setSimBook({...simBook, book_class: v})}
                                        options={Object.keys(config.book_class || {})}
                                     />
                                 </div>

                                 {/* Category */}
                                 <div className="bg-slate-100/80 dark:bg-neutral-800 rounded-xl p-3 flex flex-col gap-2 border border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600 transition-colors">
                                     <div className="flex justify-between items-center">
                                         <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">Categoria</span>
                                         <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                                             +{config.category?.[simBook.category] || 0}
                                         </span>
                                     </div>
                                     <Select 
                                        value={simBook.category}
                                        onChange={v => setSimBook({...simBook, category: v})}
                                        options={Object.keys(config.category || {}).sort()}
                                     />
                                 </div>

                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* BOTTOM: Configuration Forms */}
          <div className="w-full space-y-6">
              
              {/* Card: Base Factors */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/50 flex items-center gap-3">
                      <h3 className="font-bold text-slate-700 dark:text-white">Fatores Base</h3>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <InputGroup label="Livro Técnico" value={config.type["Técnico"]} onChange={v => updateType('Técnico', v)} />
                      <InputGroup label="Livro Não Técnico" value={config.type["default"]} onChange={v => updateType('default', v)} />
                      <InputGroup label="Na Estante Física" value={config.availability["Estante"]} onChange={v => updateAvail('Estante', v)}/>
                  </div>
              </div>

              {/* Card: Priority */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/50 flex items-center gap-3">
                      <h3 className="font-bold text-slate-700 dark:text-white">Prioridade Manual</h3>
                  </div>
                  <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {["1 - Baixa", "2 - Média", "3 - Média-Alta", "4 - Alta"].map(p => (
                          <div key={p} className="flex flex-col gap-2">
                              <label className="text-xs font-semibold text-slate-500 uppercase">{p.split(" - ")[1]}</label>
                              <div className="relative">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">+</div>
                                  <input 
                                      type="number" 
                                      value={config.priority[p]} 
                                      onChange={e => updatePriority(p, e.target.value)}
                                      className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg pl-8 pr-3 py-2 text-left font-mono font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                  />
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

               {/* Card: Year Context */}
               <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/50 flex items-center gap-3">
                      <h3 className="font-bold text-slate-700 dark:text-white">Contexto Temporal</h3>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {config.year.ranges.map((range, idx) => (
                          <div key={idx} className="flex flex-col gap-2">
                              <label className="text-xs font-semibold text-slate-500 uppercase">{range.label}</label>
                              <div className="relative">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">+</div>
                                  <input 
                                      type="number" 
                                      value={range.weight} 
                                      onChange={e => updateYear(idx, e.target.value)}
                                      className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg pl-8 pr-3 py-2 text-left font-mono font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                  />
                              </div>
                          </div>
                      ))}
                  </div>
                </div>

               {/* Card: Classes (New) */}
               <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/50 flex items-center gap-3">
                      <h3 className="font-bold text-slate-700 dark:text-white">Classes de Livro</h3>
                  </div>
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.keys(config.book_class || {}).map(cls => (
                          <InputGroup 
                             key={cls} 
                             label={cls} 
                             value={config.book_class[cls]} 
                             onChange={v => setConfig(p => ({...p, book_class: {...p.book_class, [cls]: parseInt(v) || 0}}))}
                          />
                      ))}
                  </div>
              </div>

               {/* Card: Categories (New) */}
               <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/50 flex items-center gap-3">
                      <h3 className="font-bold text-slate-700 dark:text-white">Categorias Específicas</h3>
                  </div>
                  <div className="p-6">
                      <div className="space-y-6">
                        {/* Tecnologia & IA */}
                        <div>
                          <h4 className="text-xs font-bold uppercase mb-3 flex items-center gap-2" style={{ color: 'hsl(145, 65%, 35%)' }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(145, 65%, 70%)' }}></span>
                            Tecnologia & IA
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {["IA", "Machine learning", "Data science", "Visão computacional", "MLOps", "Engenharia de dados", "Engenharia de ML & MLOps", "Sistemas de IA & LLMs", "Análise de Dados", "Programação", "Artesanato de Software (Clean Code)", "Arquitetura"].filter(cat => config.category?.[cat] !== undefined).map(cat => (
                              <InputGroup 
                                key={cat} 
                                label={cat} 
                                value={config.category[cat]} 
                                onChange={v => setConfig(p => ({...p, category: {...p.category, [cat]: parseInt(v) || 0}}))}
                                small
                              />
                            ))}
                          </div>
                        </div>

                        {/* Desenvolvimento Pessoal */}
                        <div>
                          <h4 className="text-xs font-bold uppercase mb-3 flex items-center gap-2" style={{ color: 'hsl(185, 75%, 35%)' }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(185, 75%, 75%)' }}></span>
                            Desenvolvimento Pessoal
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {["Desenvolvimento pessoal", "Produtividade", "Liderança", "Liderança & Pensamento Estratégico", "Inteligência emocional", "Criatividade", "Comunicação", "Bem-estar", "Arquitetura da Mente (Mindset)", "Biohacking & Existência"].filter(cat => config.category?.[cat] !== undefined).map(cat => (
                              <InputGroup 
                                key={cat} 
                                label={cat} 
                                value={config.category[cat]} 
                                onChange={v => setConfig(p => ({...p, category: {...p.category, [cat]: parseInt(v) || 0}}))}
                                small
                              />
                            ))}
                          </div>
                        </div>

                        {/* Negócios & Finanças */}
                        <div>
                          <h4 className="text-xs font-bold uppercase mb-3 flex items-center gap-2" style={{ color: 'hsl(45, 85%, 40%)' }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(45, 85%, 75%)' }}></span>
                            Negócios & Finanças
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {["Negócios", "Finanças pessoais", "Liberdade Econômica & Finanças"].filter(cat => config.category?.[cat] !== undefined).map(cat => (
                              <InputGroup 
                                key={cat} 
                                label={cat} 
                                value={config.category[cat]} 
                                onChange={v => setConfig(p => ({...p, category: {...p.category, [cat]: parseInt(v) || 0}}))}
                                small
                              />
                            ))}
                          </div>
                        </div>

                        {/* Conhecimento & Ciências */}
                        <div>
                          <h4 className="text-xs font-bold uppercase mb-3 flex items-center gap-2" style={{ color: 'hsl(340, 80%, 40%)' }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(340, 80%, 80%)' }}></span>
                            Conhecimento & Ciências
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {["Conhecimento geral", "Estatística", "Estatística & Incerteza", "Cosmologia & Fronteiras da Ciência", "Storytelling & Visualização"].filter(cat => config.category?.[cat] !== undefined).map(cat => (
                              <InputGroup 
                                key={cat} 
                                label={cat} 
                                value={config.category[cat]} 
                                onChange={v => setConfig(p => ({...p, category: {...p.category, [cat]: parseInt(v) || 0}}))}
                                small
                              />
                            ))}
                          </div>
                        </div>

                        {/* Literatura & Cultura */}
                        <div>
                          <h4 className="text-xs font-bold uppercase mb-3 flex items-center gap-2" style={{ color: 'hsl(270, 70%, 40%)' }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(270, 70%, 80%)' }}></span>
                            Literatura & Cultura
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {["Literatura brasileira", "Literatura Brasileira Clássica", "História/Ficção", "Épicos & Ficção Reflexiva", "Diversidade e inclusão", "Justiça Social & Interseccionalidade"].filter(cat => config.category?.[cat] !== undefined).map(cat => (
                              <InputGroup 
                                key={cat} 
                                label={cat} 
                                value={config.category[cat]} 
                                onChange={v => setConfig(p => ({...p, category: {...p.category, [cat]: parseInt(v) || 0}}))}
                                small
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  )
}

function InputGroup({ label, value, onChange, help, small }) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <label className={`font-medium text-slate-700 dark:text-slate-300 ${small ? 'text-xs' : 'text-sm'}`}>{label}</label>
                {help && <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">{help}</span>}
            </div>
            <div className="relative">
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono ${small ? 'text-[10px]' : 'text-xs'}`}>+</div>
                <input 
                    type="number" 
                    value={value} 
                    onChange={e => onChange(e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg pl-8 pr-4 font-mono font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all hover:bg-white dark:hover:bg-neutral-700 ${small ? 'py-1.5 text-sm' : 'py-2.5 text-base'}`}
                />
            </div>
        </div>
    )
}

function Select({ value, onChange, options }) {
    return (
        <select 
            value={value} 
            onChange={e => onChange(e.target.value)}
            className="w-full bg-white/10 dark:bg-black/5 border-none rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none appearance-none cursor-pointer"
        >
            {options.map(o => <option key={o} value={o} className="text-slate-900">{o}</option>)}
        </select>
    )
}
