import os
import sys
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))
sys.path.append(os.path.join(os.path.dirname(__file__), '../apps/api'))

from database import engine
from sqlalchemy import text

def fix_table():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE votes ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;"))
            conn.commit()
            print("Coluna 'created_at' adicionada à tabela votes com sucesso!")
        except Exception as e:
            if "already exists" in str(e):
                print("A coluna já existe.")
            else:
                print(f"Erro: {e}")

if __name__ == "__main__":
    fix_table()
