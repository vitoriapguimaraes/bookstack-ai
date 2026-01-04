"""
Script para popular google_rating usando busca híbrida
Tenta Google Books primeiro, depois Open Library
Execução: python populate_ratings_hybrid.py
"""

from sqlmodel import Session, select
from database import engine
from models import Book
from utils import get_hybrid_rating
import time

def populate_ratings_hybrid():
    """Busca e popula google_rating usando Google Books + Open Library."""
    
    with Session(engine) as session:
        # Busca apenas livros SEM rating ainda
        books = session.exec(
            select(Book).where(Book.google_rating.is_(None))
        ).all()
        
        if not books:
            print("✅ Todos os livros já têm rating!")
            return
        
        print(f"📚 Encontrados {len(books)} livros sem rating")
        print("🔍 Buscando em Google Books + Open Library...\n")
        
        google_count = 0
        openlibrary_count = 0
        not_found_count = 0
        
        for i, book in enumerate(books, 1):
            print(f"[{i}/{len(books)}] {book.title[:45]:45} ", end="")
            
            try:
                # Busca híbrida (Google Books + Open Library + Título Original)
                rating_data = get_hybrid_rating(
                    book.title, 
                    book.author,
                    book.original_title  # Tenta título original também
                )
                
                if rating_data:
                    book.google_rating = rating_data["average_rating"]
                    session.add(book)
                    
                    source = rating_data.get("source", "Unknown")
                    rating = rating_data["average_rating"]
                    count = rating_data.get("ratings_count", 0)
                    
                    # Emoji baseado na fonte
                    if "Google" in source:
                        emoji = "📗"
                    else:
                        emoji = "📚"
                    
                    # Indica se usou título original
                    if "Original" in source:
                        title_indicator = "🌐"
                    else:
                        title_indicator = "🇧🇷"
                    
                    print(f"✅ {rating:.1f}/5 {emoji} {title_indicator} {source}")
                    
                    if "Google" in source:
                        google_count += 1
                    else:
                        openlibrary_count += 1
                else:
                    print("⚪ Sem avaliação")
                    not_found_count += 1
                
                # Delay para não sobrecarregar as APIs
                time.sleep(0.7)  # Aumentado para 2 APIs
                
            except Exception as e:
                print(f"❌ Erro: {e}")
                not_found_count += 1
        
        # Commit todas as mudanças
        session.commit()
        
        print("\n" + "="*70)
        print("✅ ATUALIZAÇÃO HÍBRIDA CONCLUÍDA!")
        print("="*70)
        print(f"📗 Google Books: {google_count} livros")
        print(f"📚 Open Library: {openlibrary_count} livros")
        print(f"✅ Total com nota: {google_count + openlibrary_count}")
        print(f"⚪ Sem nota: {not_found_count}")
        print(f"📊 Total processado: {len(books)}")
        print(f"📈 Taxa de sucesso: {((google_count + openlibrary_count) / len(books) * 100):.1f}%")
        print("="*70)

if __name__ == "__main__":
    print("🚀 Iniciando busca HÍBRIDA de ratings...\n")
    print("📗 Fonte 1: Google Books API")
    print("📚 Fonte 2: Open Library API")
    print("\n⚠️  Isso pode demorar alguns minutos (0.7s por livro)")
    
    # Calcula livros sem rating
    with Session(engine) as session:
        count = session.exec(
            select(Book).where(Book.google_rating.is_(None))
        ).all()
        total = len(count)
        minutes = (total * 0.7) / 60
        print(f"⚠️  Tempo estimado: ~{minutes:.1f} minutos para {total} livros\n")
    
    input("Pressione ENTER para continuar...")
    populate_ratings_hybrid()
