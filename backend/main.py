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
from supabase import create_client, Client
import os

# Initialize Supabase Client (for Storage)
SUPABASE_URL = os.getenv("SUPABASE_URL")
# Prefer specific service role key, fallback to generic key
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

class TitleRequest(BaseModel):
    title: str

app = FastAPI(title="Reading List API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "https://bookstack-interface.onrender.com"
    ],
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
    custom_prompts = pref.custom_prompts if pref else None
    class_categories = pref.class_categories if pref else None
    
    details = get_book_details_hybrid(request.title, api_keys, custom_prompts, class_categories)
    if not details:
        raise HTTPException(status_code=500, detail="Failed to get suggestions")
    return details

@app.on_event("startup")
def on_startup():
    try:
        print("🔄 Tentando conectar ao BD na inicialização...")
        create_db_and_tables()
        print("✅ Tabelas verificadas/criadas com sucesso!")
    except Exception as e:
        print(f"⚠️ ERRO CRÍTICO: Não foi possível conectar ao Banco de Dados na inicialização: {e}")
        print("⚠️ A aplicação continuará incializando, mas endpoints de banco falharão.")

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
        class_categories=pref.class_categories,
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
    
    # Check if formula_config is changing to trigger recalculation
    formula_changed = False
    if pref_data.formula_config is not None and pref_data.formula_config != pref.formula_config:
        formula_changed = True

    # Update fields with ENCRYPTION
    if pref_data.openai_key is not None: pref.openai_key = encrypt_value(pref_data.openai_key)
    if pref_data.gemini_key is not None: pref.gemini_key = encrypt_value(pref_data.gemini_key)
    if pref_data.groq_key is not None: pref.groq_key = encrypt_value(pref_data.groq_key)
    
    # Update flags based on content
    # 1. API Keys: True if ANY key is present and meaningful
    pref.has_api_keys = bool(
        (pref_data.openai_key and len(pref_data.openai_key) > 5) or 
        (pref_data.gemini_key and len(pref_data.gemini_key) > 5) or 
        (pref_data.groq_key and len(pref_data.groq_key) > 5) or
        (pref.openai_key and len(pref.openai_key) > 5) or
        (pref.gemini_key and len(pref.gemini_key) > 5) or
        (pref.groq_key and len(pref.groq_key) > 5)
    )
    
    # 2. Custom Prompts: True if prompts exist AND are not just the default template
    # We check if 'user_prompt' is in custom_prompts and has specific content length 
    # or doesn't contain the placeholder strictly. 
    # For now, let's assume if the user saves prompts that are not empty, it is customized.
    # But since the frontend sends the default template, we might need to check content.
    # Simplified approach: If custom_prompts has content and is not empty dict.
    if pref_data.custom_prompts and len(pref_data.custom_prompts) > 0:
         # Optional: Add smarter check here if needed later
         pref.has_custom_prompts = True
    elif pref.custom_prompts and len(pref.custom_prompts) > 0:
         pref.has_custom_prompts = True
    else:
         pref.has_custom_prompts = False
        
    # 3. Custom Formula: True if ANY weight is > 0
    # We need to traverse the config to find non-zero weights
    has_nonzero = False
    config_to_check = pref_data.formula_config or pref.formula_config or {}
    
    # helper to check nested dicts
    def check_nonzero(d):
        for k, v in d.items():
            if isinstance(v, dict):
                if check_nonzero(v): return True
            elif isinstance(v, (int, float)) and v > 0:
                return True
            elif isinstance(v, list): # Handle year ranges
                 for item in v:
                     if isinstance(item, dict) and item.get('weight', 0) > 0:
                         return True
        return False

    if config_to_check and check_nonzero(config_to_check):
        pref.has_custom_formula = True
    else:
        pref.has_custom_formula = False

    # 4. Custom Classes: True if class_categories is different from default
    # We import CLASS_CATEGORIES from utils to compare
    from utils import CLASS_CATEGORIES as DEFAULT_CLASS_CATEGORIES
    
    current_classes = pref_data.class_categories or pref.class_categories or {}
    
    if current_classes and len(current_classes) > 0:
        # Simple comparison: if the dictionaries are not equal, it's custom
        # Note: This is sensitive to order if standard dict comparison wasn't robust, but in Python 3.7+ it is fine.
        # We might want to check equality more loosely (same keys, same lists irrespective of order)
        # But for now, exact match is a good start.
        if current_classes != DEFAULT_CLASS_CATEGORIES:
            pref.has_custom_classes = True
        else:
            pref.has_custom_classes = False
    else:
        # If empty, it uses default implementation-wise, so it's NOT custom
        pref.has_custom_classes = False

    # 5. Custom Availability: True if list is different from default
    from utils import DEFAULT_AVAILABILITY_OPTIONS
    current_availability = pref_data.availability_options or pref.availability_options
    
    # Update field
    if pref_data.availability_options is not None:
         pref.availability_options = pref_data.availability_options

    if current_availability:
        # Sort to compare content irrespective of order? Or order matters? Order matters for UI.
        if current_availability != DEFAULT_AVAILABILITY_OPTIONS:
            pref.has_custom_availability = True
        else:
             pref.has_custom_availability = False
    else:
        pref.has_custom_availability = False

    pref.updated_at = datetime.utcnow()
    
    session.add(pref)
    
    # If formula changed, recalculate ALL book scores for this user
    if formula_changed:
        books = session.exec(select(Book).where(Book.user_id == user_id)).all()
        for book in books:
            book.score = calculate_book_score(book, pref.formula_config)
            session.add(book)
    
    session.commit()
    session.refresh(pref)
    
    # Return DECRYPTED values so frontend state remains consistent/usable
    response_pref = UserPreference(
        user_id=pref.user_id,
        yearly_goal=pref.yearly_goal,
        custom_prompts=pref.custom_prompts,
        formula_config=pref.formula_config,
        class_categories=pref.class_categories,
        has_api_keys=pref.has_api_keys,
        has_custom_prompts=pref.has_custom_prompts,
        has_custom_formula=pref.has_custom_formula,
        has_custom_classes=pref.has_custom_classes,
        has_custom_availability=pref.has_custom_availability,
        availability_options=pref.availability_options,
        updated_at=pref.updated_at,
        openai_key=decrypt_value(pref.openai_key),
        gemini_key=decrypt_value(pref.gemini_key),
        groq_key=decrypt_value(pref.groq_key)
    )
    return response_pref

