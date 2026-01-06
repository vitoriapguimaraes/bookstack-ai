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


def calculate_book_score(book: Book, config: dict = None) -> float:
    """
    Calcula o score do livro baseado na fórmula personalizada ou padrão (Excel).
    config: Dicionário opcional com pesos personalizados.
    """
    
    # Se o livro já foi lido, score = 0 (conforme fórmula Excel)
    if book.status == "Lido":
        return 0.0
    
    # Default Config (Formula Original)
    if not config:
        config = {}

    weights_type = config.get('type', {"Técnico": 4, "default": 2})
    weights_availability = config.get('availability', {"Estante": 2, "default": 0})
    weights_priority = config.get('priority', {"1 - Baixa": 1, "2 - Média": 4, "3 - Média-Alta": 7, "4 - Alta": 10})
    weights_year = config.get('year', {
        "ranges": [
            {"max": 2005, "weight": 4},
            {"min": 2006, "max": 2021, "weight": 7},
            {"min": 2022, "weight": 9}
        ]
    })
    
    # New Weights for Class and Category
    weights_class = config.get('book_class', {})
    
    # Merge Default CATEGORY_WEIGHTS if not present in config, or use config as primary
    # If the user has saved a config, 'category' key will exist (even if empty).
    # If it's a fresh/legacy call without any user pref, config is empty {}, so we rely on global defaults.
    if 'category' in config:
        weights_category = config['category']
    else:
        weights_category = CATEGORY_WEIGHTS

    score = 0.0
    
    # 1. Tipo (E212)
    score += weights_type.get(book.type, weights_type.get('default', 2))
        
    # 2. Disponibilidade (H212)
    if book.availability == "Estante":
        score += weights_availability.get('Estante', 2)
    else:
        score += weights_availability.get('default', 0)
        
    # 3. Prioridade (F212)
    score += weights_priority.get(book.priority, 0)
    
    # 4. Ano (D212)
    if book.year:
        year_weight = 0
        for r in weights_year.get('ranges', []):
            if 'min' in r and 'max' in r:
                if r['min'] <= book.year <= r['max']:
                    year_weight = r['weight']
                    break
            elif 'max' in r:
                if book.year <= r['max']:
                    year_weight = r['weight']
                    break
            elif 'min' in r:
                if book.year >= r['min']:
                    year_weight = r['weight']
                    break
        score += year_weight
            
    # 5. Classe (Novo)
    if hasattr(book, 'book_class') and book.book_class:
        score += weights_class.get(book.book_class, 0)

    # 6. Categoria (I212) - Updated to use dynamic weights
    # Tenta match exato primeiro
    category_score = weights_category.get(book.category, 0)
    
    # Se não encontrou match exato, tenta match parcial (apenas se book.category existe)
    if category_score == 0 and book.category:
        for cat_name, weight in weights_category.items():
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

def get_gemini_classification(prompt, system_prompt, api_keys=None):
    # Requires: pip install google-generativeai
    # Env: GEMINI_API_KEY
    try:
        import google.generativeai as genai
        # Prefer provided key, fallback to env
        api_key = (api_keys or {}).get("gemini_key") or os.getenv("GEMINI_API_KEY")
        
        if not api_key: 
            return {"error": "GEMINI_API_KEY não configurada"}
            
        genai.configure(api_key=api_key)
        # Fallback to 'gemini-pro' if flash is not found or deprecated
        model = genai.GenerativeModel('gemini-pro', generation_config={"response_mime_type": "application/json"})
        
        full_prompt = f"{system_prompt}\n\nUSER PROMPT:\n{prompt}"
        response = model.generate_content(full_prompt)
        return json.loads(response.text)
    except ImportError:
        return {"error": "Biblioteca 'google-generativeai' não instalada"}
    except Exception as e:
        return {"error": f"Erro Gemini: {str(e)}"}

def get_openai_classification(prompt, system_prompt, api_keys=None):
    # Requires: pip install openai
    # Env: OPENAI_API_KEY
    try:
        from openai import OpenAI
        # Prefer provided key, fallback to env
        api_key = (api_keys or {}).get("openai_key") or os.getenv("OPENAI_API_KEY")
        
        if not api_key: return {"error": "OPENAI_API_KEY não configurada"}
        
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
        return {"error": "Biblioteca 'openai' não instalada"}
    except Exception as e:
        return {"error": f"Erro OpenAI: {str(e)}"}

def get_groq_classification(prompt, system_prompt, api_keys=None):
    # Prefer provided key, fallback to env
    api_key = (api_keys or {}).get("groq_key") or os.getenv("GROQ_API_KEY")
    
    if not api_key: return {"error": "GROQ_API_KEY não configurada"}
    
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
        return {"error": f"Erro Groq: {str(e)}"}

