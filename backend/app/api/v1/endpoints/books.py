from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlmodel import Session, select
from typing import List
from app.api.deps import get_current_user
from app.core.database import get_session
from app.models.book import Book
from app.models.user import UserPreference
from app.services.scoring import calculate_book_score
from app.services.book_enrichment import get_book_details_hybrid
import csv
import io
import time
from datetime import datetime

router = APIRouter()


def _get_ai_params(session: Session, user_id: str):
    """Helper: Retorna configurações de AI do usuário desserializadas."""
    from app.core.security import decrypt_value

    pref = session.get(UserPreference, user_id)
    if not pref:
        return {}, None, None

    api_keys = {}
    if pref.openai_key:
        api_keys["openai_key"] = decrypt_value(pref.openai_key)
    if pref.gemini_key:
        api_keys["gemini_key"] = decrypt_value(pref.gemini_key)
    if pref.groq_key:
        api_keys["groq_key"] = decrypt_value(pref.groq_key)

    if pref.preferred_provider:
        api_keys["ai_provider"] = pref.preferred_provider

    return api_keys, pref.custom_prompts, pref.class_categories


def _apply_enrichment(book: Book, enrichment: dict):
    """Helper: Aplica dados da IA no livro se os campos estiverem vazios."""
    if not enrichment:
        return

    if not book.author and enrichment.get("author"):
        book.author = enrichment.get("author")
    if not book.year and enrichment.get("year"):
        book.year = enrichment.get("year")

    # Map cover_image (from AI) to cover_image (Book Model)
    cover_candidate = enrichment.get("cover_image")
    if not book.cover_image and cover_candidate:
        book.cover_image = cover_candidate

    if not book.book_class and enrichment.get("book_class"):
        book.book_class = enrichment.get("book_class")
    if not book.category and enrichment.get("category"):
        book.category = enrichment.get("category")
    if not book.motivation and enrichment.get("motivation"):
        book.motivation = enrichment.get("motivation")
    if not book.original_title and enrichment.get("original_title"):
        book.original_title = enrichment.get("original_title")


def _reorder_delete(session: Session, user_id: str, deleted_order: int):
    """Decrementa ordem de todos os livros do USUÁRIO após o deletado."""
    if not deleted_order:
        return
    books = session.exec(
        select(Book).where(Book.order > deleted_order, Book.user_id == user_id)
    ).all()
    for book in books:
        book.order -= 1
        session.add(book)


def _reorder_insert(session: Session, user_id: str, new_order: int):
    """Incrementa ordem de todos os livros do USUÁRIO >= nova ordem."""
    if not new_order:
        return
    books = session.exec(
        select(Book).where(Book.order >= new_order, Book.user_id == user_id)
    ).all()
    for book in books:
        book.order += 1
        session.add(book)


def _reorder_move(
    session: Session, user_id: str, old_order: int, new_order: int, book_id: int
):
    """Ajusta a ordem dos livros entre a posição antiga e a nova."""
    if not (old_order and new_order and old_order != new_order):
        return

    stmt = select(Book).where(Book.user_id == user_id, Book.id != book_id)
    if new_order > old_order:
        stmt = stmt.where(Book.order > old_order, Book.order <= new_order)
        adjustment = -1
    else:
        stmt = stmt.where(Book.order >= new_order, Book.order < old_order)
        adjustment = 1

    books = session.exec(stmt).all()
    for book in books:
        book.order += adjustment
        session.add(book)


# --- CSV Import Helpers ---
def _parse_csv_content(content: bytes) -> csv.DictReader:
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    if reader.fieldnames:
        reader.fieldnames = [
            name.encode("utf-8").decode("utf-8-sig").strip().lower()
            for name in reader.fieldnames
        ]
    return reader


