"""
Módulo de utilidades e configurações para as análises exploratórias.
"""

import os
import logging
import sys
from pathlib import Path
from dotenv import load_dotenv

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import requests
import seaborn as sns
from sklearn.preprocessing import LabelEncoder

# ── Configurações visuais ───────────────────────────────────────────────────
sns.set_theme(style="darkgrid", palette="muted")
plt.rcParams["figure.figsize"] = (12, 6)
plt.rcParams["font.size"] = 12

BASE_DIR = Path(__file__).parent.resolve()
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)
DATA_PATH = BASE_DIR / "data" / "biblioteca.csv"

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
    logger = logging.getLogger("bookstack_analysis")
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


# Instância global do logger para os módulos importarem
log = setup_logging()


# ── Carregamento de dados ───────────────────────────────────────────────────
def load_from_api(api_url: str, token: str) -> pd.DataFrame:
    url = api_url.rstrip("/") + "/books/"
    headers = {"Authorization": f"Bearer {token}"}
    log.info("Conectando à API")
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
        from supabase import create_client  # type: ignore
    except ImportError:
        log.warning("supabase não instalado. Execute: pip install supabase")
        return pd.DataFrame()
    log.info("Conectando ao Supabase")
    client = create_client(supabase_url, service_key)
    response = client.table("book").select("*").execute()
    books = response.data
    log.info("%d livros recebidos do Supabase", len(books))
    return pd.DataFrame(books)


def load_from_csv() -> pd.DataFrame:
    if not DATA_PATH.exists():
        log.error("Arquivo não encontrado: %s", DATA_PATH)
        log.error("Use o comando de dump do sqlite primeiro (ex: no main.py).")
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
def save_plot(fig: plt.Figure, name: str) -> None:
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


def get_df() -> pd.DataFrame:
    """Carrega as credenciais via .env e retorna o DataFrame limpo.
    Ideal para rodar scripts individualmente (sem depender do main.py)."""

    env_path = BASE_DIR.parent / "backend" / ".env"
    if env_path.exists():
        load_dotenv(env_path)
        supa_url = os.getenv("SUPABASE_URL")
        supa_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
            "SUPABASE_ANON_KEY"
        )
        if supa_url and supa_key:
            df_raw = load_from_supabase(supa_url, supa_key)
            if not df_raw.empty:
                df = clean(df_raw)
                validate_columns(df)
                return df

    log.error("Falha ao inicializar o banco pelo get_df(). Verifique o backend/.env.")
    return pd.DataFrame()
