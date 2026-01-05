"""
Script para adicionar coluna google_rating ao banco de dados
Execução: python add_google_rating_column.py
"""

import sqlite3

def add_google_rating_column():
    """Adiciona coluna google_rating à tabela book."""
    
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    try:
        # Verifica se a coluna já existe
        cursor.execute("PRAGMA table_info(book)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'google_rating' in columns:
            print("⚠️  Coluna 'google_rating' já existe!")
            return
        
        print("📝 Adicionando coluna 'google_rating'...")
        
        # Adiciona a coluna
        cursor.execute("""
            ALTER TABLE book 
            ADD COLUMN google_rating REAL
        """)
        
        conn.commit()
        print("✅ Coluna 'google_rating' adicionada com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    add_google_rating_column()
