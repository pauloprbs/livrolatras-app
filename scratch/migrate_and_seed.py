import os
import sys
sys.path.insert(0, "/home/paulo/projects/livrolatras-app/apps/api")

from database import engine
from sqlalchemy import text
from sqlalchemy.orm import Session
import models

def run():
    # 1. Altera a tabela rounds para adicionar a coluna theme_image_url
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE rounds ADD COLUMN theme_image_url VARCHAR;"))
            conn.commit()
            print("Coluna theme_image_url adicionada com sucesso.")
        except Exception as e:
            print("A coluna theme_image_url provavelmente ja existe.")
            conn.rollback()

    # 2. Atualiza a rodada existente para o tema 'Épico'
    with Session(engine) as session:
        round_db = session.query(models.Round).filter(models.Round.status == 'open_suggestions').first()
        if round_db:
            round_db.theme_name = "Épico"
            round_db.theme_description = "O épico é um gênero literário ligado a grandes histórias de aventura, guerras, heróis e acontecimentos grandiosos, geralmente envolvendo uma jornada ou conflito que vai além da vida pessoal do protagonista.\n\nExemplos clássicos:\n* Ilíada — Homero\n* Odisseia — Homero\n* Eneida — Virgílio\n* Os Lusíadas — Camões\n\nE na literatura moderna, obras como O Senhor dos Anéis, As Crônicas de Nárnia e Duna têm muitos elementos épicos."
            round_db.theme_image_url = "/imgs/tema_epico.jpg"
            session.commit()
            print("Rodada atualizada para Épico com sucesso!")
        else:
            print("Nenhuma rodada aberta encontrada para atualizar.")

if __name__ == "__main__":
    run()
