"""
Campus Connect ERP — Anonymous Messaging API Router
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import cast, String, func
from typing import List, Optional
import os
import uuid
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.authority import Authority
from app.models.department import Department
from app.models.academic import Section
from app.models.messaging import Conversation, Message, SenderType, MessageType

from pydantic import BaseModel, ConfigDict

router = APIRouter()

# --- Pydantic Schemas ---

class StudentProfileReveal(BaseModel):
    name: str
    register_number: str
    department: str
    current_year: Optional[int] = None
    current_semester: Optional[int] = None
    section: Optional[str] = None
    email: str
    phone: str
    photo_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_type: str
    message_type: str
    message_text: Optional[str] = None
    image_url: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ConversationResponse(BaseModel):
    id: int
    student_id: int
    dean_id: int
    department_id: int
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    dean_unread_count: int
    student_unread_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    dean_name: Optional[str] = None  # Populated only for student-side API

    # Populated for Dean side API
    student_name: Optional[str] = None
    student_register_number: Optional[str] = None
    student_department: Optional[str] = None
    student_year: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


# --- Helper Profile Resolvers ---

def get_dean_profile(current_user: User, db: Session) -> Authority:
    if current_user.role != UserRole.AUTHORITY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to college authorities"
        )
    dean_profile = db.query(Authority).filter(
        Authority.user_id == current_user.id,
        func.lower(Authority.title) == "dean"
    ).first()
    if not dean_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to the Dean"
        )
    return dean_profile


def get_student_profile(current_user: User, db: Session) -> Student:
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to students"
        )
    student_profile = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found for this user"
        )
    return student_profile


# --- Router Endpoints ---

@router.get("/student/conversation", response_model=ConversationResponse)
def get_student_conversation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get or create the single conversation between a student and the Dean.
    """
    student = get_student_profile(current_user, db)
    
    # Resolve the active Dean
    dean = db.query(Authority).filter(
        func.lower(Authority.title) == "dean",
        Authority.is_active == True
    ).first()
    if not dean:
        raise HTTPException(
            status_code=status.HTTP_444_NOT_FOUND if hasattr(status, "HTTP_444_NOT_FOUND") else 404,
            detail="Unable to connect to the Dean's Messages. Please ensure the Dean account is active, or contact the system administrator."
        )
        
    conv = db.query(Conversation).filter(
        Conversation.student_id == student.id,
        Conversation.dean_id == dean.id
    ).first()
    
    if not conv:
        conv = Conversation(
            student_id=student.id,
            dean_id=dean.id,
            department_id=student.department_id,
            dean_unread_count=0,
            student_unread_count=0
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
        
    # Include Dean's name in student payload
    dean_name = f"Dean ({dean.first_name.capitalize()} {dean.last_name.capitalize()})"
    
    res = ConversationResponse.model_validate(conv)
    res.dean_name = dean_name
    return res


@router.get("/conversations", response_model=List[ConversationResponse])
def get_dean_conversations(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all conversations belonging to the Dean, with search support.
    """
    dean_profile = get_dean_profile(current_user, db)
    
    query = db.query(Conversation).filter(Conversation.dean_id == dean_profile.id)
    
    if search:
        search_pat = f"%{search}%"
        query = query.join(Student).outerjoin(Section).outerjoin(Department).filter(
            (Student.first_name.ilike(search_pat)) |
            (Student.last_name.ilike(search_pat)) |
            (func.concat(Student.first_name, " ", Student.last_name).ilike(search_pat)) |
            (Student.register_number.ilike(search_pat)) |
            (Department.name.ilike(search_pat)) |
            (Department.code.ilike(search_pat)) |
            (Section.name.ilike(search_pat)) |
            (cast(Student.current_year, String).ilike(search_pat))
        )
        
    conversations = query.order_by(Conversation.last_message_time.desc().nullslast()).all()
    
    results = []
    for c in conversations:
        res = ConversationResponse.model_validate(c)
        if c.student:
            res.student_name = f"{c.student.first_name} {c.student.last_name}"
            res.student_register_number = c.student.register_number
            if c.student.department:
                res.student_department = c.student.department.name
            res.student_year = c.student.current_year
        results.append(res)
        
    return results


@router.get("/conversations/{conversation_id}/student-profile", response_model=StudentProfileReveal)
def get_student_profile_reveal(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Confidential endpoint for the Dean to reveal student identity.
    """
    dean_profile = get_dean_profile(current_user, db)
    
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    if conv.dean_id != dean_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this conversation's profile"
        )
        
    student = db.query(Student).filter(Student.id == conv.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
        
    dept_name = student.department.name if student.department else "Unknown"
    sec_name = student.section.name if student.section else "Unknown"
    
    return StudentProfileReveal(
        name=f"{student.first_name} {student.last_name}",
        register_number=student.register_number,
        department=dept_name,
        current_year=student.current_year,
        current_semester=student.current_semester,
        section=sec_name,
        email=student.college_email,
        phone=student.phone,
        photo_url=student.photo_url
    )


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
def get_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all messages in a conversation and reset unread status for the caller.
    """
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    # Verify access & clear unread status
    if current_user.role == UserRole.STUDENT:
        student = get_student_profile(current_user, db)
        if conv.student_id != student.id:
            raise HTTPException(status_code=403, detail="Access denied")
            
        conv.student_unread_count = 0
        db.query(Message).filter(
            Message.conversation_id == conv.id,
            Message.sender_type == SenderType.DEAN,
            Message.is_read == False
        ).update({Message.is_read: True}, synchronize_session=False)
        db.commit()
        
    elif current_user.role == UserRole.AUTHORITY:
        dean_profile = get_dean_profile(current_user, db)
        if conv.dean_id != dean_profile.id:
            raise HTTPException(status_code=403, detail="Access denied")
            
        conv.dean_unread_count = 0
        db.query(Message).filter(
            Message.conversation_id == conv.id,
            Message.sender_type == SenderType.STUDENT,
            Message.is_read == False
        ).update({Message.is_read: True}, synchronize_session=False)
        db.commit()
    else:
        raise HTTPException(status_code=403, detail="Access denied")
        
    messages = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).all()
    return messages


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: int,
    message_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Send a message (text and/or image upload) in a conversation.
    """
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    # Verify access & identify sender
    if current_user.role == UserRole.STUDENT:
        student = get_student_profile(current_user, db)
        if conv.student_id != student.id:
            raise HTTPException(status_code=403, detail="Access denied")
        sender_type = SenderType.STUDENT
    elif current_user.role == UserRole.AUTHORITY:
        dean_profile = get_dean_profile(current_user, db)
        if conv.dean_id != dean_profile.id:
            raise HTTPException(status_code=403, detail="Access denied")
        sender_type = SenderType.DEAN
    else:
        raise HTTPException(status_code=403, detail="Access denied")
        
    image_url = None
    message_type = MessageType.TEXT
    
    if file:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            raise HTTPException(
                status_code=400,
                detail="Unsupported image type. Allowed formats: jpg, jpeg, png, webp"
            )
            
        os.makedirs("uploads/messages", exist_ok=True)
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join("uploads/messages", filename)
        
        with open(filepath, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
            
        image_url = f"/uploads/messages/{filename}"
        message_type = MessageType.IMAGE
        
    # Save the new message
    msg = Message(
        conversation_id=conversation_id,
        sender_type=sender_type,
        message_type=message_type,
        message_text=message_text,
        image_url=image_url,
        is_read=False
    )
    db.add(msg)
    
    # Update conversation metadata & counters
    conv.last_message = message_text if message_type == MessageType.TEXT else "[Image]"
    conv.last_message_time = func.now()
    
    if sender_type == SenderType.STUDENT:
        conv.dean_unread_count += 1
    else:
        conv.student_unread_count += 1
        
    db.commit()
    db.refresh(msg)
    return msg
