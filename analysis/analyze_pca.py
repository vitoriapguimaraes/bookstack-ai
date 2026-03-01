import matplotlib.cm as cm
import matplotlib.lines as mlines
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from utils import encode_features, log, save_plot


def _build_pca_labels(df: pd.DataFrame, col: str) -> tuple[np.ndarray, list[str]]:
    """Converte coluna categórica em índice e retorna cores + legenda."""
    vals = df[col].fillna("?").values
    unique = sorted(set(vals))
    idx = np.array([unique.index(v) for v in vals])
    colors = cm.tab10(np.linspace(0, 1, len(unique)))
    return idx, unique, colors


def _build_custom_legend(unique_cls, cls_colors, idx, labels, k, markers) -> list:
    """Extrai a construção de legenda para resolver complexidade (flake8 C901)."""
    legend_elements = []

    # Seção de Classes (Cores)
    legend_elements.append(
        mlines.Line2D([], [], color="none", label="── CLASSES (Cores) ──")
    )
    for c_i, cls in enumerate(unique_cls):
        if np.any(idx == c_i):
            legend_elements.append(
                mlines.Line2D(
                    [0],
                    [0],
                    marker="o",
                    color="none",
                    label=cls[:25],
                    markerfacecolor=cls_colors[c_i],
                    markeredgecolor="white",
                    markersize=9,
                )
            )

    legend_elements.append(mlines.Line2D([], [], color="none", label=" "))

    # Seção de Grupos (Formatos)
    legend_elements.append(
        mlines.Line2D([], [], color="none", label="── GRUPOS (Formatos) ──")
    )
    for k_i in range(k):
        if np.any(labels == k_i):
            legend_elements.append(
                mlines.Line2D(
                    [0],
                    [0],
                    marker=markers[k_i],
                    color="none",
                    label=f"Grupo {k_i+1}",
                    markerfacecolor="gray",
                    markeredgecolor="white",
                    markersize=9,
                )
            )

    return legend_elements


def plot_pca_clusters(df: pd.DataFrame) -> None:
    """
    Realiza Análise de Componentes Principais (PCA) em 2D
    agrupada via algoritmos K-Means e plota.
    """
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

    fig, ax = plt.subplots(figsize=(14, 8))
    markers = ["o", "s", "^", "D", "P", "*", "v", "<", ">"]

    if "book_class" in df.columns:
        idx, unique_cls, cls_colors = _build_pca_labels(df, "book_class")
    else:
        unique_cls = ["Geral"]
        idx = np.zeros(len(df), dtype=int)
        cls_colors = ["steelblue"]

    for c_i, _ in enumerate(unique_cls):
        for k_i in range(k):
            mask = (idx == c_i) & (labels == k_i)
            if not np.any(mask):
                continue
            ax.scatter(
                coords[mask, 0],
                coords[mask, 1],
                color=cls_colors[c_i],
                marker=markers[k_i],
                s=100,
                alpha=0.8,
                edgecolors="white",
                linewidth=0.5,
            )

    # Montando Legenda Customizada via Helper Extracted
    legend_elements = _build_custom_legend(
        unique_cls, cls_colors, idx, labels, k, markers
    )

    ax.legend(
        handles=legend_elements, bbox_to_anchor=(1.02, 1), loc="upper left", fontsize=9
    )
    ax.set_xlabel(
        f"Componente Principal 1 ({pca.explained_variance_ratio_[0]*100:.0f}% variância extraída)"
    )
    ax.set_ylabel(
        f"Componente Principal 2 ({pca.explained_variance_ratio_[1]*100:.0f}% variância extraída)"
    )

    plt.suptitle(
        "PCA & K-Means Clusters — Espaço de Similaridade",
        fontsize=15,
        fontweight="bold",
    )
    ax.set_title(
        "Variáveis alimentando o modelo: Classe, Categoria, Status, Score, Ano e Avaliação (Rating)",
        fontsize=11,
        color="dimgray",
        pad=10,
    )

    plt.tight_layout()
    save_plot(fig, "02_pca_clusters.png")

    log.info("Perfil dos grupos K-Means:")
    for i in range(k):
        grupo = df[labels == i]
        top = (
            grupo["book_class"].value_counts().index[0]
            if "book_class" in grupo.columns and not grupo["book_class"].empty
            else "?"
        )
        log.info("  Grupo %d: %d livros | Classe dominante: %s", i + 1, len(grupo), top)


if __name__ == "__main__":
    from utils import get_df

    df_base = get_df()
    if not df_base.empty:
        plot_pca_clusters(df_base)
