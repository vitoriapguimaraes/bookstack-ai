from .metadata import get_google_books_data, get_hybrid_rating
from .ai import get_ai_classification


def get_book_details_hybrid(
    title: str,
    api_keys: dict = None,
    custom_prompts: dict = None,
    class_categories: dict = None,
):
    """
    Solução híbrida: Google Books API + Open Library + Groq AI
    """
    result = {
        "author": None,
        "year": None,
        "book_class": "Desenvolvimento Pessoal",
        "type": "Não Técnico",
        "category": "Geral",
        "motivation": None,
        "cover_url": None,
        "google_rating": None,
        "google_ratings_count": None,
    }

    # 1. Fact Data
    google_data = get_google_books_data(title)
    description = ""
    if google_data:
        result["author"] = google_data.get("author")
        result["year"] = google_data.get("year")
        result["cover_url"] = google_data.get("cover_url")
        description = google_data.get("description", "")

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
        result["book_class"] = ai_data.get("book_class", "Desenvolvimento Pessoal")
        result["type"] = ai_data.get("type", "Não Técnico")
        result["category"] = ai_data.get("category", "Geral")
        result["motivation"] = ai_data.get("motivation")
        result["original_title"] = ai_data.get("original_title")

    return result
