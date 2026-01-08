from typing import Optional, Dict, Any
from sqlmodel import Field, SQLModel, JSON
from datetime import datetime

class UserPreference(SQLModel, table=True):
    __tablename__ = "user_preferences"
    
    user_id: str = Field(primary_key=True)
    openai_key: Optional[str] = None
    gemini_key: Optional[str] = None
    groq_key: Optional[str] = None
    yearly_goal: int = Field(default=20)
    custom_prompts: Dict[str, Any] = Field(default={}, sa_type=JSON)
    formula_config: Dict[str, Any] = Field(default={}, sa_type=JSON)
    class_categories: Dict[str, Any] = Field(default={}, sa_type=JSON)
    
    # Onboarding Flags
    has_api_keys: bool = Field(default=False)
    has_custom_prompts: bool = Field(default=False)
    has_custom_formula: bool = Field(default=False)
    has_custom_classes: bool = Field(default=False)
    has_custom_availability: bool = Field(default=False)
    
    # Custom Lists
    availability_options: Optional[list] = Field(default=None, sa_type=JSON)
    
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Profile(SQLModel, table=True):
    __tablename__ = "profiles"

    id: str = Field(primary_key=True)
    email: str
    role: str = Field(default="user")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
