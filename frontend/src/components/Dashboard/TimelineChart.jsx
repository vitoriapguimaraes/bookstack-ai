import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from "recharts";
import { CustomTimelineLegend } from "./CustomTimelineLegend";
import {
  getClassBaseHSL,
  hslToString,
  COLORS,
} from "../../utils/analyticsUtils.js";
import { useTheme } from "../../context/ThemeContext";

export function TimelineChart({ stats, timelineType, timelinePeriod }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Config for Category grouping and coloring
  const categoryConfig = useMemo(() => {
    if (timelineType !== "category") return null;

    // 1. Get all categories and their totals (from dist)
    const allCats = [...stats.dist.lidos.category].sort(
      (a, b) => b.value - a.value
    );

    // REMOVED SLICE TO INCLUDE ALL CATEGORIES AS REQUESTED
    // const topCats = allCats.slice(0, 10)
    const topCats = allCats;

    // 3. Group by Class
    const grouped = {};
    topCats.forEach((cat) => {
      const cls = stats.meta.categoryToClass[cat.name] || "Outros";
      if (!grouped[cls]) grouped[cls] = [];
      grouped[cls].push(cat);
    });

    // 4. Flatten back to list, but sorted by class
    const sortedClasses = Object.keys(grouped).sort();

    let sortedKeys = [];
    const colorMap = {};

    sortedClasses.forEach((cls) => {
      const catsInClass = grouped[cls];
      // Calculate color variations for this class
      const baseHSL = getClassBaseHSL(cls);

      catsInClass.forEach((cat, idx) => {
        sortedKeys.push(cat.name);

        // Vary Lightness
        const lightnessStep = 7;
        const offset = (idx - (catsInClass.length - 1) / 2) * lightnessStep;
        const newL = Math.max(20, Math.min(90, baseHSL.l + offset));

        colorMap[cat.name] = hslToString({ ...baseHSL, l: newL });
      });
    });

    return { keys: sortedKeys, colorMap };
  }, [stats, timelineType]);

  let keys = [];
  let legendItems = [];

  if (timelineType === "total") {
    keys = ["total"];
    legendItems = [
      { label: "Total", color: "#d8b4fe", value: stats.kpi.lidos || 0 },
    ];
  } else if (timelineType === "type") {
    keys = ["Técnico", "Não Técnico"];
    legendItems = [
      {
        label: "Técnico",
        color: "#d8b4fe",
        value:
          stats.dist.lidos.type.find((x) => x.name === "Técnico")?.value || 0,
      },
      {
        label: "Não Técnico",
        color: "#fca5a5",
        value:
          stats.dist.lidos.type.find((x) => x.name === "Não Técnico")?.value ||
          0,
      },
    ];
  } else if (timelineType === "class") {
    keys = stats.timelineMeta.classes;
    legendItems = stats.dist.lidos.class.map((c) => ({
      label: c.name,
      color: hslToString(getClassBaseHSL(c.name)),
      value: c.value,
    }));
  } else if (timelineType === "category") {
    if (categoryConfig) {
      keys = categoryConfig.keys;
      legendItems = keys.map((k) => ({
        label: k,
        color: categoryConfig.colorMap[k],
        value: stats.dist.lidos.category.find((c) => c.name === k)?.value || 0,
      }));
    }
  }

  const getColor = (key, index) => {
    if (timelineType === "total") return "#d8b4fe"; // pastel-purple
    if (timelineType === "type")
      return key === "Técnico" ? "#d8b4fe" : "#fca5a5";
    if (timelineType === "class") return hslToString(getClassBaseHSL(key));
    if (timelineType === "category")
      return categoryConfig?.colorMap[key] || COLORS[index % COLORS.length];
    return COLORS[index % COLORS.length];
  };

  const currentData = stats.timeline[timelinePeriod];
  const isYearly = timelinePeriod === "yearly";

  const gridColor = isDark ? "#262626" : "#e2e8f0"; // neutral-800 : slate-200
  const textColor = isDark ? "#737373" : "#64748b"; // neutral-500 : slate-500

  if (!currentData || currentData.length === 0) {
    return (
      <div className="w-full h-[350px] flex items-center justify-center text-slate-400 dark:text-neutral-500">
        Sem dados para exibir neste período.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col md:flex-row">
      <div className="flex-1 min-w-0 h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={currentData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            barSize={isYearly ? undefined : 20}
            barCategoryGap={isYearly ? 2 : "20%"}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={gridColor}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: textColor }}
              dy={10}
              tickFormatter={(val) => {
                if (val.length === 4) return val; // Year
                const [y, m] = val.split("-");
                return `${m}/${y}`; // Month/Year
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: textColor }}
            />
            <Tooltip
              cursor={{ fill: "var(--tooltip-cursor)" }}
              contentStyle={{
                backgroundColor: "var(--tooltip-bg)",
                borderColor: "var(--tooltip-border)",
                borderRadius: "4px",
                color: "var(--tooltip-text)",
              }}
              itemStyle={{ color: "var(--tooltip-text)" }}
              isAnimationActive={false}
            />
            {keys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={getColor(key, index)}
                radius={[2, 2, 0, 0]}
                isAnimationActive={false}
                background={{ fill: "transparent" }}
              >
                {/* Show label only on the top segment of stack or total */}
                {/* For simplicity we add labels. If stacked, it might be messy but meets req. */}
                <LabelList
                  dataKey={key}
                  position="top"
                  fill="#888"
                  fontSize={10}
                  formatter={(val) => (val > 0 ? val : "")}
                />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full md:w-56 flex-shrink-0 pt-4 md:pt-0 md:border-l border-slate-100 dark:border-neutral-800">
        <CustomTimelineLegend items={legendItems} />
      </div>
    </div>
  );
}
