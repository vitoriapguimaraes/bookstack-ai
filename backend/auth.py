import os
import requests
from fastapi import Header, HTTPException, status
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Warning: SUPABASE_URL or SUPABASE_ANON_KEY not found in backend .env")

def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Validates the Bearer Token against Supabase Auth API.
    Returns the user object if valid, else raises 401.
    """
    if not authorization:
         # Public access might be allowed for some read-only, but let's enforce auth for now
         # or return None if we want optional auth
         raise HTTPException(status_code=401, detail="Missing Authentication Token")
    
    token = authorization.replace("Bearer ", "")
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {token}"
    }
    
    # Verify token with Supabase
    try:
        response = requests.get(f"{SUPABASE_URL}/auth/v1/user", headers=headers)
        
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid or Expired Token")
            
        return response.json()
    except Exception as e:
        print(f"Auth Check Error: {e}")
        raise HTTPException(status_code=401, detail="Authentication Failed")
