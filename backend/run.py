import os
from dotenv import load_dotenv

# Load the .env file from the parent directory
load_dotenv(dotenv_path="../.env")

from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", debug=True, port=port)
