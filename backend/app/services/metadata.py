import os
import requests
from app.core.config import settings


def _score_google_item(item: dict) -> int:
    """Score a Google Books item by data completeness (higher = better)."""
    info = item.get("volumeInfo", {})
    score = 0
    if info.get("imageLinks"):
        score += 10
    if info.get("authors"):
        score += 5
    if info.get("publishedDate"):
        score += 3
    if info.get("description"):
        score += 2
    return score


def _extract_book_result(book_info: dict) -> dict:
    """Build a normalized result dict from a Google Books volumeInfo."""
    result = {
        "author": ", ".join(book_info.get("authors", [])) or None,
        "year": None,
        "description": book_info.get("description", ""),
        "subtitle": book_info.get("subtitle", ""),
        "cover_image": None,
        "average_rating": book_info.get("averageRating"),
        "ratings_count": book_info.get("ratingsCount"),
    }

    published_date = book_info.get("publishedDate", "")
    if published_date:
        try:
            result["year"] = int(published_date.split("-")[0])
        except ValueError:
            pass

    image_links = book_info.get("imageLinks", {})
    # Prefer higher resolution images
    cover_url = (
        image_links.get("large")
        or image_links.get("medium")
        or image_links.get("small")
        or image_links.get("thumbnail")
        or image_links.get("smallThumbnail")
    )
    if cover_url:
        # Force https and request larger zoom
        cover_url = cover_url.replace("http://", "https://")
        # Google Books URLs support zoom parameter — zoom=1 is thumbnail, zoom=3 is larger
        if "zoom=" in cover_url:
            cover_url = cover_url.replace("zoom=1", "zoom=3")
        elif "?" in cover_url:
            cover_url += "&zoom=3"
        else:
            cover_url += "?zoom=3"
    result["cover_image"] = cover_url
    return result


def _search_google_books(query: str, api_key: str = None) -> list:
    """Run a single query against Google Books API and return items list."""
    try:
        url = "https://www.googleapis.com/books/v1/volumes"
        params = {"q": query, "maxResults": 5, "printType": "books"}
        if api_key:
            params["key"] = api_key
        response = requests.get(url, params=params, timeout=8)
        response.raise_for_status()
        return response.json().get("items", [])
    except Exception as e:
        print(f"Google Books query failed for '{query}': {e}")
        return []


def get_google_books_data(title: str, author: str = None):
    """Busca dados do livro na Google Books API com estratégia de fallback."""
    api_key = getattr(settings, "GOOGLE_BOOKS_API_KEY", None) or os.getenv(
        "GOOGLE_BOOKS_API_KEY"
    )

    items = []
    # Strategy 1: Search by title AND author
    if author:
        items = _search_google_books(f"intitle:{title} inauthor:{author}", api_key)

    # Strategy 2: If no items found, fallback to title only
    if not items:
        items = _search_google_books(f"intitle:{title}", api_key)

    if not items:
        return None

    best = max(items, key=_score_google_item)
    return _extract_book_result(best["volumeInfo"])


def get_openlibrary_data(title: str, author: str = None):
    """Busca dados adicionais (ano da primeira publicação, título original, rating) na Open Library API."""
    try:
        search_query = title
        if author:
            search_query = f"{title} {author}"

        url = "https://openlibrary.org/search.json"
        params = {"q": search_query, "limit": 1}

        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()

        if data.get("numFound", 0) > 0:
            book = data["docs"][0]
            rating = book.get("ratings_average")
            rating_count = book.get("ratings_count", 0)
            
            result = {}
            if rating and rating > 0:
                result.update({
                    "average_rating": round(rating, 2),
                    "ratings_count": rating_count,
                    "source": "Open Library",
                })
            
            first_publish_year = book.get("first_publish_year")
            if first_publish_year:
                result["year"] = first_publish_year
                
            # O título original (OpenLibrary costuma ter o título principal da obra)
            ol_title = book.get("title")
            if ol_title:
                result["original_title"] = ol_title

            return result if result else None
    except Exception as e:
        print(f"Erro ao buscar no Open Library: {e}")

    return None


def get_hybrid_rating(title: str, author: str = None, original_title: str = None):
    """Busca rating de forma híbrida."""
    # Tenta Google Books com título em português
    google_data = get_google_books_data(title)
    if google_data and google_data.get("average_rating"):
        return {
            "average_rating": google_data["average_rating"],
            "ratings_count": google_data.get("ratings_count", 0),
            "source": "Google Books (PT)",
        }

    # Tenta Google Books com título original
    if original_title:
        google_data_original = get_google_books_data(original_title)
        if google_data_original and google_data_original.get("average_rating"):
            return {
                "average_rating": google_data_original["average_rating"],
                "ratings_count": google_data_original.get("ratings_count", 0),
                "source": "Google Books (Original)",
            }

    # Tenta Open Library com título em português
    openlibrary_data = get_openlibrary_data(title, author)
    if openlibrary_data and openlibrary_data.get("average_rating"):
        openlibrary_data["source"] = "Open Library (PT)"
        return openlibrary_data

    # Tenta Open Library com título original
    if original_title:
        openlibrary_data_original = get_openlibrary_data(original_title, author)
        if openlibrary_data_original and openlibrary_data_original.get("average_rating"):
            openlibrary_data_original["source"] = "Open Library (Original)"
            return openlibrary_data_original

    return None
