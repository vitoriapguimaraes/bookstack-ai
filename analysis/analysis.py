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
"""

import argparse
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


# ── Carregamento de dados ───────────────────────────────────────────────────
def load_from_api(api_url: str, token: str) -> pd.DataFrame:
    """Busca todos os livros diretamente do backend via GET /books/."""
    url = api_url.rstrip("/") + "/books/"
    headers = {"Authorization": f"Bearer {token}"}

    print(f"🌐 Conectando à API: {url}")
    response = requests.get(url, headers=headers, timeout=15)

    if response.status_code == 401:
        print("❌ Token inválido ou expirado.")
        print(
            "   Abra o app, F12 → Application → Local Storage → sb-...-auth-token → access_token"
        )
        sys.exit(1)
    if response.status_code != 200:
        print(f"❌ Erro na API: {response.status_code} — {response.text[:200]}")
        sys.exit(1)

    books = response.json()
    print(f"✅ {len(books)} livros recebidos da API\n")
    return pd.DataFrame(books)


def load_from_csv() -> pd.DataFrame:
    """Carrega a partir do CSV exportado manualmente."""
    if not DATA_PATH.exists():
        print("❌ Arquivo não encontrado:", DATA_PATH)
        print(
            "   No app: Tabela → Exportar CSV → salve em analysis/data/biblioteca.csv"
        )
        sys.exit(1)
    df = pd.read_csv(DATA_PATH, encoding="utf-8-sig")
    print(f"✅ {len(df)} livros carregados do CSV\n")
    return df


def load_from_supabase(supabase_url: str, service_key: str) -> pd.DataFrame:
    """Lê os livros diretamente do Supabase usando a service role key do backend/.env."""
    try:
        from supabase import create_client
    except ImportError:
        print("⚠️  supabase não instalado. Execute: pip install supabase")
        return pd.DataFrame()

    print(f"🗄️  Conectando ao Supabase: {supabase_url}")
    client = create_client(supabase_url, service_key)
    response = client.table("book").select("*").execute()
    books = response.data
    print(f"✅ {len(books)} livros recebidos do Supabase\n")
    return pd.DataFrame(books)


def clean(df: pd.DataFrame) -> pd.DataFrame:
    """Normaliza nomes de colunas e converte tipos."""
    df = df.copy()
    df.columns = df.columns.str.strip().str.lower()
    df = df.rename(columns={k: v for k, v in COLUMN_MAP.items() if k in df.columns})

    for col in ("score", "year", "order", "rating"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    if "score" in df.columns:
        df["score"] = df["score"].fillna(0)
    if "date_read" in df.columns:
        df["date_read"] = pd.to_datetime(
            df["date_read"], errors="coerce", format="%Y/%m"
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
        print(f"⚠️  Colunas ausentes (algumas análises serão puladas): {missing}\n")


# ── Helpers ─────────────────────────────────────────────────────────────────
def save(fig: plt.Figure, name: str) -> None:
    path = OUTPUT_DIR / name
    fig.savefig(path, dpi=150)
    plt.close(fig)
    print(f"   → {path.name}")


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


# ── Análises ─────────────────────────────────────────────────────────────────
def print_overview(df: pd.DataFrame, lidos: pd.DataFrame) -> None:
    print("=" * 55)
    print("  VISÃO GERAL")
    print("=" * 55)
    print(f"  Total de livros : {len(df)}")
    if "status" in df.columns:
        for status, count in df["status"].value_counts().items():
            print(f"  {status:20s}: {count}")
    if "score" in df.columns and df["score"].sum() > 0:
        print(f"\n  Score médio     : {df['score'].mean():.1f}")
        print(f"  Score máximo    : {df['score'].max():.1f}")
    if "rating" in df.columns:
        rated = lidos[lidos["rating"] > 0] if len(lidos) else pd.DataFrame()
        if len(rated):
            print(f"  Nota média      : {rated['rating'].mean():.2f}/5")
    print()


def plot_monthly_pattern(lidos: pd.DataFrame) -> None:
    if "date_read" not in lidos.columns or lidos["date_read"].notna().sum() == 0:
        return
    print("📅 Padrão de leitura por mês...")
    monthly = (
        lidos.groupby(lidos["date_read"].dt.to_period("M"))
        .size()
        .reset_index(name="count")
    )
    monthly["month_str"] = monthly["date_read"].astype(str)
    fig, ax = plt.subplots(figsize=(14, 5))
    ax.bar(monthly["month_str"], monthly["count"], color="#7c3aed", alpha=0.85)
    ax.set_title("Livros Lidos por Mês", fontsize=14, fontweight="bold")
    ax.set_xlabel("Mês")
    ax.set_ylabel("Livros")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    save(fig, "01_leitura_por_mes.png")


def plot_class_distribution(df: pd.DataFrame, lidos: pd.DataFrame) -> None:
    if "book_class" not in df.columns:
        return
    print("📚 Distribuição por classe...")
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    for ax, data, title, color in [
        (axes[0], df, "Total por Classe", "#7c3aed"),
        (axes[1], lidos, "Lidos por Classe", "#10b981"),
    ]:
        counts = data["book_class"].value_counts()
        ax.barh(counts.index, counts.values, color=color, alpha=0.8)
        ax.set_title(title, fontweight="bold")
        ax.set_xlabel("Livros")
    plt.tight_layout()
    save(fig, "02_distribuicao_por_classe.png")


def plot_score_per_class(df: pd.DataFrame) -> None:
    if "score" not in df.columns or "book_class" not in df.columns:
        return
    if df["score"].sum() == 0:
        return
    print("📊 Score médio por classe...")
    score_class = (
        df[df["score"] > 0].groupby("book_class")["score"].agg(["mean", "count"])
    )
    score_class = score_class[score_class["count"] >= 2].sort_values("mean")
    if score_class.empty:
        return
    fig, ax = plt.subplots(figsize=(10, 6))
    bars = ax.barh(score_class.index, score_class["mean"], color="#f59e0b", alpha=0.85)
    ax.bar_label(bars, fmt="%.1f", padding=3)
    ax.set_title("Score Médio por Classe (mín. 2 livros)", fontweight="bold")
    ax.set_xlabel("Score Médio")
    plt.tight_layout()
    save(fig, "03_score_por_classe.png")


def plot_rating_vs_score(lidos: pd.DataFrame) -> None:
    if "rating" not in lidos.columns or "score" not in lidos.columns:
        return
    valid = lidos[(lidos["rating"] > 0) & (lidos["score"] > 0)]
    if len(valid) < 5:
        return
    print("⭐ Nota pessoal vs Score calculado...")
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
    z = np.polyfit(valid["score"], valid["rating"], 1)
    x_line = np.linspace(valid["score"].min(), valid["score"].max(), 100)
    ax.plot(
        x_line, np.poly1d(z)(x_line), "--", color="gray", alpha=0.6, label="Tendência"
    )
    ax.set_title("Nota Pessoal vs Score Calculado", fontweight="bold")
    ax.set_xlabel("Score")
    ax.set_ylabel("Nota (1-5)")
    ax.legend(bbox_to_anchor=(1.05, 1), loc="upper left", fontsize=9)
    plt.tight_layout()
    save(fig, "04_nota_vs_score.png")


def _plot_clusters(
    coords: np.ndarray, labels: np.ndarray, titles: pd.Series, k: int, pca: PCA
) -> plt.Figure:
    fig, ax = plt.subplots(figsize=(10, 7))
    colors = cm.tab10(np.linspace(0, 1, k))
    for i in range(k):
        mask = labels == i
        ax.scatter(
            coords[mask, 0],
            coords[mask, 1],
            label=f"Grupo {i+1}",
            color=colors[i],
            s=100,
            alpha=0.8,
        )
        for x, y, t in zip(coords[mask, 0], coords[mask, 1], titles[mask]):
            ax.annotate(
                str(t)[:20],
                (x, y),
                fontsize=6,
                alpha=0.7,
                xytext=(4, 4),
                textcoords="offset points",
            )
    ax.set_title(f"Clustering (K={k}) — PCA 2D", fontweight="bold")
    ax.set_xlabel(f"PC1 ({pca.explained_variance_ratio_[0]*100:.0f}%)")
    ax.set_ylabel(f"PC2 ({pca.explained_variance_ratio_[1]*100:.0f}%)")
    ax.legend()
    plt.tight_layout()
    return fig


def plot_clusters(df: pd.DataFrame) -> None:
    X = encode_features(
        df,
        cat_cols=["book_class", "category", "status"],
        num_cols=["score", "year", "rating"],
    )
    if X.size == 0 or len(df) < 6:
        print("   ⚠️ Dados insuficientes para clustering (mín. 6 livros)\n")
        return
    print("🔵 Clustering K-Means + PCA...")
    k = min(4, len(df) // 3)
    labels = KMeans(n_clusters=k, random_state=42, n_init=10).fit_predict(X)
    pca = PCA(n_components=2)
    coords = pca.fit_transform(X)
    titles = df["title"] if "title" in df.columns else pd.Series(range(len(df)))
    fig = _plot_clusters(coords, labels, titles, k, pca)
    save(fig, "05_clusters_pca.png")
    print("\n  Perfil dos clusters:")
    for i in range(k):
        grupo = df[labels == i]
        top = (
            grupo["book_class"].value_counts().index[0]
            if "book_class" in grupo.columns
            else "?"
        )
        print(f"  Grupo {i+1}: {len(grupo)} livros | Classe dominante: {top}")
    print()


def recommend(df: pd.DataFrame) -> None:
    if "rating" not in df.columns or "status" not in df.columns:
        return
    lidos_top = df[(df["status"] == "Lido") & (df["rating"] >= 4)]
    fila = df[df["status"] == "A Ler"]
    if len(lidos_top) < 3 or len(fila) < 3:
        print("   ⚠️ Poucos dados para recomendação (mín. 3 lidos nota≥4 e 3 na fila)\n")
        return
    combined = pd.concat([lidos_top, fila], ignore_index=True)
    X = encode_features(
        combined, cat_cols=["book_class", "category", "type"], num_cols=[]
    )
    if X.size == 0:
        return
    k = min(5, len(fila))
    nn = NearestNeighbors(n_neighbors=k, metric="euclidean").fit(X[: len(lidos_top)])
    query = X[: len(lidos_top)].mean(axis=0).reshape(1, -1)
    _, indices = nn.kneighbors(query)
    print("🎯 Recomendações (baseado nos lidos com nota ≥ 4):")
    for idx in indices[0]:
        book = combined.iloc[int(idx)]
        print(f"   → {book.get('title', '?')} [{book.get('book_class', '?')}]")
    print()


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

    # Carrega backend/.env automaticamente (tem SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY)
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
            print("  Supabase vazio ou erro — usando CSV local como fallback.\n")
            df_raw = load_from_csv()
    elif token:
        df_raw = load_from_api(api_url, token)
    else:
        print("⚠️  Nenhuma credencial encontrada — usando CSV local.\n")
        df_raw = load_from_csv()

    df = clean(df_raw)
    validate_columns(df)
    lidos = df[df["status"] == "Lido"].copy() if "status" in df.columns else df.copy()

    print_overview(df, lidos)
    plot_monthly_pattern(lidos)
    plot_class_distribution(df, lidos)
    plot_score_per_class(df)
    plot_rating_vs_score(lidos)
    plot_clusters(df)
    recommend(df)

    print("=" * 55)
    print(f"  Gráficos em: {OUTPUT_DIR.resolve()}")
    print("=" * 55)


if __name__ == "__main__":
    main()
