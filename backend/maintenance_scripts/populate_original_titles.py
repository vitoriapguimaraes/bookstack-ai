import logging
import time
import sys
import os
from dotenv import load_dotenv

# Adiciona o diretório PAI (backend) ao path para garantir imports corretos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Carrega .env da raiz do projeto (2 níveis para cima: script -> maintenance -> backend -> root)
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env')
load_dotenv(env_path)

from sqlmodel import Session, select
from database import engine
from models import Book
from utils import get_ai_classification

# Configuração de Logs
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def populate_original_titles():
    """
    Percorre todos os livros sem título original e consulta a IA para preenchê-los.
    """
    with Session(engine) as session:
        # Busca livros onde original_title é nulo ou string vazia
        # Nota: SQLite às vezes trata vazios de forma diferente, então checamos ambos se possível, ou filtramos no python
        statement = select(Book)
        books = session.exec(statement).all()
        
        books_to_update = [b for b in books if not b.original_title]
        total = len(books_to_update)
        
        logger.info(f"Encontrados {total} livros sem título original.")
        
        consecutive_errors = 0
        max_consecutive_errors = 3
        
        for index, book in enumerate(books_to_update, 1):
            if consecutive_errors >= max_consecutive_errors:
                logger.error("⛔ Parei! Muitos erros consecutivos (429/400). Tente novamente mais tarde.")
                break

            logger.info(f"[{index}/{total}] Processando: {book.title}")
            
            try:
                # Usa a IA para obter dados
                ai_data = get_ai_classification(book.title, book.motivation or "")
                
                if ai_data and ai_data.get("original_title"):
                    original = ai_data.get("original_title")
                    
                    # Se tiver original, salva. Se não, salva o próprio título (IA instruída a repetir se for PT/Igual)
                    # Mas garante que não sobrescreva se vier vazio por erro
                    book.original_title = original or book.title
                    session.add(book)
                    session.commit()
                    logger.info(f"✅ Atualizado: '{book.title}' -> '{book.original_title}'")
                    
                    consecutive_errors = 0 # Reset count on success
                    time.sleep(3) # Pausa amigável de 3s entre sucessos
                    
                else:
                    logger.warning(f"⚠️ IA não retornou original_title para: {book.title}")
                    consecutive_errors += 0 # Aviso não conta como erro fatal, mas cuidado
            
            except Exception as e:
                consecutive_errors += 1
                wait_time = 10 * consecutive_errors # 10s, 20s, 30s...
                logger.error(f"❌ Erro ({consecutive_errors}/{max_consecutive_errors}) ao processar {book.title}: {e}")
                logger.info(f"⏳ Pausando por {wait_time} segundos antes de continuar...")
                time.sleep(wait_time)
                continue # Pula sleep padrão

        logger.info("🎉 Processo finalizado!")

if __name__ == "__main__":
    populate_original_titles()
