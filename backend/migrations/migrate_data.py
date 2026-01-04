import pandas as pd
from sqlmodel import Session, select, delete, SQLModel
from database import engine, create_db_and_tables
from models import Book
import os
import unicodedata
import re

# Caminho relativo ao CWD (raiz do projeto) ou absoluto
CSV_PATH = r"original_streamlit_app\assets\data\Lista_Leitura_Completa - 2025_08.csv"
COVERS_DIR = "backend/static/covers"

def normalize_filename(title):
    # Remove acentos e caracteres especiais
    nfkd_form = unicodedata.normalize('NFKD', str(title))
    only_ascii = nfkd_form.encode('ASCII', 'ignore').decode('utf-8')
    # Substitui espaços e símbolos por _
    slug = re.sub(r'[^a-zA-Z0-9]', '_', only_ascii).lower()
    # Remove _ repetidos
    slug = re.sub(r'_+', '_', slug).strip('_')
    return slug

def parse_year(year_str):
    """Safely parse year, handling special cases like 'Séc. V a.C.'"""
    if pd.isna(year_str):
        return None
    try:
        return int(year_str)
    except (ValueError, TypeError):
        # Handle special cases like "Séc. V a.C." or empty strings
        return None

def migrate_csv():
    if not os.path.exists(CSV_PATH):
        print(f"Erro: CSV não encontrado em {CSV_PATH}")
        return

    print("Recriando tabelas (Schema Update)...")
    # Drop all tables to ensure schema matches models.py
    SQLModel.metadata.drop_all(engine)
    create_db_and_tables()

    print("Lendo CSV...")
    df = pd.read_csv(CSV_PATH)
    
    # Normalizar colunas
    df.columns = [c.strip() for c in df.columns]
    
    # Map column names from this CSV to our model fields
    # CSV columns: #, Título, Autor, Ano (pub.), Tipo, Prioridade, Status, Disponível em, Categoria, Motivação, i, minha opinião, Lido em
    
    with Session(engine) as session:
        print(f"Importando {len(df)} livros...")
        count = 0
        for _, row in df.iterrows():
            # Skip rows without title
            if pd.isna(row['Título']):
                continue
                
            # Tentar encontrar imagem da capa
            normalized_title = normalize_filename(row['Título'])
            cover_path = None
            for ext in ['jpg', 'png', 'jpeg']:
                 # Verifica se existe no sistema de arquivos (caminho relativo à execução do script)
                 if os.path.exists(os.path.join(COVERS_DIR, f"{normalized_title}.{ext}")):
                     cover_path = f"/static/covers/{normalized_title}.{ext}"
                     break

            book = Book(
                title=str(row['Título']),
                author=str(row['Autor']) if pd.notna(row['Autor']) else "Desconhecido",
                year=parse_year(row['Ano (pub.)']),
                type=str(row['Tipo']) if pd.notna(row['Tipo']) else "Não Técnico",
                priority=str(row['Prioridade']) if pd.notna(row['Prioridade']) else "1 - Baixa",
                status={0: 'Lido', 1: 'A Ler', 2: 'Lendo'}.get(int(row['Status\n(2 lendo, 1 a ler e 0 lido)']) if pd.notna(row['Status\n(2 lendo, 1 a ler e 0 lido)']) else 1, "A Ler"),
                availability=str(row['Disponível em']) if pd.notna(row['Disponível em']) else "Estante",
                category=str(row['Categoria']) if pd.notna(row['Categoria']) else "Geral",
                order=int(row['#']) if pd.notna(row['#']) else None,
                rating=int(row['minha opinião (1 a 5, amei)']) if pd.notna(row['minha opinião (1 a 5, amei)']) else None,
                date_read=str(row['Lido em']) if pd.notna(row['Lido em']) else None,
                score=float(row['i']) if pd.notna(row['i']) else 0.0,
                motivation=str(row['Motivação']) if pd.notna(row['Motivação']) else None,
                cover_image=cover_path
            )
            session.add(book)
            count += 1
            
        session.commit()
    print(f"Sucesso! {count} livros importados.")

if __name__ == "__main__":
    migrate_csv()
