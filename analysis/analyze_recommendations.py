import math
from datetime import datetime, timezone

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import LabelEncoder
from utils import log, save_plot

LAMBDA = 0.4
NEG_BETA = 0.35


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


def _build_heuristic_profile(source_books, is_pos):
    clsF, catF, typF, authF = {}, {}, {}, {}
    for b in source_books:
        w = _temporal_weight(b.get("date_read"), b.get("rating"), is_pos)

        c = str(b.get("book_class") or "?")
        clsF[c] = clsF.get(c, 0) + w

        cat = str(b.get("category") or "?")
        catF[cat] = catF.get(cat, 0) + w

        typ = str(b.get("type") or "?")
        typF[typ] = typF.get(typ, 0) + w

        aut = str(b.get("author") or "?")
        authF[aut] = authF.get(aut, 0) + w

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


def _run_heuristic(fila, lidos_pos, lidos_neg):
    max_queue_score = max([float(b.get("score") or 0) for b in fila] + [1.0])
    p_pos = _build_heuristic_profile(lidos_pos, True)
    p_neg = _build_heuristic_profile(lidos_neg, False) if lidos_neg else None

    def calc_heur_sim(b, p):
        if not p:
            return 0
        cls = p["clsF"].get(str(b.get("book_class")), 0) / p["maxCls"]
        cat = p["catF"].get(str(b.get("category")), 0) / p["maxCat"]
        typ = p["typF"].get(str(b.get("type")), 0) / p["maxTyp"]
        aut = p["authF"].get(str(b.get("author")), 0) / p["maxAuth"]
        scr = (
            float(b.get("score") or 0) / max_queue_score
            if float(b.get("score") or 0) > 0
            else 0.5
        )
        return cls * 0.35 + cat * 0.25 + typ * 0.13 + aut * 0.12 + scr * 0.15

    for b in fila:
        s_pos = calc_heur_sim(b, p_pos)
        s_neg = calc_heur_sim(b, p_neg) if p_neg else 0
        adj = s_pos - 0.35 * s_neg
        b["heur_score"] = max(1, min(100, round(adj * 100)))

    return sorted(fila, key=lambda x: x["heur_score"], reverse=True)


def _build_knn_features(combined):
    import pandas as pd

    def _encode_col(col):
        vals = [
            str(d.get(col)) if not pd.isna(d.get(col)) and d.get(col) else "?"
            for d in combined
        ]
        return LabelEncoder().fit_transform(vals).astype(float)

    def _encode_num(col):
        vals = np.array(
            [
                float(d.get(col)) if not pd.isna(d.get(col)) and d.get(col) else 0.0
                for d in combined
            ]
        )
        std = vals.std()
        return (vals - vals.mean()) / std if std > 0 else vals * 0

    parts = []
    for c_col in ["book_class", "category", "type"]:
        parts.append(_encode_col(c_col))
    for n_col in ["score", "year"]:
        parts.append(_encode_num(n_col))

    return np.column_stack(parts)


def _compute_centroid(X_group, books_group, positive):
    ws = np.array(
        [
            _temporal_weight(b.get("date_read"), b.get("rating"), positive)
            for b in books_group
        ]
    )
    return (X_group * (ws / ws.sum())[:, np.newaxis]).sum(axis=0).reshape(1, -1)


def _calculate_knn_scores(fila, X_fila, prof_pos, prof_neg):
    k_nn = min(len(fila), 30)
    nn_pos = NearestNeighbors(n_neighbors=k_nn, metric="euclidean").fit(X_fila)
    d_pos, i_pos = nn_pos.kneighbors(prof_pos)

    neg_d_map = {}
    if prof_neg is not None:
        nn_neg = NearestNeighbors(n_neighbors=len(fila), metric="euclidean").fit(X_fila)
        d_neg_all, i_neg_all = nn_neg.kneighbors(prof_neg)
        for di, ii in zip(d_neg_all[0], i_neg_all[0]):
            neg_d_map[int(ii)] = float(di)

    min_p = d_pos[0].min() if len(d_pos[0]) > 0 else 0.0
    max_p = d_pos[0].max() if len(d_pos[0]) > 0 else 1.0
    range_p = max_p - min_p if max_p > min_p else 1.0

    min_n = min(neg_d_map.values()) if neg_d_map else 0.0
    max_n = max(neg_d_map.values()) if neg_d_map else 1.0
    range_n = max_n - min_n if max_n > min_n else 1.0

    for idx, d_p in zip(i_pos[0], d_pos[0]):
        # Normaliza a distância entre 0 (mais próximo ao Cntrd) e 1 (mais longe do Top 30)
        norm_d_p = (d_p - min_p) / range_p
        # Transforma pro mundo Similarity. Pior caso é similaridade 10%. Melhor caso é 100%.
        sim_p = 1.0 - (norm_d_p * 0.90)

        sim_n = 0.0
        if prof_neg is not None and idx in neg_d_map:
            d_n = neg_d_map.get(idx, max_n)
            norm_d_n = (d_n - min_n) / range_n
            sim_n = 1.0 - (norm_d_n * 0.90)

        adj = sim_p - NEG_BETA * sim_n
        fila[int(idx)]["knn_score"] = max(1, min(100, round(adj * 100)))

    for b in fila:
        if "knn_score" not in b:
            # Fora do range do top K vizinhos? Score base = 1
            b["knn_score"] = 1

    return sorted(fila, key=lambda x: x["knn_score"], reverse=True)


