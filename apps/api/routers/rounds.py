from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
import uuid
from datetime import datetime, timezone
from auth import get_current_user

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

@router.get("/active", response_model=schemas.RoundResponse)
def get_active_round(db: Session = Depends(get_db)):
    db_round = db.query(models.Round).filter(models.Round.status == 'open_suggestions').order_by(models.Round.voting_opens_at.desc()).first()
    if not db_round:
        db_round = db.query(models.Round).order_by(models.Round.voting_opens_at.desc()).first()
    if not db_round:
        raise HTTPException(status_code=404, detail="Nenhuma rodada encontrada")
    return db_round

@router.get("/{round_id}", response_model=schemas.RoundResponse)
def read_round(round_id: uuid.UUID, db: Session = Depends(get_db)):
    db_round = db.query(models.Round).filter(models.Round.id == round_id).first()
    if not db_round:
        raise HTTPException(status_code=404, detail="Rodada não encontrada")
    return db_round

@router.post("/{round_id}/vote", response_model=schemas.VoteResponse)
def vote_for_nomination(
    round_id: uuid.UUID,
    vote_in: schemas.VoteCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 1. Fetch user
    db_user = db.query(models.Member).filter(models.Member.supabase_uid == current_user.id).first()
    if not db_user:
        raise HTTPException(status_code=403, detail="Membro não encontrado.")
    
    # 2. Fetch round
    db_round = db.query(models.Round).filter(models.Round.id == round_id).first()
    if not db_round:
        raise HTTPException(status_code=404, detail="Rodada não encontrada.")
        
    # 3. Check time limits
    # Se datetime vier sem fuso horário do banco, forçar UTC para comparar com now(utc)
    now = datetime.now(timezone.utc)
    opens_at = db_round.voting_opens_at
    closes_at = db_round.voting_closes_at
    
    if opens_at and opens_at.tzinfo is None:
        opens_at = opens_at.replace(tzinfo=timezone.utc)
    if closes_at and closes_at.tzinfo is None:
        closes_at = closes_at.replace(tzinfo=timezone.utc)
        
    if not opens_at or now < opens_at:
        raise HTTPException(status_code=403, detail="A votação ainda não está aberta.")
        
    if not closes_at or now > closes_at:
        raise HTTPException(status_code=403, detail="A votação já foi encerrada.")
        
    # 4. Fetch nomination
    db_nom = db.query(models.Nomination).filter(models.Nomination.id == vote_in.nomination_id).first()
    if not db_nom or db_nom.round_id != round_id:
        raise HTTPException(status_code=404, detail="Indicação não encontrada para esta rodada.")
        
    # 5. Check if user is voting for their own book
    if db_nom.user_id == db_user.id:
        raise HTTPException(status_code=403, detail="Você não pode votar no seu próprio livro.")
        
    # 6. Check if user already voted in this round
    existing_vote = db.query(models.Vote).filter(
        models.Vote.round_id == round_id,
        models.Vote.user_id == db_user.id
    ).first()
        
    # 7. Calculate weight (Attendance check)
    prev_round = db.query(models.Round).filter(models.Round.id != round_id).order_by(models.Round.voting_opens_at.desc()).first()
    
    weight = 1.0
    if prev_round:
        attended = db.query(models.Attendance).filter(
            models.Attendance.round_id == prev_round.id,
            models.Attendance.user_id == db_user.id
        ).first()
        if attended:
            weight = 1.3
            
    # 8. Save or Update vote
    if existing_vote:
        existing_vote.nomination_id = db_nom.id
        existing_vote.weight = weight
        db.commit()
        db.refresh(existing_vote)
        return existing_vote
    else:
        db_vote = models.Vote(
            user_id=db_user.id,
            nomination_id=db_nom.id,
            round_id=round_id,
            weight=weight
        )
        db.add(db_vote)
        db.commit()
        db.refresh(db_vote)
        
        return db_vote

@router.get("/{round_id}/my_vote", response_model=schemas.VoteResponse)
def get_my_vote(
    round_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_user = db.query(models.Member).filter(models.Member.supabase_uid == current_user.id).first()
    if not db_user:
        raise HTTPException(status_code=403, detail="Membro não encontrado.")
        
    vote = db.query(models.Vote).filter(
        models.Vote.round_id == round_id,
        models.Vote.user_id == db_user.id
    ).first()
    
    if not vote:
        raise HTTPException(status_code=404, detail="Voto não encontrado.")
    return vote

@router.get("/{round_id}/attendance", response_model=list[schemas.AttendanceResponse])
def get_attendance(
    round_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_user = db.query(models.Member).filter(models.Member.supabase_uid == current_user.id).first()
    if not db_user or db_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    return db.query(models.Attendance).filter(models.Attendance.round_id == round_id).all()

@router.post("/{round_id}/attendance/{user_id}", response_model=schemas.AttendanceResponse)
def add_attendance(
    round_id: uuid.UUID,
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_user = db.query(models.Member).filter(models.Member.supabase_uid == current_user.id).first()
    if not db_user or db_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado.")
        
    existing = db.query(models.Attendance).filter(
        models.Attendance.round_id == round_id,
        models.Attendance.user_id == user_id
    ).first()
    
    if existing:
        return existing
        
    new_att = models.Attendance(round_id=round_id, user_id=user_id)
    db.add(new_att)
    db.commit()
    db.refresh(new_att)
    return new_att

@router.delete("/{round_id}/attendance/{user_id}")
def remove_attendance(
    round_id: uuid.UUID,
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_user = db.query(models.Member).filter(models.Member.supabase_uid == current_user.id).first()
    if not db_user or db_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado.")
        
    att = db.query(models.Attendance).filter(
        models.Attendance.round_id == round_id,
        models.Attendance.user_id == user_id
    ).first()
    
    if att:
        db.delete(att)
        db.commit()
        
    return {"status": "removed"}
