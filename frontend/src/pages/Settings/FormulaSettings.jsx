import { ChevronRight, Filter, Database, Star, Calendar, Award, Plus, Equal } from "lucide-react"

export default function FormulaSettings() {
  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in pb-20 md:pb-0">
      
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-300 flex items-start gap-3">
        <div className="mt-0.5"><Award size={16} /></div>
        <div>
            <p className="font-bold mb-1">Como funciona o cálculo?</p>
            <p className="opacity-90">O sistema soma os pontos de cada categoria acima. Livros com maior pontuação aparecem primeiro na sua lista de leitura ("A Ler"). Livros já lidos (status "Lido") são automaticamente removidos da fila de prioridade.</p>
        </div>
      </div>
      
      {/* Formula Equation Wrapper */}
      <div className="flex flex-col xl:flex-row items-stretch gap-6">
        
        {/* INPUTS GROUP */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <FormulaStep 
                step={1} 
                title="Filtro Inicial" 
                icon={Filter} 
                color="text-slate-500"
                operator="start"
            >
                <div className="h-full flex flex-col justify-center">
                    <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wider font-bold">Status</p>
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-2 rounded text-center">
                        <p className="text-sm font-bold text-red-600 dark:text-red-400">Lido</p>
                        <p className="text-[10px] text-red-400">Score = 0</p>
                    </div>
                </div>
            </FormulaStep>

            <FormulaStep 
                step={2} 
                title="Base" 
                icon={Database} 
                color="text-blue-500"
                operator="+"
            >
                <div className="space-y-2">
                    <Item label="Técnico" value="+4" />
                    <Item label="Outros" value="+2" />
                    <Divider />
                    <Item label="Estante Física" value="+2" />
                </div>
            </FormulaStep>

            <FormulaStep 
                step={3} 
                title="Prioridade" 
                icon={Star} 
                color="text-amber-500"
                operator="+"
            >
                <div className="space-y-2">
                    <Item label="Baixa" value="+1" />
                    <Item label="Média" value="+4" />
                    <Item label="Alta" value="+10" />
                </div>
            </FormulaStep>

            <FormulaStep 
                step={4} 
                title="Contexto" 
                icon={Calendar} 
                color="text-emerald-500"
                operator="+"
            >
                <div className="space-y-2">
                    <Item label="≥ 2022" value="+9" />
                    <Item label="Recentes" value="+6" />
                    <Item label="Antigos" value="+4" />
                </div>
            </FormulaStep>
        </div>

        {/* EQUALS SIGN (XL Only) */}
        <div className="hidden xl:flex items-center justify-center text-slate-300 dark:text-neutral-600">
            <Equal size={32} />
        </div>

        {/* RESULT CARD */}
        <div className="w-full xl:w-56 flex-shrink-0">
            <ResultCard />
        </div>

      </div>

    </div>
  )
}

function FormulaStep({ step, title, icon: Icon, color, children, operator }) {
  return (
    <div className="relative group">
        {/* Operator Badge (Mobile/Desktop) */}
        {operator !== 'start' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 xl:-left-3 xl:top-1/2 xl:-translate-y-1/2 w-6 h-6 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-full flex items-center justify-center shadow-sm z-10 text-slate-400 dark:text-neutral-500">
                <Plus size={12} />
            </div>
        )}

        <div className="h-full bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 flex flex-col shadow-sm hover:shadow-md transition-all duration-300 hover:border-purple-500/30 dark:hover:border-purple-500/30">
            <div className="flex items-center gap-4 mb-4 border-b border-slate-100 dark:border-neutral-800 pb-3">
                <div className={`p-2 rounded-lg bg-slate-50 dark:bg-neutral-800 ${color}`}>
                    <Icon size={18} />
                </div>
                <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest block">Passo {step}</span>
                    <h3 className="font-bold text-slate-800 dark:text-white">{title}</h3>
                </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center">
                {children}
            </div>
        </div>
    </div>
  )
}

function Item({ label, value }) {
  return (
    <div className="flex justify-between items-center text-sm py-1 border-b border-slate-50 dark:border-neutral-800/50 last:border-0">
      <span className="text-slate-600 dark:text-neutral-400 font-medium">{label}</span>
      <span className="font-mono font-bold text-purple-600 dark:text-purple-400 text-xs bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded">
        {value}
      </span>
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-slate-100 dark:bg-neutral-800 my-1" />
}

function ResultCard() {
  return (
    <div className="h-full min-h-[200px] rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 text-white dark:text-slate-900 p-6 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden group">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-purple-500/30"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl -ml-10 -mb-10 transition-all group-hover:bg-blue-500/30"></div>

      <div className="relative z-10 flex flex-col items-center">
          <div className="p-3 bg-white/10 dark:bg-black/5 rounded-2xl mb-4 backdrop-blur-sm">
             <Award className="w-8 h-8" />
          </div>
          
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] opacity-70 mb-2">Resultado Final</h3>
          
          <div className="text-5xl font-black font-mono tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-tr from-white to-slate-400 dark:from-slate-900 dark:to-slate-600">
              SCORE
          </div>
          
          <p className="text-xs opacity-60 leading-relaxed max-w-[150px]">
            Define a ordem automática da sua fila de leitura.
          </p>
      </div>
    </div>
  )
}
