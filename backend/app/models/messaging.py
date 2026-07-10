"""
Campus Connect ERP — Anonymous Messaging Models

Dedicated tables for the Anonymous Student Messaging module.
Students can message the Dean anonymously. The Dean can view student
identity via a private profile reveal — not shown to students.

Do NOT add columns to existing tables for this module.
"""

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey,
    Text, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class SenderType(str, enum.Enum):
    STUDENT = "student"
    DEAN = "dean"


class MessageType(str, enum.Enum):
    TEXT = "text"
    IMAGE = "image"


class Conversation(Base):
    """
    One conversation per student-Dean pair.
    A student has exactly one conversation with the institution's Dean.
    All students across all departments message the same Dean.
    """
    __tablename__ = "msg_conversations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    dean_id = Column(Integer, ForeignKey("authorities.id"), nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)

    last_message = Column(Text, nullable=True)
    last_message_time = Column(DateTime(timezone=True), nullable=True)

    # Unread counts
    dean_unread_count = Column(Integer, default=0, nullable=False)
    student_unread_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")
    student = relationship("Student", foreign_keys=[student_id])
    dean = relationship("Authority", foreign_keys=[dean_id])


class Message(Base):
    """
    Individual messages within a conversation.
    """
    __tablename__ = "msg_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("msg_conversations.id"), nullable=False, index=True)

    sender_type = Column(SQLEnum(SenderType), nullable=False)
    message_type = Column(SQLEnum(MessageType), nullable=False, default=MessageType.TEXT)

    message_text = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)

    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    conversation = relationship("Conversation", back_populates="messages")
