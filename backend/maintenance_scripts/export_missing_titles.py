import sys
import os
import csv
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sqlmodel import Session, select
from database import engine
from models import Book

def export_missing():
    file_name = "missing_original_titles.csv"
    with Session(engine) as session:
        # Select books with missing original_title
        books = session.exec(select(Book).where((Book.original_title == None) | (Book.original_title == ""))).all()
        
        print(f"Exportando {len(books)} livros para {file_name}...")
        
        with open(file_name, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'title', 'original_title']) # Header
            
            for book in books:
                writer.writerow([book.id, book.title, ''])
                
    print(f"✅ Arquivo '{file_name}' criado com sucesso!")
    print("Abra-o, preencha a coluna 'original_title' e depois rode o script de importação.")

if __name__ == "__main__":
    export_missing()
