import sys
import os
import re
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sqlmodel import Session, select
from database import engine
from models import Book

def update_from_markdown():
    markdown_table = """
| title | original_title |
|------|----------------|
| Build a Large Language Model (From Scratch) | Build a Large Language Model (From Scratch) |
| 1984 | 1984 |
| Python Fluente | Fluent Python |
| Low-Code AI: A Practical Project-Driven Introduction to Machine Learning | Low-Code AI: A Practical Project-Driven Introduction to Machine Learning |
| Pai Rico, Pai Pobre | Rich Dad Poor Dad |
| Generative Deep Learning | Generative Deep Learning |
| Simple SQL | Simple SQL |
| Image classification with AutoKeras | Image Classification with AutoKeras |
| Think Stats | Think Stats |
| Machine Learning Yearning | Machine Learning Yearning |
| Automated machine learning in action | Automated Machine Learning in Action |
| Sobre a escrita: A arte em memórias | On Writing: A Memoir of the Craft |
| Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow | Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow |
| Deep Learning | Deep Learning |
| Machine Learning Engineering | Machine Learning Engineering |
| Transformers for Natural Language Processing | Transformers for Natural Language Processing |
| Sapiens: Uma Breve História da Humanidade | Sapiens: A Brief History of Humankind |
| An Introduction to Statistical Learning | An Introduction to Statistical Learning |
| Eloquent JavaScript | Eloquent JavaScript |
| Deep Learning for Computer Vision with Python (Practitioner Bundle) | Deep Learning for Computer Vision with Python |
| Deep Learning for Computer Vision with Python (Starter Bundle) | Deep Learning for Computer Vision with Python |
| A Jornada do Escritor: Estrutura mítica para escritores | The Writer's Journey: Mythic Structure for Writers |
| Guia Front-End: O caminho das pedras para ser um dev Front-End | Guia Front-End |
| Feature Engineering for Machine Learning | Feature Engineering for Machine Learning |
| HTML5 e CSS3: Domine a web do futuro | HTML5 and CSS3 |
| Machine Learning: A First Course for Engineers and Scientists | Machine Learning: A First Course for Engineers and Scientists |
| Inteligência Emocional | Emotional Intelligence |
| Designing Machine Learning Systems | Designing Machine Learning Systems |
| Computer Vision: Algorithms and Applications | Computer Vision: Algorithms and Applications |
| A Cor dos Dados: Um guia para o uso de cores em storytelling de dados | The Color of Data |
| Practical MLOps | Practical MLOps |
| Data Science for Business | Data Science for Business |
| Razão e Sensibilidade | Sense and Sensibility |
| Uma Breve História do Tempo | A Brief History of Time |
| Business Intelligence: Implementar do jeito certo e a custo zero | Business Intelligence |
| Persuasão | Influence |
| Data Analytics For Beginners | Data Analytics for Beginners |
| Soft skills: competências essenciais para os novos tempos | Soft Skills |
| Soft Skills - Vol 2 | Soft Skills Vol. 2 |
| Comunicação Não Violenta | Nonviolent Communication: A Language of Life |
| A Coragem de Não Agradar | The Courage to Be Disliked |
| O Poder da Ação | The Power of Action |
| O Poder da Empatia | The Power of Empathy |
| JavaScript: O Guia Definitivo | JavaScript: The Definitive Guide |
| A Sutil Arte de Ligar o F*da-se | The Subtle Art of Not Giving a F*ck |
| A Guerra da Arte | The War of Art |
| GPU Programming with C++ and CUDA | GPU Programming with C++ and CUDA |
| O Príncipe | Il Principe |
| A Arte da Guerra | The Art of War |
| Comece pelo Porquê | Start with Why |
| Liderança sem Título | Leadership Without Title |
| O Milagre da Manhã | The Miracle Morning |
| O Poder do Hábito | The Power of Habit |
| O Poder da Vulnerabilidade | The Power of Vulnerability |
| A Coragem de Ser Imperfeito | The Gifts of Imperfection |
| Lógica de programação com Portugol | Programming Logic with Portugol |
| Como Fazer Amigos e Influenciar Pessoas | How to Win Friends and Influence People |
| Atlas do Coração | Atlas of the Heart |
| Harry Potter e a Pedra Filosofal | Harry Potter and the Philosopher's Stone |
| Harry Potter e a Câmara Secreta | Harry Potter and the Chamber of Secrets |
| Harry Potter e o Prisioneiro de Azkaban | Harry Potter and the Prisoner of Azkaban |
| Harry Potter e o Cálice de Fogo | Harry Potter and the Goblet of Fire |
| Harry Potter e a Ordem da Fênix | Harry Potter and the Order of the Phoenix |
| Harry Potter e o Enigma do Príncipe | Harry Potter and the Half-Blood Prince |
| Harry Potter e as Relíquias da Morte | Harry Potter and the Deathly Hallows |
| Jogador Nº 1 | Ready Player One |
| Understanding Deep Learning | Understanding Deep Learning |
| Practical Statistics for Data Scientists | Practical Statistics for Data Scientists |
| O Homem Mais Rico da Babilônia | The Richest Man in Babylon |
| Ethics of Artificial Intelligence | Ethics of Artificial Intelligence |
| Building Machine Learning Pipelines | Building Machine Learning Pipelines |
| AI Ethics | AI Ethics |
| Os Segredos da Mente Milionária | Secrets of the Millionaire Mind |
| O Mundo de Sofia | Sofies verden |
| Hábitos Atômicos | Atomic Habits |
| Arquitetura Limpa | Clean Architecture |
| Pense em Python | Think Python |
| O Monge e o Executivo | The Servant |
| Getting Things Done | Getting Things Done |
| Armas, Germes e Aço | Guns, Germs, and Steel |
| O Gene Egoísta | The Selfish Gene |
| A Origem das Espécies | On the Origin of Species |
| Cosmos | Cosmos |
| Assim Falou Zaratustra | Thus Spoke Zarathustra |
| O Andar do Bêbado | The Drunkard's Walk |
| Lean Analytics | Lean Analytics |
| Frankenstein | Frankenstein |
| Assassinato no Expresso do Oriente | Murder on the Orient Express |
| Oliver Twist | Oliver Twist |
| The Book of Why | The Book of Why |
| Pattern Recognition and Machine Learning | Pattern Recognition and Machine Learning |
| Peopleware | Peopleware |
| Python Data Science Handbook | Python Data Science Handbook |
| The Coming Wave | The Coming Wave |
| Meditações | Meditations |
| O Conto da Aia | The Handmaid's Tale |
| Drácula | Dracula |
| A Metamorfose | Die Verwandlung |
| Essencialismo | Essentialism |
| Mindset | Mindset |
| Data Mesh | Data Mesh: Delivering Data-Driven Value at Scale |
| Fundamentals of Data Engineering | Fundamentals of Data Engineering |
| Refatoração | Refactoring |
| The Mythical Man-Month | The Mythical Man-Month |
| Reinforcement Learning | Reinforcement Learning |
| Structure and Interpretation of Computer Programs | Structure and Interpretation of Computer Programs |
| O Programador Pragmático | The Pragmatic Programmer |
| Código Limpo | Clean Code |
| Deep Learning with Python | Deep Learning with Python |
| Storytelling with Data | Storytelling with Data |
"""
    
    # Parse table
    updates = {}
    lines = markdown_table.strip().split('\n')
    
    for line in lines:
        if "|" not in line or "---" in line or "title" in line:
            continue
            
        parts = [p.strip() for p in line.split('|') if p.strip()]
        if len(parts) >= 2:
            title = parts[0]
            original = parts[1]
            updates[title] = original

    print(f"Lidos {len(updates)} livros da tabela.")

    with Session(engine) as session:
        count = 0
        for pt_title, original in updates.items():
            # Tenta encontrar por match exato primeiro
            statement = select(Book).where(Book.title == pt_title)
            book = session.exec(statement).first()
            
            # Se não achou exato, tenta contains (case insensitive handling via ilike se fosse postgres, mas sqlite ok)
            if not book:
                statement = select(Book).where(Book.title.contains(pt_title))
                book = session.exec(statement).first()

            if book:
                # Update
                book.original_title = original
                session.add(book)
                print(f"✅ Atualizado: '{book.title}' -> '{original}'")
                count += 1
            else:
                print(f"⚠️ Não encontrado no banco: '{pt_title}'")
        
        session.commit()
    
    print(f"\n🎉 Processo concluído! {count} livros atualizados com base na tabela.")

if __name__ == "__main__":
    update_from_markdown()
