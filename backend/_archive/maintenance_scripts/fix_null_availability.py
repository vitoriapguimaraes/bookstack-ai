import sys
import os
import csv
from sqlmodel import Session, select, create_engine

# Add parent directory to path to import models
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from models import Book

db_path = os.path.join(BASE_DIR, "database.db")
DATABASE_URL = f"sqlite:///{db_path}"
engine = create_engine(DATABASE_URL)

# Path to original CSV
CSV_PATH = os.path.join(BASE_DIR, "..", "original_streamlit_app", "assets", "data", "lista_livros_2025.csv")

def fix_null_availability(dry_run=True):
    """
    Identify books that had null/empty availability in the original CSV
    and set them to 'N/A' in the database.
    """
    
    # Read CSV and identify books with null availability
    null_availability_titles = set()
    
    try:
        with open(CSV_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Check if availability column exists and is empty/null
                # Try both Portuguese and English column names
                availability = row.get('Disponibilidade', row.get('availability', '')).strip()
                if not availability or availability.lower() in ['', 'nan', 'null', 'none']:
                    title = row.get('Título', row.get('title', '')).strip()
                    if title:
                        null_availability_titles.add(title)
        
        print(f"Found {len(null_availability_titles)} books with null availability in CSV")
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return
    
    # Update database
    with Session(engine) as session:
        books = session.exec(select(Book)).all()
        
        updates_count = 0
        
        if dry_run:
            print("\n--- DRY RUN: Proposed Changes ---")
        else:
            print("\n--- APPLYING CHANGES ---")
        
        for book in books:
            if book.title in null_availability_titles:
                if dry_run:
                    print(f"Would change ID {book.id} '{book.title}': '{book.availability}' -> 'N/A'")
                else:
                    book.availability = 'N/A'
                    session.add(book)
                    print(f"Changed ID {book.id} '{book.title}': '{book.availability}' -> 'N/A'")
                updates_count += 1
        
        if not dry_run:
            session.commit()
            print(f"\nSuccessfully updated {updates_count} books.")
        else:
            print(f"\nDry run complete. Would update {updates_count} books.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Apply changes to database")
    args = parser.parse_args()
    
    fix_null_availability(dry_run=not args.apply)
