from database import engine
from sqlalchemy import text

def migrate():
    print("Applying migration: Add groq_key to user_preferences...")
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE user_preferences ADD COLUMN groq_key VARCHAR"))
            conn.commit()
        print("Migration successful! Column 'groq_key' added.")
    except Exception as e:
        print(f"Migration failed (maybe column already exists?): {e}")

if __name__ == "__main__":
    migrate()
