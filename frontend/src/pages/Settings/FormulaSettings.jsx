import { ChevronRight, Filter, Database, Star, Calendar, Award } from "lucide-react"

export default function FormulaSettings() {
  return (
    <div className="flex items-stretch gap-4 overflow-x-auto">
      <FormulaCard title="Filtro Inicial" icon={Filter}>
        <p className="text-xs text-neutral-500 mb-2">Status</p>
        <p className="text-sm font-medium">Lido → Score = 0</p>
      </FormulaCard>

      <FormulaOperator />

      <FormulaCard title="Base" icon={Database}>
        <Item label="Técnico" value="+4" />
        <Item label="Outros" value="+2" />
        <Divider />
        <Item label="Na estante" value="+2" />
      </FormulaCard>

      <FormulaOperator />

      <FormulaCard title="Prioridade" icon={Star}>
        <Item label="Baixa" value="+1" />
        <Item label="Média" value="+4" />
        <Item label="Alta" value="+10" />
      </FormulaCard>

      <FormulaOperator />

      <FormulaCard title="Contexto" icon={Calendar}>
        <Item label="≥ 2022" value="+9" />
        <Item label="Recentes" value="+6" />
        <Item label="Antigos" value="+4" />
      </FormulaCard>

      <FormulaOperator icon="=" />

      <ResultCard />
    </div>
  )
}

function FormulaCard({ title, icon: Icon, children }) {
  return (
    <div className="w-[220px] rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-indigo-500" />}
        <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
          {title}
        </h4>
      </div>
      <div className="text-sm space-y-1">{children}</div>
    </div>
  )
}

function Item({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-neutral-600 dark:text-neutral-400">{label}</span>
      <span className="font-mono font-semibold text-neutral-900 dark:text-white">
        {value}
      </span>
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-2" />
}

function FormulaOperator({ icon = ChevronRight }) {
  const Icon = typeof icon === "string" ? null : icon

  return (
    <div className="flex items-center justify-center w-8 text-neutral-400">
      {Icon ? <Icon size={16} /> : icon}
    </div>
  )
}

function ResultCard() {
  return (
    <div className="w-[220px] rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 p-4 flex flex-col items-center justify-center gap-2">
      <Award className="w-5 h-5 opacity-60" />
      <span className="text-xs uppercase tracking-wide opacity-70">
        Resultado
      </span>
      <span className="text-3xl font-mono font-bold">SCORE</span>
      <span className="text-xs opacity-60 text-center">
        Ordem de leitura
      </span>
    </div>
  )
}
