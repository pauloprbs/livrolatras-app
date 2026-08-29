from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
import uuid

router = APIRouter(prefix="/nominations", tags=["Nominations"])

@router.post("/round/{round_id}", response_model=schemas.NominationResponse)
def create_nomination(round_id: uuid.UUID, user_id: uuid.UUID, nomination_in: schemas.NominationCreate, db: Session = Depends(get_db)):
    # Verifica se a rodada existe
    db_round = db.query(models.Round).filter(models.Round.id == round_id).first()
    if not db_round:
        raise HTTPException(status_code=404, detail="Rodada não encontrada")
        
    db_nomination = models.Nomination(
        **nomination_in.model_dump(),
        round_id=round_id,
        user_id=user_id
    )
    db.add(db_nomination)
    db.commit()
    db.refresh(db_nomination)
    return db_nomination

@router.get("/round/{round_id}", response_model=list[schemas.NominationResponse])
def read_nominations_by_round(round_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.query(models.Nomination).filter(models.Nomination.round_id == round_id).all()
