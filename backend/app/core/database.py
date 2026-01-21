from sqlmodel import SQLModel, create_engine, Session
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Check for DATABASE_URL env var (set by Supabase user)
database_url = os.getenv("DATABASE_URL")

if database_url:
    # SQLAlchemy requires 'postgresql://', Supabase gives 'postgres://' sometimes
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    # Fix for Supabase Transaction Pooler: psycopg2 doesn't like "pgbouncer=true" in the DSN
    if "pgbouncer=true" in database_url:
        database_url = database_url.replace("?pgbouncer=true", "")
        database_url = database_url.replace("&pgbouncer=true", "")

    print("Conectando ao Banco de Dados REMOTO (PostgreSQL/Supabase)...")
else:
    # Fallback to local SQLite
    sqlite_file_name = os.path.join(BASE_DIR, "database.db")
    database_url = f"sqlite:///{sqlite_file_name}"
    print("Conectando ao Banco de Dados LOCAL (SQLite)")

# Create engine
# echo=False by default to avoid log spam, can be enabled for debugging
engine = create_engine(database_url, echo=False)


def create_db_and_tables():
    try:
        SQLModel.metadata.create_all(engine)
    except Exception as e:
        print(f"CRITICAL: Failed to create tables on startup. DB Context: {engine.url}")
        print(f"Error details: {e}")
        # We don't raise here to allow the app to try starting, or we could raise.
        # But printing allows us to see the log in Vercel.
        pass


def get_session():
    with Session(engine) as session:
        yield session


def sync_sequences():
    """Fix for Postgres 'Duplicate Key' error: syncs sequence with max ID."""
    if "sqlite" in str(engine.url):
        return

    try:
        from sqlalchemy import text

        with engine.connect() as conn:
            # Sync 'book' table sequence
            conn.execute(
                text(
                    "SELECT setval(pg_get_serial_sequence('book', 'id'), coalesce(max(id)+1, 1), false) FROM book;"
                )
            )
            conn.commit()
            print("Sequências do Banco de Dados Sincronizadas (Postgres)")
    except Exception as e:
        print(f"Aviso: Falha ao sincronizar sequências: {e}")
