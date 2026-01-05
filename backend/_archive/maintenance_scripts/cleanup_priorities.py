import sys
import os
from sqlmodel import Session, select

# Add parent dir to path to import models and database
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine
from models import Book

def cleanup_priorities():
    with Session(engine) as session:
        # Find all books that are 'Lido' but don't have 'Concluído' as priority
        statement = select(Book).where(Book.status == "Lido").where(Book.priority != "Concluído")
        books = session.exec(statement).all()
        
        print(f"Encontrei {len(books)} livros lidos com prioridade antiga. Atualizando...")
        
        for book in books:
            book.priority = "Concluído"
            session.add(book)
            
        session.commit()
        print("Concluído! Todos os livros lidos agora têm prioridade 'Concluído'.")

if __name__ == "__main__":
    cleanup_priorities()
