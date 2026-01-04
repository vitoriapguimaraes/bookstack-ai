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
                "cover_url": None,
                "average_rating": book_info.get("averageRating"),  # Nota média (0-5)
                "ratings_count": book_info.get("ratingsCount")     # Número de avaliações
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

def get_openlibrary_rating(title: str, author: str = None):
    """Busca rating do livro na Open Library API."""
    try:
        # Busca por título (e autor se disponível)
        search_query = title
        if author:
            search_query = f"{title} {author}"
        
        url = "https://openlibrary.org/search.json"
        params = {
            "q": search_query,
            "limit": 1
        }
        
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        if data.get("numFound", 0) > 0:
            book = data["docs"][0]
            
            # Open Library usa "ratings_average" (escala 1-5)
            rating = book.get("ratings_average")
            rating_count = book.get("ratings_count", 0)
            
            if rating and rating > 0:
                return {
                    "average_rating": round(rating, 2),
                    "ratings_count": rating_count,
                    "source": "Open Library"
                }
    except Exception as e:
        print(f"Erro ao buscar no Open Library: {e}")
    
    return None

def get_hybrid_rating(title: str, author: str = None, original_title: str = None):
    """
    Busca rating de forma híbrida:
    1. Tenta título em português no Google Books
    2. Se não encontrar, tenta título original no Google Books
    3. Se não encontrar, tenta título em português no Open Library
    4. Se não encontrar, tenta título original no Open Library
    """
    # Tenta Google Books com título em português
    google_data = get_google_books_data(title)
    if google_data and google_data.get("average_rating"):
        return {
            "average_rating": google_data["average_rating"],
            "ratings_count": google_data.get("ratings_count", 0),
            "source": "Google Books (PT)"
        }
    
    # Tenta Google Books com título original (se disponível)
    if original_title:
        google_data_original = get_google_books_data(original_title)
        if google_data_original and google_data_original.get("average_rating"):
            return {
                "average_rating": google_data_original["average_rating"],
                "ratings_count": google_data_original.get("ratings_count", 0),
                "source": "Google Books (Original)"
            }
    
    # Tenta Open Library com título em português
    openlibrary_data = get_openlibrary_rating(title, author)
    if openlibrary_data:
        openlibrary_data["source"] = "Open Library (PT)"
        return openlibrary_data
    
    # Tenta Open Library com título original (se disponível)
    if original_title:
        openlibrary_data_original = get_openlibrary_rating(original_title, author)
        if openlibrary_data_original:
            openlibrary_data_original["source"] = "Open Library (Original)"
            return openlibrary_data_original
    
    return None

# --- AI PROVIDERS ---

def get_groq_classification(prompt, system_prompt):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key: return None
    
    try:
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" },
            temperature=0.7
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Erro no Groq: {e}")
        return None

def get_gemini_classification(prompt, system_prompt):
    # Requires: pip install google-generativeai
    # Env: GEMINI_API_KEY
    try:
        import google.generativeai as genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key: 
            print("Erro: GEMINI_API_KEY não encontrada.")
            return None
            
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})
        
        full_prompt = f"{system_prompt}\n\nUSER PROMPT:\n{prompt}"
        response = model.generate_content(full_prompt)
        return json.loads(response.text)
    except ImportError:
        print("Erro: Biblioteca 'google-generativeai' não instalada.")
        return None
    except Exception as e:
        print(f"Erro no Gemini: {e}")
        return None

def get_openai_classification(prompt, system_prompt):
    # Requires: pip install openai
    # Env: OPENAI_API_KEY
    try:
        from openai import OpenAI
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key: return None
        
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" },
            temperature=0.7
        )
        return json.loads(response.choices[0].message.content)
    except ImportError:
        print("Erro: Biblioteca 'openai' não instalada.")
        return None
    except Exception as e:
        print(f"Erro na OpenAI: {e}")
        return None

