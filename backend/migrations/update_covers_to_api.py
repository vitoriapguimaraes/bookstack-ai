"""
Script para migrar capas locais para URLs da Google Books API
Execução: python update_covers_to_api.py
"""

from sqlmodel import Session, select
from database import engine
from models import Book
import requests
import time

def get_google_books_cover(title: str):
    """Busca apenas a URL da capa no Google Books."""
    try:
        url = "https://www.googleapis.com/books/v1/volumes"
        params = {
            "q": f"intitle:{title}",
            "maxResults": 1,
            "langRestrict": "pt"
        }
        
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        if data.get("totalItems", 0) == 0:
            # Tenta sem restrição de idioma
            params.pop("langRestrict")
            response = requests.get(url, params=params, timeout=5)
            data = response.json()
            
        if data.get("totalItems", 0) > 0:
            book_info = data["items"][0]["volumeInfo"]
            image_links = book_info.get("imageLinks", {})
            # Use thumbnail for faster loading (smaller resolution)
            cover_url = (
                image_links.get("thumbnail") or 
                image_links.get("smallThumbnail") or
                image_links.get("small")
            )
            return cover_url
    except Exception as e:
        print(f"    ⚠️  Erro: {e}")
    
    return None

def update_all_covers():
    """Atualiza todas as capas dos livros para URLs da Google Books API."""
    
    with Session(engine) as session:
        # Busca todos os livros
        books = session.exec(select(Book)).all()
        total = len(books)
        
        print(f"📚 Encontrados {total} livros no banco de dados")
        print("🔍 Buscando capas na Google Books API...\n")
        
        success_count = 0
        failed_count = 0
        skipped_count = 0
        
        for i, book in enumerate(books, 1):
            print(f"[{i}/{total}] {book.title[:50]}")
            
            # Pula se já tem uma URL (não caminho local)
            if book.cover_image and book.cover_image.startswith('http'):
                print(f"  ⏭️  Já possui URL da API")
                skipped_count += 1
                continue
            
            # Busca capa no Google Books
            cover_url = get_google_books_cover(book.title)
            
            if cover_url:
                book.cover_image = cover_url
                session.add(book)
                print(f"  ✅ Capa encontrada")
                success_count += 1
            else:
                print(f"  ❌ Capa não encontrada")
                failed_count += 1
            
            # Delay para não sobrecarregar a API
            if i < total:
                time.sleep(0.3)  # 300ms entre requisições
        
        # Commit todas as mudanças
        session.commit()
        
        print("\n" + "="*60)
        print("📊 RESUMO DA MIGRAÇÃO")
        print("="*60)
        print(f"✅ Capas encontradas e atualizadas: {success_count}")
        print(f"⏭️  Já possuíam URL (pulados): {skipped_count}")
        print(f"❌ Capas não encontradas: {failed_count}")
        print(f"📚 Total de livros processados: {total}")
        print("="*60)
        
        if success_count > 0:
            print("\n🎉 Migração concluída com sucesso!")
            print("💡 Agora você pode deletar a pasta 'backend/static/covers'")
            print("   As capas serão carregadas diretamente da Google Books API")
        else:
            print("\n⚠️  Nenhuma capa foi atualizada.")

if __name__ == "__main__":
    print("🚀 Iniciando migração de capas para URLs da API...\n")
    update_all_covers()
