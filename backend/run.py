import os
from dotenv import load_dotenv

# Load the .env file from the parent directory
load_dotenv(dotenv_path="../.env")

from app import create_app

app = create_app()

import socket

def get_local_ip():
    try:
        # Create a dummy socket to detect the local routing IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    local_ip = get_local_ip()
    print("=" * 60)
    print(f"🌟 Backend Server is running!")
    print(f"👉 Local Access:   http://localhost:{port}")
    print(f"📱 Mobile Access:  http://{local_ip}:{port}")
    print(f"📱 Frontend UI:    http://{local_ip}:3000  <-- Open this on your phone")
    print("=" * 60)
    app.run(host="0.0.0.0", debug=True, port=port)
