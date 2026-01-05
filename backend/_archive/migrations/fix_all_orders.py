"""
Script para reorganizar todas as ordens dos livros
Remove gaps e duplicações, criando uma sequência contínua: 1, 2, 3, 4...
Execução: python fix_all_orders.py
"""

from sqlmodel import Session, select
from database import engine
from models import Book

def fix_all_orders():
    """Reorganiza todas as ordens para sequência contínua sem gaps."""
    
    with Session(engine) as session:
        # Busca todos os livros com ordem definida, ordenados pela ordem atual
        books_with_order = session.exec(
            select(Book)
            .where(Book.order.isnot(None))
            .order_by(Book.order)
        ).all()
        
        if not books_with_order:
            print("⚠️  Nenhum livro com ordem definida encontrado.")
            return
        
        print(f"📚 Encontrados {len(books_with_order)} livros com ordem definida")
        print("\n🔍 Verificando problemas...")
        
        # Verificar duplicações e gaps
        orders = [book.order for book in books_with_order]
        duplicates = len(orders) != len(set(orders))
        gaps = any(orders[i] != i + 1 for i in range(len(orders)))
        
        if duplicates:
            print("⚠️  DUPLICAÇÕES ENCONTRADAS!")
            from collections import Counter
            order_counts = Counter(orders)
            for order, count in order_counts.items():
                if count > 1:
                    print(f"   Ordem {order}: {count} livros")
        
        if gaps:
            print("⚠️  GAPS ENCONTRADOS!")
            expected = list(range(1, len(orders) + 1))
            missing = set(expected) - set(orders)
            if missing:
                print(f"   Ordens faltando: {sorted(missing)}")
        
        if not duplicates and not gaps:
            print("✅ Nenhum problema encontrado! Ordens já estão corretas.")
            return
        
        print("\n🔧 Reorganizando ordens...")
        print("\nAntes → Depois:")
        
        # Reorganizar: atribuir nova ordem sequencial
        for new_order, book in enumerate(books_with_order, start=1):
            old_order = book.order
            if old_order != new_order:
                print(f"  {book.title[:40]:40} | #{old_order} → #{new_order}")
                book.order = new_order
                session.add(book)
        
        # Commit todas as mudanças
        session.commit()
        
        print("\n" + "="*60)
        print("✅ REORGANIZAÇÃO CONCLUÍDA!")
        print("="*60)
        print(f"Total de livros reorganizados: {len(books_with_order)}")
        print(f"Nova sequência: 1 até {len(books_with_order)}")
        print("="*60)

if __name__ == "__main__":
    print("🚀 Iniciando reorganização de ordens...\n")
    fix_all_orders()
