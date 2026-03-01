# analysis/

Análise exploratória dos dados da biblioteca bookstack-ai.

## Como usar

1. No app, exporte seus livros: **Tabela → Exportar CSV**
2. Salve o arquivo em: `analysis/data/biblioteca.csv`
3. Instale as dependências:

   ```bash
   pip install pandas matplotlib seaborn scikit-learn
   ```

4. Execute:

   ```bash
   python analysis.py
   ```

5. Os gráficos são salvos em `analysis/output/`

## O que o script gera

| Arquivo                          | Análise                                   |
| -------------------------------- | ----------------------------------------- |
| `01_leitura_por_mes.png`         | Livros lidos por mês (série temporal)     |
| `02_distribuicao_por_classe.png` | Quantidade por classe (total e só lidos)  |
| `03_score_por_classe.png`        | Score médio por classe                    |
| `04_nota_vs_score.png`           | Nota pessoal × Score calculado (scatter)  |
| `05_clusters_pca.png`            | Clustering K-Means visualizado com PCA 2D |

Além dos gráficos, imprime no terminal as **recomendações** de próximos livros baseadas nos seus favoritos (nota ≥ 4).
