from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
import uuid

router = APIRouter(prefix="/rounds", tags=["Rounds"])

@router.post("/", response_model=schemas.RoundResponse)
def create_round(round_in: schemas.RoundCreate, db: Session = Depends(get_db)):
    db_round = models.Round(**round_in.model_dump())
    db.add(db_round)
    db.commit()
    db.refresh(db_round)
    return db_round

@router.get("/", response_model=list[schemas.RoundResponse])
def read_rounds(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return db.query(models.Round).order_by(models.Round.voting_opens_at.desc()).offset(skip).limit(limit).all()

@router.get("/{round_id}", response_model=schemas.RoundResponse)
def read_round(round_id: uuid.UUID, db: Session = Depends(get_db)):
    db_round = db.query(models.Round).filter(models.Round.id == round_id).first()
    if not db_round:
        raise HTTPException(status_code=404, detail="Rodada não encontrada")
    return db_round
