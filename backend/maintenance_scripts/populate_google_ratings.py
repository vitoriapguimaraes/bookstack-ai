"""
Script para popular google_rating de todos os livros existentes
Busca na API do Google Books e atualiza o banco de dados
Execução: python populate_google_ratings.py
"""

from sqlmodel import Session, select
from database import engine
from models import Book
from utils import get_google_books_data
import time

def populate_google_ratings():
    """Busca e popula google_rating para todos os livros."""
    
    with Session(engine) as session:
        # Busca todos os livros
        books = session.exec(select(Book)).all()
        
        print(f"📚 Encontrados {len(books)} livros")
        print("🔍 Buscando notas do Google Books...\n")
        
        updated_count = 0
        not_found_count = 0
        
        for i, book in enumerate(books, 1):
            print(f"[{i}/{len(books)}] {book.title[:50]:50} ", end="")
            
            try:
                # Busca dados do Google Books
                google_data = get_google_books_data(book.title)
                
                if google_data and google_data.get("average_rating"):
                    book.google_rating = google_data["average_rating"]
                    session.add(book)
                    print(f"✅ {google_data['average_rating']:.1f}/5")
                    updated_count += 1
                else:
                    print("⚪ Sem avaliação")
                    not_found_count += 1
                
                # Delay para não sobrecarregar a API
                time.sleep(0.5)
                
            except Exception as e:
                print(f"❌ Erro: {e}")
                not_found_count += 1
        
        # Commit todas as mudanças
        session.commit()
        
        print("\n" + "="*60)
        print("✅ ATUALIZAÇÃO CONCLUÍDA!")
        print("="*60)
        print(f"✅ Livros com nota: {updated_count}")
        print(f"⚪ Livros sem nota: {not_found_count}")
        print(f"📊 Total processado: {len(books)}")
        print("="*60)

if __name__ == "__main__":
    print("🚀 Iniciando busca de notas do Google Books...\n")
    print("⚠️  Isso pode demorar alguns minutos (0.5s por livro)")
    print("⚠️  Tempo estimado: ~2 minutos para 237 livros\n")
    
    input("Pressione ENTER para continuar...")
    populate_google_ratings()
