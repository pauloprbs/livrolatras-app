from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/sync")
def sync_user(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Sincroniza o usuário autenticado do Supabase com a nossa tabela interna 'members'.
    Isso substitui a necessidade de um webhook externo no ambiente de desenvolvimento.
    """
    db_user = db.query(models.Member).filter(models.Member.supabase_uid == current_user.id).first()
    
    if not db_user:
        metadata = current_user.user_metadata
        db_user = models.Member(
            supabase_uid=current_user.id,
            name=metadata.get("full_name", "Usuário do Clube"),
            email=current_user.email,
            avatar_url=metadata.get("avatar_url", "")
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    
    return {"message": "Usuário sincronizado com sucesso", "member_id": db_user.id, "role": db_user.role}

@router.get("/members")
def get_all_members(db: Session = Depends(get_db)):
    # Retorna nome, avatar e id de todos os membros
    members = db.query(models.Member).all()
    return [{"id": str(m.id), "name": m.name, "avatar_url": m.avatar_url, "role": m.role} for m in members]
