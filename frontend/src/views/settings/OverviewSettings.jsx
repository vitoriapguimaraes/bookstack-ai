import {
  Brain,
  Calculator,
  List,
  Info,
  Target
} from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function OverviewSettings() {
  const navigate = useNavigate()

  return (
    <div className="w-full animate-fade-in">

      {/* Feature cards */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard
          icon={Brain}
          title="IA & Prompts"
          description="Prompts e regras usadas para enriquecimento automático."
          onClick={() => navigate("/settings/ai")}
          features={[
            "Prompt principal",
            "Categorização",
            "Metadados"
          ]}
        />

        <FeatureCard
          icon={Calculator}
          title="Fórmula de Score"
          description="Cálculo que define a ordem de leitura."
          onClick={() => navigate("/settings/formula")}
          features={[
            "Filtros",
            "Pontuação base",
            "Prioridade",
            "Contexto"
          ]}
        />

        <FeatureCard
          icon={List}
          title="Listas de Referência"
          description="Categorias, classes e pesos do sistema."
          onClick={() => navigate("/settings/lists")}
          features={[
            "Categorias",
            "Classes",
            "Pesos"
          ]}
        />

        <FeatureCard
          icon={Target}
          title="Preferências do Usuário"
          description="Configure suas metas e personalizações."
          onClick={() => navigate("/settings/preferences")}
          features={[
            "Meta de Leitura",
            "Personalização",
            "Conta"
          ]}
        />
      </div>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description, features, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 hover:shadow-md transition flex flex-col h-full"
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {title}
        </h3>
      </div>

      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
        {description}
      </p>

      {features && (
        <ul className="space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
          {features.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-indigo-400" />
              {item}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-4 text-xs font-medium text-indigo-600 dark:text-indigo-400">
        Explorar →
      </div>
    </div>
  )
}