def _run_knn(fila, lidos_pos, lidos_neg):
    combined = lidos_pos + lidos_neg + fila
    X = _build_knn_features(combined)

    n_pos = len(lidos_pos)
    n_neg = len(lidos_neg)
    X_pos = X[:n_pos]
    X_neg = X[n_pos : n_pos + n_neg] if n_neg > 0 else None
    X_fila = X[n_pos + n_neg :]

    prof_pos = _compute_centroid(X_pos, lidos_pos, True)
    prof_neg = _compute_centroid(X_neg, lidos_neg, False) if X_neg is not None else None

    return _calculate_knn_scores(fila, X_fila, prof_pos, prof_neg)


def _plot_recommendations(fila_heur, fila_knn, lidos_pos_len, lidos_neg_len):
    log.info("=" * 60)
    log.info(
        f"TOP 10: ALGORITMO HEURÍSTICO (JS) | {lidos_pos_len} lidos-pos, {lidos_neg_len} lidos-neg"
    )
    log.info("-" * 60)
    for i, b in enumerate(fila_heur[:10]):
        log.info(
            f" {i+1:2d} | {b['heur_score']:3d}% | {b.get('title')[:30]:30s} | {b.get('book_class')}"
        )

    log.info("=" * 60)
    log.info("TOP 10: ALGORITMO KNN (Backend API)")
    log.info("-" * 60)
    for i, b in enumerate(fila_knn[:10]):
        log.info(
            f" {i+1:2d} | {b['knn_score']:3d}% | {b.get('title')[:30]:30s} | {b.get('book_class')}"
        )
    log.info("=" * 60)

    fig, axes = plt.subplots(1, 2, figsize=(16, 6))

    def plot_bins(ax, scores, title, color):
        bins = [0] * 10
        for s in scores:
            if s > 0:
                bins[min(9, int((s - 1) // 10))] += 1
        labels = [f"{i*10+1}-{i*10+10}%" for i in range(10)]
        ax.barh(labels, bins, color=color)
        ax.set_title(title, fontweight="bold")
        for i, v in enumerate(bins):
            if v > 0:
                ax.text(v + 0.1, i, str(v), va="center", fontsize=9)

    scores_heur = [b["heur_score"] for b in fila_heur]
    scores_knn = [b["knn_score"] for b in fila_knn]

    plot_bins(
        axes[0],
        scores_heur,
        "Distribuição — Algoritmo Heurístico (Pesos Fixos)",
        "royalblue",
    )
    plot_bins(
        axes[1], scores_knn, "Distribuição — Algoritmo KNN (IA Backend)", "fuchsia"
    )

    plt.suptitle(
        "Comparação de Algoritmos de Recomendação — Fila 'A Ler'",
        fontsize=14,
        fontweight="bold",
    )
    plt.tight_layout()
    save_plot(fig, "05_recomendações_comparacao.png")


def analyze_recommendations(df: pd.DataFrame) -> None:
    if (
        "rating" not in df.columns
        or "status" not in df.columns
        or "title" not in df.columns
    ):
        log.warning("[Rec] Colunas necessárias ('rating', 'status', 'title') ausentes.")
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

    fila_heur = _run_heuristic(fila, lidos_pos, lidos_neg)
    fila_knn = _run_knn(fila, lidos_pos, lidos_neg)

    _plot_recommendations(fila_heur, fila_knn, len(lidos_pos), len(lidos_neg))


if __name__ == "__main__":
    from utils import get_df

    df_base = get_df()
    if not df_base.empty:
        analyze_recommendations(df_base)
