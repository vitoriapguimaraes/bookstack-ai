"""
bookstack-ai — Análise Exploratória da Biblioteca (Runner Principal)
===================================================================

Um pacote modular para análise de dados do Bookstack.

Como executar localmente com CSV exportado ou de Dump:
  python main.py --local

Via API:
  python main.py --api http://localhost:8000 --token SEU_TOKEN

Dumps & Logs sairão na pasta `/output/`.
"""

import argparse

from analyze_overview import analyze_overview, analyze_score_per_class
from analyze_pca import plot_pca_clusters
from analyze_rating_score import plot_rating_vs_score
from analyze_recommendations import analyze_recommendations
from utils import (
    clean,
    load_from_api,
    load_from_csv,
    load_from_supabase,
    log,
    validate_columns,
)


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


def main():
    args = parse_args()
    log.info("Iniciando análises...")

    # Load Stage
    if args.local:
        df_raw = load_from_csv()
    elif args.api and args.token:
        df_raw = load_from_api(args.api, args.token)
    else:
        import os
        from pathlib import Path
        from dotenv import load_dotenv

        # Localiza o .env relativo a este arquivo main.py
        env_path = Path(__file__).resolve().parent.parent / "backend" / ".env"
        if env_path.exists():
            load_dotenv(env_path)
            supa_url = os.getenv("SUPABASE_URL")
            supa_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
                "SUPABASE_ANON_KEY"
            )
            if supa_url and supa_key:
                df_raw = load_from_supabase(supa_url, supa_key)
            else:
                log.error("Credenciais do Supabase não encontradas no .env")
                return
        else:
            log.error(f"Arquivo .env não encontrado em {env_path}")
            log.error("Nenhuma fonte de dados especificada (--local ou backend/.env)")
            return

    if df_raw.empty:
        log.warning("Nenhum dado retornado. Encerrando.")
        return

    # Clean Stage
    df = clean(df_raw)
    validate_columns(df)

    lidos = df[df["status"] == "Lido"].copy() if "status" in df.columns else df

    # Analytics Pipeline
    try:
        analyze_overview(df, lidos)
        analyze_score_per_class(df)
        plot_rating_vs_score(lidos)
        plot_pca_clusters(df)
        analyze_recommendations(df)
    except Exception as e:
        log.error("Falha durante o pipeline de analytics: %s", e, exc_info=True)

    log.info("Análises finalizadas! Verifique a pasta 'output/'.")


if __name__ == "__main__":
    main()
