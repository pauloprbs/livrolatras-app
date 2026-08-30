import os
import json
import google.generativeai as genai
import nomic
from nomic import embed
from dotenv import load_dotenv

# Força o carregamento do .env da raiz do projeto, caso o backend não tenha carregado
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

def setup_ai():
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key:
        genai.configure(api_key=gemini_key)
    
    nomic_key = os.environ.get("NOMIC_API_KEY")
    if nomic_key:
        nomic.login(nomic_key)

def validate_nomination(theme_description: str, synopsis: str):
    """
    Retorna uma avaliação da curadoria virtual (Gemini).
    """
    if not os.environ.get("GEMINI_API_KEY"):
        return {"score": 10, "opinion": "Gemini não configurado. Aprovação automática."}
        
    try:
        model = genai.GenerativeModel("gemini-3.6-flash")
        
        prompt = f"""
        Você é a Curadora Virtual de um clube do livro. de alto nível.
        O tema oficial de leitura deste mês é:
        "{theme_description}"
        
        Um membro do clube quer indicar o seguinte livro (sinopse):
        "{synopsis}"
        
        Sua tarefa é avaliar se este livro tem forte aderência ao tema da rodada.
        Responda ESTRITAMENTE em formato JSON com as chaves:
        - "score": um número inteiro de 0 a 10 (onde 0 é fuga total ao tema e 10 é encaixe perfeito).
        - "opinion": um parágrafo avaliativo curto (no máximo 3 frases) justificando a nota de forma elegante para o membro que indicou o livro.
        """
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(response.text)
    except Exception as e:
        print(f"Erro no Gemini: {e}")
        return {"score": 10, "opinion": f"Falha na API da IA: {str(e)}"}

def generate_embedding(text: str):
    """
    Gera o embedding usando Nomic.
    """
    if not os.environ.get("NOMIC_API_KEY"):
        print("Nomic key missing, generating dummy embedding.")
        return [0.0] * 768
    try:
        result = embed.text(
            texts=[text],
            model='nomic-embed-text-v1.5',
            task_type='search_document'
        )
        return result['embeddings'][0]
    except Exception as e:
        print(f"Erro no Nomic: {e}")
        return [0.0] * 768

setup_ai()
