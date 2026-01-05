"""
Script para adicionar coluna original_title ao banco de dados
Execução: python add_original_title_column.py
"""

import sqlite3

def add_original_title_column():
    """Adiciona coluna original_title à tabela book."""
    
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    try:
        # Verifica se a coluna já existe
        cursor.execute("PRAGMA table_info(book)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'original_title' in columns:
            print("⚠️  Coluna 'original_title' já existe!")
            return
        
        print("📝 Adicionando coluna 'original_title'...")
        
        # Adiciona a coluna
        cursor.execute("""
            ALTER TABLE book 
            ADD COLUMN original_title TEXT
        """)
        
        conn.commit()
        print("✅ Coluna 'original_title' adicionada com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    add_original_title_column()
