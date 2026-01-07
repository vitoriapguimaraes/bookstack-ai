import {
  Brain,
  Calculator,
  List,
  Info,
  Target,
  Shield,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function OverviewSettings() {
  const navigate = useNavigate();

  return (
    <div className="w-full animate-fade-in pb-20 md:pb-0 font-sans">
      {/* Header with Actions */}
      <div className="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            Visão Geral
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Status do sistema
          </p>
        </div>
      </div>

      {/* Feature cards */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard
          icon={Brain}
          title="IA & Inteligência"
          description="Prompts e regras usadas para enriquecimento automático."
          onClick={() => navigate("/settings/ai")}
          color="bg-indigo-500"
          features={[
            "Chaves de API (Encrypted)",
            "Prompts Customizados",
            "Classificação Automática",
          ]}
        />

        <FeatureCard
          icon={Calculator}
          title="Fórmula de Score"
          description="Cálculo dinâmico que define a prioridade de leitura."
          onClick={() => navigate("/settings/formula")}
          color="bg-amber-500"
          features={[
            "Pesos por Tipo/Classe",
            "Contexto Temporal",
            "Recálculo em Massa",
          ]}
        />

        <FeatureCard
          icon={List}
          title="Listas e Campos"
          description="Gerencie as classes e categorias da sua biblioteca."
          onClick={() => navigate("/settings/lists")}
          color="bg-emerald-500"
          features={[
            "Configurar Árvore de Categorias",
            "Adicionar/Remover Classes",
            "Filtragem Dinâmica",
          ]}
        />

        <FeatureCard
          icon={Shield}
          title="Auditoria de Dados"
          description="Mantenha a integridade da sua biblioteca em dia."
          onClick={() => navigate("/settings/audit")}
          color="bg-rose-500"
          features={[
            "Detecção de Inconsistências",
            "Correção em Massa",
            "Agrupamento por Erro",
          ]}
        />

        <FeatureCard
          icon={Target}
          title="Preferências Gerais"
          description="Metas anuais e personalização de interface."
          onClick={() => navigate("/settings/preferences")}
          color="bg-blue-500"
          features={[
            "Meta de Leitura Anual",
            "Aparência do Dashboard",
            "Configurações de Conta",
          ]}
        />
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  features,
  onClick,
  color = "bg-indigo-500",
}) {
  const iconColor = color.replace("bg-", "text-");

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative overflow-hidden"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl ${color} bg-opacity-10 ${iconColor}`}>
          <Icon size={20} />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {title}
        </h3>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        {description}
      </p>

      {features && (
        <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
          {features.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span className={`w-1 h-1 rounded-full ${color}`} />
              {item}
            </li>
          ))}
        </ul>
      )}

      <div
        className={`mt-auto pt-6 text-xs font-bold ${iconColor} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0`}
      >
        Acessar configurações <ArrowRight size={14} />
      </div>

      {/* Subtle Background Glow */}
      <div
        className={`absolute -right-8 -bottom-8 w-24 h-24 ${color} opacity-[0.03] rounded-full blur-2xl group-hover:opacity-[0.08] transition-opacity`}
      />
    </div>
  );
}
