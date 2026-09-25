import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(dotenv_path="../.env")

db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found!")
    exit(1)

# Ensure the URL is compatible (e.g. postgresql:// instead of postgres://)
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

print(f"Connecting to {db_url.split('@')[-1]}...")
engine = create_engine(db_url)

with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN allergies JSON;"))
        print("Column 'allergies' added successfully.")
    except Exception as e:
        print(f"Error adding 'allergies': {e}")
        
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN diet_preferences JSON;"))
        print("Column 'diet_preferences' added successfully.")
    except Exception as e:
        print(f"Error adding 'diet_preferences': {e}")

print("Migration completed.")
