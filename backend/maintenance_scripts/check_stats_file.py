import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from sqlmodel import Session, select, func
from database import engine
from models import Book
import logging

# Suppress logs aggressively
logging.basicConfig(level=logging.CRITICAL)

def check_stats():
    try:
        with Session(engine) as session:
            total = session.exec(select(func.count(Book.id))).one()
            with_orig = session.exec(select(func.count(Book.id)).where(Book.original_title != None).where(Book.original_title != "")).one()
            
            output = f"""
--- Estatísticas ---
Total de Livros: {total}
Com Título Original: {with_orig}
Faltando: {total - with_orig}
Progresso: {(with_orig/total)*100:.1f}%
"""
            with open("stats_output.txt", "w", encoding="utf-8") as f:
                f.write(output)
            print("Stats written to stats_output.txt")
            
    except Exception as e:
        with open("stats_output.txt", "w", encoding="utf-8") as f:
            f.write(f"Error: {str(e)}")

if __name__ == "__main__":
    check_stats()
