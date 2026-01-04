"""
Script para limpar valores vazios de 'order' e convertê-los para NULL
Execução: python fix_empty_orders.py
"""

from sqlmodel import Session, select
from database import engine
from models import Book

def fix_empty_orders():
    """Converte valores vazios de order para NULL."""
    
    with Session(engine) as session:
        # Busca todos os livros
        books = session.exec(select(Book)).all()
        
        fixed_count = 0
        
        for book in books:
            # Se order é string vazia, 0, ou qualquer valor "falsy", converte para None
            if book.order == "" or book.order == 0 or (isinstance(book.order, str) and book.order.strip() == ""):
                print(f"Fixing: {book.title} - order was: {repr(book.order)}")
                book.order = None
                session.add(book)
                fixed_count += 1
        
        # Commit todas as mudanças
        session.commit()
        
        print(f"\n✅ Fixed {fixed_count} books with empty order values")
        print("All empty orders are now NULL")

if __name__ == "__main__":
    print("🔧 Fixing empty order values...\n")
    fix_empty_orders()
