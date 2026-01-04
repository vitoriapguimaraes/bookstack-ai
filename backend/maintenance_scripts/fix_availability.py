import sys
import os
from sqlmodel import Session, select, create_engine
from collections import Counter

# Add parent directory to path to import models
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from models import Book

db_path = os.path.join(BASE_DIR, "database.db")
DATABASE_URL = f"sqlite:///{db_path}"
engine = create_engine(DATABASE_URL)

VALID_AVAILABILITY = [
    "Estante",
    "Estante Araçatuba",
    "Kindle",
    "PDF",
    "Audiobook",
    "Emprestado",
    "Biblioteca",
    "Online",
    "A Comprar"
]

# Manual Mapping based on common variations
MAP_FIXES = {
    "Estante (Físico)": "Estante",
    "Físico": "Estante",
    "ATA": "Estante Araçatuba",
    "Desejado": "A Comprar",
    "Desejado / A Comprar": "A Comprar",
    "Kindle (E-book)": "Kindle",
    "E-book": "Kindle",
    "PDF / Digital": "PDF",
    "Digital": "PDF",
    "Web / Online": "Online",
    "Web": "Online"
}

def fix_availability(dry_run=True):
    with Session(engine) as session:
        books = session.exec(select(Book)).all()
        
        current_counts = Counter([b.availability for b in books])
        print(f"\n--- Current Values ({len(books)} books) ---")
        for val, count in current_counts.items():
            status = "✅ OK" if val in VALID_AVAILABILITY else "❌ INVALID"
            print(f"{val}: {count} [{status}]")

        if dry_run:
            print("\n--- PROPOSED CHANGES ---")
        else:
            print("\n--- APPLYING CHANGES ---")

        updates_count = 0
        unknown_values = set()

        for book in books:
            if book.availability in VALID_AVAILABILITY:
                continue
            
            original = book.availability
            new_val = MAP_FIXES.get(original)
            
            if new_val:
                if dry_run:
                    print(f"Would change ID {book.id}: '{original}' -> '{new_val}'")
                else:
                    book.availability = new_val
                    session.add(book)
                    print(f"Changed ID {book.id}: '{original}' -> '{new_val}'")
                updates_count += 1
            else:
                unknown_values.add(original)

        if not dry_run:
            session.commit()
            print(f"\nSuccessfully updated {updates_count} books.")
        else:
            print(f"\nDry run complete. Would update {updates_count} books.")

        if unknown_values:
            print(f"\n⚠️ WARNING: The following values have NO mapping defined: {unknown_values}")
            print("Please update the script with mappings for these values.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Apply changes to database")
    args = parser.parse_args()
    
    fix_availability(dry_run=not args.apply)
