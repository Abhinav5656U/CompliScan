import os
from dotenv import load_dotenv
load_dotenv(dotenv_path="../.env")
from app import create_app, db
from sqlalchemy import text

app = create_app()
with app.app_context():
    try:
        db.session.execute(text("ALTER TABLE users ADD COLUMN allergies JSON;"))
        db.session.commit()
        print("Column 'allergies' added successfully.")
    except Exception as e:
        print(f"Error adding 'allergies': {e}")
        db.session.rollback()
        
    try:
        db.session.execute(text("ALTER TABLE users ADD COLUMN diet_preferences JSON;"))
        db.session.commit()
        print("Column 'diet_preferences' added successfully.")
    except Exception as e:
        print(f"Error adding 'diet_preferences': {e}")
        db.session.rollback()
