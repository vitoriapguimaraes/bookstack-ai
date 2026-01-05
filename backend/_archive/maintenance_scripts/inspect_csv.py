import csv
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "..", "original_streamlit_app", "assets", "data", "lista_livros_2025.csv")

try:
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames
        print("CSV Headers:")
        print(headers)
        print("\nFirst 3 rows:")
        for i, row in enumerate(reader):
            if i >= 3:
                break
            print(f"\nRow {i+1}:")
            for key, value in row.items():
                print(f"  {key}: {value}")
except Exception as e:
    print(f"Error: {e}")
