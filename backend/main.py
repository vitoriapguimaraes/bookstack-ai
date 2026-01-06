from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
import shutil
import time
from datetime import datetime
from pathlib import Path
from sqlmodel import Session, select
from typing import List, Optional
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

@app.post("/books/", response_model=Book)
def create_book(book: Book, session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    # Set owner
    book.user_id = user['id']
    
    # Auto-calculate score
    book.score = calculate_book_score(book)
    
    # Reordenar se tem ordem definida (inserir e empurrar outros)
    if book.order:
        reorder_books(session, 'insert', user_id=user['id'], new_order=book.order)
    
    session.add(book)
    session.commit()
    session.refresh(book)
    return book

@app.get("/books/{book_id}", response_model=Book)
def read_book(book_id: int, session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    book = session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Ownership Check
    if book.user_id != user['id']:
        raise HTTPException(status_code=403, detail="Acesso negado")
        
    return book



@app.delete("/books/{book_id}")
def delete_book(book_id: int, session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    book = session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Ownership Check
    if book.user_id != user['id']:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    deleted_order = book.order  # Salvar ordem antes de deletar
    session.delete(book)
    
    # Reordenar após deletar (recontar ordens)
    if deleted_order:
        reorder_books(session, 'delete', user_id=user['id'], deleted_order=deleted_order)
    
    session.commit()
    # session.commit() # Removed duplicate commit
    return {"ok": True}

@app.post("/books/{book_id}/cover")
async def upload_book_cover(book_id: int, file: UploadFile = File(...), session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    book = session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    # Ownership Check
    if book.user_id != user['id']:
        raise HTTPException(status_code=403, detail="Acesso negado")

    # Ensure uploads directory exists
    UPLOAD_DIR.mkdir(exist_ok=True)
    
    # Generate unique filename (timestamp) to avoid caching issues
    file_extension = Path(file.filename).suffix
    if not file_extension:
        file_extension = ".jpg" # Default fallback
        
    filename = f"cover_{book_id}_{int(time.time())}{file_extension}"
    file_path = UPLOAD_DIR / filename
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Update book record
        # Save relative path that will be served via proxy or static mount
        book.cover_image = f"/uploads/{filename}"
        session.add(book)
        session.commit()
        session.refresh(book)
        
        return {"filename": filename, "cover_url": book.cover_image}
    except Exception as e:
        print(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")

@app.put("/books/{book_id}", response_model=Book)
def update_book(book_id: int, book_data: Book, session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    book = session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Ownership Check
    if book.user_id != user['id']:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    old_order = book.order  # Salvar ordem antiga
    
    # Update fields manually to avoid overwriting ID or cover if not passed
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
    
    # Auto-clear order when status is "Lido" (finished books don't need queue position)
    if book_data.status == "Lido":
        new_order = None
    else:
        new_order = book_data.order
    
    # Reordenar se a ordem mudou
    if old_order != new_order:
        if old_order is None and new_order is not None:
            # Inserindo ordem pela primeira vez
            reorder_books(session, 'insert', new_order=new_order)
        elif old_order is not None and new_order is None:
            # Removendo ordem (livro marcado como "Lido")
            reorder_books(session, 'delete', deleted_order=old_order)
        elif old_order is not None and new_order is not None:
            # Movendo de uma posição para outra
            reorder_books(session, 'move', user_id=user['id'], old_order=old_order, new_order=new_order, book_id=book_id)
    
    book.order = new_order
    
    # Recalculate score based on new data
    book.score = calculate_book_score(book)
    
    session.add(book)
    session.commit()
    session.refresh(book)
    return book

@app.post("/books/suggest")
def suggest_book_details(request: TitleRequest):
    details = get_book_details_hybrid(request.title)
    if not details:
        raise HTTPException(status_code=500, detail="Failed to get suggestions")
    return details

@app.get("/dashboard/stats")
def get_dashboard_stats(session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    # Filter by user
    books = session.exec(select(Book).where(Book.user_id == user['id'])).all()
    
    total_books = len(books)
    if total_books == 0:
        return {
            "total": 0, "by_status": {}, "by_category": [], "rating_avg": 0
        }

    # Status counts
    status_counts = {"Lido": 0, "A Ler": 0, "Lendo": 0}
    for b in books:
        if b.status in status_counts:
            status_counts[b.status] += 1
            
    # Rating Average (only for Lido)
    lidos = [b for b in books if b.status == 'Lido' and b.rating]
    avg_rating = sum([b.rating for b in lidos]) / len(lidos) if lidos else 0
    
    # Category Distribution (Top 5)
    cat_map = {}
    for b in books:
        cat = b.category or "Outros"
        cat_map[cat] = cat_map.get(cat, 0) + 1
    
    # Format for Recharts: [{name: 'Cat', value: 10}, ...]
    by_category = [{"name": k, "value": v} for k, v in cat_map.items()]
    by_category.sort(key=lambda x: x['value'], reverse=True)
    
    # Readings per Year (chart) - based on 'year' field or maybe 'Data_Leitura' (not migrated yet?)
    # Let's use 'year' (Publication Year) distribution as a proxy or just skip for now.
    # A better metric is "Pages Reading" or count by Status. Let's return simple stats first.
    
    return {
        "total": total_books,
        "by_status": status_counts,
        "by_category": by_category[:6], # Top 6
        "rating_avg": round(avg_rating, 1)
    }

@app.get("/proxy/image")
async def proxy_image(url: str):
    """
    Proxy endpoint to fetch images with local caching.
    """
    import os
    import hashlib
    from pathlib import Path

    CACHE_DIR = Path("image_cache")
    CACHE_DIR.mkdir(exist_ok=True)

    try:
        # Create hash for filename
        url_hash = hashlib.md5(url.encode()).hexdigest()
        cache_path = CACHE_DIR / f"{url_hash}.jpg"

        if cache_path.exists():
            with open(cache_path, "rb") as f:
                return Response(content=f.read(), media_type="image/jpeg")

        # Fetch from web (NON-BLOCKING)
        import asyncio
        loop = asyncio.get_event_loop()
        
        def fetch_url():
            return requests.get(url, timeout=10, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            
        response = await loop.run_in_executor(None, fetch_url)
        response.raise_for_status()
        
        # Save to cache
        with open(cache_path, "wb") as f:
            f.write(response.content)
            
        content_type = response.headers.get('content-type', 'image/jpeg')
        return Response(content=response.content, media_type=content_type)

    except Exception as e:
        print(f"Error proxying image: {e}")
        return Response(status_code=404)

@app.get("/books_export/", response_class=StreamingResponse)
def export_books_csv(session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    """
    Gera e baixa um CSV com todos os livros da biblioteca do usuário.
    """
    books = session.exec(select(Book).where(Book.user_id == user['id'])).all()
    
    # Criar um buffer em memória para o CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Cabeçalhos
    headers = [
        "id", "title", "original_title", "author", "year", "type", 
        "priority", "status", "availability", "book_class", 
        "category", "rating", "google_rating", "date_read", 
        "score", "motivation", "cover_image"
    ]
    writer.writerow(headers)
    
    # Dados
    for book in books:
        writer.writerow([
            book.id,
            book.title,
            book.original_title,
            book.author,
            book.year,
            book.type,
            book.priority,
            book.status,
            book.availability,
            book.book_class,
            book.category,
            book.rating,
            book.google_rating,
            book.date_read,
            book.score,
            book.motivation,
            book.cover_image
        ])
    
    output.seek(0)
    
    # Add BOM for Excel compatibility
    bom = codecs.BOM_UTF8.decode('utf-8')
    csv_content = bom + output.getvalue()
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=biblioteca_backup.csv"}
    )

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
            new_book.score = calculate_book_score(new_book)
            
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
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Failed to fetch image: {str(e)}")

# --- Preferences Endpoints ---

@app.get("/preferences/", response_model=UserPreference)
def get_preferences(session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    user_id = user['id']
    pref = session.get(UserPreference, user_id)
    if not pref:
        # Create default if not exists
        pref = UserPreference(user_id=user_id)
        session.add(pref)
        session.commit()
        session.refresh(pref)
    return pref

@app.put("/preferences/", response_model=UserPreference)
def update_preferences(pref_data: UserPreference, session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    user_id = user['id']
    pref = session.get(UserPreference, user_id)
    if not pref:
        pref = UserPreference(user_id=user_id)
    
    # Update fields
    if pref_data.openai_key is not None: pref.openai_key = pref_data.openai_key
    if pref_data.gemini_key is not None: pref.gemini_key = pref_data.gemini_key
    if pref_data.yearly_goal is not None: pref.yearly_goal = pref_data.yearly_goal
    if pref_data.custom_prompts is not None: pref.custom_prompts = pref_data.custom_prompts
    
    pref.updated_at = datetime.utcnow()
    
    session.add(pref)
    session.commit()
    session.refresh(pref)
    return pref

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
