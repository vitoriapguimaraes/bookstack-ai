"""
bookstack-ai — Análise Exploratória da Biblioteca
==================================================
Como usar:

  Opção A — Via Supabase (automático, usa backend/.env):
    pip install pandas matplotlib seaborn scikit-learn supabase python-dotenv
    python analysis.py

  Opção B — Via API do backend:
    python analysis.py --api http://localhost:8000 --token SEU_TOKEN

  Opção C — Via CSV local:
    No app: Tabela → Exportar CSV → salve em analysis/data/biblioteca.csv
    python analysis.py --local

Saída:
  - Log completo em analysis/output/analysis.log
  - Gráficos em analysis/output/*.png
"""

import argparse
import logging
import os
import sys
from pathlib import Path

import matplotlib.cm as cm
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import requests
import seaborn as sns
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import LabelEncoder

# ── Configurações visuais ───────────────────────────────────────────────────
sns.set_theme(style="darkgrid", palette="muted")
plt.rcParams["figure.figsize"] = (12, 6)
plt.rcParams["font.size"] = 12

OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)
DATA_PATH = Path(__file__).parent / "data" / "biblioteca.csv"

# ── Mapeamento de colunas ───────────────────────────────────────────────────
COLUMN_MAP = {
    "título": "title",
    "titulo": "title",
    "autor": "author",
    "status": "status",
    "classe": "book_class",
    "class": "book_class",
    "categoria": "category",
    "score": "score",
    "ordem": "order",
    "order": "order",
    "ano": "year",
    "year": "year",
    "motivação": "motivation",
    "motivacao": "motivation",
    "data lida": "date_read",
    "date_read": "date_read",
    "date read": "date_read",
    "título original": "original_title",
    "nota": "rating",
    "tipo": "type",
}


# ── Logging ─────────────────────────────────────────────────────────────────
def setup_logging() -> logging.Logger:
    """Configura log simultâneo no terminal e em arquivo .log."""
    log_path = OUTPUT_DIR / "analysis.log"
    logger = logging.getLogger("bookstack")
    logger.setLevel(logging.DEBUG)
    logger.handlers.clear()

    fmt = logging.Formatter(
        "%(asctime)s  %(levelname)-7s  %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
    )

    # Console
    ch = logging.StreamHandler(sys.stdout)
    ch.setFormatter(fmt)
    logger.addHandler(ch)

    # Arquivo
    fh = logging.FileHandler(log_path, encoding="utf-8", mode="w")
    fh.setFormatter(fmt)
    logger.addHandler(fh)

    return logger


log = setup_logging()


# ── Carregamento de dados ───────────────────────────────────────────────────
def load_from_api(api_url: str, token: str) -> pd.DataFrame:
    url = api_url.rstrip("/") + "/books/"
    headers = {"Authorization": f"Bearer {token}"}
    log.info("Conectando à API: %s", url)
    response = requests.get(url, headers=headers, timeout=15)
    if response.status_code == 401:
        log.error("Token inválido ou expirado.")
        sys.exit(1)
    if response.status_code != 200:
        log.error("Erro na API: %s — %s", response.status_code, response.text[:200])
        sys.exit(1)
    books = response.json()
    log.info("%d livros recebidos da API", len(books))
    return pd.DataFrame(books)


def load_from_supabase(supabase_url: str, service_key: str) -> pd.DataFrame:
    try:
        from supabase import create_client
    except ImportError:
        log.warning("supabase não instalado. Execute: pip install supabase")
        return pd.DataFrame()
    log.info("Conectando ao Supabase: %s", supabase_url)
    client = create_client(supabase_url, service_key)
    response = client.table("book").select("*").execute()
    books = response.data
    log.info("%d livros recebidos do Supabase", len(books))
    return pd.DataFrame(books)


def load_from_csv() -> pd.DataFrame:
    if not DATA_PATH.exists():
        log.error("Arquivo não encontrado: %s", DATA_PATH)
        log.error(
            "No app: Tabela → Exportar CSV → salve em analysis/data/biblioteca.csv"
        )
        sys.exit(1)
    df = pd.read_csv(DATA_PATH, encoding="utf-8-sig")
    log.info("%d livros carregados do CSV", len(df))
    return df


