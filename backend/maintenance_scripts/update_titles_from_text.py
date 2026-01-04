import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from sqlmodel import Session, select
from database import engine
from models import Book

def update_from_text():
    # Mapeamento fornecido pelo usuário
    updates = {
        "Python Fluente": "Fluent Python",
        "Entendendo Algoritmos": "Grokking Algorithms",
        "Código Limpo": "Clean Code",
        "Arquitetura Limpa": "Clean Architecture",
        "Refatoração": "Refactoring",
        "O Programador Pragmático": "The Pragmatic Programmer",
        "Gênero Queer: Memórias": "Gender Queer: A Memoir",
        "Como mentir com estatística": "How to Lie with Statistics",
        "Estatística: O que é, para que serve": "Naked Statistics",
        "O Mundo de Sofia": "Sofies verden",
        "O Pequeno Príncipe": "Le Petit Prince",
        "A Metamorfose": "Die Verwandlung",
        "O Diário de Anne Frank": "Het Achterhuis",
        "A Revolução dos Bichos": "Animal Farm",
        "O Segundo Sexo": "Le Deuxième Sexe",
        "A Rapariga no Comboio": "The Girl on the Train",
        "Assassinato no Expresso do Oriente": "Murder on the Orient Express",
        "Drácula": "Dracula",
        "Orgulho e Preconceito": "Pride and Prejudice",
        "Hábitos Atómicos": "Atomic Habits",
        "Rápido e Devagar: Duas Formas de Pensar": "Thinking, Fast and Slow",
        "O Monge e o Executivo": "The Servant",
        "Essencialismo": "Essentialism",
        "Mindset: A Nova Psicologia do Sucesso": "Mindset",
        "O Poder do Agora": "The Power of Now",
        "Pai Rico, Pai Pobre": "Rich Dad Poor Dad",
        "Factfulness": "Factfulness",
        "Dom Casmurro": "Dom Casmurro",
        "Vidas Secas": "Vidas Secas",
        "Memórias Póstumas de Brás Cubas": "Memórias Póstumas de Brás Cubas",
        "A Hora da Estrela": "A Hora da Estrela",
        "O Triste Fim de Policarpo Quaresma": "O Triste Fim de Policarpo Quaresma",
        "A Morte é um Dia que Vale a Pena Viver": "A Morte é um Dia que Vale a Pena Viver"
    }

    with Session(engine) as session:
        count = 0
        for pt_title, original in updates.items():
            # Tenta encontrar por match exato ou parcial
            statement = select(Book).where(Book.title.contains(pt_title))
            books = session.exec(statement).all()
            
            for book in books:
                # Verifica se é o livro certo (as vezes match parcial pega outros)
                # Mas neste caso os titulos são bem específicos
                old_orig = book.original_title
                book.original_title = original
                session.add(book)
                print(f"✅ Atualizado: '{book.title}' \n   Antigo: {old_orig} -> Novo: {original}")
                count += 1
        
        session.commit()
    
    print(f"\n🎉 Processo concluído! {count} livros atualizados com base na sua lista.")

if __name__ == "__main__":
    update_from_text()
