from models import Book
from groq import Groq
from dotenv import load_dotenv
import os
import json
import requests

load_dotenv()

# Category weights based on the Excel formula
CATEGORY_WEIGHTS = {
    "Produtividade": 5,
    "Liderança": 7,
    "Inteligência emocional": 7,
    "Desenvolvimento pessoal": 5,
    "Criatividade": 3,
    "Comunicação": 5,
    "Bem-estar": 5,
    "Literatura brasileira": 5,
    "Literatura Brasileira Clássica": 5,
    "História/Ficção": 7,
    "Diversidade e inclusão": 3,
    "Negócios": 2,
    "Finanças pessoais": 4,
    "Conhecimento geral": 7,
    "Estatística": 7,
    "MLOps": 5,
    "Engenharia de dados": 5,
    "Arquitetura": 1,
    "Programação": 3,
    "Machine learning": 7,
    "Visão computacional": 7,
    "IA": 6,
    "Data science": 7,
    "Análise de Dados": 5,
    # Additional categories from the system
    "Liderança & Pensamento Estratégico": 7,
    "Arquitetura da Mente (Mindset)": 7,
    "Artesanato de Software (Clean Code)": 6,
    "Sistemas de IA & LLMs": 6,
    "Storytelling & Visualização": 5,
    "Biohacking & Existência": 5,
    "Épicos & Ficção Reflexiva": 7,
    "Justiça Social & Interseccionalidade": 3,
    "Liberdade Econômica & Finanças": 4,
    "Cosmologia & Fronteiras da Ciência": 7,
    "Estatística & Incerteza": 7,
    "Engenharia de ML & MLOps": 5,
}

# Hierarchical classification: Classes and their Categories
CLASS_CATEGORIES = {
    "Tecnologia & IA": [
        "Análise de Dados",
        "Data Science",
        "IA",
        "Visão Computacional",
        "Machine Learning",
        "Programação",
        "Sistemas de IA & LLMs"
    ],
    "Engenharia & Arquitetura": [
        "Arquitetura",
        "Arquitetura da Mente (Mindset)",
        "Engenharia de Dados",
        "MLOps",
        "Engenharia de ML & MLOps",
        "Artesanato de Software (Clean Code)"
    ],
    "Conhecimento & Ciências": [
        "Conhecimento Geral",
        "Estatística",
        "Estatística & Incerteza",
        "Cosmologia & Fronteiras da Ciência"
    ],
    "Negócios & Finanças": [
        "Finanças Pessoais",
        "Negócios",
        "Liberdade Econômica & Finanças"
    ],
    "Literatura & Cultura": [
        "Diversidade e Inclusão",
        "História/Ficção",
        "Literatura Brasileira",
        "Literatura Brasileira Clássica",
        "Épicos & Ficção Reflexiva",
        "Justiça Social & Interseccionalidade"
    ],
    "Desenvolvimento Pessoal": [
        "Bem-estar",
        "Comunicação",
        "Criatividade",
        "Desenvolvimento Pessoal",
        "Inteligência Emocional",
        "Liderança",
        "Liderança & Pensamento Estratégico",
        "Produtividade",
        "Biohacking & Existência",
        "Storytelling & Visualização",
        "Geral"  # Fallback category
    ]
}

def get_class_from_category(category: str) -> str:
    """Returns the class for a given category."""
    for book_class, categories in CLASS_CATEGORIES.items():
        if category in categories:
            return book_class
    return "Desenvolvimento Pessoal"  # Default fallback

