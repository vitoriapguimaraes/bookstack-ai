import sys
import os

# Ensure backend root is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from database import get_session, create_db_and_tables
from models import Book

TITLE_MAP = {
    "Machine Learning a First Course for Engineers and Scientists": "Machine Learning: A First Course for Engineers and Scientists",
    "Atlas do coração": "Atlas of the Heart",
    "Estatística, Probabilidade e Aprendizado de Máquina": "Statistics, Probability, and Machine Learning",
    "Speech and Language Processing": "Speech and Language Processing",
    "Dynamics of Software Development": "Dynamics of Software Development",
    "Design Patterns": "Design Patterns: Elements of Reusable Object-Oriented Software",
    "Guia Politicamente Incorreto da História do Brasil": "Guia Politicamente Incorreto da História do Brasil",
    "Guia Politicamente Incorreto da História do Mundo": "Guia Politicamente Incorreto da História do Mundo",
    "Practical Statistics for Data Scientists": "Practical Statistics for Data Scientists",
    "O herói e o fora da lei: Como construir marcas extraordinárias usando o poder dos arquétipos": "The Hero and the Outlaw",
    "Como Criar uma Mente: Os segredos do pensamento humano": "How to Create a Mind",
    "A Ciência de Como Não Estar Errado": "How Not to Be Wrong",
    "Storybrand: Crie Mensagens Claras e Atraia a Atenção dos Clientes Para sua Marca": "Building a StoryBrand",
    "Engenharia de Software: Uma abordagem profissional": "Software Engineering: A Practitioner's Approach",
    "Conversas Difíceis": "Difficult Conversations",
    "Quebrando o hábito de ser você mesmo": "Breaking the Habit of Being Yourself",
    "Super Thinking: The Big Book of Mental Models": "Super Thinking: The Big Book of Mental Models"
}

import unicodedata

def normalize_text(text):
    if not text: return ""
    return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn').lower().strip()

def update_titles():
    session = next(get_session())
    books = session.exec(select(Book)).all()
    count = 0
    
    print(f"Checking {len(books)} books against {len(TITLE_MAP)} updates (using normalized accent-insensitive comparison)...")
    
    for book in books:
        if not book.title: continue
        
        db_title_norm = normalize_text(book.title)
        
        # Iterate through map to find match
        matched_key = None
        for key in TITLE_MAP:
            if normalize_text(key) == db_title_norm:
                matched_key = key
                break
        
        if matched_key:
            new_original = TITLE_MAP[matched_key]
            # Update if empty or different
            if book.original_title != new_original:
                print(f"Updating '{book.title}': {book.original_title} -> {new_original}")
                book.original_title = new_original
                session.add(book)
                count += 1
                
    if count > 0:
        session.commit()
        print(f"\nSuccessfully updated {count} books!")
    else:
        print("\nNo updates needed.")

if __name__ == "__main__":
    update_titles()