# ── Limpeza ─────────────────────────────────────────────────────────────────
def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = df.columns.str.strip().str.lower()
    df = df.rename(columns={k: v for k, v in COLUMN_MAP.items() if k in df.columns})

    for col in ("score", "year", "order", "rating"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    if "score" in df.columns:
        df["score"] = df["score"].fillna(0)

    # Suporte a múltiplos formatos de data: YYYY/MM, YYYY-MM, YYYY-MM-DD
    if "date_read" in df.columns:
        df["date_read"] = pd.to_datetime(
            df["date_read"].astype(str).str[:7].str.replace("/", "-"),
            errors="coerce",
            format="%Y-%m",
        )
    return df


def validate_columns(df: pd.DataFrame) -> None:
    important = [
        "title",
        "status",
        "book_class",
        "category",
        "score",
        "rating",
        "date_read",
        "year",
        "type",
    ]
    missing = [c for c in important if c not in df.columns]
    if missing:
        log.warning("Colunas ausentes (análises parciais): %s", missing)


# ── Helpers ─────────────────────────────────────────────────────────────────
def save(fig: plt.Figure, name: str) -> None:
    path = OUTPUT_DIR / name
    fig.savefig(path, dpi=150)
    plt.close(fig)
    log.info("Gráfico salvo: %s", name)


def encode_features(df: pd.DataFrame, cat_cols: list, num_cols: list) -> np.ndarray:
    parts = []
    for col in cat_cols:
        if col in df.columns:
            parts.append(LabelEncoder().fit_transform(df[col].fillna("?")))
    for col in num_cols:
        if col in df.columns:
            vals = df[col].fillna(0).values.astype(float)
            if vals.std() > 0:
                parts.append((vals - vals.mean()) / vals.std())
    return np.column_stack(parts) if len(parts) > 1 else np.array([])


# ── Análise 1: Visão Geral ──────────────────────────────────────────────────
def log_overview(df: pd.DataFrame, lidos: pd.DataFrame) -> None:
    log.info("=" * 50)
    log.info("VISÃO GERAL — %d livros totais", len(df))
    log.info("=" * 50)
    if "status" in df.columns:
        for status, count in df["status"].value_counts().items():
            log.info("  %-22s: %d", status, count)
    if "score" in df.columns and df["score"].sum() > 0:
        log.info("  Score médio       : %.1f", df["score"].mean())
        log.info("  Score máximo      : %.1f", df["score"].max())
    if "rating" in df.columns and len(lidos):
        rated = lidos[lidos["rating"] > 0]
        if len(rated):
            log.info("  Nota média (lidos): %.2f/5", rated["rating"].mean())


# ── Análise 2: Score por Classe — métricas texto ─────────────────────────────
def log_score_per_class(df: pd.DataFrame) -> None:
    if "score" not in df.columns or "book_class" not in df.columns:
        log.warning("[Score/Classe] Colunas ausentes, análise pulada.")
        return
    if df["score"].sum() == 0:
        log.warning("[Score/Classe] Nenhum livro com score calculado ainda.")
        return

    log.info("-" * 50)
    log.info("SCORE POR CLASSE (mín. 2 livros)")
    log.info("-" * 50)
    grp = (
        df[df["score"] > 0]
        .groupby("book_class")["score"]
        .agg(count="count", mean="mean", min="min", max="max")
    )
    grp = grp[grp["count"] >= 2].sort_values("mean", ascending=False)

    if grp.empty:
        log.warning("[Score/Classe] Menos de 2 livros por classe para comparar.")
        return

    for cls, row in grp.iterrows():
        log.info(
            "  %-30s  média=%.1f  min=%.1f  max=%.1f  n=%d",
            cls,
            row["mean"],
            row["min"],
            row["max"],
            int(row["count"]),
        )


# ── Análise 3: Nota vs Score ────────────────────────────────────────────────
def plot_rating_vs_score(lidos: pd.DataFrame) -> None:
    if "rating" not in lidos.columns or "score" not in lidos.columns:
        log.warning("[NxS] Colunas 'rating' ou 'score' ausentes.")
        return

    valid = lidos[(lidos["rating"] > 0) & (lidos["score"] > 0)].copy()
    log.debug(
        "[NxS] Livros com nota e score preenchidos: %d / %d", len(valid), len(lidos)
    )

    if len(valid) < 3:
        log.warning("[NxS] Apenas %d livros com nota E score. Mínimo: 3.", len(valid))
        return

    log.info("Gerando: Nota pessoal vs Score calculado (%d livros)", len(valid))
    fig, ax = plt.subplots(figsize=(10, 6))
    if "book_class" in valid.columns:
        classes = valid["book_class"].unique()
        colors = cm.tab10(np.linspace(0, 1, len(classes)))
        for cls, color in zip(classes, colors):
            sub = valid[valid["book_class"] == cls]
            ax.scatter(
                sub["score"], sub["rating"], label=cls, color=color, s=80, alpha=0.75
            )
    else:
        ax.scatter(valid["score"], valid["rating"], color="#7c3aed", s=80, alpha=0.75)

    if len(valid) >= 2:
        z = np.polyfit(valid["score"], valid["rating"], 1)
        x_line = np.linspace(valid["score"].min(), valid["score"].max(), 100)
        ax.plot(
            x_line,
            np.poly1d(z)(x_line),
            "--",
            color="gray",
            alpha=0.6,
            label="Tendência",
        )

    ax.set_title("Nota Pessoal × Score Calculado", fontweight="bold")
    ax.set_xlabel("Score (calculado pelo app)")
    ax.set_ylabel("Nota Pessoal (1–5)")
    ax.legend(bbox_to_anchor=(1.05, 1), loc="upper left", fontsize=9)
    plt.tight_layout()
    save(fig, "01_nota_vs_score.png")


# ── Análise 4: PCA + Clustering ──────────────────────────────────────────────
def _build_pca_labels(df: pd.DataFrame, col: str) -> tuple[np.ndarray, list[str]]:
    """Converte coluna categórica em índice e retorna cores + legenda."""
    vals = df[col].fillna("?").values
    unique = sorted(set(vals))
    idx = np.array([unique.index(v) for v in vals])
    colors = cm.tab10(np.linspace(0, 1, len(unique)))
    return idx, unique, colors


def plot_pca_clusters(df: pd.DataFrame) -> None:
    X = encode_features(
        df,
        cat_cols=["book_class", "category", "status"],
        num_cols=["score", "year", "rating"],
    )
    if X.size == 0 or len(df) < 6:
        log.warning("[PCA] Dados insuficientes (mín. 6 livros com campos preenchidos).")
        return

    log.info("Gerando: PCA 2D com clustering K-Means")
    k = min(4, len(df) // 3)
    labels = KMeans(n_clusters=k, random_state=42, n_init=10).fit_predict(X)
    pca = PCA(n_components=2)
    coords = pca.fit_transform(X)

    # Uma grade 1×2: esquerda colorido por cluster, direita por book_class
    fig, axes = plt.subplots(1, 2, figsize=(16, 7))

    # — Plot A: por cluster K-Means
    cluster_colors = cm.tab10(np.linspace(0, 1, k))
    for i in range(k):
        mask = labels == i
        axes[0].scatter(
            coords[mask, 0],
            coords[mask, 1],
            color=cluster_colors[i],
            label=f"Grupo {i+1}",
            s=70,
            alpha=0.8,
        )
    axes[0].set_title(f"Clusters K-Means (K={k})", fontweight="bold")
    axes[0].set_xlabel(f"PC1 ({pca.explained_variance_ratio_[0]*100:.0f}% variância)")
    axes[0].set_ylabel(f"PC2 ({pca.explained_variance_ratio_[1]*100:.0f}% variância)")
    axes[0].legend(fontsize=8)

    # — Plot B: por book_class (para entender o que os grupos representam)
    if "book_class" in df.columns:
        idx, unique_cls, cls_colors = _build_pca_labels(df, "book_class")
        for i, cls in enumerate(unique_cls):
            mask = idx == i
            axes[1].scatter(
                coords[mask, 0],
                coords[mask, 1],
                color=cls_colors[i],
                label=cls[:20],
                s=70,
                alpha=0.8,
            )
            # Rótulo do título
            if "title" in df.columns:
                for x, y, t in zip(
                    coords[mask, 0], coords[mask, 1], df["title"].values[mask]
                ):
                    axes[1].annotate(
                        str(t)[:15],
                        (x, y),
                        fontsize=6,
                        alpha=0.6,
                        xytext=(3, 3),
                        textcoords="offset points",
                    )
        axes[1].set_title("Mesmo espaço — colorido por Classe", fontweight="bold")
        axes[1].set_xlabel(f"PC1 ({pca.explained_variance_ratio_[0]*100:.0f}%)")
        axes[1].set_ylabel(f"PC2 ({pca.explained_variance_ratio_[1]*100:.0f}%)")
        axes[1].legend(fontsize=7, bbox_to_anchor=(1.05, 1), loc="upper left")

    plt.suptitle(
        "PCA — Espaço de similaridade dos livros", fontsize=13, fontweight="bold"
    )
    plt.tight_layout()
    save(fig, "02_pca_clusters.png")

    log.info("Perfil dos grupos K-Means:")
    for i in range(k):
        grupo = df[labels == i]
        top = (
            grupo["book_class"].value_counts().index[0]
            if "book_class" in grupo.columns
            else "?"
        )
        log.info("  Grupo %d: %d livros | Classe dominante: %s", i + 1, len(grupo), top)


# ── Análise 5: Recomendação ──────────────────────────────────────────────────
def log_recommend(df: pd.DataFrame) -> None:
    if "rating" not in df.columns or "status" not in df.columns:
        log.warning("[Rec] Colunas 'rating' ou 'status' ausentes.")
        return

    lidos_top = df[(df["status"] == "Lido") & (df["rating"] >= 4)].copy()
    fila = df[df["status"] == "A Ler"].copy()

    log.debug("[Rec] Lidos com nota ≥4: %d | Fila: %d", len(lidos_top), len(fila))

    if len(lidos_top) < 3:
        log.warning(
            "[Rec] Poucos livros lidos com nota ≥4 (min. 3). Encontrados: %d",
            len(lidos_top),
        )
        return
    if len(fila) < 1:
        log.warning("[Rec] Nenhum livro com status 'A Ler' para recomendar.")
        return

    # Encode separado para lidos e fila (mesmo espaço de features)
    combined = pd.concat([lidos_top, fila], ignore_index=True)
    X = encode_features(
        combined, cat_cols=["book_class", "category", "type"], num_cols=[]
    )

    if X.size == 0:
        log.warning(
            "[Rec] Sem features categóricas suficientes para calcular similaridade."
        )
        return

    n_lidos = len(lidos_top)
    X_lidos = X[:n_lidos]  # features dos livros favoritos
    X_fila = X[n_lidos:]  # features dos livros na fila

    # Centroide do gosto do usuário (média dos lidos top)
    query = X_lidos.mean(axis=0).reshape(1, -1)

    # KNN treinado na FILA, consultado com o perfil do usuário
    k = min(5, len(fila))
    nn = NearestNeighbors(n_neighbors=k, metric="euclidean").fit(X_fila)
    _, indices = nn.kneighbors(query)

    log.info("-" * 50)
    log.info("RECOMENDAÇÕES (baseado nos lidos com nota ≥4)")
    log.info("-" * 50)
    seen = set()
    for idx in indices[0]:
        book = fila.iloc[int(idx)]
        title = book.get("title", "?")
        if title in seen:
            continue
        seen.add(title)
        cls = book.get("book_class", "?")
        log.info("  → %s [%s]", title, cls)


# ── Main ────────────────────────────────────────────────────────────────────
def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Análise da biblioteca bookstack-ai")
    parser.add_argument(
        "--local", action="store_true", help="Usar CSV local em vez da API ou Supabase"
    )
    parser.add_argument(
        "--api", default=None, help="URL do backend (ex: http://localhost:8000)"
    )
    parser.add_argument(
        "--token", default=None, help="Token JWT para autenticar na API do backend"
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    # Carrega backend/.env automaticamente
    backend_env = Path(__file__).parent.parent / "backend" / ".env"
    local_env = Path(__file__).parent / ".env"
    if backend_env.exists():
        from dotenv import load_dotenv

        load_dotenv(backend_env)
    elif local_env.exists():
        from dotenv import load_dotenv

        load_dotenv(local_env)

    supabase_url = os.getenv("SUPABASE_URL", "")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    api_url = args.api or os.getenv("BOOKSTACK_API_URL", "http://localhost:8000")
    token = args.token or os.getenv("BOOKSTACK_TOKEN", "")

    if args.local:
        df_raw = load_from_csv()
    elif supabase_url and service_key:
        df_raw = load_from_supabase(supabase_url, service_key)
        if df_raw.empty:
            log.warning("Supabase vazio ou erro — usando CSV local como fallback.")
            df_raw = load_from_csv()
    elif token:
        df_raw = load_from_api(api_url, token)
    else:
        log.warning("Nenhuma credencial encontrada — usando CSV local.")
        df_raw = load_from_csv()

    df = clean(df_raw)
    validate_columns(df)
    lidos = df[df["status"] == "Lido"].copy() if "status" in df.columns else df.copy()

    log_overview(df, lidos)
    log_score_per_class(df)
    plot_rating_vs_score(lidos)
    plot_pca_clusters(df)
    log_recommend(df)

    log.info("=" * 50)
    log.info("Saída em: %s", OUTPUT_DIR.resolve())
    log.info("=" * 50)


if __name__ == "__main__":
    main()
