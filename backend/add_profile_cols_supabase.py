import os
from dotenv import load_dotenv
load_dotenv(dotenv_path="../.env")
from app import create_app, db
from sqlalchemy import text

app = create_app()
with app.app_context():
    try:
        db.session.execute(text("ALTER TABLE users ADD COLUMN age INTEGER;"))
        db.session.commit()
        print("Column 'age' added successfully.")
    except Exception as e:
        print(f"Error adding 'age': {e}")
        db.session.rollback()
        
    try:
        db.session.execute(text("ALTER TABLE users ADD COLUMN gender VARCHAR(20);"))
        db.session.commit()
        print("Column 'gender' added successfully.")
    except Exception as e:
        print(f"Error adding 'gender': {e}")
        db.session.rollback()
