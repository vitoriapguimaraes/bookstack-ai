import { Target, TrendingUp, Award, Calendar, Gem, Star } from "lucide-react";

export default function QuickInsights({ stats, books }) {
  const currentYear = new Date().getFullYear();
  const booksThisYear = books.filter(
    (b) =>
      b.status === "Lido" &&
      b.date_read &&
      new Date(b.date_read).getFullYear() === currentYear,
  ).length;
  const yearGoal = 20; // Pode ser configurável depois
  const progress = Math.min((booksThisYear / yearGoal) * 100, 100);

  const insights = [
    {
      icon: Target,
      label: `Meta ${currentYear}`,
      value: `${booksThisYear}/${yearGoal}`,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      progress: progress,
    },
    {
      icon: Award,
      label: "Nota Média",
      value: stats.kpi.avgRating.toFixed(1),
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      subtitle: "de 5.0",
    },
    {
      icon: TrendingUp,
      label: "Índice Médio",
      value: stats.kpi.avgScore.toFixed(0),
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      subtitle: "pontos",
    },
    {
      icon: Calendar,
      label: stats.insights.oldestRead ? "Desde" : "Início",
      value: stats.insights.oldestRead?.year || currentYear,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      subtitle: "anos de leitura",
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-neutral-300 flex items-center gap-2">
        <Gem size={16} className="text-purple-600" />
        Insights Rápidos
      </h3>

      {insights.map((insight, idx) => (
        <div
          key={idx}
          className={`${insight.bgColor} rounded-lg p-4 border border-slate-200 dark:border-neutral-700`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <insight.icon size={16} className={insight.color} />
                <span className="text-xs font-medium text-slate-600 dark:text-neutral-400">
                  {insight.label}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {insight.value}
              </div>
              {insight.subtitle && (
                <div className="text-xs text-slate-500 dark:text-neutral-500 mt-1">
                  {insight.subtitle}
                </div>
              )}
            </div>
          </div>

          {/* Progress bar para meta */}
          {insight.progress !== undefined && (
            <div className="mt-3">
              <div className="w-full bg-slate-200 dark:bg-neutral-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${insight.progress}%` }}
                />
              </div>
              <div className="text-xs text-slate-500 dark:text-neutral-500 mt-1 text-right">
                {insight.progress.toFixed(0)}% completo
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
