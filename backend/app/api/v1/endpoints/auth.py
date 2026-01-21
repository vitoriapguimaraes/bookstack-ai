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
        print(f"DEBUG: Creating local profile for {user_id}")
        new_profile = Profile(id=user_id, email=email, role="user", is_active=True)
        session.add(new_profile)
        session.commit()
        print("DEBUG: Local profile committed.")
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

        # DIAGNOSTIC STEP
        try:
            from sqlalchemy import text

            # Fix: Using bindparams for robust scalar execution in various SQLAlchemy/SQLModel versions
            stmt = text("SELECT id FROM auth.users WHERE id = :uid").bindparams(
                uid=user_id
            )
            result = session.exec(stmt).first()
            if result:
                print(
                    f"DEBUG: SUCCESS - User {user_id} found in auth.users table via DB connection."
                )
            else:
                print(
                    f"DEBUG: CRITICAL - User {user_id} NOT found in auth.users via DB connection!"
                )
                stmt_chk = text(
                    "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'"
                )
                chk = session.exec(stmt_chk).first()
                if chk:
                    print(
                        "DEBUG: WARNING - 'public.users' table EXISTS. This might be confusing the constraint."
                    )
        except Exception as dd:
            print(f"DEBUG: Database Check Failed: {dd}")

        # 2. Local Profile
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
