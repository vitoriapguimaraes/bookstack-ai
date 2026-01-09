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

    
    # Check Env
    if not SUPABASE_URL:
        print("CRITICAL: SUPABASE_URL is not set!")
        raise HTTPException(status_code=500, detail="Server Configuration Error: Missing SUPABASE_URL")
    if not SUPABASE_KEY:
        print("CRITICAL: SUPABASE_KEY is not set!")
        # We might continue without key if it is not used in headers? (It is used)
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {token}"
    }
    
    # Verify token with Supabase
    # Verify token with Supabase
    try:

        response = requests.get(f"{SUPABASE_URL}/auth/v1/user", headers=headers, timeout=5)
        
        if response.status_code != 200:

            raise HTTPException(status_code=401, detail="Invalid or Expired Token")
            
        user_data = response.json()
        user_id = user_data.get("id")

        # --- Enforce Local IS_ACTIVE Check ---
        # We need a quick database session here to check the profile status
        from database import get_session
        from models_preferences import Profile
        
        # Manually create a session since we are inside a dependency
        session = next(get_session()) 
        try:
            profile = session.get(Profile, user_id)
            if profile and not profile.is_active:
                raise HTTPException(status_code=403, detail="User account is inactive. Contact admin.")
        finally:
            session.close() # Important to close!
            
        return user_data

    except requests.exceptions.Timeout:
        print("Auth Check Timeout: Supabase not reachable")
        raise HTTPException(status_code=401, detail="Authentication Timeout (Supabase unreachable)")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Auth Check Error: {e}")
        raise HTTPException(status_code=401, detail="Authentication Failed (Internal Error)")
