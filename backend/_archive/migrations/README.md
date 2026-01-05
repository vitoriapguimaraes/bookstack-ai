# Scripts de Migração

Esta pasta contém scripts de migração que foram executados durante o desenvolvimento do projeto.

## Scripts Disponíveis

### 1. `migrate_data.py`
**Status**: ✅ Executado  
**Descrição**: Migração inicial dos dados do CSV para o banco SQLite.  
**Quando usar**: Apenas na primeira configuração do projeto.

### 2. `add_book_class_column.py`
**Status**: ✅ Executado  
**Descrição**: Adiciona a coluna `book_class` ao banco de dados existente.  
**Quando usar**: Já foi executado. Não é necessário rodar novamente.

### 3. `migrate_book_classes.py`
**Status**: ✅ Executado (237 livros)  
**Descrição**: Popula o campo `book_class` baseado na categoria existente.  
**Quando usar**: Já foi executado. Não é necessário rodar novamente.

### 4. `update_covers_to_api.py`
**Status**: ✅ Executado  
**Descrição**: Migra capas locais para URLs da Google Books API.  
**Quando usar**: Já foi executado. Não é necessário rodar novamente.

### 5. `update_to_thumbnails.py`
**Status**: ✅ Executado (210 URLs atualizadas)  
**Descrição**: Atualiza URLs de capas para versão thumbnail (menor resolução).  
**Quando usar**: Já foi executado. Não é necessário rodar novamente.

### 6. `fix_empty_orders.py`
**Status**: ✅ Executado (1 livro corrigido)  
**Descrição**: Converte valores vazios de `order` para NULL.  
**Quando usar**: Já foi executado. Não é necessário rodar novamente.

## ⚠️ Importante

Estes scripts são **one-time migrations** e já foram executados com sucesso. Eles estão arquivados aqui para referência e documentação, mas **não devem ser executados novamente** no banco de dados atual, pois podem causar duplicação ou erros.

Se você precisar recriar o banco de dados do zero, execute os scripts na seguinte ordem:
1. `migrate_data.py`
2. `add_book_class_column.py`
3. `migrate_book_classes.py`
4. `update_covers_to_api.py`
5. `update_to_thumbnails.py`
6. `fix_empty_orders.py`
