from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
import shutil
import time
from datetime import datetime
from pathlib import Path
from sqlmodel import Session, select
from typing import List
from database import create_db_and_tables, get_session
from models import Book
from utils import calculate_book_score, get_book_details_hybrid
from auth import get_current_user
import requests
import csv
import io
import codecs
from pydantic import BaseModel
from models_preferences import UserPreference, Profile
from security import encrypt_value, decrypt_value

class TitleRequest(BaseModel):
    title: str

app = FastAPI(title="Reading List API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory to serve static files (images)
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


def reorder_books(session: Session, operation: str, user_id: str, **kwargs):
    """
    Reorganiza a ordem dos livros baseado na operação.
    
    Args:
        operation: 'delete', 'insert', 'move'
        kwargs: parâmetros específicos da operação
    """
    if operation == 'delete':
        deleted_order = kwargs.get('deleted_order')
        if deleted_order:
            # Decrementa ordem de todos os livros do USUÁRIO após o deletado
            books = session.exec(
                select(Book).where(Book.order > deleted_order, Book.user_id == user_id)
            ).all()
            for book in books:
                book.order -= 1
                session.add(book)
    
    elif operation == 'insert':
        new_order = kwargs.get('new_order')
        if new_order:
            # Incrementa ordem de todos os livros do USUÁRIO >= nova ordem
            books = session.exec(
                select(Book).where(Book.order >= new_order, Book.user_id == user_id)
            ).all()
            for book in books:
                book.order += 1
                session.add(book)
    
    elif operation == 'move':
        old_order = kwargs.get('old_order')
        new_order = kwargs.get('new_order')
        book_id = kwargs.get('book_id')  # ID do livro sendo movido
        
        if old_order and new_order and old_order != new_order:
            if new_order > old_order:
                # Movendo para baixo: decrementar ordens entre old e new
                books = session.exec(
                    select(Book).where(
                        Book.order > old_order,
                        Book.order <= new_order,
                        Book.id != book_id,
                        Book.user_id == user_id
                    )
                ).all()
                for book in books:
                    book.order -= 1
                    session.add(book)
            else:
                # Movendo para cima: incrementar ordens entre new e old
                books = session.exec(
                    select(Book).where(
                        Book.order >= new_order,
                        Book.order < old_order,
                        Book.id != book_id,
                        Book.user_id == user_id
                    )
                ).all()
                for book in books:
                    book.order += 1
                    session.add(book)


@app.post("/books/suggest")
def suggest_book_details(request: TitleRequest, session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    # Need user context to get API Keys
    pref = session.get(UserPreference, user['id'])
    api_keys = get_decrypted_api_keys(pref)
    
    details = get_book_details_hybrid(request.title, api_keys)
    if not details:
        raise HTTPException(status_code=500, detail="Failed to get suggestions")
    return details

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/")
def read_root():
    return {"message": "Reading List API is Running! 🚀"}

@app.get("/books/", response_model=List[Book])
def read_books(session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    # Filter by user_id
    books = session.exec(select(Book).where(Book.user_id == user['id'])).all()
    return books


# Helper to get decrypted API keys dict
def get_decrypted_api_keys(pref: UserPreference) -> dict:
    if not pref: return {}
    return {
        "openai_key": decrypt_value(pref.openai_key),
        "gemini_key": decrypt_value(pref.gemini_key),
        "groq_key": decrypt_value(pref.groq_key),
        "ai_provider": "groq" # TODO: Add preference field for provider later if needed
    }

# ... (inside endpoints) ...

@app.post("/books/", response_model=Book)
def create_book(book: Book, session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    # Set owner
    book.user_id = user['id']
    
    # Fetch user preferences for formula config and keys
    pref = session.get(UserPreference, user['id'])
    config = pref.formula_config if pref else None
    api_keys = get_decrypted_api_keys(pref)

    # Auto-calculate score (now possibly using keys in utils, though currently utils uses env, we will fix utils next)
    # Right now calculate_book_score doesn't take keys, but get_ai_classification inside import/suggest does.
    # Actually calculate_book_score is pure math. AI classification happens in Suggest or Import.
    
    book.score = calculate_book_score(book, config)
    
    # Reordenar se tem ordem definida (inserir e empurrar outros)
    if book.order:
        reorder_books(session, 'insert', user_id=user['id'], new_order=book.order)
    
    session.add(book)
    session.commit()
    session.refresh(book)
    return book

# ...

@app.put("/books/{book_id}", response_model=Book)
def update_book(book_id: int, book_data: Book, session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    # ... existing ownership check ...
    book = session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Ownership Check
    if book.user_id != user['id']:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    old_order = book.order 
    
    # Update fields manually
    book.title = book_data.title
    book.original_title = book_data.original_title
    book.author = book_data.author
    book.year = book_data.year
    book.type = book_data.type
    book.priority = book_data.priority
    book.status = book_data.status
    book.availability = book_data.availability
    book.book_class = book_data.book_class
    book.category = book_data.category
    book.rating = book_data.rating
    book.google_rating = book_data.google_rating
    book.motivation = book_data.motivation
    book.date_read = book_data.date_read
    
    if book_data.status == "Lido":
        new_order = None
    else:
        new_order = book_data.order
    
    if old_order != new_order:
        if old_order is None and new_order is not None:
            reorder_books(session, 'insert', new_order=new_order)
        elif old_order is not None and new_order is None:
            reorder_books(session, 'delete', deleted_order=old_order)
        elif old_order is not None and new_order is not None:
            reorder_books(session, 'move', user_id=user['id'], old_order=old_order, new_order=new_order, book_id=book_id)
    
    book.order = new_order
    
    # Fetch user preferences
    pref = session.get(UserPreference, user['id'])
    config = pref.formula_config if pref else None
    
    # Recalculate score
    book.score = calculate_book_score(book, config)
    
    session.add(book)
    session.commit()
    session.refresh(book)
    return book


# ... Preferences Endpoints ...

@app.post("/books_import/")
async def import_books_csv(file: UploadFile = File(...), session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    """
    Importa livros via CSV.
    Campos obrigatórios: 'title'
    Campos recomendados: 'author', 'status'
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Arquivo deve ser um CSV")
    
    try:
        # Ler conteúdo do arquivo
        content = await file.read()
        # Decodificar para string (tenta utf-8)
        decoded = content.decode('utf-8')
        
        # Usar csv.DictReader
        reader = csv.DictReader(io.StringIO(decoded))
        
        # Normalizar headers (remover espaços e lowercase)
        if reader.fieldnames:
             reader.fieldnames = [name.encode('utf-8').decode('utf-8-sig').strip().lower() for name in reader.fieldnames]

        imported_count = 0
        errors = []
        
        # Fetch user preferences ONCE
        pref = session.get(UserPreference, user['id'])
        config = pref.formula_config if pref else None
        api_keys = get_decrypted_api_keys(pref) # Fetch and decrypt API keys
        
        for row in reader:
            # Check for required title
            if 'title' not in row or not row['title']:
                continue
            
            # Map CSV fields to Book model
            book_data = {
                "title": row['title'].strip(),
                "author": row.get('author', "Desconhecido").strip() if row.get('author') else "Desconhecido",
                "status": row.get('status', 'A Ler').strip() if row.get('status') else 'A Ler',
                "priority": row.get('priority', '1 - Baixa'),
                "type": row.get('type', 'Não Técnico'),
                "book_class": row.get('book_class', 'Desenvolvimento Pessoal').strip() if row.get('book_class') else 'Desenvolvimento Pessoal',
                "category": row.get('category', 'Geral').strip() if row.get('category') else 'Geral',
                "availability": row.get('availability', 'Estante'),
                "original_title": row.get('original_title').strip() if row.get('original_title') else None
            }
            
            # Handle numeric fields if present
            if row.get('year'):
                try: book_data['year'] = int(row['year'])
                except: pass
                
            if row.get('rating'):
                try: book_data['rating'] = int(row['rating'])
                except: pass
                
            if row.get('google_rating'):
                try: book_data['google_rating'] = float(row['google_rating'])
                except: pass
            
            # Create Book
            new_book = Book(**book_data)
            
            # Calculate initial score
            new_book.score = calculate_book_score(new_book, config)
            
            # Assign order (append to end)
            last_order = session.exec(select(Book.order).order_by(Book.order.desc())).first() or 0
            new_book.order = last_order + 1
            
            session.add(new_book)
            imported_count += 1
        
        session.commit()
        return {"message": f"Importação concluída. {imported_count} livros adicionados.", "errors": errors}
        
    except Exception as e:
        print(f"Erro na importação: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar CSV: {str(e)}")

@app.get("/preferences/", response_model=UserPreference)
def get_preferences(session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    user_id = user['id']
    pref = session.get(UserPreference, user_id)
    if not pref:
        pref = UserPreference(user_id=user_id)
        session.add(pref)
        session.commit()
        session.refresh(pref)
    
    # DECRYPT keys before sending to frontend (so user can see/edit them)
    # We create a COPY or just return a new object to avoid modifying the DB session object which might auto-commit?
    # SQLModel objects tracked by session might auto-save changes on commit. 
    # Safest is to return a copy with decrypted values.
    
    # Create a transient copy for response
    response_pref = UserPreference(
        user_id=pref.user_id,
        yearly_goal=pref.yearly_goal,
        custom_prompts=pref.custom_prompts,
        formula_config=pref.formula_config,
        updated_at=pref.updated_at,
        openai_key=decrypt_value(pref.openai_key),
        gemini_key=decrypt_value(pref.gemini_key),
        groq_key=decrypt_value(pref.groq_key)
    )
    
    return response_pref

@app.put("/preferences/", response_model=UserPreference)
def update_preferences(pref_data: UserPreference, session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    user_id = user['id']
    pref = session.get(UserPreference, user_id)
    if not pref:
        pref = UserPreference(user_id=user_id)
    
    # Update fields with ENCRYPTION
    if pref_data.openai_key is not None: pref.openai_key = encrypt_value(pref_data.openai_key)
    if pref_data.gemini_key is not None: pref.gemini_key = encrypt_value(pref_data.gemini_key)
    if pref_data.groq_key is not None: pref.groq_key = encrypt_value(pref_data.groq_key)
    
    if pref_data.yearly_goal is not None: pref.yearly_goal = pref_data.yearly_goal
    if pref_data.custom_prompts is not None: pref.custom_prompts = pref_data.custom_prompts
    if pref_data.formula_config is not None: pref.formula_config = pref_data.formula_config
    
    pref.updated_at = datetime.utcnow()
    
    session.add(pref)
    session.commit()
    session.refresh(pref)
    
    # Return DECRYPTED values so frontend state remains consistent/usable
    response_pref = UserPreference(
        user_id=pref.user_id,
        yearly_goal=pref.yearly_goal,
        custom_prompts=pref.custom_prompts,
        formula_config=pref.formula_config,
        updated_at=pref.updated_at,
        openai_key=decrypt_value(pref.openai_key),
        gemini_key=decrypt_value(pref.gemini_key),
        groq_key=decrypt_value(pref.groq_key)
    )
    return response_pref

# --- Admin Endpoints ---

@app.get("/admin/users", response_model=List[Profile])
def list_users(session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    # Simple Admin Check (Hardcoded for vipistori@gmail.com or via Profiles table role)
    # 1. Check if requester has admin role in Profiles table
    requester_profile = session.get(Profile, user['id'])
    
    is_admin = False
    if requester_profile and requester_profile.role == 'admin':
        is_admin = True
    elif user.get('email') == 'vipistori@gmail.com': # Fallback hardcode
        is_admin = True
        
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
        
    profiles = session.exec(select(Profile)).all()
    return profiles