def get_ai_classification(title: str, description: str = ""):
    """Usa IA (Provider configurável) para classificar o livro."""
    
    # Mapeamento de classes para categorias
    class_categories_str = "\n".join([
        f"- {cls}: {', '.join(cats)}" 
        for cls, cats in CLASS_CATEGORIES.items()
    ])
    
    system_prompt = "Você é um assistente literário especializado que conhece profundamente o perfil da leitora."
    
    prompt = f"""
PERFIL DA LEITORA:
Vitória é uma mulher de 30 anos, pansexual e profissional de tecnologia (Cientista de Dados e Desenvolvedora) com raízes na Engenharia Ambiental. Seu estilo de leitura é marcado pela busca de equilíbrio entre a densidade técnica e a sensibilidade humana. Ela não lê apenas para aprender uma sintaxe, mas para entender como a tecnologia e o comportamento humano se moldam. Como estudante contínua, ela valoriza o rigor técnico, mas sua lente de mundo é inclusiva, ética e focada em impacto coletivo.

LIVRO A ANALISAR:
Título: "{title}"
Descrição: "{description[:800]}"

TAREFA:
Analise este livro e retorne um JSON com:

1. "book_class" (string): Escolha UMA das 6 classes abaixo:
   - Tecnologia & IA
   - Desenvolvimento Pessoal
   - Negócios & Carreira
   - Ciência & Conhecimento
   - Ficção & Literatura
   - Engenharia & Arquitetura

2. "category" (string): Escolha UMA categoria específica dentro da classe escolhida.
   Atenção: Você DEVE escolher EXATAMENTE uma das opções listadas abaixo. NÃO INVENTE CATEGORIAS NOVAS.
   OPÇÕES VÁLIDAS:
{class_categories_str}

3. "type" (string): "Técnico" ou "Não Técnico"
   - Técnico: Programação, Data Science, Engenharia, Arquitetura de Software
   - Não Técnico: Desenvolvimento pessoal, ficção, negócios, comportamento

4. "motivation" (string): Uma frase reflexiva e autêntica (2-3 linhas) que explique por que este livro faz sentido para Vitória AGORA, aos 30 anos.

DIRETRIZES PARA A MOTIVAÇÃO:
- Informar o 'O quê': Resumir a tese central da obra de forma direta, sem rodeios
- Identificar a Motivação Técnica: Como fortalece sua base como dev/cientista de dados
- Identificar a Motivação Pessoal/Social: Conectar com sua fase de vida (maturidade, liderança, transição) e valores (respeito, autenticidade, impacto coletivo)
- Tom: Reflexivo, autêntico, levemente instigante. Fuja de clichês de 'gurus de produtividade'

ESTRUTURA IDEAL DA MOTIVAÇÃO:
"Este livro explora [eixo central] e faz total sentido para o momento da Vitória porque, enquanto oferece [benefício prático/técnico], também provoca uma reflexão necessária sobre [aspecto humano/comportamental/social], alinhando-se à sua busca por uma tecnologia mais consciente e uma liderança autêntica."

5. "original_title" (string): O título original do livro. IMPORTANTE: Se o título fornecido JA ESTIVER no idioma original (ex: Inglês), repita exatamente o mesmo título aqui. NÃO retorne null.

IMPORTANTE:
- Seja específico e relevante ao perfil dela
- Evite generalizações vazias
- Conecte tecnologia com humanidade
- Reconheça sua maturidade e experiência

Responda APENAS com um JSON válido no formato:
{{
  "book_class": "...",
  "category": "...",
  "type": "...",
  "motivation": "...",
  "original_title": "..."
}}
"""
    
    provider = os.getenv("AI_PROVIDER", "groq").lower()
    
    if provider == "gemini":
        return get_gemini_classification(prompt, system_prompt)
    elif provider == "openai":
        return get_openai_classification(prompt, system_prompt)
    else:
        return get_groq_classification(prompt, system_prompt)

def get_book_details_hybrid(title: str):
    """
    Solução híbrida: Google Books API + Open Library + Groq AI
    
    1. Google Books → author, year, description, cover_url
    2. Hybrid Rating (Google + Open Library) → average_rating, ratings_count
    3. Groq AI → book_class, category, type, motivation
    """
    result = {
        "author": None,
        "year": None,
        "book_class": "Desenvolvimento Pessoal",  # Default
        "type": "Não Técnico",
        "category": "Geral",
        "motivation": None,
        "cover_url": None,
        "google_rating": None,
        "google_ratings_count": None
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
    
    # 2. Busca rating de forma híbrida (Google Books + Open Library)
    rating_data = get_hybrid_rating(title, result.get("author"))
    if rating_data:
        result["google_rating"] = rating_data["average_rating"]
        result["google_ratings_count"] = rating_data.get("ratings_count", 0)
    
    # 3. Usa IA para classificação personalizada
    ai_data = get_ai_classification(title, description)
    if ai_data:
        result["book_class"] = ai_data.get("book_class", "Desenvolvimento Pessoal")
        result["type"] = ai_data.get("type", "Não Técnico")
        result["category"] = ai_data.get("category", "Geral")
        result["motivation"] = ai_data.get("motivation")
        result["original_title"] = ai_data.get("original_title")
        result["category"] = ai_data.get("category", "Geral")
        result["motivation"] = ai_data.get("motivation")
    
    return result
