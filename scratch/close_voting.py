import os
import sys
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))
sys.path.append(os.path.join(os.path.dirname(__file__), '../apps/api'))

from database import SessionLocal
from models import Round

def force_close_voting():
    db = SessionLocal()
    try:
        active_round = db.query(Round).filter(Round.status == 'open_suggestions').first()
        if active_round:
            # Apaga as datas de votação, voltando para a fase de Indicação
            active_round.voting_opens_at = None
            active_round.voting_closes_at = None
            db.commit()
            print("Sucesso! O portal de Indicações foi reaberto.")
        else:
            print("Nenhuma rodada ativa encontrada.")
    except Exception as e:
        print(f"Erro: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    force_close_voting()
