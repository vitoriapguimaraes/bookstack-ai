import requests
from fastapi import Header, HTTPException
from typing import Optional
from app.core.config import settings
from app.core.database import get_session
from app.models.user import Profile


def _verify_supabase_token(token: str) -> dict:
    """Verifies the token with Supabase Auth API."""
    if not settings.SUPABASE_URL:
        print("CRITICAL: SUPABASE_URL is not set!")
        raise HTTPException(
            status_code=500, detail="Server Configuration Error: Missing SUPABASE_URL"
        )

    # Use ANON KEY for verification typically, or Service Role?
    # The original code used "SUPABASE_KEY" which was loaded from "SUPABASE_ANON_KEY" in the file I replaced.
    # So I will use settings.SUPABASE_ANON_KEY or settings.SUPABASE_KEY.
    # In original file: SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
    headers = {
        "apikey": settings.SUPABASE_ANON_KEY or settings.SUPABASE_KEY,
        "Authorization": f"Bearer {token}",
    }

    try:
        response = requests.get(
            f"{settings.SUPABASE_URL}/auth/v1/user", headers=headers, timeout=5
        )

        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid or Expired Token")

        return response.json()

    except requests.exceptions.Timeout:
        print("Auth Check Timeout: Supabase not reachable")
        raise HTTPException(
            status_code=401, detail="Authentication Timeout (Supabase unreachable)"
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Auth Check Error: {e}")
        raise HTTPException(
            status_code=401, detail="Authentication Failed (Internal Error)"
        )


def _ensure_user_active(user_id: str):
    """Checks if the user profile is active in the local database."""
    # Manually create a session since we are likely inside a dependency execution
    session = next(get_session())
    try:
        profile = session.get(Profile, user_id)
        if profile and not profile.is_active:
            raise HTTPException(
                status_code=403, detail="User account is inactive. Contact admin."
            )
    finally:
        session.close()


def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Validates the Bearer Token against Supabase Auth API.
    Returns the user object if valid, else raises 401.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authentication Token")

    token = authorization.replace("Bearer ", "")

    user_data = _verify_supabase_token(token)
    user_id = user_data.get("id")

    _ensure_user_active(user_id)

    return user_data
