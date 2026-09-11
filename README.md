# 🔍 MeteroLens - Legal Metrology Compliance Checker

<div align="center">
  <img alt="MeteroLens Banner" src="https://via.placeholder.com/800x200.png?text=MeteroLens" />
  
  <p><b>AI-powered platform to check compliance of packaged commodities under Legal Metrology (Packaged Commodities) Rules, 2011.</b></p>

  ![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
  ![React](https://img.shields.io/badge/React-v18-blue.svg)
  ![Flask](https://img.shields.io/badge/Flask-v3.0-lightgrey.svg)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)
  ![Gemini](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-orange.svg)
  ![YOLOv8](https://img.shields.io/badge/CV-YOLOv8-yellow.svg)
</div>

---

## 📖 Problem Statement
**SIH 2026 - PS26034 | Ministry of Consumer Affairs, Food & Public Distribution**

To develop a software system that checks the compliance of packaged commodities with legal metrology rules by scanning products, images, and labels.

---

## ✨ Unique Selling Propositions (USPs) & Capabilities

1. 🧠 **Intelligent Data Extraction (Multimodal & CV):** Utilizes **Gemini 2.5 Flash** and **PaddleOCR** (Multilingual) to perform OCR and extract structured information (MRP, Manufacturer details, Net Weight, Dates, etc.) directly from uploaded packaging images.
2. 📏 **Dedicated Object Detection & Dimension Calibration:** Uses custom **YOLOv8** combined with **OpenCV** to accurately detect bounding boxes and calculate physical font heights, ensuring strict adherence to dimensional requirements.
3. 📸 **Automated Image Stitching:** Handles multiple angles of product packaging by seamlessly stitching uploaded images into a single panoramic view.
4. ⚖️ **Hybrid Compliance Rule Engine:** Validates data against Legal Metrology rules using a mix of deterministic checks (Regex, font-height bounds) and a **Semantic LLM Judge (Groq LLaMA 3)** for ambiguous claims.
5. 🗺️ **Citizen Crowdsourcing with GPS Tracking:** A dedicated public reporting portal for consumers that silently captures GPS coordinates, flagging non-compliant uploads into a prioritized **"Risk Queue"**.
6. 🤖 **Interactive Multilingual AI Assistant:** Embedded conversational AI that explains rule violations, drafts formal complaints, and routes them (with Section 65B PDF evidence) to relevant Nodal Officers via email.
7. 🌐 **Bilingual Consistency Checker:** Cross-checks English and Hindi (Devanagari) declarations on packaging to ensure semantic consistency and prevent mistranslation using **Groq (llama-3.3-70b)**.
8. 🔒 **Evidence Integrity & Legal Reporting:** Secures image evidence using **SHA-256 Cryptographic Hashing** for non-repudiation and generates court-admissible PDF compliance reports (Section 65B(4) / Section 63 BSA).
9. 🛒 **E-commerce Mismatch Detection:** Logic to cross-check physical packaging details against e-commerce listing URLs to detect discrepancies.
10. 📊 **Role-Based Dashboard Analytics:** React-based dashboard featuring trend graphs, compliance ratios, and geographic mapping to monitor metrics across jurisdictions.
11. 🏷️ **GTIN/Barcode Risk Scoring:** Historical analytics engine tracking compliance failures by product GTIN and assigning a Risk Tier (High/Medium/Low).

---

## 🛠️ Technology Stack

### 🎨 Frontend & Capture App
- **Core Framework:** React.js (v18)
- **Styling:** Tailwind CSS
- **Dashboard Analytics:** Recharts (Trend graphs)
- **Map Visualization:** react-simple-maps (Geographic plotting)
- **Scanning:** html5-qrcode (Browser-based QR/Barcode)
- **Citizen Reporting:** HTML5 Geolocation API

### ⚙️ Backend & Security
- **Framework:** Flask (v3.0.3) with Blueprints
- **Authentication:** JWT (Flask-JWT-Extended), bcrypt
- **Serialization:** Marshmallow
- **Rate Limiting & Security:** Flask-Limiter, Flask-Talisman

### 🗄️ Database & Storage
- **Relational DB:** PostgreSQL (via psycopg2-binary, Flask-SQLAlchemy, Flask-Migrate)
- **Caching:** Redis
- **Storage:** Local File System (`UPLOAD_FOLDER`) + Cloudinary API

### 👁️ AI, OCR, & Vision Pipeline
- **Primary AI Engine:** Gemini 2.5 Flash (Multimodal OCR & structured JSON mapping)
- **Fallback OCR:** PaddleOCR (English + Hindi)
- **Computer Vision:** YOLOv8 (Precise geometrical validation)
- **Image Preprocessing:** OpenCV + Pillow (Image stitching, preprocessing)

### 📋 Compliance Rule Engine
- **Deterministic:** Python script executing Regex and physical font-height checks against versioned JSON rules.
- **Semantic LLM Judge:** Groq API (llama3-8b-8192)
- **Bilingual Checker:** Groq API (llama-3.3-70b-versatile)

### 📄 Reporting & Integrations
- **Document Generation:** ReportLab (Python) for automated compliance certificates.
- **Evidence Integrity:** SHA-256 Cryptographic Hashing.

---

## 📂 Project Structure

```text
MeteroLens/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # App factory
│   │   ├── models.py            # User, Scan models
│   │   ├── routes/              # auth, scan, dashboard, history
│   │   └── services/            # ocr_service, validation_service, report_service, mismatch_service
│   ├── uploads/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── run.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/          # Navbar, ProtectedRoute
│   │   ├── context/             # AuthContext
│   │   ├── pages/               # Login, Register, Scan, Dashboard, History
│   │   └── utils/               # Axios API instance
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites
- **Python 3.11+**
- **Node.js 20+**
- **PostgreSQL 15+**
- **Docker & Docker Compose** (Optional, recommended)

### Option 1: Docker (Recommended)
```bash
git clone https://github.com/Abhinav5656U/MeteroLens.git
cd MeteroLens
cp .env.example .env

# Edit .env with your settings, then start services
docker-compose up --build
```
- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:5000`

### Option 2: Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | macOS/Linux: source venv/bin/activate

pip install -r requirements.txt

# Create PostgreSQL database
createdb meterolens

cp ../.env.example ../.env
# Edit .env with your DATABASE_URL

flask db upgrade
python run.py
```
*Backend runs at `http://localhost:5000`*

**Frontend:**
```bash
cd frontend
npm install
npm start
```
*Frontend runs at `http://localhost:3000`*

### Create Admin User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@meterolens.in","password":"admin123","role":"admin","full_name":"System Admin"}'
```

---

## 📡 Core API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register user |
| POST | `/api/auth/login` | No | Login, get JWT |
| GET | `/api/auth/me` | Yes | Current user info |
| POST | `/api/scan/upload` | Yes | Upload image, OCR + validate |
| GET | `/api/scan/:id` | Yes | Get scan details |
| GET | `/api/scan/:id/report` | Yes | Download PDF report |
| GET | `/api/dashboard/stats`| Officer/Admin | Dashboard statistics |
| GET | `/api/dashboard/scans`| Officer/Admin | All scans with filters |
| GET | `/api/history`| Yes | User scan history |
| DELETE| `/api/history/:id`| Yes | Delete scan |

---

## 🔮 Future Roadmap & Planned Capabilities

- 🕵️‍♂️ **"Dark Patterns" in Packaging Detection:** Train models to detect deceptive packaging practices that technically follow the rules but mislead consumers (e.g., hiding the MRP under folds, using text colors that intentionally blend with the background, or obscured "shrinkflation" metric changes).
- 🏢 **Counterfeit & Phantom Manufacturer Detection:** Integrate deep cross-referencing to check if the manufacturer address actually exists using mapping APIs, and verify the GS1 GTIN/Barcode to catch unregistered or counterfeit products alongside standard compliance failures.

---
<div align="center">
  <b>Built for SIH 2026 - Problem Statement PS26034</b>
</div>
