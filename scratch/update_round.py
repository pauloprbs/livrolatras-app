import os
import sys
from dotenv import load_dotenv

# Força o carregamento do .env ANTES de importar o banco
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

# Adiciona o diretório da API ao path para poder importar os módulos
sys.path.append(os.path.join(os.path.dirname(__file__), '../apps/api'))

from database import SessionLocal
from models import Round

def update_active_round():
    db = SessionLocal()
    try:
        active_round = db.query(Round).filter(Round.status == 'open_suggestions').first()
        if not active_round:
            active_round = db.query(Round).first()
            
        if not active_round:
            print("Nenhuma rodada ativa encontrada!")
            return

        active_round.theme_name = "Épico"
        active_round.theme_description = """O épico é um gênero literário ligado a grandes histórias de aventura, guerras, heróis e acontecimentos grandiosos, geralmente envolvendo uma jornada ou conflito que vai além da vida pessoal do protagonista.

Exemplos clássicos:

* Ilíada — Homero
* Odisseia — Homero
* Eneida — Virgílio
* Os Lusíadas — Camões

E na literatura moderna, obras como O Senhor dos Anéis, As Crônicas de Nárnia e Duna têm muitos elementos épicos."""
        
        # A URL aponta para a pasta public do React
        active_round.theme_image_url = "/image.png"

        db.commit()
        print(f"Rodada '{active_round.theme_name}' atualizada com sucesso no banco de dados!")

    except Exception as e:
        print(f"Erro ao atualizar: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_active_round()
