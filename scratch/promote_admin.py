import os
import sys
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))
sys.path.append(os.path.join(os.path.dirname(__file__), '../apps/api'))

from database import SessionLocal
from models import Member

def promote_first_user():
    db = SessionLocal()
    try:
        user = db.query(Member).first()
        if user:
            user.role = "super_admin"
            db.commit()
            print(f"Usuário {user.name} promovido a super_admin com sucesso!")
        else:
            print("Nenhum usuário encontrado no banco de dados.")
    except Exception as e:
        print(f"Erro: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    promote_first_user()
