import requests


def get_google_books_data(title: str):
    """Busca dados do livro na Google Books API."""
    try:
        url = "https://www.googleapis.com/books/v1/volumes"
        params = {
            "q": f"intitle:{title}",
            "maxResults": 1,
            "langRestrict": "pt",
        }

        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()

        if data.get("totalItems", 0) == 0:
            params.pop("langRestrict")
            response = requests.get(url, params=params, timeout=5)
            data = response.json()

        if data.get("totalItems", 0) > 0:
            book_info = data["items"][0]["volumeInfo"]

            result = {
                "author": ", ".join(book_info.get("authors", [])) or None,
                "year": None,
                "description": book_info.get("description", ""),
                "cover_image": None,
                "average_rating": book_info.get("averageRating"),
                "ratings_count": book_info.get("ratingsCount"),
            }

            published_date = book_info.get("publishedDate", "")
            if published_date:
                try:
                    result["year"] = int(published_date.split("-")[0])
                except Exception:
                    pass

            image_links = book_info.get("imageLinks", {})

            cover_url = (
                image_links.get("thumbnail")
                or image_links.get("smallThumbnail")
                or image_links.get("small")
            )
            result["cover_image"] = (
                cover_url.replace("http://", "https://") if cover_url else None
            )

            return result
    except Exception as e:
        print(f"Erro ao buscar no Google Books: {e}")

    return None


def get_openlibrary_rating(title: str, author: str = None):
    """Busca rating do livro na Open Library API."""
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

            if rating and rating > 0:
                return {
                    "average_rating": round(rating, 2),
                    "ratings_count": rating_count,
                    "source": "Open Library",
                }
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
    openlibrary_data = get_openlibrary_rating(title, author)
    if openlibrary_data:
        openlibrary_data["source"] = "Open Library (PT)"
        return openlibrary_data

    # Tenta Open Library com título original
    if original_title:
        openlibrary_data_original = get_openlibrary_rating(original_title, author)
        if openlibrary_data_original:
            openlibrary_data_original["source"] = "Open Library (Original)"
            return openlibrary_data_original

    return None
