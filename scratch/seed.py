import requests
import datetime

def run():
    res = requests.post("http://127.0.0.1:8000/rounds/", json={
        "theme_name": "Distopias e Futuros Obscuros",
        "theme_description": "Livros que exploram sociedades alternativas e futuros sombrios, onde a tecnologia e a opressão andam de mãos dadas.",
        "month_year": "2026-10",
        "voting_opens_at": (datetime.datetime.now() - datetime.timedelta(days=1)).isoformat(),
        "voting_closes_at": (datetime.datetime.now() + datetime.timedelta(days=7)).isoformat(),
        "status": "open_suggestions"
    })
    print("Seed result:", res.status_code, res.json())

if __name__ == "__main__":
    run()
