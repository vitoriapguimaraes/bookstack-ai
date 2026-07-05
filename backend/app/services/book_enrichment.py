from .metadata import get_google_books_data, get_hybrid_rating
from .ai import get_ai_classification


def _apply_google_data(result: dict, google_data: dict) -> str:
    """Merges Google Books fields into result. Returns the book description."""
    result["author"] = google_data.get("author")
    result["year"] = google_data.get("year")
    result["cover_image"] = google_data.get("cover_image")
    return google_data.get("description", "")


def _apply_ai_data(result: dict, ai_data: dict) -> None:
    """Merges AI classification fields into result."""
    result["book_class"] = ai_data.get("book_class", "Desenvolvimento Pessoal")
    result["type"] = ai_data.get("type", "Não Técnico")
    result["category"] = ai_data.get("category", "Geral")
    result["motivation"] = ai_data.get("motivation")
    result["original_title"] = ai_data.get("original_title")


def _fill_cover_fallback(result: dict, title: str, google_data: dict) -> None:
    """Tries to fill missing cover and original_title using subtitle or original-title search."""
    # Fallback original_title: use Google Books subtitle when AI didn't detect one
    if not result.get("original_title") and google_data:
        subtitle = google_data.get("subtitle", "")
        if subtitle and subtitle.lower() != title.lower():
            result["original_title"] = subtitle

    # Fallback cover: retry Google Books with original title + author
    if result.get("cover_image") or not result.get("original_title"):
        return

    print(
        f"Cover not found for '{title}', "
        f"retrying with original title: '{result['original_title']}'"
    )
    orig_data = get_google_books_data(result["original_title"], result.get("author"))
    if not orig_data or not orig_data.get("cover_image"):
        return

    result["cover_image"] = orig_data["cover_image"]
    result.setdefault("author", orig_data.get("author"))
    result.setdefault("year", orig_data.get("year"))


def get_book_details_hybrid(
    title: str,
    api_keys: dict = None,
    custom_prompts: dict = None,
    class_categories: dict = None,
) -> dict:
    """Solução híbrida: Google Books API + Open Library + Groq AI."""
    result = {
        "author": None,
        "year": None,
        "book_class": "Desenvolvimento Pessoal",
        "type": "Não Técnico",
        "category": "Geral",
        "motivation": None,
        "cover_image": None,
        "google_rating": None,
        "google_ratings_count": None,
    }

    # 1. Fact Data
    google_data = get_google_books_data(title)
    description = _apply_google_data(result, google_data) if google_data else ""

    # 2. Rating
    rating_data = get_hybrid_rating(title, result.get("author"))
    if rating_data:
        result["google_rating"] = rating_data["average_rating"]
        result["google_ratings_count"] = rating_data.get("ratings_count", 0)

    # 3. AI Enrichment
    ai_data = get_ai_classification(
        title, description, api_keys, custom_prompts, class_categories
    )
    if ai_data and "error" in ai_data:
        return {"error": ai_data["error"], "partial_result": result}
    if ai_data:
        _apply_ai_data(result, ai_data)

    # 4 & 5. Original title + cover fallbacks
    _fill_cover_fallback(result, title, google_data)

    return result
