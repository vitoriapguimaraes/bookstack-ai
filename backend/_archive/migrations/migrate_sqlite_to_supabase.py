import os
import sys
from sqlmodel import SQLModel, create_engine, Session, select
from dotenv import load_dotenv
from models import Book

# Load env variables
load_dotenv()

# Setup Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sqlite_file_name = os.path.join(BASE_DIR, "database.db")
sqlite_url = f"sqlite:///{sqlite_file_name}"

postgres_url = os.getenv("DATABASE_URL")

def migrate():
    print("--- 🔄 Migração SQLite -> Supabase ---")

    # 1. Check Source
    if not os.path.exists(sqlite_file_name):
        print(f"❌ Erro: Banco SQLite não encontrado em {sqlite_file_name}")
        return

    # 2. Check Destination
    if not postgres_url:
        print("❌ Erro: DATABASE_URL não encontrada no arquivo .env")
        print("Crie um arquivo .env na pasta backend com: DATABASE_URL=postgresql://user:pass@host:port/db")
        return

    # Fix connection string for SQLAlchemy
    dest_url = postgres_url
    if dest_url.startswith("postgres://"):
        dest_url = dest_url.replace("postgres://", "postgresql://", 1)

    # 3. Connect Source
    print(f"📂 Lendo banco local: {sqlite_file_name}")
    engine_sqlite = create_engine(sqlite_url)
    
    # 4. Connect Destination
    print(f"☁️  Conectando ao Supabase...")
    try:
        engine_postgres = create_engine(dest_url)
        # Test connection
        with engine_postgres.connect() as conn:
            pass
    except Exception as e:
        print(f"❌ Erro ao conectar no Supabase: {e}")
        return

    # 5. Read Data
    books_data = []
    with Session(engine_sqlite) as session:
        books = session.exec(select(Book)).all()
        print(f"📚 Encontrados {len(books)} livros no SQLite.")
        for book in books:
            # Detach instance from session
            books_data.append(book.model_dump())

    if not books_data:
        print("⚠️ Nenhum livro para migrar.")
        return

    # 6. Write Data
    print("🛠️ Garantindo que a tabela existe no Supabase...")
    SQLModel.metadata.create_all(engine_postgres)

    with Session(engine_postgres) as session:
        # Check existing
        existing = session.exec(select(Book)).all()
        if len(existing) > 0:
            print(f"⚠️ O banco no Supabase já contém {len(existing)} livros.")
            print("❌ Abortando para evitar duplicidade. Limpe o banco no Supabase se quiser reimportar.")
            return

        print("🚀 Inserindo livros...")
        for book_dict in books_data:
            # Create new instance explicitly ensuring ID is preserved
            new_book = Book(**book_dict)
            session.add(new_book)
        
        try:
            session.commit()
            print(f"✅ Sucesso! {len(books_data)} livros migrados para o Supabase.")
        except Exception as e:
            print(f"❌ Erro ao salvar no Supabase: {e}")

if __name__ == "__main__":
    migrate()
