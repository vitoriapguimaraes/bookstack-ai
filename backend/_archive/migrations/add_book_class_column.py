"""
Script para adicionar a coluna book_class ao banco de dados existente
Execução: python add_book_class_column.py
"""

import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(BASE_DIR, "database.db")

def add_book_class_column():
    """Adiciona a coluna book_class à tabela book."""
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Verifica se a coluna já existe
        cursor.execute("PRAGMA table_info(book)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'book_class' in columns:
            print("⚠️  Coluna 'book_class' já existe!")
            return
        
        # Adiciona a coluna
        print("➕ Adicionando coluna 'book_class'...")
        cursor.execute("""
            ALTER TABLE book 
            ADD COLUMN book_class VARCHAR DEFAULT 'Desenvolvimento Pessoal'
        """)
        
        conn.commit()
        print("✅ Coluna 'book_class' adicionada com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("🔧 Adicionando coluna book_class ao banco de dados...\n")
    add_book_class_column()
