import pandas as pd
from utils import log, get_df


def analyze_overview(df: pd.DataFrame, lidos: pd.DataFrame) -> None:
    """Análise estatística básica: contagem e scores gerais."""
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


def analyze_score_per_class(df: pd.DataFrame) -> None:
    """Analisa o score médio e performance por cada classe de livro."""
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


if __name__ == "__main__":
    df_base = get_df()
    if not df_base.empty:
        lidos_base = (
            df_base[df_base["status"] == "Lido"].copy()
            if "status" in df_base.columns
            else df_base
        )
        analyze_overview(df_base, lidos_base)
        analyze_score_per_class(df_base)
