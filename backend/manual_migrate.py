
import os
import sys

# Ensure we can import from the same directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text, inspect
from database import engine

def migrate():
    print(f"Checking database schema for: {engine.url}")
    
    # Inspect existing columns
    try:
        inspector = inspect(engine)
        if not inspector.has_table("user_preferences"):
            print("Table 'user_preferences' does not exist! Migration aborted.")
            return

        columns = [c['name'] for c in inspector.get_columns('user_preferences')]
        print(f"Existing columns: {columns}")

        with engine.connect() as conn:
            # 1. availability_options
            if 'availability_options' not in columns:
                print("Adding column: availability_options...")
                # Determine type based on dialect
                col_type = "JSONB" if engine.dialect.name == 'postgresql' else "JSON"
                
                # SQLite usually just treats JSON as TEXT or generic, but keyword JSON is valid
                try:
                    conn.execute(text(f"ALTER TABLE user_preferences ADD COLUMN availability_options {col_type}"))
                    conn.commit()
                    print("availability_options added.")
                except Exception as e:
                    print(f"Error adding availability_options: {e}")
            else:
                print("availability_options already exists.")

            # 2. has_custom_availability
            if 'has_custom_availability' not in columns:
                print("Adding column: has_custom_availability...")
                # Postgres uses TRUE/FALSE, SQLite can use 0/1 or TRUE/FALSE keywords depending on version
                col_type = "BOOLEAN"
                default_val = "FALSE" if engine.dialect.name == 'postgresql' else "0"
                
                try:
                    conn.execute(text(f"ALTER TABLE user_preferences ADD COLUMN has_custom_availability {col_type} DEFAULT {default_val}"))
                    conn.commit()
                    print("has_custom_availability added.")
                except Exception as e:
                    print(f"Error adding has_custom_availability: {e}")
            else:
                print("has_custom_availability already exists.")

    except Exception as e:
        print(f"Critical Error during migration: {e}")

if __name__ == "__main__":
    migrate()
