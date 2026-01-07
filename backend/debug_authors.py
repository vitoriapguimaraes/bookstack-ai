from sqlmodel import select
from database import get_session
from models import Book
import sys
import codecs

# Force UTF-8 output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Adapting to run as a script inside backend/ but executed from root
# actually if we run from root with PYTHONPATH=., imports like 'from backend.database' works if we adjust, 
# BUT the existing code uses relative imports or expects to be run as module.
# backend/database.py uses 'from sqlmodel...' 
# backend/models.py uses 'from sqlmodel...'

# Let's try to simulate the app context
try:
    session_gen = get_session()
    session = next(session_gen)
    
    books = session.exec(select(Book).where(Book.author.contains("Meg"))).all()
    
    with open("backend/debug_output.txt", "w", encoding="utf-8") as f:
        f.write(f"Found {len(books)} books matching 'Meg'\\n")
        for b in books:
            f.write(f"ID: {b.id} | Title: {b.title} | Author: '{b.author}' | Status: '{b.status}'\\n")
    
    print("Done writing to backend/debug_output.txt")
        
except Exception as e:
    print(f"Error: {e}")
