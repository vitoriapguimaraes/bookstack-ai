"""
Análise Comparativa de Algoritmos de Recomendação
===================================================

Três algoritmos são comparados:
  A — Heurístico (pesos fixos, normalizado pelo teto real do perfil)
  B — KNN por votação (cada livro lido positivo vota nos k vizinhos mais próximos)
  C — Classificador (Random Forest treinado nos livros lidos, prediz P(gostar))
"""

import math
from datetime import datetime, timezone

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import LabelEncoder
from utils import get_df, log, save_plot

LAMBDA = 0.4
NEG_BETA = 0.35

# ─── helpers compartilhados ────────────────────────────────────────────────────


def _temporal_weight(date_read, rating, positive=True):
    if positive:
        rating_w = 2.0 if rating >= 5 else 1.0
    else:
        rating_w = {1: 2.0, 2: 1.5, 3: 0.5}.get(int(rating), 1.0)
    if pd.isna(date_read) or not str(date_read).strip():
        return rating_w * math.exp(-LAMBDA * 10)
    try:
        ds = str(date_read)[:10]
        dt = datetime.fromisoformat(ds).replace(tzinfo=timezone.utc)
        years_ago = (datetime.now(timezone.utc) - dt).days / 365.25
    except (ValueError, TypeError):
        years_ago = 10.0
    return rating_w * math.exp(-LAMBDA * years_ago)


def _safe_str(val):
    return str(val) if not pd.isna(val) and val else "?"


def _safe_float(val):
    try:
        f = float(val)
        return f if not math.isnan(f) else 0.0
    except (TypeError, ValueError):
        return 0.0


def _years_since_read(b):
    """Retorna quantos anos faz desde que o livro foi lido (feature de recência)."""
    dr = b.get("date_read")
    if dr is None or (isinstance(dr, float) and math.isnan(dr)):
        return 10.0  # valor alto = leitura antiga
    try:
        ds = str(dr)[:10]
        dt = datetime.fromisoformat(ds).replace(tzinfo=timezone.utc)
        return (datetime.now(timezone.utc) - dt).days / 365.25
    except (ValueError, TypeError):
        return 10.0


def _encode_features(books, include_years_since_read=False):
    """Encoda livros numa matriz numérica normalizada para uso em ML/KNN."""
    cat_cols = ["book_class", "category", "type"]
    num_cols = ["score", "year"]
    encoders = {}
    parts = []
    for col in cat_cols:
        vals = [_safe_str(b.get(col)) for b in books]
        le = LabelEncoder()
        parts.append(le.fit_transform(vals).astype(float))
        encoders[col] = le
    for col in num_cols:
        vals = np.array([_safe_float(b.get(col)) for b in books])
        std = vals.std()
        parts.append((vals - vals.mean()) / std if std > 0 else vals * 0)
    if include_years_since_read:
        vals = np.array([_years_since_read(b) for b in books])
        std = vals.std()
        parts.append((vals - vals.mean()) / std if std > 0 else vals * 0)
    return np.column_stack(parts), encoders


# ─── Algoritmo A: Heurístico Normalizado ──────────────────────────────────────


def _build_heuristic_profile(source_books, is_pos):
    clsF, catF, typF, authF = {}, {}, {}, {}
    for b in source_books:
        w = _temporal_weight(b.get("date_read"), b.get("rating"), is_pos)
        for key, field in [
            ("clsF", "book_class"),
            ("catF", "category"),
            ("typF", "type"),
            ("authF", "author"),
        ]:
            v = _safe_str(b.get(field))
            locals()[key]  # just to avoid unused var warning
            d = {"clsF": clsF, "catF": catF, "typF": typF, "authF": authF}
            d[key][v] = d[key].get(v, 0) + w
    return {
        "clsF": clsF,
        "catF": catF,
        "typF": typF,
        "authF": authF,
        "maxCls": max(list(clsF.values()) + [1]),
        "maxCat": max(list(catF.values()) + [1]),
        "maxTyp": max(list(typF.values()) + [1]),
        "maxAuth": max(list(authF.values()) + [1]),
    }


def _run_algo_a(fila, lidos_pos, lidos_neg):
    """Heurístico com normalização relativa: top-1 → 95%."""
    max_queue_score = max([_safe_float(b.get("score")) for b in fila] + [1.0])
    p_pos = _build_heuristic_profile(lidos_pos, True)
    p_neg = _build_heuristic_profile(lidos_neg, False) if lidos_neg else None

    def sim(b, p):
        if not p:
            return 0
        cls = p["clsF"].get(_safe_str(b.get("book_class")), 0) / p["maxCls"]
        cat = p["catF"].get(_safe_str(b.get("category")), 0) / p["maxCat"]
        typ = p["typF"].get(_safe_str(b.get("type")), 0) / p["maxTyp"]
        aut = p["authF"].get(_safe_str(b.get("author")), 0) / p["maxAuth"]
        scr = (
            _safe_float(b.get("score")) / max_queue_score
            if _safe_float(b.get("score")) > 0
            else 0.5
        )
        return cls * 0.35 + cat * 0.25 + typ * 0.13 + aut * 0.12 + scr * 0.15

    raw = []
    for b in fila:
        s_pos = sim(b, p_pos)
        s_neg = sim(b, p_neg) if p_neg else 0
        raw.append(max(0.0, s_pos - NEG_BETA * s_neg))

    # Normalização relativa: estica o range real para 10%–95%
    lo, hi = min(raw), max(raw)
    span = hi - lo if hi > lo else 1.0
    for b, r in zip(fila, raw):
        b["score_a"] = max(1, min(100, round(((r - lo) / span) * 85 + 10)))

    return sorted(fila, key=lambda x: x["score_a"], reverse=True)


