import os
from dotenv import load_dotenv
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

# Load the .env file from the parent directory
load_dotenv(dotenv_path="../.env")

from app import create_app, db
from app.celery_app import celery

app = create_app()

class ContextTask(celery.Task):
    def __call__(self, *args, **kwargs):
        with app.app_context():
            try:
                return self.run(*args, **kwargs)
            finally:
                db.session.remove()

celery.Task = ContextTask
