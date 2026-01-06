from typing import Optional
from sqlmodel import Field, SQLModel

class Book(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    original_title: Optional[str] = None
    author: str
    year: Optional[int] = None
    type: str = "Não Técnico"
    priority: str = "1 - Baixa"
    status: str = "A Ler"       # 0=Lido, 1=A Ler, 2=Lendo (convertido para string)
    availability: str = "Estante"
    book_class: str = "Desenvolvimento Pessoal"
    category: str = "Geral"
    order: Optional[int] = None
    rating: Optional[int] = None  # Nota pessoal (1-5)
    google_rating: Optional[float] = None  # Nota do Google Books (0-5)
    date_read: Optional[str] = None
    score: Optional[float] = 0.0
    motivation: Optional[str] = None
    cover_image: Optional[str] = None
    user_id: Optional[str] = Field(default=None, index=True) # ID do usuário no Supabase
