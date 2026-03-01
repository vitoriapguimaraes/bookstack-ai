import matplotlib.cm as cm
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from utils import log, save_plot


def plot_rating_vs_score(lidos: pd.DataFrame) -> None:
    """Gera gráfico de dispersão comparando a Nota Pessoal com o Score Calculado."""
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
                sub["score"],
                sub["rating"],
                label=cls[:25],
                color=color,
                s=80,
                alpha=0.75,
            )
    else:
        ax.scatter(valid["score"], valid["rating"], color="#7c3aed", s=80, alpha=0.75)

    # Linha de tendência
    if len(valid) >= 2:
        try:
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
        except Exception as e:
            log.debug("Aviso ao tentar gerar linha de tendência: %s", e)

    ax.set_title("Nota Pessoal × Score Calculado", fontweight="bold")
    ax.set_xlabel("Score (calculado pelo app)")
    ax.set_ylabel("Nota Pessoal (1–5)")
    ax.legend(bbox_to_anchor=(1.05, 1), loc="upper left", title="Classes")

    plt.tight_layout()
    save_plot(fig, "01_nota_vs_score.png")


if __name__ == "__main__":
    from utils import get_df

    df_base = get_df()
    if not df_base.empty:
        lidos_base = (
            df_base[df_base["status"] == "Lido"].copy()
            if "status" in df_base.columns
            else df_base
        )
        plot_rating_vs_score(lidos_base)