def _process_import_row(row: dict, session: Session, user_id: str, config: dict):
    if not row.get("title") or not row.get("author"):
        return False

    order_val = (
        int(row.get("order"))
        if row.get("order") and str(row.get("order")).isdigit()
        else 0
    )
    year_val = (
        int(row.get("year"))
        if row.get("year") and str(row.get("year")).isdigit()
        else None
    )

    book_data = {
        "user_id": user_id,
        "title": row.get("title"),
        "author": row.get("author"),
        "status": row.get("status", "Não lido"),
        "type": row.get("type", "Não Técnico"),
        "priority": row.get("priority", "1 - Baixa"),
        "format": row.get("format", "Físico"),
        "availability": row.get("availability", "Físico"),
        "category": row.get("category", "Geral"),
        "book_class": row.get("book_class", "Desenvolvimento Pessoal"),
        "year": year_val,
        "order": order_val,
    }

    new_book = Book(**book_data)
    new_book.score = calculate_book_score(new_book, config)

    if new_book.order > 0:
        _reorder_insert(session, user_id, new_book.order)

    session.add(new_book)
    return True


@router.get("/", response_model=List[Book])
def get_books(
    session: Session = Depends(get_session), user: dict = Depends(get_current_user)
):
    user_id = user["id"]
    return session.exec(
        select(Book).where(Book.user_id == user_id).order_by(Book.order)
    ).all()


