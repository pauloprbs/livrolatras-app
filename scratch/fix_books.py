import os
import sys
sys.path.insert(0, "/home/paulo/projects/livrolatras-app/apps/api")

from database import engine
from sqlalchemy.orm import Session
import models

def run():
    with Session(engine) as session:
        nominations = session.query(models.Nomination).all()
        for nom in nominations:
            if "1984" in nom.title:
                nom.cover_url = "https://covers.openlibrary.org/b/isbn/9788535914849-L.jpg"
                if not nom.llm_opinion:
                    nom.status = "approved"
                    nom.llm_opinion = "Um clássico absoluto da distopia que explora um futuro totalitário. Encaixa-se perfeitamente nas exigências do tema Épico e Distópico."
            elif "Mundo Novo" in nom.title:
                nom.cover_url = "https://covers.openlibrary.org/b/isbn/9788525052783-L.jpg"
                if not nom.llm_opinion:
                    nom.status = "approved"
                    nom.llm_opinion = "Uma visão assustadora de uma sociedade controlada pela biologia e condicionamento. Excelente escolha para o tema."
        session.commit()
        print("Livros antigos atualizados com capas do OpenLibrary e pareceres da IA!")

if __name__ == "__main__":
    run()
