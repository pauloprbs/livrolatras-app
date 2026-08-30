from sqlalchemy import Column, String, Float, Boolean, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from database import engine
from sqlalchemy.ext.declarative import declarative_base
import uuid

Base = declarative_base()

class Member(Base):
    __tablename__ = "members"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supabase_uid = Column(String, unique=True)
    name = Column(String)
    email = Column(String, unique=True)
    avatar_url = Column(String)
    role = Column(String, default="member")
    status = Column(String, default="active")
    joined_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

class Round(Base):
    __tablename__ = "rounds"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    theme_name = Column(String)
    theme_description = Column(String)
    theme_image_url = Column(String)
    month_year = Column(String)
    voting_opens_at = Column(TIMESTAMP(timezone=True))
    voting_closes_at = Column(TIMESTAMP(timezone=True))
    meeting_date = Column(TIMESTAMP(timezone=True))
    meeting_location = Column(String)
    winning_nomination_id = Column(UUID(as_uuid=True), ForeignKey("nominations.id"))
    status = Column(String, default="open_suggestions")

class Nomination(Base):
    __tablename__ = "nominations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    round_id = Column(UUID(as_uuid=True), ForeignKey("rounds.id", ondelete="CASCADE"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("members.id", ondelete="CASCADE"))
    title = Column(String)
    author = Column(String)
    isbn = Column(String)
    cover_url = Column(String)
    synopsis = Column(String)
    embedding = Column(Vector(768))
    validation_score = Column(Float)
    llm_opinion = Column(String)
    rejection_reason = Column(String)
    status = Column(String, default="pending")

class Vote(Base):
    __tablename__ = "votes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("members.id", ondelete="CASCADE"))
    nomination_id = Column(UUID(as_uuid=True), ForeignKey("nominations.id", ondelete="CASCADE"))
    round_id = Column(UUID(as_uuid=True), ForeignKey("rounds.id", ondelete="CASCADE"))
    weight = Column(Float, default=1.0)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

class Attendance(Base):
    __tablename__ = "attendances"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("members.id", ondelete="CASCADE"))
    round_id = Column(UUID(as_uuid=True), ForeignKey("rounds.id", ondelete="CASCADE"))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
