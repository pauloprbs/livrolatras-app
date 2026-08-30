import os
import sys
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))
sys.path.append(os.path.join(os.path.dirname(__file__), '../apps/api'))

from database import engine
from models import Base

def create_new_tables():
    print("Verificando e criando novas tabelas no banco de dados...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Tabelas criadas com sucesso (se já existissem, foram ignoradas).")
    except Exception as e:
        print(f"Erro ao criar tabelas: {e}")

if __name__ == "__main__":
    create_new_tables()
