import os
import psycopg2
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")
db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("No DATABASE_URL found.")
    exit(1)

result = urlparse(db_url)
username = result.username
password = result.password
database = result.path[1:]
hostname = result.hostname
port = result.port

conn = psycopg2.connect(
    database=database,
    user=username,
    password=password,
    host=hostname,
    port=port
)
cur = conn.cursor()

try:
    cur.execute("ALTER TABLE users ADD COLUMN allergies JSON;")
    print("Added allergies column.")
except psycopg2.errors.DuplicateColumn:
    print("allergies column already exists.")
    conn.rollback()
except Exception as e:
    print("Error adding allergies:", e)
    conn.rollback()

conn.commit()

try:
    cur.execute("ALTER TABLE users ADD COLUMN diet_preferences JSON;")
    print("Added diet_preferences column.")
except psycopg2.errors.DuplicateColumn:
    print("diet_preferences column already exists.")
    conn.rollback()
except Exception as e:
    print("Error adding diet_preferences:", e)
    conn.rollback()

conn.commit()
cur.close()
conn.close()
