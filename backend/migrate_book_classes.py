"""
Script para migrar dados existentes e popular o campo book_class
Execução: python migrate_book_classes.py
"""

from sqlmodel import Session, select
from database import engine
from models import Book
from utils import get_class_from_category

def migrate_book_classes():
    """Popula o campo book_class baseado na category existente."""
    
    with Session(engine) as session:
        # Busca todos os livros
        books = session.exec(select(Book)).all()
        total = len(books)
        
        print(f"📚 Encontrados {total} livros no banco de dados")
        print("🔄 Populando campo 'book_class'...\n")
        
        updated_count = 0
        class_distribution = {}
        
        for i, book in enumerate(books, 1):
            # Determina a classe baseada na categoria
            book_class = get_class_from_category(book.category)
            
            # Atualiza o livro
            book.book_class = book_class
            session.add(book)
            
            # Contabiliza distribuição
            class_distribution[book_class] = class_distribution.get(book_class, 0) + 1
            
            updated_count += 1
            
            if i % 50 == 0:
                print(f"Processados: {i}/{total}")
        
        # Commit todas as mudanças
        session.commit()
        
        print("\n" + "="*60)
        print("📊 RESUMO DA MIGRAÇÃO")
        print("="*60)
        print(f"✅ Livros atualizados: {updated_count}")
        print("\n📈 Distribuição por Classe:")
        for book_class, count in sorted(class_distribution.items(), key=lambda x: x[1], reverse=True):
            print(f"  • {book_class}: {count} livros")
        print("="*60)
        
        print("\n🎉 Migração concluída com sucesso!")
        print("Todos os livros agora têm uma classe atribuída.")

if __name__ == "__main__":
    print("🚀 Iniciando migração de classes...\n")
    migrate_book_classes()
