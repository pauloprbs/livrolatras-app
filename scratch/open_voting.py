import os
import sys
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))
sys.path.append(os.path.join(os.path.dirname(__file__), '../apps/api'))

from database import SessionLocal
from models import Round

def force_open_voting():
    db = SessionLocal()
    try:
        active_round = db.query(Round).filter(Round.status == 'open_suggestions').first()
        if active_round:
            now = datetime.now(timezone.utc)
            active_round.voting_opens_at = now - timedelta(days=1)
            active_round.voting_closes_at = now + timedelta(days=1)
            db.commit()
            print("Sucesso! A votação da rodada atual foi ABERTA (encerra amanhã).")
        else:
            print("Nenhuma rodada ativa encontrada.")
    except Exception as e:
        print(f"Erro: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    force_open_voting()
