from models import Book
from utils import calculate_book_score

# Mock Config
config = {
    "type": { "Técnico": 10, "default": 0 }, # High weight for Technical
    "availability": { "Estante": 5, "default": 0 },
    "priority": { "1 - Baixa": 0, "4 - Alta": 20 },
    "year": {
        "ranges": [
            { "max": 2020, "weight": 0 },
            { "min": 2021, "weight": 50 } # New books are super valuable
        ]
    }
}

# Book Case 1: Technical, High Priority, New
b1 = Book(title="Test", type="Técnico", availability="Estante", priority="4 - Alta", year=2024, category="Geral")

score_default = calculate_book_score(b1, None) # Standard
score_custom = calculate_book_score(b1, config) # Custom

print(f"Default Score: {score_default}")
print(f"Custom Score: {score_custom}")

assert score_custom > score_default, "Custom score should be higher with these weights"
print("Verification passed!")
