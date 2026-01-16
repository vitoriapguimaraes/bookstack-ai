import json
import os
from .scoring import CLASS_CATEGORIES

# AI Keys should be passed in, not reading env here necessarily unless fallback.
# Providers import
from groq import Groq


def get_gemini_classification(prompt, system_prompt, api_keys=None):
    try:
        import google.generativeai as genai

        api_key = (api_keys or {}).get("gemini_key") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {"error": "GEMINI_API_KEY não configurada"}

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            "gemini-1.5-flash",
            generation_config={"response_mime_type": "application/json"},
        )

        full_prompt = f"{system_prompt}\n\nUSER PROMPT:\n{prompt}"
        response = model.generate_content(full_prompt)
        return json.loads(response.text)
    except Exception as e:
        return {"error": f"Erro Gemini: {str(e)}"}


def get_openai_classification(prompt, system_prompt, api_keys=None):
    try:
        from openai import OpenAI

        api_key = (api_keys or {}).get("openai_key") or os.getenv("OPENAI_API_KEY")
        if not api_key:
            return {"error": "OPENAI_API_KEY não configurada"}

        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt + " Responda estritamente em JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        return {"error": f"Erro OpenAI: {str(e)}"}


def get_groq_classification(prompt, system_prompt, api_keys=None):
    api_key = (api_keys or {}).get("groq_key") or os.getenv("GROQ_API_KEY")
    if not api_key:
        return {"error": "GROQ_API_KEY não configurada"}

    try:
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt + " Responda estritamente em JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        return {"error": f"Erro Groq: {str(e)}"}


def get_ai_classification(
    title: str,
    description: str = "",
    api_keys: dict = None,
    custom_prompts: dict = None,
    class_categories: dict = None,
):
    current_mapping = (
        class_categories
        if class_categories and len(class_categories) > 0
        else CLASS_CATEGORIES
    )

    class_categories_str = "\n".join(
        [f"- {cls}: {', '.join(cats)}" for cls, cats in current_mapping.items()]
    )
    valid_classes_str = "\n".join([f"   - {cls}" for cls in current_mapping.keys()])

    system_prompt = (custom_prompts or {}).get(
        "system_prompt"
    ) or "Você é um assistente literário especializado."

    user_prompt_template = (custom_prompts or {}).get("user_prompt")
    if user_prompt_template:
        prompt = f'{user_prompt_template}\n\nLIVRO A ANALISAR:\nTítulo: "{title}"\nDescrição: "{description[:800]}"'
    else:
        # Simplificando prompt para economizar espaço tokens na refatoracao
        # Mantenha o original se critico, mas aqui vou usar o que estava no utils original.
        prompt = f"""
PERFIL DO USUÁRIO:
[NOME/PERSONA]: [Idade, profissão e principais áreas de interesse]
[OBJETIVO DE LEITURA]: [O que você busca ao ler um livro?]
[LENTE DE MUNDO]: [Quais valores ou perspectivas você aplica?]

LIVRO A ANALISAR:
Título: "{title}"
Descrição: "{description[:800]}"

PROCESSO DE RACIOCÍNIO OBRIGATÓRIO:
1. Primeiro, defina a "book_class" (Classe Macro) adequada.
2. Depois, consulte a lista de categorias APENAS dessa classe específica.
3. Escolha a "category" (Subcategoria) a partir dessa lista restrita.

1. "book_class" (string): Escolha UMA das classes abaixo.
{valid_classes_str}

2. "category" (string): Escolha UMA categoria específica válida para a classe selecionada.
{class_categories_str}

3. "type" (string): "Técnico" ou "Não Técnico"
4. "motivation" (string): Frase reflexiva (2-3 linhas).
5. "original_title" (string): O título original.

Responda APENAS com um JSON válido:
{{
  "book_class": "...",
  "category": "...",
  "type": "...",
  "motivation": "...",
  "original_title": "..."
}}
"""

    preferred_provider = (api_keys or {}).get("ai_provider", "groq").lower()
    if preferred_provider not in ["openai", "gemini", "groq"]:
        preferred_provider = os.getenv("AI_PROVIDER", "groq").lower()

    providers = []
    # Simplified priority list
    p_map = {
        "gemini": [
            get_gemini_classification,
            get_groq_classification,
            get_openai_classification,
        ],
        "openai": [
            get_openai_classification,
            get_gemini_classification,
            get_groq_classification,
        ],
        "groq": [
            get_groq_classification,
            get_gemini_classification,
            get_openai_classification,
        ],
    }
    providers = p_map.get(preferred_provider, p_map["groq"])

    errors = []
    print(f"Tentando classificar com {preferred_provider.upper()}...")

    for provider_func in providers:
        res = provider_func(prompt, system_prompt, api_keys)
        if isinstance(res, dict) and "error" in res:
            errors.append(f"{provider_func.__name__}: {res['error']}")
            continue
        if not res:
            errors.append(f"{provider_func.__name__}: Retorno vazio")
            continue

        print(f"Sucesso com {provider_func.__name__}")
        return res

    return {"error": f"Falha em todas as IAs. {' | '.join(errors)}"}