# ─── Algoritmo B: KNN por Votação ─────────────────────────────────────────────


def _run_algo_b(fila, lidos_pos, lidos_neg):
    """Cada livro lido-positivo vota nos seus k vizinhos na fila; penalidade por negativo."""
    all_books = lidos_pos + lidos_neg + fila
    X, _ = _encode_features(all_books)

    n_pos = len(lidos_pos)
    n_neg = len(lidos_neg)
    X_pos = X[:n_pos]
    X_neg = X[n_pos : n_pos + n_neg] if n_neg > 0 else None
    X_fila = X[n_pos + n_neg :]

    if len(fila) == 0:
        return fila

    k = min(10, len(fila))
    votes = np.zeros(len(fila))

    # Cada lido-positivo contribui ponderado pelo peso temporal
    nn = NearestNeighbors(n_neighbors=k, metric="euclidean").fit(X_fila)
    for i, b in enumerate(lidos_pos):
        w = _temporal_weight(b.get("date_read"), b.get("rating"), True)
        dists, idxs = nn.kneighbors(X_pos[i : i + 1])
        max_d = dists[0].max() if dists[0].max() > 0 else 1.0
        for d, idx in zip(dists[0], idxs[0]):
            votes[idx] += w * (1.0 - d / max_d)

    # Cada lido-negativo penaliza ponderado pelo peso
    penalty = np.zeros(len(fila))
    if X_neg is not None:
        for i, b in enumerate(lidos_neg):
            w = _temporal_weight(b.get("date_read"), b.get("rating"), False)
            dists, idxs = nn.kneighbors(X_neg[i : i + 1])
            max_d = dists[0].max() if dists[0].max() > 0 else 1.0
            for d, idx in zip(dists[0], idxs[0]):
                penalty[idx] += w * (1.0 - d / max_d)

    raw = votes - NEG_BETA * penalty
    lo, hi = raw.min(), raw.max()
    span = hi - lo if hi > lo else 1.0
    for b, r in zip(fila, raw):
        b["score_b"] = max(1, min(100, round(((r - lo) / span) * 85 + 10)))

    return sorted(fila, key=lambda x: x["score_b"], reverse=True)


# ─── Algoritmo C: Classificador (Random Forest) ───────────────────────────────


def _apply_diversity(fila_sorted, max_per_class=3, pool=40):
    """Garante diversidade no top-10: máximo `max_per_class` livros por classe nos primeiros `pool`."""
    top_pool = fila_sorted[:pool]
    rest = fila_sorted[pool:]
    counts = {}
    chosen = []
    skipped = []
    for b in top_pool:
        cls = b.get("book_class") or "?"
        if counts.get(cls, 0) < max_per_class:
            chosen.append(b)
            counts[cls] = counts.get(cls, 0) + 1
        else:
            skipped.append(b)
    return chosen + skipped + rest


def _run_algo_c(fila, lidos_pos, lidos_neg):
    """Treina RF nos livros lidos; prediz P(gostar) para a fila.
    Features incluem classe, categoria, tipo, score, ano e recencia da leitura."""
    lidos = lidos_pos + lidos_neg
    if len(lidos) < 4:
        log.warning(
            "[C] Livros lidos insuficientes para treinar classificador (min. 4)."
        )
        for b in fila:
            b["score_c"] = 50
        return sorted(fila, key=lambda x: x["score_c"], reverse=True)

    all_books = lidos + fila
    # include_years_since_read=True: o RF aprende que leituras recentes predizem preferencias atuais
    X_all, _ = _encode_features(all_books, include_years_since_read=True)
    X_lidos = X_all[: len(lidos)]
    X_fila = X_all[len(lidos) :]

    y = np.array([1 if b in lidos_pos else 0 for b in lidos])

    # Pesos temporais: leituras recentes e bem avaliadas pesam mais no treino
    sample_weights = np.array(
        [
            _temporal_weight(b.get("date_read"), b.get("rating"), b in lidos_pos)
            for b in lidos
        ]
    )
    sample_weights /= sample_weights.sum()

    clf = RandomForestClassifier(
        n_estimators=300,
        max_depth=5,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42,
    )
    clf.fit(X_lidos, y, sample_weight=sample_weights)

    probs = clf.predict_proba(X_fila)[:, 1]

    lo, hi = probs.min(), probs.max()
    span = hi - lo if hi > lo else 1.0
    for b, p in zip(fila, probs):
        b["score_c"] = max(1, min(100, round(((p - lo) / span) * 85 + 10)))

    feature_names = ["Classe", "Categoria", "Tipo", "Score", "Ano", "AnosDesde"]
    importances = sorted(
        zip(feature_names, clf.feature_importances_), key=lambda x: -x[1]
    )
    log.info(
        "[C] Importancia das features RF: %s",
        ", ".join(f"{n}={v:.2f}" for n, v in importances),
    )

    fila_sorted = sorted(fila, key=lambda x: x["score_c"], reverse=True)
    return _apply_diversity(fila_sorted, max_per_class=3, pool=40)


