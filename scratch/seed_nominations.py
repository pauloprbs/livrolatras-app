import os
import sys
import uuid
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))
sys.path.append(os.path.join(os.path.dirname(__file__), '../apps/api'))

from database import SessionLocal
from models import Round, Member, Nomination

def seed_data():
    db = SessionLocal()
    try:
        active_round = db.query(Round).filter(Round.status == 'open_suggestions').first()
        if not active_round:
            print("Nenhuma rodada ativa encontrada para semear dados.")
            return

        print("Criando membros falsos...")
        fake_member_1 = Member(
            supabase_uid=str(uuid.uuid4()),
            name="Frodo Bolseiro",
            email="frodo@condado.com",
            role="member"
        )
        fake_member_2 = Member(
            supabase_uid=str(uuid.uuid4()),
            name="Paul Atreides",
            email="paul@duna.com",
            role="member"
        )
        db.add(fake_member_1)
        db.add(fake_member_2)
        db.commit()
        db.refresh(fake_member_1)
        db.refresh(fake_member_2)

        print("Criando livros épicos falsos...")
        book1 = Nomination(
            round_id=active_round.id,
            user_id=fake_member_1.id,
            title="O Senhor dos Anéis",
            author="J.R.R. Tolkien",
            synopsis="Uma jornada épica para destruir O Um Anel.",
            cover_url="https://covers.openlibrary.org/b/id/8302146-L.jpg",
            status="approved",
            llm_opinion="Perfeito, é a definição de épico."
        )
        
        book2 = Nomination(
            round_id=active_round.id,
            user_id=fake_member_2.id,
            title="Duna",
            author="Frank Herbert",
            synopsis="O épico de ficção científica sobre o planeta Arrakis.",
            cover_url="https://covers.openlibrary.org/b/id/12836261-L.jpg",
            status="approved",
            llm_opinion="Totalmente alinhado ao tema épico intergaláctico."
        )

        db.add(book1)
        db.add(book2)
        db.commit()

        print("Tudo pronto! 2 Novos livros (aprovados) inseridos no banco.")
    except Exception as e:
        print(f"Erro ao semear: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
