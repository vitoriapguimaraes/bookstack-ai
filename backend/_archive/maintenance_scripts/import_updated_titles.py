import sys
import os
import csv
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sqlmodel import Session, select
from database import engine
from models import Book

def import_updated():
    file_name = "missing_original_titles.csv"
    
    if not os.path.exists(file_name):
        print(f"❌ Arquivo '{file_name}' não encontrado.")
        return

    with Session(engine) as session:
        print(f"Lendo {file_name}...")
        count = 0
        
        with open(file_name, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                book_id = row.get('id')
                new_original = row.get('original_title')
                
                if book_id and new_original and new_original.strip():
                    book = session.get(Book, int(book_id))
                    if book:
                        book.original_title = new_original.strip()
                        session.add(book)
                        count += 1
                        print(f"Atualizando ID {book.id}: {new_original}")
        
        session.commit()
    
    print(f"✅ Sucesso! {count} livros atualizados.")

if __name__ == "__main__":
    import_updated()
