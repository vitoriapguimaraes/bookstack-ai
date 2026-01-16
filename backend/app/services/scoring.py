from app.models.book import Book

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
    "História/Ficção": 7,
    "Diversidade e inclusão": 3,
    "Negócios": 2,
    "Finanças pessoais": 4,
    "Conhecimento geral": 7,
    "Estatística": 7,
    "MLOps": 5,
    "Engenharia de dados": 5,
    "Arquitetura de Software": 1,
    "Programação": 3,
    "Machine learning": 7,
    "Visão computacional": 7,
    "IA": 6,
    "Data science": 7,
    "Análise de Dados": 5,
    "Liderança & Pensamento Estratégico": 7,
    "Arquitetura da Mente (Mindset)": 7,
    "Sistemas de IA & LLMs": 6,
    "Storytelling & Visualização": 5,
    "Biohacking & Existência": 5,
    "Épicos & Ficção Reflexiva": 7,
    "Justiça Social & Interseccionalidade": 3,
    "Liberdade Econômica": 4,
    "Cosmologia": 7,
    "Estatística & Incerteza": 7,
    "Engenharia de ML & MLOps": 5,
}

DEFAULT_AVAILABILITY_OPTIONS = ["Físico", "Virtual", "Desejado", "Emprestado", "N/A"]

# Hierarchical classification: Classes and their Categories
CLASS_CATEGORIES = {
    "Tecnologia & IA": [
        "Análise de Dados",
        "Data Science",
        "IA",
        "Visão Computacional",
        "Machine Learning",
        "Programação",
        "Sistemas de IA & LLMs",
    ],
    "Engenharia & Arquitetura": [
        "Arquitetura de Software",
        "Arquitetura da Mente (Mindset)",
        "Engenharia de Dados",
        "MLOps",
        "Engenharia de ML & MLOps",
    ],
    "Conhecimento & Ciências": [
        "Conhecimento Geral",
        "Estatística",
        "Estatística & Incerteza",
        "Cosmologia",
    ],
    "Negócios & Finanças": ["Finanças Pessoais", "Negócios", "Liberdade Econômica"],
    "Literatura & Cultura": [
        "Diversidade e Inclusão",
        "História/Ficção",
        "Literatura Brasileira",
        "Épicos & Ficção Reflexiva",
        "Justiça Social & Interseccionalidade",
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
        "Geral",  # Fallback category
    ],
}


def get_class_from_category(category: str) -> str:
    """Returns the class for a given category."""
    for book_class, categories in CLASS_CATEGORIES.items():
        if category in categories:
            return book_class
    return "Desenvolvimento Pessoal"  # Default fallback


def _get_year_score(year: int, weights_year: dict) -> float:
    """Calcula pontuação baseada no ano de publicação."""
    if not year:
        return 0.0

    for r in weights_year.get("ranges", []):
        if "min" in r and "max" in r:
            if r["min"] <= year <= r["max"]:
                return r["weight"]
        elif "max" in r:
            if year <= r["max"]:
                return r["weight"]
        elif "min" in r:
            if year >= r["min"]:
                return r["weight"]
    return 0.0


def _get_category_score(category: str, weights_category: dict) -> float:
    """Calcula pontuação baseada na categoria (match exato ou parcial)."""
    if not category:
        return 0.0

    # Tenta match exato primeiro
    score = weights_category.get(category, 0)
    if score != 0:
        return score

    # Se não encontrou match exato, tenta match parcial
    for cat_name, weight in weights_category.items():
        if cat_name.lower() in category.lower() or category.lower() in cat_name.lower():
            return weight
    return 0.0


def calculate_book_score(book: Book, config: dict = None) -> float:
    """
    Calcula o score do livro baseado na fórmula personalizada ou padrão (Excel).
    config: Dicionário opcional com pesos personalizados.
    """

    if book.status == "Lido":
        return 0.0

    if not config:
        config = {}

    weights_type = config.get("type", {"Técnico": 0, "default": 0})
    weights_availability = config.get("availability", {"Estante": 0, "default": 0})
    weights_priority = config.get(
        "priority", {"1 - Baixa": 0, "2 - Média": 0, "3 - Média-Alta": 0, "4 - Alta": 0}
    )
    weights_year = config.get(
        "year",
        {
            "ranges": [
                {"max": 2005, "weight": 0},
                {"min": 2006, "max": 2021, "weight": 0},
                {"min": 2022, "weight": 0},
            ]
        },
    )

    weights_class = config.get("book_class", {})

    if "category" in config:
        weights_category = config["category"]
    else:
        weights_category = CATEGORY_WEIGHTS

    score = 0.0
    score += weights_type.get(book.type, weights_type.get("default", 2))

    if book.availability == "Físico":
        score += weights_availability.get("Físico", 2)
    else:
        score += weights_availability.get("default", 0)

    score += weights_priority.get(book.priority, 0)
    score += _get_year_score(book.year, weights_year)

    if hasattr(book, "book_class") and book.book_class:
        score += weights_class.get(book.book_class, 0)

    score += _get_category_score(book.category, weights_category)

    return score
