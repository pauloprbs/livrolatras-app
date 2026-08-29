from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class RoundBase(BaseModel):
    theme_name: str
    theme_description: Optional[str] = None
    month_year: str
    voting_opens_at: Optional[datetime] = None
    voting_closes_at: Optional[datetime] = None
    meeting_date: Optional[datetime] = None
    meeting_location: Optional[str] = None
    status: str = "open_suggestions"

class RoundCreate(RoundBase):
    pass

class RoundResponse(RoundBase):
    id: UUID
    winning_nomination_id: Optional[UUID] = None

    class Config:
        from_attributes = True

class NominationBase(BaseModel):
    title: str
    author: str
    isbn: Optional[str] = None
    cover_url: Optional[str] = None
    synopsis: Optional[str] = None

class NominationCreate(NominationBase):
    pass

class NominationResponse(NominationBase):
    id: UUID
    round_id: UUID
    user_id: UUID
    validation_score: Optional[float] = None
    llm_opinion: Optional[str] = None
    rejection_reason: Optional[str] = None
    status: str

    class Config:
        from_attributes = True
