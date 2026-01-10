import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  XAxis,
  YAxis,
  Bar,
  LabelList,
} from "recharts";
import { COLORS } from "../../utils/analyticsUtils.js";

export function DistributionChart({
  title,
  dataLidos,
  dataNaoLidos,
  chartType = "pie",
  getColor,
}) {
  const getDynamicHeight = (data) => {
    if (chartType === "pie") return "16rem"; // h-64
    const headerOffset = 60; // Increased to account for margins
    const itemHeight = 50;
    const calculated = headerOffset + data.length * itemHeight;
    return `${Math.max(calculated, 150)}px`; // Enforce min height
  };

  const resolveColor = (entry, index) => {
    if (getColor) return getColor(entry, index);
    return COLORS[index % COLORS.length];
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-6 rounded-xl shadow-sm">
      <h3 className="text-lg font-light text-slate-800 dark:text-neutral-200 mb-8 flex items-center gap-2">
        <span className="w-1 h-4 bg-pastel-purple rounded-full"></span>
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div
          className="flex flex-col"
          style={{
            height: getDynamicHeight(dataLidos),
            width: "100%",
            minHeight: 0,
          }}
        >
          <p className="text-sm font-medium text-slate-500 dark:text-neutral-500 mb-4 flex justify-between uppercase tracking-widest flex-shrink-0">
            <span>Lidos</span>
            <span className="text-slate-700 dark:text-neutral-300">
              {dataLidos.reduce((a, b) => a + b.value, 0)}
            </span>
          </p>
          <div className="flex-1 min-h-0 min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              {chartType === "pie" ? (
                <PieChart>
                  <Pie
                    data={dataLidos}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#333"
                    paddingAngle={2}
                    dataKey="value"
                    isAnimationActive={false}
                    stroke="none"
                  >
                    {dataLidos.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={resolveColor(entry, index)}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--tooltip-bg)",
                      borderColor: "var(--tooltip-border)",
                      borderRadius: "4px",
                      color: "var(--tooltip-text)",
                    }}
                    itemStyle={{ color: "var(--tooltip-text)" }}
                    isAnimationActive={false}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                    }}
                  />
                </PieChart>
              ) : (
                <BarChart
                  data={dataLidos}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={110}
                    tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--tooltip-cursor)" }}
                    contentStyle={{
                      backgroundColor: "var(--tooltip-bg)",
                      borderColor: "var(--tooltip-border)",
                      color: "var(--tooltip-text)",
                    }}
                    itemStyle={{ color: "var(--tooltip-text)" }}
                    isAnimationActive={false}
                    labelStyle={{ display: "none" }}
                    formatter={(value, name, props) => [
                      value,
                      props.payload.name,
                    ]}
                  />
                  <Bar
                    dataKey="value"
                    radius={[2, 2, 2, 2]}
                    isAnimationActive={false}
                    barSize={32}
                    background={{ fill: "transparent" }}
                  >
                    <LabelList
                      dataKey="value"
                      position="right"
                      fill="var(--text-secondary)"
                      fontSize={11}
                    />
                    {dataLidos.map((entry, index) => (
                      <Cell key={index} fill={resolveColor(entry, index)} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="relative flex flex-col"
          style={{ height: getDynamicHeight(dataNaoLidos) }}
        >
          <div className="hidden md:block absolute left-0 top-4 bottom-4 w-px bg-slate-200 dark:bg-neutral-800"></div>

          <p className="text-sm font-medium text-slate-500 dark:text-neutral-500 mb-4 flex justify-between uppercase tracking-widest pl-0 md:pl-6 flex-shrink-0">
            <span>Não Lidos</span>
            <span className="text-slate-700 dark:text-neutral-300">
              {dataNaoLidos.reduce((a, b) => a + b.value, 0)}
            </span>
          </p>
          <div className="flex-1 min-h-0 min-w-0 w-full pl-0 md:pl-6">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              {chartType === "pie" ? (
                <PieChart>
                  <Pie
                    data={dataNaoLidos}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#333"
                    paddingAngle={2}
                    dataKey="value"
                    isAnimationActive={false}
                    stroke="none"
                  >
                    {dataNaoLidos.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={resolveColor(entry, index)}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--tooltip-bg)",
                      borderColor: "var(--tooltip-border)",
                      borderRadius: "0px",
                      color: "var(--tooltip-text)",
                    }}
                    itemStyle={{ color: "var(--tooltip-text)" }}
                    isAnimationActive={false}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                    }}
                  />
                </PieChart>
              ) : (
                <BarChart
                  data={dataNaoLidos}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={110}
                    tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--tooltip-cursor)" }}
                    contentStyle={{
                      backgroundColor: "var(--tooltip-bg)",
                      borderColor: "var(--tooltip-border)",
                      color: "var(--tooltip-text)",
                    }}
                    itemStyle={{ color: "var(--tooltip-text)" }}
                    isAnimationActive={false}
                    labelStyle={{ display: "none" }}
                    formatter={(value, name, props) => [
                      value,
                      props.payload.name,
                    ]}
                  />
                  <Bar
                    dataKey="value"
                    radius={[2, 2, 2, 2]}
                    isAnimationActive={false}
                    barSize={32}
                    background={{ fill: "transparent" }}
                  >
                    <LabelList
                      dataKey="value"
                      position="right"
                      fill="var(--text-secondary)"
                      fontSize={11}
                    />
                    {dataNaoLidos.map((entry, index) => (
                      <Cell key={index} fill={resolveColor(entry, index)} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
