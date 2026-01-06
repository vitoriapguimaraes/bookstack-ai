from sqlmodel import SQLModel, create_engine, text
from dotenv import load_dotenv
import os

# Load env variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env")

engine = create_engine(DATABASE_URL)

def apply_migration():
    with engine.connect() as connection:
        trans = connection.begin()
        try:
            # Check if column exists
            check_sql = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='user_preferences' AND column_name='formula_config';
            """)
            result = connection.execute(check_sql)
            
            if result.fetchone():
                print("Column 'formula_config' already exists.")
            else:
                print("Adding 'formula_config' column...")
                alter_sql = text("ALTER TABLE user_preferences ADD COLUMN formula_config JSONB DEFAULT '{}';")
                connection.execute(alter_sql)
                print("Migration successful!")
            
            trans.commit()
        except Exception as e:
            trans.rollback()
            print(f"Migration failed: {e}")
            raise e

if __name__ == "__main__":
    apply_migration()
