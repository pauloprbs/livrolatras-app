from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env na raiz do projeto
load_dotenv(dotenv_path="../../.env")

app = FastAPI(
    title="Livrolatras API",
    description="API para o sistema de gestão do Clube do Livro",
    version="1.0.0"
)

# Configuração de CORS (permite que o frontend React se comunique com a API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, alterar para o domínio correto
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Bem-vindo à API do Clube do Livro!"}
