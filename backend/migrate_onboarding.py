from database import engine
from sqlalchemy import text

def run_migration():
    print("Iniciando migração de flags de onboarding...")
    with engine.connect() as conn:
        try:
            conn.execute(text('ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS has_api_keys BOOLEAN DEFAULT FALSE'))
            conn.execute(text('ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS has_custom_prompts BOOLEAN DEFAULT FALSE'))
            conn.execute(text('ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS has_custom_formula BOOLEAN DEFAULT FALSE'))
            conn.commit()
            print("Colunas adicionadas com sucesso (ou já existiam).")
        except Exception as e:
            print(f"Erro na migração: {e}")

if __name__ == "__main__":
    run_migration()
