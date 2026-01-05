from sqlmodel import Session, select
from database import get_session, create_db_and_tables
from models import Book

def find_weird_book():
    session = next(get_session())
    
    # Try to find by Google Books ID in cover_image
    query = select(Book).where(Book.cover_image.contains("TQ-oEAAAQBAJ"))
    books = session.exec(query).all()
    
    print(f"Found {len(books)} books with matching cover image ID.")
    for book in books:
        print("--- Book Found ---")
        print(f"ID: {book.id}")
        print(f"Title: '{book.title}'")
        print(f"Author: '{book.author}'")
        print(f"Original Title: '{book.original_title}'")
        print(f"Year: {book.year}")
        print(f"Score: {book.score}")
        print(f"Status: {book.status}")
        print(f"Full Record: {book}")

    # Also search by metadata just in case cover image doesn't match exactly
    query2 = select(Book).where(
        Book.year == 2023,
        Book.category == "IA",
        Book.book_class == "Tecnologia & IA", 
        Book.score == 23.0
    )
    books2 = session.exec(query2).all()
    print(f"\nFound {len(books2)} books matching metadata (Year=2023, Cat=IA, Class=Tech&IA, Score=23.0).")
    for book in books2:
        print(f"ID: {book.id} | Title: '{book.title}'")

if __name__ == "__main__":
    find_weird_book()
