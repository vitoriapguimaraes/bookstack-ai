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
    print(f"DEBUG: Checking Auth Token: {token[:10]}...")
    
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
    try:
        print(f"DEBUG: Requesting user from Supabase: {SUPABASE_URL}/auth/v1/user")
        response = requests.get(f"{SUPABASE_URL}/auth/v1/user", headers=headers, timeout=2)
        
        print(f"DEBUG: Supabase response status: {response.status_code}")
        if response.status_code != 200:
            print(f"DEBUG: Supabase response text: {response.text}")
            raise HTTPException(status_code=401, detail="Invalid or Expired Token")
            
        return response.json()
    except requests.exceptions.Timeout:
        print("Auth Check Timeout: Supabase not reachable")
        # For debugging purposes, if timeout, maybe we simulate a success for the admin email if hardcoded? 
        # No, that requires decoding the token which we can't do without library.
        # We will just raise the 401 with specific message.
        raise HTTPException(status_code=401, detail="Authentication Timeout (Supabase unreachable)")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Auth Check Error: {e}")
        raise HTTPException(status_code=401, detail="Authentication Failed (Internal Error)")
