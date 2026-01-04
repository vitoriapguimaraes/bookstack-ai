"""
Script para atualizar URLs de capas existentes para versão thumbnail (menor resolução)
Execução: python update_to_thumbnails.py
"""

from sqlmodel import Session, select
from database import engine
from models import Book

def update_to_thumbnails():
    """Atualiza URLs existentes substituindo zoom=1 por zoom=0 (thumbnail)."""
    
    with Session(engine) as session:
        # Busca todos os livros com cover_image
        books = session.exec(select(Book).where(Book.cover_image != None)).all()
        total = len(books)
        
        print(f"📚 Encontrados {total} livros com capas")
        print("🔄 Atualizando para versão thumbnail (menor resolução)...\n")
        
        updated_count = 0
        
        for i, book in enumerate(books, 1):
            if book.cover_image and book.cover_image.startswith('http'):
                # Substitui zoom=1 por zoom=0 para thumbnail
                old_url = book.cover_image
                new_url = old_url.replace('zoom=1', 'zoom=0')
                
                if old_url != new_url:
                    book.cover_image = new_url
                    session.add(book)
                    updated_count += 1
                    print(f"[{i}/{total}] ✅ {book.title[:50]}")
                else:
                    print(f"[{i}/{total}] ⏭️  {book.title[:50]} (já é thumbnail)")
        
        # Commit todas as mudanças
        session.commit()
        
        print("\n" + "="*60)
        print("📊 RESUMO DA ATUALIZAÇÃO")
        print("="*60)
        print(f"✅ URLs atualizadas: {updated_count}")
        print(f"⏭️  Já eram thumbnails: {total - updated_count}")
        print(f"📚 Total processado: {total}")
        print("="*60)
        
        if updated_count > 0:
            print("\n🎉 Atualização concluída!")
            print("⚡ As capas agora carregarão muito mais rápido!")
        else:
            print("\n⚠️  Nenhuma URL foi atualizada.")

if __name__ == "__main__":
    print("🚀 Iniciando atualização para thumbnails...\n")
    update_to_thumbnails()