# --- Admin Endpoints ---

@app.get("/admin/users")
def list_users(session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    # Simple Admin Check
    requester_profile = session.get(Profile, user['id'])
    
    print(f"DEBUG: Requesting user ID: {user['id']}")
    print(f"DEBUG: Requesting user email: {user.get('email')}")
    if requester_profile:
        print(f"DEBUG: Profile found. Role: {requester_profile.role}")
    else:
        print("DEBUG: No profile found for this user.")

    is_admin = False
    if requester_profile and requester_profile.role == 'admin':
        is_admin = True
    elif user.get('email') == 'vipistori@gmail.com': # Fallback
        is_admin = True
        
    if not is_admin:
        print("DEBUG: Access Denied. Not an admin.")
        raise HTTPException(status_code=403, detail="Admin access required")
        
    # Join Profile with UserPreference to get flags
    results = session.exec(
        select(Profile, UserPreference)
        .outerjoin(UserPreference, Profile.id == UserPreference.user_id)
    ).all()
    
    output = []
    for profile, pref in results:
        user_data = {
            "id": profile.id,
            "email": profile.email,
            "role": profile.role,
            "created_at": profile.created_at,
            "has_api_keys": pref.has_api_keys if pref else False,
            "has_custom_prompts": pref.has_custom_prompts if pref else False,
            "has_custom_formula": pref.has_custom_formula if pref else False,
            "has_custom_availability": pref.has_custom_availability if pref else False,
            "is_active": profile.is_active if profile else True
        }
        output.append(user_data)
        
    return output

import hashlib
CACHE_DIR = Path("image_cache")
CACHE_DIR.mkdir(exist_ok=True)

@app.get("/proxy/image")
async def proxy_image(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    # Gerar hash da URL para usar como nome de arquivo
    url_hash = hashlib.md5(url.encode()).hexdigest()
    cache_path = CACHE_DIR / url_hash
    
    # Se já existe no cache, servimos o arquivo local
    if cache_path.exists():
        # Tenta adivinhar o media type ou usa jpeg como padrão
        content_type = "image/jpeg"
        if url.lower().endswith('.png'): content_type = "image/png"
        elif url.lower().endswith('.webp'): content_type = "image/webp"
        
        return Response(content=cache_path.read_bytes(), media_type=content_type)
    
    try:
        # Busca a imagem externa
        response = requests.get(url, stream=True, timeout=10)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch image")
        
        content = response.content
        # Salva no cache (Opcional - fail safe)
        try:
            cache_path.write_bytes(content)
        except Exception as e:
            print(f"Warning: Could not write to cache: {e}")
        
        return Response(content=content, media_type=response.headers.get("Content-Type", "image/jpeg"))
    except Exception as e:
        print(f"Erro no proxy de imagem: {e}")
        raise HTTPException(status_code=500, detail="Internal server error fetching image")


@app.post("/books/{book_id}/cover", response_model=Book)
async def upload_book_cover(book_id: int, file: UploadFile = File(...), session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    """
    Uploads a book cover for a specific book to Supabase Storage and updates the book record.
    """
    book = session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    if book.user_id != user['id']:
        raise HTTPException(status_code=403, detail="Acesso negado")

    # 1. Supabase Storage Upload
    if not supabase:
         print("WARNING: Supabase Storage keys missing.")
         raise HTTPException(status_code=503, detail="Supabase Storage not configured")
    
    try:
        content = await file.read()
        
        # Sanitize filename
        original_name = file.filename.replace(" ", "_")
        file_ext = Path(original_name).suffix
        if not file_ext: file_ext = ".jpg" 
        
        # Unique Name: userID_BookID_Timestamp
        filename = f"{user['id']}_{book_id}_{int(time.time())}{file_ext}"
        bucket_name = "book-covers"

        # Upload
        supabase.storage.from_(bucket_name).upload(
            path=filename,
            file=content,
            file_options={"content-type": file.content_type}
        )
        
        # Get URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(filename)
        
        # 2. Update DB
        book.cover_image = public_url
        session.add(book)
        session.commit()
        session.refresh(book)
        
        return book

        return book

    except Exception as e:
        print(f"Upload Error: {e}")
        detail = str(e)
        if "Bucket not found" in detail:
            detail = "Bucket 'book-covers' does not exist."
        raise HTTPException(status_code=500, detail=f"Upload Failed: {detail}")

# --- Account Reset ---

@app.delete("/books/reset")
def reset_account(session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    """
    Apaga TODOS os livros do usuário atual. Ação irreversível.
    """
    try:
        # Delete all books for this user
        statement = select(Book).where(Book.user_id == user['id'])
        books = session.exec(statement).all()
        
        for book in books:
            session.delete(book)
            
        session.commit()
        return {"message": "Conta resetada com sucesso. Todos os livros foram apagados."}
    except Exception as e:
        session.rollback()
        print(f"Erro ao resetar conta: {e}")
        raise HTTPException(status_code=500, detail="Erro ao resetar conta")

# --- Admin User Management ---

@app.delete("/admin/users/{target_user_id}")
def delete_user(target_user_id: str, session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    # Check Admin
    requester_profile = session.get(Profile, user['id'])
    if not requester_profile or requester_profile.role != 'admin':
        # Fallback hardcoded check
        if user.get('email') != 'vipistori@gmail.com':
            raise HTTPException(status_code=403, detail="Acesso negado")

    try:
        # 1. Delete User Preferences
        pref = session.get(UserPreference, target_user_id)
        if pref: session.delete(pref)
        
        # 2. Delete User Profile
        profile = session.get(Profile, target_user_id)
        if profile: session.delete(profile)
        
        # 3. Delete User Books
        books = session.exec(select(Book).where(Book.user_id == target_user_id)).all()
        for book in books:
            session.delete(book)
            
        session.commit()
        return {"message": f"Usuário {target_user_id} excluído com sucesso."}
    except Exception as e:
        session.rollback()
        print(f"Erro ao excluir usuário: {e}")
        raise HTTPException(status_code=500, detail="Erro ao excluir usuário")

@app.post("/admin/users/{target_user_id}/toggle_active")
def toggle_user_active(target_user_id: str, session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    # Check Admin
    requester_profile = session.get(Profile, user['id'])
    if not requester_profile or requester_profile.role != 'admin':
        if user.get('email') != 'vipistori@gmail.com':
            raise HTTPException(status_code=403, detail="Acesso negado")

    try:
        profile = session.get(Profile, target_user_id)
        if not profile:
             raise HTTPException(status_code=404, detail="Usuário não encontrado")
             
        # Toggle current status (default to True if not set)
        current_status = getattr(profile, 'is_active', True)
        profile.is_active = not current_status
        session.add(profile)
        session.commit()
        
        return {"message": "Status alterado com sucesso", "is_active": profile.is_active}

    except Exception as e:
        print(f"Erro ao alterar status: {e}")
        raise HTTPException(status_code=500, detail="Erro ao alterar status")
