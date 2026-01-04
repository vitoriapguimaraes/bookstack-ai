import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from sqlmodel import Session, select, func, col
from database import engine
from models import Book
import logging

# Suppress SQLAlchemy logs
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

def check_stats():
    with Session(engine) as session:
        total = session.exec(select(func.count(Book.id))).one()
        # Count non-null and non-empty
        with_orig = session.exec(select(func.count(Book.id)).where(Book.original_title != None).where(Book.original_title != "")).one()
        
        print(f"--- Estatísticas ---")
        print(f"Total de Livros: {total}")
        print(f"Com Título Original: {with_orig}")
        print(f"Faltando: {total - with_orig}")
        print(f"Progresso: {(with_orig/total)*100:.1f}%")

if __name__ == "__main__":
    check_stats()
