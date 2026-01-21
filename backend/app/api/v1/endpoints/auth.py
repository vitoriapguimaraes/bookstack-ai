import requests
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlmodel import Session
from app.core.config import settings
from app.core.database import get_session
from app.models.user import Profile, UserPreference

router = APIRouter()


class UserRegister(BaseModel):
    email: EmailStr
    password: str


def _signup_on_supabase(email: str, password: str):
    """Auxiliar para cadastrar no Supabase Auth."""
    print(f"DEBUG: Calling Supabase Auth API: {settings.SUPABASE_URL}")
    url = f"{settings.SUPABASE_URL}/auth/v1/signup"
    headers = {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }
    payload = {"email": email, "password": password}

    response = requests.post(url, json=payload, headers=headers)
    response_data = response.json()

    if response.status_code != 200:
        msg = (
            response_data.get("msg")
            or response_data.get("error_description")
            or "Erro no cadastro"
        )
        print(f"DEBUG: Supabase Auth Failed: {response.status_code} - {msg}")
        raise HTTPException(status_code=response.status_code, detail=msg)

    user_info = response_data.get("user")
    if not user_info and "id" in response_data:
        user_info = response_data

    if not user_info:
        print("DEBUG: Could not extract user info from response")
        raise HTTPException(
            status_code=500, detail="Falha ao obter ID do usuário do Supabase"
        )
    return user_info


def _create_local_profile_if_missing(session: Session, user_id: str, email: str):
    """Auxiliar para criar perfil local se não existir."""
    existing_profile = session.get(Profile, user_id)
    if not existing_profile:
        print(f"DEBUG: Creating local profile and preferences for {user_id}")

        # 1. Create Profile
        new_profile = Profile(id=user_id, email=email, role="user", is_active=True)
        session.add(new_profile)

        # 2. Create User Preferences
        # (Check performed inside session.get usually, but here we can be direct
        # since we are inside a 'new user' flow context or relying on unique constraints)
        new_pref = UserPreference(user_id=user_id)
        session.add(new_pref)

        session.commit()
        print("DEBUG: Local profile and preferences committed.")
    else:
        print("DEBUG: Profile already exists.")


@router.post("/register")
def register_user(user_data: UserRegister, session: Session = Depends(get_session)):
    """
    Registers a new user by calling Supabase Auth and creating a local Profile.
    This ensures the user list is always in sync.
    """
    print(f"DEBUG: Starting registration for {user_data.email}")

    try:
        # 1. Supabase Auth
        user_info = _signup_on_supabase(user_data.email, user_data.password)
        user_id = user_info.get("id")
        email = user_info.get("email")
        print(f"DEBUG: User Created in Auth. ID: {user_id}, Email: {email}")

        # 2. Local Profile (and Preferences)
        # We removed the diagnostic DB check because we know the Transaction Pooler
        # doesn't show auth.users immediately. We are relying on dropped FKs.
        _create_local_profile_if_missing(session, user_id, email)

        return {
            "message": "Cadastro realizado com sucesso! Verifique seu email.",
            "user_id": user_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration Error: {e}")
        session.rollback()
        raise HTTPException(
            status_code=500, detail="Erro interno no servidor durante o cadastro"
        )
