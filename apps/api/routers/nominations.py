from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
import models, schemas
import uuid
import requests
from auth import get_current_user

router = APIRouter(prefix="/nominations", tags=["Nominations"])

def process_nomination_background(nom_id: uuid.UUID, nomination_in: schemas.NominationCreate, theme_description: str):
    db = SessionLocal()
    try:
        db_nomination = db.query(models.Nomination).filter(models.Nomination.id == nom_id).first()
        if not db_nomination:
            return
            
        # Enriquecimento via BrasilAPI / Google Books
        needs_enrichment = not (nomination_in.title and nomination_in.author and nomination_in.synopsis and nomination_in.cover_url)
        
        if needs_enrichment:
            if nomination_in.isbn:
                isbn = nomination_in.isbn.replace("-", "").strip()
                res = requests.get(f"https://brasilapi.com.br/api/isbn/v1/{isbn}")
                if res.status_code == 200:
                    data = res.json()
                    nomination_in.title = nomination_in.title or data.get("title", "")
                    authors = data.get("authors", [])
                    nomination_in.author = nomination_in.author or (", ".join(authors) if authors else "")
                    nomination_in.cover_url = nomination_in.cover_url or data.get("cover_url", "")
                    nomination_in.synopsis = nomination_in.synopsis or data.get("synopsis", "")
                else:
                    gres = requests.get(f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}")
                    if gres.status_code == 200:
                        gdata = gres.json()
                        if gdata.get("totalItems", 0) > 0:
                            item = gdata["items"][0].get("volumeInfo", {})
                            nomination_in.title = nomination_in.title or item.get("title", "")
                            authors = item.get("authors", [])
                            nomination_in.author = nomination_in.author or (", ".join(authors) if authors else "")
                            nomination_in.synopsis = nomination_in.synopsis or item.get("description", "")
                            images = item.get("imageLinks", {})
                            nomination_in.cover_url = nomination_in.cover_url or images.get("thumbnail", "")
            elif nomination_in.title:
                query = f"intitle:{nomination_in.title}"
                if nomination_in.author:
                    query += f"+inauthor:{nomination_in.author}"
                    
                gres = requests.get(f"https://www.googleapis.com/books/v1/volumes?q={query}")
                if gres.status_code == 200:
                    gdata = gres.json()
                    if gdata.get("totalItems", 0) > 0:
                        item = gdata["items"][0].get("volumeInfo", {})
                        nomination_in.title = nomination_in.title or item.get("title", "")
                        authors = item.get("authors", [])
                        nomination_in.author = nomination_in.author or (", ".join(authors) if authors else "")
                        nomination_in.synopsis = nomination_in.synopsis or item.get("description", "")
                        images = item.get("imageLinks", {})
                        
                        thumb = images.get("thumbnail", "")
                        if thumb and thumb.startswith("http:"):
                            thumb = thumb.replace("http:", "https:")
                        nomination_in.cover_url = nomination_in.cover_url or thumb
                        
        # Gerador de Sinopse de Emergência (Gemini)
        if not nomination_in.synopsis and nomination_in.title and nomination_in.author:
            try:
                import os
                import google.generativeai as genai
                from dotenv import load_dotenv
                load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))
                
                gemini_key = os.environ.get("GEMINI_API_KEY")
                if gemini_key:
                    genai.configure(api_key=gemini_key)
                    model = genai.GenerativeModel("gemini-3.6-flash")
                    res_gemini = model.generate_content(f"Escreva uma sinopse muita curta (max 3 frases) em português para o livro '{nomination_in.title}' de {nomination_in.author}.")
                    nomination_in.synopsis = res_gemini.text.strip()
            except Exception as e:
                print(f"Erro ao gerar sinopse com Gemini: {e}")
                
            if not nomination_in.synopsis:
                nomination_in.synopsis = f"Obra clássica '{nomination_in.title}', escrita por {nomination_in.author}. (Sinopse gerada automaticamente para validação)."

        status_val = "pending"
        score = None
        opinion = None
        embedding = None
        
        if nomination_in.title and nomination_in.synopsis:
            from ai_utils import validate_nomination, generate_embedding
            
            embedding = generate_embedding(f"Título: {nomination_in.title}\nSinopse: {nomination_in.synopsis}")
            
            ai_res = validate_nomination(theme_description, nomination_in.synopsis)
            score = ai_res.get("score", 0)
            opinion = ai_res.get("opinion", "")
            
            # Deixamos como pending para passar pela moderação humana no Painel Admin
            status_val = "pending"
        elif not nomination_in.title or not nomination_in.author:
            status_val = "pending_metadata"

        # Atualiza a indicação com os dados processados
        db_nomination.title = nomination_in.title
        db_nomination.author = nomination_in.author
        db_nomination.synopsis = nomination_in.synopsis
        db_nomination.cover_url = nomination_in.cover_url
        db_nomination.status = status_val
        db_nomination.validation_score = score
        db_nomination.llm_opinion = opinion
        db_nomination.embedding = embedding
        
        db.commit()

    except Exception as e:
        print(f"Erro crítico no background: {e}")
        if db_nomination:
            db_nomination.status = "pending_metadata"
            db_nomination.llm_opinion = f"Falha no processamento: {str(e)}"
            db.commit()
    finally:
        db.close()


@router.post("/round/{round_id}", response_model=schemas.NominationResponse)
def create_nomination(
    round_id: uuid.UUID, 
    nomination_in: schemas.NominationCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Verifica se a rodada existe
    db_round = db.query(models.Round).filter(models.Round.id == round_id).first()
    if not db_round:
        raise HTTPException(status_code=404, detail="Rodada não encontrada")
    
    # Busca o usuário
    db_user = db.query(models.Member).filter(models.Member.supabase_uid == current_user.id).first()
    if not db_user:
        raise HTTPException(status_code=403, detail="Membro não sincronizado no sistema")

    # Bloqueio de duplicatas
    existing_nomination = db.query(models.Nomination).filter(
        models.Nomination.round_id == round_id,
        models.Nomination.user_id == db_user.id
    ).first()
    
    if existing_nomination:
        raise HTTPException(status_code=400, detail="Você já enviou uma indicação para esta rodada. Limite de 1 por membro.")

    # Salva IMEDIATAMENTE como "pending" (resposta rápida para a UI)
    db_nomination = models.Nomination(
        **nomination_in.model_dump(),
        round_id=round_id,
        user_id=db_user.id,
        status="pending"
    )
    db.add(db_nomination)
    db.commit()
    db.refresh(db_nomination)
    
    # Despacha a carga pesada para o Background!
    background_tasks.add_task(
        process_nomination_background, 
        nom_id=db_nomination.id, 
        nomination_in=nomination_in, 
        theme_description=db_round.theme_description
    )
    
    return db_nomination


@router.get("/round/{round_id}", response_model=list[schemas.NominationResponse])
def read_nominations_by_round(round_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.query(models.Nomination).filter(models.Nomination.round_id == round_id).all()

@router.patch("/{nom_id}/status", response_model=schemas.NominationResponse)
def update_nomination_status(
    nom_id: uuid.UUID,
    status: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_user = db.query(models.Member).filter(models.Member.supabase_uid == current_user.id).first()
    if not db_user or db_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores podem moderar indicações.")
        
    db_nom = db.query(models.Nomination).filter(models.Nomination.id == nom_id).first()
    if not db_nom:
        raise HTTPException(status_code=404, detail="Indicação não encontrada.")
        
    if status not in ["approved", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Status inválido.")
        
    db_nom.status = status
    db.commit()
    db.refresh(db_nom)
    return db_nom
