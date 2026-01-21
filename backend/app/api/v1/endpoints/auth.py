import requests
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlmodel import Session
from app.core.config import settings
from app.core.database import get_session
from app.models.user import Profile

router = APIRouter()


class UserRegister(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
def register_user(user_data: UserRegister, session: Session = Depends(get_session)):
    """
    Registers a new user by calling Supabase Auth and creating a local Profile.
    This ensures the user list is always in sync.
    """

    # 1. Update Supabase Auth
    supabase_auth_url = f"{settings.SUPABASE_URL}/auth/v1/signup"
    headers = {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "email": user_data.email,
        "password": user_data.password,
    }

    try:
        response = requests.post(supabase_auth_url, json=payload, headers=headers)
        response_data = response.json()

        if response.status_code != 200:
            # Propagate Supabase error
            msg = (
                response_data.get("msg")
                or response_data.get("error_description")
                or "Erro no cadastro"
            )
            raise HTTPException(status_code=response.status_code, detail=msg)

        # 2. Extract User ID
        # Supabase returns user object inside 'user' key (or root depending on version via anon)
        # Usually { "user": { "id": "...", ... }, ... } or just keys if auto-confirm is on?
        # Standard GoTrue response usually has 'id' at root or inside 'user'.
        # Let's inspect typical structure: { "id": "...", "aud": "authenticated", ... }
        # OR { "access_token": "...", "user": { ... } }

        user_info = response_data.get("user")
        if not user_info and "id" in response_data:
            user_info = response_data  # sometimes it returns the user directly if no confirmation needed?

        if not user_info:
            # Fallback if structure is unexpected
            raise HTTPException(
                status_code=500, detail="Falha ao obter ID do usuário do Supabase"
            )

        user_id = user_info.get("id")
        email = user_info.get("email")

        # 3. Create Local Profile
        # Check if exists (shouldn't, but good to be safe)
        existing_profile = session.get(Profile, user_id)
        if not existing_profile:
            new_profile = Profile(id=user_id, email=email, role="user", is_active=True)
            session.add(new_profile)
            session.commit()

        return {
            "message": "Cadastro realizado com sucesso! Verifique seu email.",
            "user_id": user_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration Error: {e}")
        raise HTTPException(
            status_code=500, detail="Erro interno no servidor durante o cadastro"
        )