def get_ai_classification(title: str, description: str = "", api_keys: dict = None, custom_prompts: dict = None):
    """Usa IA (Provider configurável com Fallback) para classificar o livro."""
    
    # Mapeamento de classes para categorias
    class_categories_str = "\n".join([
        f"- {cls}: {', '.join(cats)}" 
        for cls, cats in CLASS_CATEGORIES.items()
    ])
    
    system_prompt = (custom_prompts or {}).get("system_prompt") or "Você é um assistente literário especializado que conhece profundamente o perfil da leitora."
    
    user_prompt_template = (custom_prompts or {}).get("user_prompt")
    if user_prompt_template:
        # Replace placeholders if any, but since it's a template we just append the book info or expect specific format
        # For now, let's keep it simple: if custom user_prompt exists, use it as the base prompt
        prompt = f"{user_prompt_template}\n\nLIVRO A ANALISAR:\nTítulo: \"{title}\"\nDescrição: \"{description[:800]}\""
    else:
        prompt = f"""
PERFIL DA LEITORA:
Vitória é uma mulher de 30 anos, pansexual e profissional de tecnologia (Cientista de Dados e Desenvolvedora) com raízes na Engenharia Ambiental. Seu estilo de leitura é marcado pela busca de equilíbrio entre a densidade técnica e a sensibilidade humana. Ela não lê apenas para aprender uma sintaxe, mas para entender como a tecnologia e o comportamento humano se moldam. Como estudante contínua, ela valoriza o rigor técnico, mas sua lente de mundo é inclusiva, ética e focada em impacto coletivo.

LIVRO A ANALISAR:
Título: "{title}"
Descrição: "{description[:800]}"

PROCESSO DE RACIOCÍNIO OBRIGATÓRIO:
1. Primeiro, defina a "book_class" (Classe Macro) adequada.
2. Depois, consulte a lista de categorias APENAS dessa classe específica.
3. Escolha a "category" (Subcategoria) a partir dessa lista restrita.

1. "book_class" (string): Escolha UMA das classes abaixo.
   ATENÇÃO: Use EXACTAMENTE a string da classe. NÃO INVENTE ou modifique.
   OPÇÕES VÁLIDAS:
   - Tecnologia & IA
   - Desenvolvimento Pessoal
   - Negócios & Finanças
   - Conhecimento & Ciências
   - Literatura & Cultura
   - Engenharia & Arquitetura

2. "category" (string): Escolha UMA categoria específica válida para a classe que você escolheu no passo anterior.
   CRÍTICO: A categoria DEVE pertencer à classe selecionada.
   
   TABELA DE REFERÊNCIA (CLASSE -> CATEGORIAS):
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
    
    preferred_provider = (api_keys or {}).get("ai_provider", "groq").lower()
    # Fallback to env var if key not in dict, or if just relying on system default
    if preferred_provider not in ["openai", "gemini", "groq"]:
        preferred_provider = os.getenv("AI_PROVIDER", "groq").lower()

    providers = []
    # Order providers: Preferred first, then others
    if preferred_provider == "gemini":
        providers = [get_gemini_classification, get_groq_classification, get_openai_classification]
    elif preferred_provider == "openai":
        providers = [get_openai_classification, get_gemini_classification, get_groq_classification]
    else: # Groq or default
        providers = [get_groq_classification, get_gemini_classification, get_openai_classification]
        
    errors = []
    
    print(f"Tentando classificar com {preferred_provider.upper()}...")
    
    for provider_func in providers:
        res = provider_func(prompt, system_prompt, api_keys)
        
        # Se retornou dicionário com 'error', registramos e continuamos
        if isinstance(res, dict) and "error" in res:
            error_msg = f"{provider_func.__name__}: {res['error']}"
            print(error_msg)
            errors.append(error_msg)
            continue
            
        # Se retornou None ou vazio (caso antigo), também continuamos
        if not res:
            errors.append(f"{provider_func.__name__}: Retorno vazio")
            continue

        # Se chegou aqui, é sucesso (JSON válido)
        print(f"Sucesso com {provider_func.__name__}")
        return res

    # Se saiu do loop, tudo falhou
    print("Todas as IAs falharam.")
    error_summary = " | ".join(errors)
    return {"error": f"Falha em todas as IAs. Detalhes: {error_summary}"}

def get_book_details_hybrid(title: str, api_keys: dict = None, custom_prompts: dict = None):
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
    ai_data = get_ai_classification(title, description, api_keys, custom_prompts)
    if ai_data:
        result["book_class"] = ai_data.get("book_class", "Desenvolvimento Pessoal")
        result["type"] = ai_data.get("type", "Não Técnico")
        result["category"] = ai_data.get("category", "Geral")
        result["motivation"] = ai_data.get("motivation")
        result["original_title"] = ai_data.get("original_title")
        result["category"] = ai_data.get("category", "Geral")
        result["motivation"] = ai_data.get("motivation")
    
    return result
