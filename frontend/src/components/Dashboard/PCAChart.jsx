/**
 * PCAChart — Análise de Componentes Principais interativa
 *
 * Implementa PCA (covariância + eigen) e K-Means em JS puro.
 * Cada ponto é colorido pela classe do livro e tem forma pelo cluster K-Means.
 */
import { useMemo, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ── PCA helpers ─────────────────────────────────────────────────────────────

function mean(arr) {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function covMatrix(X) {
  const n = X.length;
  const cols = X[0].length;
  const cov = Array.from({ length: cols }, () => Array(cols).fill(0));
  const means = X[0].map((_, j) => mean(X.map((r) => r[j])));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < cols; j++)
      for (let k = 0; k < cols; k++)
        cov[j][k] += ((X[i][j] - means[j]) * (X[i][k] - means[k])) / (n - 1);
  return cov;
}

/** Devolve [eigenvalue, eigenvector] usando Power Iteration (2 iterations). */
function powerIteration(M, iters = 200) {
  const n = M.length;
  let v = Array.from({ length: n }, () => Math.random() - 0.5);
  for (let it = 0; it < iters; it++) {
    const mv = M.map((row) => row.reduce((s, val, j) => s + val * v[j], 0));
    const norm = Math.sqrt(mv.reduce((s, x) => s + x * x, 0)) || 1;
    v = mv.map((x) => x / norm);
  }
  const eigenval = v.reduce(
    (s, vi, j) => s + vi * M[j].reduce((ss, val, k) => ss + val * v[k], 0),
    0,
  );
  return [eigenval, v];
}

function deflate(M, eigenval, eigenvec) {
  return M.map((row, i) =>
    row.map((val, j) => val - eigenval * eigenvec[i] * eigenvec[j]),
  );
}

function pca2D(X) {
  const cov = covMatrix(X);
  const [ev1, pc1] = powerIteration(cov);
  const [, pc2] = powerIteration(deflate(cov, ev1, pc1));
  const means = X[0].map((_, j) => mean(X.map((r) => r[j])));
  const centered = X.map((row) => row.map((v, j) => v - means[j]));
  return centered.map((row) => [
    row.reduce((s, v, j) => s + v * pc1[j], 0),
    row.reduce((s, v, j) => s + v * pc2[j], 0),
  ]);
}

// ── K-Means (simplificado, 3 clusters) ──────────────────────────────────────

function kMeans(points, k = 4, iters = 50) {
  if (points.length < k) k = Math.max(1, points.length);
  let centroids = points.slice(0, k).map((p) => [...p]);
  let labels = new Array(points.length).fill(0);

  for (let it = 0; it < iters; it++) {
    labels = points.map((p) => {
      let best = 0;
      let bestD = Infinity;
      centroids.forEach((c, ci) => {
        const d = p.reduce((s, v, j) => s + (v - c[j]) ** 2, 0);
        if (d < bestD) {
          bestD = d;
          best = ci;
        }
      });
      return best;
    });

    centroids = centroids.map((_, ci) => {
      const cluster = points.filter((_, i) => labels[i] === ci);
      if (cluster.length === 0) return centroids[ci];
      return cluster[0].map((_, j) => mean(cluster.map((p) => p[j])));
    });
  }
  return labels;
}

// ── Encode livros em vetor numérico ──────────────────────────────────────────

const BOOK_CLASSES = [
  "Tecnologia & IA",
  "Literatura & Cultura",
  "Desenvolvimento Pessoal",
  "Conhecimento & Ciências",
  "Negócios & Finanças",
  "Engenharia & Arquitetura",
];

const STATUSES = ["Lido", "A Ler", "Lendo", "Pausado", "Abandonado"];
const TYPES = ["Técnico", "Não-técnico"];

function encodeBook(book, allCategories) {
  const cls = BOOK_CLASSES.indexOf(book.book_class ?? "");
  const status = STATUSES.indexOf(book.status ?? "");
  const type = TYPES.indexOf(book.type ?? "");
  const catIdx = allCategories.indexOf(book.category ?? "");
  const score = parseFloat(book.score) || 0;
  const year = parseInt(book.year) || 2000;
  const rating = parseFloat(book.rating) || 0;
  return [
    cls < 0 ? -1 : cls,
    status < 0 ? -1 : status,
    type < 0 ? -1 : type,
    catIdx < 0 ? -1 : catIdx,
    score,
    (year - 2000) / 10,
    rating,
  ];
}

function normalize(matrix) {
  const cols = matrix[0].length;
  return matrix.map((row) => {
    const colMeans = row.map((_, j) => mean(matrix.map((r) => r[j])));
    const colStds = row.map((_, j) => {
      const m = colMeans[j];
      const variance = mean(matrix.map((r) => (r[j] - m) ** 2));
      return Math.sqrt(variance) || 1;
    });
    return row.map((v, j) => (v - colMeans[j]) / colStds[j]);
  });
}

// ── Paleta de cores por classe ────────────────────────────────────────────────

const CLASS_COLORS = {
  "Tecnologia & IA": "#6366f1",
  "Literatura & Cultura": "#ec4899",
  "Desenvolvimento Pessoal": "#f59e0b",
  "Conhecimento & Ciências": "#10b981",
  "Negócios & Finanças": "#3b82f6",
  "Engenharia & Arquitetura": "#8b5cf6",
  Outros: "#94a3b8",
};

const CLUSTER_SHAPES = ["circle", "diamond", "square", "triangle"];

// ── Tooltip customizado ────────────────────────────────────────────────────────

function PCATooltip({ active, payload }) {
  if (!active || !payload || !payload[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg p-3 shadow-xl text-xs max-w-[200px]">
      <p className="font-semibold text-slate-800 dark:text-white mb-1 leading-tight">
        {d.title}
      </p>
      <p className="text-slate-500 dark:text-slate-400">{d.book_class}</p>
      <p className="text-slate-400 dark:text-slate-500">{d.category}</p>
      <p className="text-slate-400 dark:text-slate-500 mt-1">
        Grupo {d.cluster + 1}
      </p>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export function PCAChart({ books }) {
  const [filterClass, setFilterClass] = useState(null);
  const K_CLUSTERS = 4;

  const { scatterData, clusters } = useMemo(() => {
    if (!books || books.length < 6) return { scatterData: [], clusters: [] };

    const allCategories = [...new Set(books.map((b) => b.category ?? ""))];
    const matrix = books.map((b) => encodeBook(b, allCategories));
    const normed = normalize(matrix);

    const coords = pca2D(normed);
    const labels = kMeans(coords, K_CLUSTERS);

    const data = books.map((b, i) => ({
      x: coords[i][0],
      y: coords[i][1],
      title: b.title ?? "?",
      book_class: b.book_class ?? "Outros",
      category: b.category ?? "",
      status: b.status ?? "",
      cluster: labels[i],
    }));

    const clusterGroups = Array.from({ length: K_CLUSTERS }, (_, ci) =>
      data.filter((d) => d.cluster === ci),
    );

    return { scatterData: data, clusters: clusterGroups };
  }, [books]);

  const visibleClasses = useMemo(
    () => [...new Set(scatterData.map((d) => d.book_class))].sort(),
    [scatterData],
  );

  const filtered = filterClass
    ? scatterData.filter((d) => d.book_class === filterClass)
    : scatterData;

  const groupedByCluster = Array.from({ length: K_CLUSTERS }, (_, ci) =>
    filtered.filter((d) => d.cluster === ci),
  );

  if (scatterData.length < 6) return null;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-6 rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-light text-slate-800 dark:text-neutral-200 flex items-center gap-2">
            <span className="w-1 h-4 bg-indigo-500 rounded-full" />
            Mapa de Similaridade — PCA
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Variáveis: Classe · Categoria · Status · Score · Ano · Avaliação
          </p>
        </div>
        {/* Filtro por classe */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterClass(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              filterClass === null
                ? "bg-slate-700 text-white dark:bg-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-neutral-700"
            }`}
          >
            Todos
          </button>
          {visibleClasses.map((cls) => (
            <button
              key={cls}
              onClick={() => setFilterClass(cls === filterClass ? null : cls)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                filterClass === cls
                  ? "text-white"
                  : "bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-neutral-700"
              }`}
              style={
                filterClass === cls
                  ? { backgroundColor: CLASS_COLORS[cls] ?? "#6366f1" }
                  : {}
              }
            >
              {cls.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico */}
      <ResponsiveContainer width="100%" height={380}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <XAxis
            dataKey="x"
            type="number"
            name="PC1"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickFormatter={(v) => v.toFixed(1)}
            label={{
              value: "Componente Principal 1",
              position: "insideBottom",
              offset: -2,
              fontSize: 10,
              fill: "#94a3b8",
            }}
          />
          <YAxis
            dataKey="y"
            type="number"
            name="PC2"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickFormatter={(v) => v.toFixed(1)}
            label={{
              value: "Componente Principal 2",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              fontSize: 10,
              fill: "#94a3b8",
            }}
          />
          <Tooltip content={<PCATooltip />} />
          {groupedByCluster.map((clusterPoints, ci) => (
            <Scatter
              key={ci}
              name={`Grupo ${ci + 1}`}
              data={clusterPoints}
              shape={CLUSTER_SHAPES[ci] ?? "circle"}
            >
              {clusterPoints.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={CLASS_COLORS[entry.book_class] ?? CLASS_COLORS.Outros}
                  fillOpacity={0.75}
                  stroke="white"
                  strokeWidth={0.5}
                />
              ))}
            </Scatter>
          ))}
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legenda */}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 self-center">
            Cores (Classes)
          </span>
          {visibleClasses.map((cls) => (
            <span
              key={cls}
              className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400"
            >
              <span
                className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: CLASS_COLORS[cls] ?? CLASS_COLORS.Outros,
                }}
              />
              {cls}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1 sm:mt-0">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 self-center">
            Formas (Grupos)
          </span>
          {clusters.map((_, ci) => (
            <span
              key={ci}
              className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
            >
              <span className="inline-block w-3 h-3 bg-slate-400 rounded-sm flex-shrink-0" />
              Grupo {ci + 1} ({clusters[ci]?.length ?? 0})
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
