import os
import psycopg2
from dotenv import load_dotenv

# Carrega a DATABASE_URL do arquivo .env
load_dotenv(dotenv_path="../../.env")
database_url = os.getenv("DATABASE_URL")

if not database_url:
    print("Erro: DATABASE_URL não encontrada.")
    exit(1)

def run_migration():
    print("Conectando ao banco de dados...")
    conn = psycopg2.connect(database_url)
    conn.autocommit = True
    cursor = conn.cursor()
    
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        sql = f.read()
    
    print("Aplicando schema.sql...")
    try:
        cursor.execute(sql)
        print("Tabelas criadas com sucesso!")
    except Exception as e:
        print("Erro ao aplicar schema:", e)
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
