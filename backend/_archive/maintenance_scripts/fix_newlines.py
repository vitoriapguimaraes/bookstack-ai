import sys
import os

# Ensure backend root is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from database import get_session, create_db_and_tables
from models import Book

def fix_newlines():
    session = next(get_session())
    books = session.exec(select(Book)).all()
    count = 0
    
    for book in books:
        modified = False
        
        if book.title and ('\n' in book.title or '\r' in book.title):
            print(f"Fixing Title for ID {book.id}: {repr(book.title)}")
            book.title = book.title.strip()
            modified = True
            
        if book.author and ('\n' in book.author or '\r' in book.author):
            print(f"Fixing Author for ID {book.id}: {repr(book.author)}")
            book.author = book.author.strip()
            modified = True
            
        if book.original_title and ('\n' in book.original_title or '\r' in book.original_title):
            print(f"Fixing Original Title for ID {book.id}: {repr(book.original_title)}")
            book.original_title = book.original_title.strip()
            modified = True
            
        if modified:
            session.add(book)
            count += 1
            
    if count > 0:
        session.commit()
        print(f"\nDone! Fixed {count} books.")
    else:
        print("\nNo books needed fixing.")

if __name__ == "__main__":
    fix_newlines()
