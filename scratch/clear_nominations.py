import os
import sys
sys.path.insert(0, "/home/paulo/projects/livrolatras-app/apps/api")

from database import engine
from sqlalchemy.orm import Session
import models

def run():
    with Session(engine) as session:
        # Exclui todas as indicações para limpar o terreno para os testes!
        deleted_count = session.query(models.Nomination).delete()
        session.commit()
        print(f"Sucesso! {deleted_count} indicações foram excluídas.")
        print("Você já pode voltar para o site e fazer uma nova indicação!")

if __name__ == "__main__":
    run()