def calculate_book_score(book: Book) -> float:
    """
    Calcula o score do livro baseado na fórmula do Excel:
    =SE(G212=0; 0; 
       SE(E212="Técnico";4;2)
       + SE(H212="Estante";2;0)
       + IFS(F212="1 - Baixa";1; F212="2 - Média";4; F212="3 - Média-Alta";7; F212="4 - Alta";10)
       + IFS(D212<=2005;4; E(D212>=2006; D212<=2021);7; D212>=2022;9)
       + IFS(I212=categoria; peso_categoria)
    )
    
    Onde G212 = Status (0=Lido, 1=A Ler, 2=Lendo)
    Se Status = Lido (0), score = 0
    """
    
    # Se o livro já foi lido, score = 0 (conforme fórmula Excel)
    if book.status == "Lido":
        return 0.0
    
    score = 0.0
    
    # 1. Tipo (E212)
    if book.type == "Técnico":
        score += 4
    else:
        score += 2
        
    # 2. Disponibilidade (H212)
    if book.availability == "Estante":
        score += 2
        
    # 3. Prioridade (F212)
    priority_weights = {
        "1 - Baixa": 1,
        "2 - Média": 4, 
        "3 - Média-Alta": 7, 
        "4 - Alta": 10
    }
    score += priority_weights.get(book.priority, 0)
    
    # 4. Ano (D212)
    if book.year:
        if book.year <= 2005:
            score += 4
        elif 2006 <= book.year <= 2021:
            score += 7
        elif book.year >= 2022:
            score += 9
            
    # 5. Categoria (I212)
    # Tenta match exato primeiro
    category_score = CATEGORY_WEIGHTS.get(book.category, 0)
    
    # Se não encontrou match exato, tenta match parcial
    if category_score == 0 and book.category:
        for cat_name, weight in CATEGORY_WEIGHTS.items():
            if cat_name.lower() in book.category.lower() or book.category.lower() in cat_name.lower():
                category_score = weight
                break
    
    score += category_score
    
    return score

def get_google_books_data(title: str):
    """Busca dados do livro na Google Books API."""
    try:
        url = "https://www.googleapis.com/books/v1/volumes"
        params = {
            "q": f"intitle:{title}",
            "maxResults": 1,
            "langRestrict": "pt"  # Prioriza livros em português
        }
        
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        if data.get("totalItems", 0) == 0:
            # Tenta sem restrição de idioma
            params.pop("langRestrict")
            response = requests.get(url, params=params, timeout=5)
            data = response.json()
            
        if data.get("totalItems", 0) > 0:
            book_info = data["items"][0]["volumeInfo"]
            
            # Extrai informações
            result = {
                "author": ", ".join(book_info.get("authors", [])) or None,
                "year": None,
                "description": book_info.get("description", ""),
                "cover_url": None
            }
            
            # Ano de publicação
            published_date = book_info.get("publishedDate", "")
            if published_date:
                try:
                    result["year"] = int(published_date.split("-")[0])
                except:
                    pass
            
            # URL da capa (prioriza thumbnail para carregamento rápido)
            image_links = book_info.get("imageLinks", {})
            result["cover_url"] = (
                image_links.get("thumbnail") or 
                image_links.get("smallThumbnail") or
                image_links.get("small")
            )
            
            return result
    except Exception as e:
        print(f"Erro ao buscar no Google Books: {e}")
    
    return None

def get_ai_classification(title: str, description: str = ""):
    """Usa Groq AI para classificar categoria, tipo e motivação."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("Erro: GROQ_API_KEY não encontrada.")
        return None
    
    categories_list = list(CATEGORY_WEIGHTS.keys())
    
    client = Groq(api_key=api_key)
    prompt = f"""
    Dado o livro '{title}' com a seguinte descrição:
    "{description[:500]}"
    
    Classifique o livro e retorne um JSON com:
    - type (string: "Técnico" ou "Não Técnico")
    - category (string: escolha UMA das categorias abaixo que melhor se encaixa)
    - motivation (string: uma frase curta e pessoal sobre por que ler este livro)
    
    Categorias disponíveis:
    {', '.join(categories_list[:20])}
    
    Responda APENAS o JSON válido.
    """
    
    try:
        response = client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={ "type": "json_object" }
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Erro no Groq: {e}")
        return None

def get_book_details_hybrid(title: str):
    """
    Solução híbrida: Google Books API + Groq AI
    
    1. Google Books → author, year, description, cover_url
    2. Groq AI → type, category, motivation
    """
    result = {
        "author": None,
        "year": None,
        "type": "Não Técnico",
        "category": "Geral",
        "motivation": None,
        "cover_url": None
    }
    
    # 1. Busca dados factuais no Google Books
    google_data = get_google_books_data(title)
    if google_data:
        result["author"] = google_data.get("author")
        result["year"] = google_data.get("year")
        result["cover_url"] = google_data.get("cover_url")
        description = google_data.get("description", "")
    else:
        description = ""
    
    # 2. Usa IA para classificação personalizada
    ai_data = get_ai_classification(title, description)
    if ai_data:
        result["type"] = ai_data.get("type", "Não Técnico")
        result["category"] = ai_data.get("category", "Geral")
        result["motivation"] = ai_data.get("motivation")
    
    return result
