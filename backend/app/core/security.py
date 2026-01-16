from cryptography.fernet import Fernet
import os
from dotenv import load_dotenv

load_dotenv()

_key = os.getenv("ENCRYPTION_KEY")
try:
    _cipher = Fernet(_key) if _key else None
except Exception as e:
    print(f"⚠️ WARNING: Invalid ENCRYPTION_KEY ({e}). Encryption disabled.")
    _cipher = None

if not _cipher:
    # Only print warning if strictly necessary or logging
    print("WARNING: Encryption disabled. Data will be saved as plain text.")


def encrypt_value(value: str) -> str:
    """Encrypts a string value. Returns the encrypted string."""
    if not value:
        return value
    if not _cipher:
        return value  # Fallback to plain text if no key (dev mode)

    # Check if already encrypted (Fernet tokens start with gAAAAA)
    # This is a heuristic, but useful to avoid double encryption if logic is called twice
    if value.startswith("gAAAAA"):
        return value

    return _cipher.encrypt(value.encode()).decode()


def decrypt_value(value: str) -> str:
    """Decrypts a string value. Returns the decrypted string."""
    if not value:
        return value
    if not _cipher:
        return value

    try:
        if not value.startswith("gAAAAA"):
            return value  # Assume plain text

        return _cipher.decrypt(value.encode()).decode()
    except Exception as e:
        print(f"Decryption error: {e}")
        return value  # Return original on error (maybe it wasn't encrypted)
