import requests
import json

def test_google_books():
    """Testa se a API do Google Books retorna ratings."""
    
    title = "Atomic Habits"
    url = "https://www.googleapis.com/books/v1/volumes"
    params = {
        "q": f"intitle:{title}",
        "langRestrict": "pt",
        "maxResults": 1
    }
    
    try:
        response = requests.get(url, params=params, timeout=5)
        data = response.json()
        
        if data.get("totalItems", 0) > 0:
            book_info = data["items"][0]["volumeInfo"]
            
            print("📚 Livro:", book_info.get("title"))
            print("👤 Autor:", ", ".join(book_info.get("authors", [])))
            print("📅 Ano:", book_info.get("publishedDate", "N/A"))
            print("\n⭐ RATINGS:")
            print("  - averageRating:", book_info.get("averageRating", "❌ NÃO DISPONÍVEL"))
            print("  - ratingsCount:", book_info.get("ratingsCount", "❌ NÃO DISPONÍVEL"))
            
            print("\n📋 Campos disponíveis no volumeInfo:")
            print(json.dumps(list(book_info.keys()), indent=2))
            
        else:
            print("❌ Nenhum livro encontrado")
            
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    test_google_books()
