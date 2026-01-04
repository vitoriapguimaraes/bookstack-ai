from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlmodel import Session, select
from typing import List
from database import create_db_and_tables, get_session
from models import Book
from utils import calculate_book_score, get_book_details_hybrid
import requests
from pydantic import BaseModel

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



@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/")
def read_root():
    return {"message": "Reading List API is Running! 🚀"}

@app.get("/books/", response_model=List[Book])
def read_books(session: Session = Depends(get_session)):
    books = session.exec(select(Book)).all()
    return books

@app.post("/books/", response_model=Book)
def create_book(book: Book, session: Session = Depends(get_session)):
    # Auto-calculate score
    book.score = calculate_book_score(book)
    
    session.add(book)
    session.commit()
    session.refresh(book)
    return book

@app.get("/books/{book_id}", response_model=Book)
def read_book(book_id: int, session: Session = Depends(get_session)):
    book = session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book



@app.delete("/books/{book_id}")
def delete_book(book_id: int, session: Session = Depends(get_session)):
    book = session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    session.delete(book)
    session.commit()
    return {"ok": True}

@app.put("/books/{book_id}", response_model=Book)
def update_book(book_id: int, book_data: Book, session: Session = Depends(get_session)):
    book = session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Update fields manually to avoid overwriting ID or cover if not passed
    book.title = book_data.title
    book.author = book_data.author
    book.year = book_data.year
    book.type = book_data.type
    book.priority = book_data.priority
    book.status = book_data.status
    book.availability = book_data.availability
    book.book_class = book_data.book_class
    book.category = book_data.category
    book.rating = book_data.rating
    book.motivation = book_data.motivation
    book.date_read = book_data.date_read
    
    # Auto-clear order when status is "Lido" (finished books don't need queue position)
    if book_data.status == "Lido":
        book.order = None
    else:
        book.order = book_data.order
    
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
def get_dashboard_stats(session: Session = Depends(get_session)):
    books = session.exec(select(Book)).all()
    
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
    Proxy endpoint to fetch images from external URLs (like Google Books)
    This bypasses CORS restrictions
    """
    try:
        response = requests.get(url, timeout=10, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        response.raise_for_status()
        
        # Return the image with appropriate content type
        content_type = response.headers.get('content-type', 'image/jpeg')
        return Response(content=response.content, media_type=content_type)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Failed to fetch image: {str(e)}")
