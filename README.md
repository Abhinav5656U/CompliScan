<div align="center">
  <img alt="MeteroLens Banner" src="https://via.placeholder.com/1000x250/09090b/ffffff?text=MeteroLens" width="100%" />

  <br />
  <br />

  <b>An AI-powered, hybrid compliance checker for Legal Metrology Rules, 2011.</b>

  <br />
  <br />

  <a href="https://github.com/Abhinav5656U/MeteroLens/stargazers"><img src="https://img.shields.io/github/stars/Abhinav5656U/MeteroLens?style=flat-square&color=blue" alt="Stars"/></a>
  <a href="https://github.com/Abhinav5656U/MeteroLens/network/members"><img src="https://img.shields.io/github/forks/Abhinav5656U/MeteroLens?style=flat-square&color=blue" alt="Forks"/></a>
  <a href="https://github.com/Abhinav5656U/MeteroLens/issues"><img src="https://img.shields.io/github/issues/Abhinav5656U/MeteroLens?style=flat-square&color=blue" alt="Issues"/></a>
  <a href="#license"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License"/></a>

  <br />
  <br />
  
  ![Python](https://img.shields.io/badge/Python-3.11+-blue.svg?style=for-the-badge&logo=python&logoColor=white)
  ![React](https://img.shields.io/badge/React-18-blue.svg?style=for-the-badge&logo=react&logoColor=white)
  ![Flask](https://img.shields.io/badge/Flask-3.0-lightgrey.svg?style=for-the-badge&logo=flask&logoColor=black)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg?style=for-the-badge&logo=postgresql&logoColor=white)
  ![Gemini](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-orange.svg?style=for-the-badge&logo=google&logoColor=white)
  ![YOLOv8](https://img.shields.io/badge/CV-YOLOv8-yellow.svg?style=for-the-badge)

</div>

---

## 📖 Overview

**MeteroLens** is a comprehensive, hybrid AI-powered platform designed to digitize and automate the work of Legal Metrology Officers. Built for the **Ministry of Consumer Affairs, Food & Public Distribution** (SIH 2026 - PS26034), it seamlessly checks the compliance of packaged commodities against legal metrology rules using state-of-the-art Computer Vision and Large Language Models.

By combining deterministic rule engines with semantic AI validation, MeteroLens removes human subjectivity, automates compliance reporting, and secures evidence cryptographically.

---

## ✨ Key Features & Capabilities

- **🧠 Intelligent Multimodal Extraction:** Leverages **Gemini 2.5 Flash** and **PaddleOCR** for robust text extraction and structured JSON mapping directly from physical packaging.
- **📏 Automated Dimension Calibration:** Uses a custom **YOLOv8** model integrated with OpenCV to detect bounding boxes and accurately calculate font heights, enforcing dimensional compliance natively.
- **⚖️ Hybrid Rule Engine:** A deterministic engine (Regex & geometrical bounds) handles strict legal requirements, while a **Semantic LLM Judge (Groq LLaMA 3)** tackles ambiguous claims and contextual nuances.
- **🌐 Bilingual Semantic Consistency:** Evaluates both English and Hindi (Devanagari) declarations simultaneously to flag misleading translations.
- **📸 Panoramic Stitching & Multi-Scan:** Intelligently stitches multiple angles of product packaging into a single cohesive view for comprehensive analysis.
- **🔒 Tamper-Proof Evidence:** Every captured image is locked via **SHA-256 Cryptographic Hashing**. Produces court-admissible PDF reports compliant with Section 65B(4) / Section 63 BSA.
- **📍 Crowdsourced Risk Queue:** Consumers can upload violations via a public portal, tagging GPS coordinates that feed directly into a prioritized risk dashboard for officers.

---

## 🛠️ Architecture & Tech Stack

MeteroLens employs a modern, decoupled architecture designed for scalability, security, and edge-AI integration.

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend UI** | React.js (v18), Tailwind CSS, Recharts, react-simple-maps, html5-qrcode |
| **Backend API** | Python, Flask (v3.0.3), Celery, Flask-JWT-Extended, Flask-SQLAlchemy |
| **Database & Cache** | PostgreSQL (Supabase), Redis |
| **AI & Vision Pipeline**| Gemini 2.5 Flash, Groq API (LLaMA-3), PaddleOCR, YOLOv8, OpenCV |
| **Integrations** | Cloudinary (Image Storage), ReportLab (PDF Generation) |

---

## 🚀 Getting Started

Follow these steps to set up the MeteroLens development environment on your local machine.

### Prerequisites

Ensure you have the following installed:
- [Node.js (v20+)](https://nodejs.org/)
- [Python (3.11+)](https://www.python.org/)
- [PostgreSQL (15+)](https://www.postgresql.org/)
- [Docker & Docker Compose](https://www.docker.com/) (Highly Recommended)

### 🐳 Option 1: Running with Docker (Recommended)

The fastest way to get started is using Docker, which orchestrates the frontend, backend API, and database seamlessly.

```bash
# 1. Clone the repository
git clone https://github.com/Abhinav5656U/MeteroLens.git
cd MeteroLens

# 2. Configure environment variables
cp .env.example .env
# Make sure to update the .env file with your API keys (Gemini, Groq, Cloudinary)

# 3. Spin up the containers
docker-compose up --build
```
- **Frontend Dashboard:** `http://localhost:3000`
- **Backend API:** `http://localhost:5000`

### 💻 Option 2: Local Manual Setup

If you prefer to run the services natively on your machine:

**1. Setup the Backend Environment**
```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create the database and run migrations
createdb meterolens
cp ../.env.example ../.env  # Update DATABASE_URL in .env
flask db upgrade

# Start the Flask development server
python run.py
```

**2. Setup the Frontend Environment**
Open a new terminal window:
```bash
cd frontend

# Install Node modules
npm install

# Start the React development server
npm start
```

### 🔑 Initial Configuration

After starting the application, you'll need to create an initial admin account to access the dashboard.

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@meterolens.in","password":"admin123","role":"admin","full_name":"System Administrator"}'
```

---

## 📂 Project Structure

```bash
MeteroLens/
├── backend/                   # Flask API & AI Pipeline
│   ├── app/
│   │   ├── models.py          # SQLAlchemy ORM Models
│   │   ├── routes/            # API Endpoints (auth, scan, dashboard)
│   │   ├── services/          # Core logic (OCR, Validation, Mismatch)
│   │   └── rules/             # Versioned JSON compliance rules
│   ├── requirements.txt       
│   └── run.py                 # Application entry point
├── frontend/                  # React User Interface
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route views (Dashboard, Scan, History)
│   │   └── utils/             # API client & helpers
│   └── nginx.conf             # Production web server config
├── docker-compose.yml         # Container orchestration
└── .env.example               # Template for environment variables
```

---

## 🔮 Roadmap

- [x] Dual-mode OCR scanning pipeline with seamless LLM fallbacks.
- [x] Semantic search integration for historical compliance scans.
- [x] Geo-location fallback mechanism and real-time mapping for citizen reports.
- [ ] **Dark Patterns Detection:** ML models to catch deceptive packaging (e.g. shrinkflation, misleading font colors).
- [ ] **Counterfeit Verification:** Cross-referencing GS1 GTIN/Barcodes with mapping APIs to detect phantom manufacturers.

---

## 🤝 Contributing

We welcome contributions from the community! Please refer to our [Contributing Guidelines](CONTRIBUTING.md) for more details on how to submit pull requests, report issues, or request features.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <sub>Built with ❤️ for <b>SIH 2026</b> (Problem Statement PS26034)</sub>
</div>