@router.post("/", response_model=Book)
def create_book(
    book: Book,
    session: Session = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    user_id = user["id"]
    book.user_id = user_id

    # Populate AI fields if classification not provided
    if book.title and (not book.book_class or not book.category):
        api_keys, custom_prompts, class_categories = _get_ai_params(session, user_id)

        enrichment = get_book_details_hybrid(
            book.title, api_keys, custom_prompts, class_categories
        )

        _apply_enrichment(book, enrichment)

    # Get formula config
    pref = session.get(UserPreference, user_id)
    config = pref.formula_config if pref else None

    book.score = calculate_book_score(book, config)

    # Order management
    if book.status == "Lido":
        book.order = 0
    elif book.order is None or book.order == 0:
        # Default behavior: Append to end of list
        last_book = session.exec(
            select(Book).where(Book.user_id == user_id).order_by(Book.order.desc())
        ).first()
        book.order = (last_book.order + 1) if last_book and last_book.order else 1
    else:
        # Specific order requested (e.g. "Lendo" insertion): shift others down
        _reorder_insert(session, user_id, book.order)

    # Set created/updated
    book.created_at = datetime.utcnow()
    book.updated_at = datetime.utcnow()

    session.add(book)
    session.commit()
    session.refresh(book)
    return book


@router.put("/{book_id}", response_model=Book)
def update_book(
    book_id: int,
    book_data: Book,
    session: Session = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    user_id = user["id"]
    book = session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Livro não encontrado")
    if book.user_id != user_id:
        raise HTTPException(status_code=403, detail="Acesso negado")

    old_order = book.order
    new_order = book_data.order

    # Update fields
    book_data_dict = book_data.dict(exclude_unset=True)
    for key, value in book_data_dict.items():
        if key not in ["id", "user_id", "created_at"]:  # Protect ID and ownership
            setattr(book, key, value)

    # Re-calculate score
    pref = session.get(UserPreference, user_id)
    config = pref.formula_config if pref else None
    book.score = calculate_book_score(book, config)
    book.updated_at = datetime.utcnow()

    # Reorder if changed
    if new_order and new_order != old_order:
        _reorder_move(session, user_id, old_order, new_order, book_id)

    session.add(book)
    session.commit()
    session.refresh(book)
    return book


@router.delete("/{book_id}")
def delete_book(
    book_id: int,
    session: Session = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    user_id = user["id"]
    book = session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Livro não encontrado")
    if book.user_id != user_id:
        raise HTTPException(status_code=403, detail="Acesso negado")

    deleted_order = book.order
    session.delete(book)
    _reorder_delete(session, user_id, deleted_order)

    session.commit()
    return {"ok": True}


@router.post("/reorder_all")
def reorder_all_books(
    books: List[Book],
    session: Session = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    user_id = user["id"]
    # Verify ownership of all (basic check)
    for b in books:
        if b.user_id != user_id:
            continue  # Skip or error? Safe to skip/ignore invalid

        db_book = session.get(Book, b.id)
        if db_book and db_book.user_id == user_id:
            db_book.order = b.order
            session.add(db_book)

    session.commit()
    return {"message": "Reordenação concluída"}


@router.post("/import_csv")
async def import_books_csv(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Por favor envie um arquivo .csv")

    content = await file.read()
    try:
        reader = _parse_csv_content(content)
    except Exception:
        raise HTTPException(
            status_code=400, detail="Erro ao ler CSV. Verifique o formato."
        )

    user_id = user["id"]
    pref = session.get(UserPreference, user_id)
    config = pref.formula_config if pref else None

    count = 0
    for row in reader:
        if _process_import_row(row, session, user_id, config):
            count += 1

    session.commit()
    return {"message": f"{count} livros importados com sucesso!"}


class SuggestRequest(BaseModel):
    title: str


@router.post("/suggest")
def suggest_book(
    request: SuggestRequest,
    session: Session = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    """
    Endpoint dedicado para sugestão de metadados via IA sem salvar o livro.
    Retorna o objeto com dados preenchidos para o frontend usar.
    """
    user_id = user["id"]
    api_keys, custom_prompts, class_categories = _get_ai_params(session, user_id)

    enrichment = get_book_details_hybrid(
        request.title, api_keys, custom_prompts, class_categories
    )

    if enrichment and enrichment.get("error"):
        return {"error": enrichment.get("error")}

    if not enrichment:
        return {"error": "Não foi possível encontrar dados para este livro."}

    return enrichment


@router.post("/{book_id}/cover", response_model=Book)
async def upload_book_cover(
    book_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    from app.core.storage import upload_file_to_bucket

    book = session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.user_id != user["id"]:
        raise HTTPException(status_code=403, detail="Acesso negado")

    try:
        file_ext = file.filename.split(".")[-1]
        filename = f"{user['id']}/{book_id}_{int(time.time())}.{file_ext}"
        file_content = await file.read()

        # Upload using helper (handles bucket creation)
        public_url = upload_file_to_bucket(
            "book-covers", filename, file_content, file.content_type
        )

        book.cover_image = public_url
        session.add(book)
        session.commit()
        session.refresh(book)
        return book

    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/toread")
def get_toread_stats(
    session: Session = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    """
    Returns average scores for Q1-Q4 quadrants of the 'A Ler' (To Read) list.
    Q1 = Top 25% (Highest Priority/Score)
    Q4 = Bottom 25% (Lowest Priority/Score)
    """
    user_id = user["id"]

    # Get all "To Read" books sorted by current order
    books = session.exec(
        select(Book)
        .where(Book.user_id == user_id, Book.status == "A Ler")
        .order_by(Book.order)
    ).all()

    if not books:
        return {"q1": 0, "q2": 0, "q3": 0, "q4": 0, "total": 0}

    total = len(books)
    scores = [b.score for b in books]

    # Divide into 4 chunks based on list position (Order)
    # Since they are ordered, first chunk is Q1 (top of stack)
    q_size = total / 4

    def get_avg(start_idx, end_idx):
        start = int(start_idx)
        end = int(end_idx)
        if start >= total:
            return 0
        segment = scores[start:end] if end > start else scores[start : start + 1]
        return round(sum(segment) / len(segment), 1) if segment else 0

    return {
        "q1": get_avg(0, q_size),
        "q2": get_avg(q_size, q_size * 2),
        "q3": get_avg(q_size * 2, q_size * 3),
        "q4": get_avg(q_size * 3, total),
        "total": total,
    }


@router.post("/preview-score")
def preview_score(
    book_data: Book,
    session: Session = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    """
    Calculates the score for a book without saving it.
    Useful for 'Live Preview' in frontend.
    """
    user_id = user["id"]

    # Get user formula config
    pref = session.get(UserPreference, user_id)
    config = pref.formula_config if pref else None

    # Calculate score
    # Note: We create a temporary Book object from the input data to pass to the calculator
    temp_book = Book(**book_data.dict(exclude_unset=True))
    score = calculate_book_score(temp_book, config)

    return {"score": score}
