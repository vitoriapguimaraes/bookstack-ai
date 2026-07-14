import os
import json
from typing import TypedDict, Optional
from langgraph.graph import StateGraph, START, END
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from app.services.metadata import get_google_books_data, get_hybrid_rating, get_openlibrary_data
from app.services.scoring import CLASS_CATEGORIES

class BookGraphState(TypedDict):
    title: str
    author: Optional[str]
    year: Optional[int]
    abstract: Optional[str]
    book_class: Optional[str]
    type: Optional[str]
    category: Optional[str]
    motivation: Optional[str]
    original_title: Optional[str]
    google_rating: Optional[float]
    google_ratings_count: Optional[int]
    cover_image: Optional[str]
    error: Optional[str]
    api_keys: dict
    custom_prompts: dict
    class_categories: dict


def fetch_book_data(state: BookGraphState) -> dict:
    title = state["title"]
    author = state.get("author")

    google_data = get_google_books_data(title, author)
    openlib_data = get_openlibrary_data(title, author) or {}
    
    if not google_data and not openlib_data.get("year"):
        return {"error": "Não foi possível encontrar dados para este livro."}

    google_data = google_data or {}
    return {
        "author": google_data.get("author") or author,
        "year": openlib_data.get("year") or google_data.get("year"),
        "abstract": google_data.get("description", ""),
        "cover_image": google_data.get("cover_image"),
        "original_title": openlib_data.get("original_title") or google_data.get("subtitle", "") or google_data.get("original_title", "") or title,
    }


def fetch_ratings(state: BookGraphState) -> dict:
    rating_data = get_hybrid_rating(state["title"], state.get("author"))
    if rating_data:
        return {
            "google_rating": rating_data.get("average_rating"),
            "google_ratings_count": rating_data.get("ratings_count", 0),
        }
    return {}


def impute_classification(state: BookGraphState) -> dict:
    if state.get("error"):
        return {}

    groq_key = state.get("api_keys", {}).get("groq_key") or os.getenv("GROQ_API_KEY")
    if not groq_key:
        return {"error": "GROQ_API_KEY não configurada"}

    current_mapping = state.get("class_categories") or CLASS_CATEGORIES
    class_categories_str = "\n".join(
        [f"- {cls}: {', '.join(cats)}" for cls, cats in current_mapping.items()]
    )
    valid_classes_str = "\n".join([f"   - {cls}" for cls in current_mapping.keys()])

    llm = ChatGroq(
        temperature=0.2, groq_api_key=groq_key, model_name="llama-3.3-70b-versatile"
    ).bind(response_format={"type": "json_object"})

    prompt = PromptTemplate.from_template(
        "Você é um assistente literário especializado.\n"
        "LIVRO A ANALISAR:\n"
        'Título: "{title}"\n'
        'Resumo: "{abstract}"\n\n'
        "INSTRUÇÕES OBRIGATÓRIAS:\n"
        "1. 'book_class': Escolha UMA das classes:\n{valid_classes}\n"
        "2. 'category': Escolha UMA subcategoria válida para a classe selecionada:\n{class_categories}\n"
        "3. 'type': 'Técnico' ou 'Não Técnico'\n\n"
        "Responda APENAS um JSON válido contendo as chaves 'book_class', 'category' e 'type'."
    )

    chain = prompt | llm
    try:
        response = chain.invoke(
            {
                "title": state["title"],
                "abstract": str(state.get("abstract", ""))[:1500],
                "valid_classes": valid_classes_str,
                "class_categories": class_categories_str,
            }
        )
        parsed = json.loads(response.content)
        return {
            "book_class": parsed.get("book_class"),
            "category": parsed.get("category"),
            "type": parsed.get("type"),
        }
    except Exception as e:
        return {"error": f"Erro de classificação IA: {str(e)}"}


def write_motivation(state: BookGraphState) -> dict:
    if state.get("error"):
        return {}

    groq_key = state.get("api_keys", {}).get("groq_key") or os.getenv("GROQ_API_KEY")
    if not groq_key:
        return {}

    llm = ChatGroq(
        temperature=0.7, groq_api_key=groq_key, model_name="llama-3.1-8b-instant"
    ).bind(response_format={"type": "json_object"})

    prompt = PromptTemplate.from_template(
        "Você é um assistente literário.\n"
        "LIVRO A ANALISAR:\n"
        'Título: "{title}"\n'
        'Resumo: "{abstract}"\n\n'
        "Escreva 2 a 3 frases diretas e específicas explicando por que ler ESTE livro. "
        "O que ele ensina de concreto? Foque no diferencial único.\n"
        "REGRAS VITAIS:\n"
        "- NÃO repita o nome do livro na resposta.\n"
        "- NÃO use aspas, nem inicie com 'Este livro...'.\n"
        "- Escreva em prosa corrida e vá direto ao ponto e ao argumento.\n"
        "Retorne APENAS um JSON com a chave 'motivation' contendo a sua resposta."
    )

    chain = prompt | llm
    try:
        response = chain.invoke(
            {"title": state["title"], "abstract": str(state.get("abstract", ""))[:1500]}
        )
        parsed = json.loads(response.content)
        return {"motivation": parsed.get("motivation")}
    except Exception:
        return {}


def should_continue(state: BookGraphState):
    if state.get("error"):
        return END
    return "fetch_ratings"


def build_graph():
    builder = StateGraph(BookGraphState)
    builder.add_node("fetch_book_data", fetch_book_data)
    builder.add_node("fetch_ratings", fetch_ratings)
    builder.add_node("impute_classification", impute_classification)
    builder.add_node("write_motivation", write_motivation)

    builder.add_edge(START, "fetch_book_data")
    builder.add_conditional_edges("fetch_book_data", should_continue)
    builder.add_edge("fetch_ratings", "impute_classification")
    builder.add_edge("impute_classification", "write_motivation")
    builder.add_edge("write_motivation", END)

    return builder.compile()


def get_book_details_langgraph(
    title: str,
    author: str = None,
    api_keys: dict = None,
    custom_prompts: dict = None,
    class_categories: dict = None,
) -> dict:
    graph = build_graph()
    initial_state = {
        "title": title,
        "author": author,
        "api_keys": api_keys or {},
        "custom_prompts": custom_prompts or {},
        "class_categories": class_categories or {},
    }

    result = graph.invoke(initial_state)

    if result.get("error") and not result.get("abstract"):
        return {"error": result["error"]}

    ret = {
        "author": result.get("author"),
        "year": result.get("year"),
        "book_class": result.get("book_class", "Desenvolvimento Pessoal"),
        "type": result.get("type", "Não Técnico"),
        "category": result.get("category", "Geral"),
        "motivation": result.get("motivation"),
        "cover_image": result.get("cover_image"),
        "original_title": result.get("original_title"),
        "google_rating": result.get("google_rating"),
        "google_ratings_count": result.get("google_ratings_count"),
    }

    if result.get("error"):
        return {"error": result["error"], "partial_result": ret}

    return ret
