from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.core.config import get_settings
from app.models.user import User
from app.schemas.auth import Token

settings = get_settings()
router = APIRouter()

@router.post("/login", response_model=Token)
def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    # We use OAuth2PasswordRequestForm which uses 'username' and 'password'
    # In our case, 'username' will carry the email address.
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value}, expires_delta=access_token_expires
    )
    
    # Return basic user info with token
    user_data = {
        "id": user.id,
        "email": user.email,
        "role": user.role.value,
        "name": user.email.split('@')[0] # Fallback until profiles are populated
    }
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_data}

from app.core.security import get_current_active_user
from app.models.faculty import Faculty
from app.models.academic import Section

@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    extra = {"is_class_advisor": False, "advisor_section_id": None}

    if current_user.role in ("faculty", "hod"):
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if faculty:
            section = db.query(Section).filter(
                Section.class_advisor_id == faculty.id,
                Section.is_active == True
            ).first()
            if section:
                extra["is_class_advisor"] = True
                extra["advisor_section_id"] = section.id

    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role.value,
        **extra
    }