# ─── Logging dos Top 10 ───────────────────────────────────────────────────────


def _log_top10(label, books, score_key):
    log.info("=" * 62)
    log.info("TOP 10: %s", label)
    log.info("-" * 62)
    for i, b in enumerate(books[:10]):
        log.info(
            " %2d | %3d%% | %-30s | %s",
            i + 1,
            b.get(score_key, 0),
            str(b.get("title") or "")[:30],
            b.get("book_class") or "?",
        )
    log.info("=" * 62)


# ─── Plot comparativo ─────────────────────────────────────────────────────────


def _plot_all(fila_a, fila_b, fila_c):
    fig, axes = plt.subplots(1, 3, figsize=(20, 7))

    configs = [
        (
            fila_a,
            "score_a",
            "Heurístico Normalizado (A)\nPesos fixos + escala relativa",
            "steelblue",
        ),
        (
            fila_b,
            "score_b",
            "KNN por Votação (B)\nCada lido vota nos k vizinhos",
            "darkorange",
        ),
        (
            fila_c,
            "score_c",
            "Classificador RF (C) [recomendado]\nRF + Recencia + Diversidade",
            "mediumorchid",
        ),
    ]

    def plot_bins(ax, fila, score_key, title, color):
        bins = [0] * 10
        for b in fila:
            s = b.get(score_key, 1)
            bins[min(9, (s - 1) // 10)] += 1
        labels = [f"{i*10+1}–{i*10+10}%" for i in range(10)]
        bars = ax.barh(labels, bins, color=color, alpha=0.85)
        ax.set_title(title, fontweight="bold", fontsize=10)
        ax.set_xlabel("Livros na fila")
        for bar, v in zip(bars, bins):
            if v > 0:
                ax.text(
                    v + 0.2,
                    bar.get_y() + bar.get_height() / 2,
                    str(v),
                    va="center",
                    fontsize=9,
                )

    for ax, (fila, key, title, color) in zip(axes, configs):
        plot_bins(ax, fila, key, title, color)

    plt.suptitle(
        "Comparação de 3 Algoritmos de Recomendação — Distribuição da Fila 'A Ler'",
        fontsize=13,
        fontweight="bold",
    )
    plt.tight_layout()
    save_plot(fig, "05_recomendações_comparacao.png")


# ─── Pipeline Principal ───────────────────────────────────────────────────────


def analyze_recommendations(df: pd.DataFrame) -> None:
    needed = {"rating", "status", "title"}
    if not needed.issubset(df.columns):
        log.warning("[Rec] Colunas ausentes: %s", needed - set(df.columns))
        return

    books = df.to_dict("records")
    lidos = [
        b
        for b in books
        if b.get("status") == "Lido"
        and not pd.isna(b.get("rating"))
        and int(b.get("rating")) > 0
    ]
    lidos_pos = [b for b in lidos if int(b.get("rating")) >= 4]
    lidos_neg = [b for b in lidos if int(b.get("rating")) < 4]
    fila = [b for b in books if b.get("status") == "A Ler"]

    if len(lidos_pos) < 2 or not fila:
        log.warning("[Rec] Livros insuficientes para recomendação.")
        return

    log.info(
        "[Rec] %d lidos-positivos, %d lidos-negativos, %d na fila",
        len(lidos_pos),
        len(lidos_neg),
        len(fila),
    )

    # Roda os 3 algoritmos (cada um opera numa cópia independente da fila)
    import copy

    fila_a = _run_algo_a(copy.deepcopy(fila), lidos_pos, lidos_neg)
    fila_b = _run_algo_b(copy.deepcopy(fila), lidos_pos, lidos_neg)
    fila_c = _run_algo_c(copy.deepcopy(fila), lidos_pos, lidos_neg)

    _log_top10("A | Heurístico Normalizado", fila_a, "score_a")
    _log_top10("B | KNN por Votação", fila_b, "score_b")
    _log_top10("C | Classificador Random Forest ★", fila_c, "score_c")

    _plot_all(fila_a, fila_b, fila_c)


if __name__ == "__main__":
    df_base = get_df()
    if not df_base.empty:
        analyze_recommendations(df_base)
