import os
import re
from datetime import datetime, timedelta, timezone
from app import db
from app.models import Scan, ImprovementNotice, User

def normalize_manufacturer(name):
    if not name:
        return ""
    # Lowercase
    name = name.lower()
    # Remove punctuation
    name = re.sub(r'[^\w\s]', '', name)
    # Remove common corporate suffixes
    suffixes = [r'\bltd\b', r'\blimited\b', r'\bpvt\b', r'\bprivate\b', r'\binc\b', r'\bcorp\b', r'\bcorporation\b']
    for suffix in suffixes:
        name = re.sub(suffix, '', name)
    # Remove extra spaces
    name = re.sub(r'\s+', ' ', name).strip()
    return name

def check_eligibility(scan_id):
    scan = Scan.query.get(scan_id)
    if not scan:
        return {"status": "error", "message": "Scan not found"}
        
    if scan.overall_status != "non_compliant":
        return {"status": "ineligible", "message": "Scan is compliant, no notice needed."}
        
    if not scan.manufacturer:
        return {"status": "ineligible", "message": "No manufacturer detected to issue notice against."}
        
    # Check if a notice was already issued for this scan
    existing_notice = ImprovementNotice.query.filter_by(scan_id=scan.id).first()
    if existing_notice:
        return {"status": "already_issued", "notice": existing_notice.to_dict()}
        
    norm_name = normalize_manufacturer(scan.manufacturer)
    
    # Find past non_compliant scans for the same normalized manufacturer
    # Not using exact match, we fetch all non_compliant scans and compare normalized names
    # For large DBs we should store the normalized name in the table, but this is fine for now
    past_scans = Scan.query.filter(Scan.id != scan.id, Scan.overall_status == "non_compliant").all()
    
    repeat_offenses = 0
    for ps in past_scans:
        if ps.manufacturer and normalize_manufacturer(ps.manufacturer) == norm_name:
            repeat_offenses += 1
            
    if repeat_offenses > 0:
        return {"status": "repeat_offender", "past_offenses": repeat_offenses, "message": "Manufacturer has past violations. Standard prosecution required."}
        
    return {"status": "eligible", "message": "First-time offense. Eligible for Improvement Notice."}


def generate_notice_pdf(scan_id, user_id):
    scan = Scan.query.get(scan_id)
    user = User.query.get(user_id)
    
    eligibility = check_eligibility(scan_id)
    if eligibility["status"] not in ["eligible", "already_issued"]:
        raise ValueError(eligibility["message"])
        
    if eligibility["status"] == "already_issued":
        return eligibility["notice"]
        
    # Generate PDF using ReportLab
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    import uuid
    
    upload_dir = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "notices")
    os.makedirs(upload_dir, exist_ok=True)
    
    filename = f"notice_{uuid.uuid4().hex}.pdf"
    filepath = os.path.join(upload_dir, filename)
    
    c = canvas.Canvas(filepath, pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, 750, "GOVERNMENT OF INDIA")
    c.setFont("Helvetica", 14)
    c.drawString(100, 730, "Department of Legal Metrology")
    
    c.setFont("Helvetica-Bold", 18)
    c.drawString(100, 680, "IMPROVEMENT NOTICE")
    c.setFont("Helvetica", 10)
    c.drawString(100, 665, "(Issued under Jan Vishwas (Amendment of Provisions) Act)")
    
    c.setFont("Helvetica", 12)
    c.drawString(100, 620, f"Date: {datetime.now().strftime('%Y-%m-%d')}")
    c.drawString(100, 600, f"To: {scan.manufacturer}")
    
    c.drawString(100, 560, "Subject: Notice to rectify minor labeling violations")
    
    c.drawString(100, 520, "Upon inspection of your packaged commodity:")
    c.drawString(120, 500, f"Product: {scan.product_name or 'Unknown'}")
    c.drawString(120, 480, f"Scan Reference ID: {scan.id}")
    
    # Add Cloudinary Evidence Link as a clickable hyperlink
    c.drawString(120, 460, "Digital Evidence: ")
    c.setFillColorRGB(0, 0, 1)  # Blue color for link
    c.drawString(210, 460, "Click here to view original scan")
    # c.linkURL expects (rect), URL. The rect is (x1, y1, x2, y2)
    # Approx width of "Click here to view original scan" at 12pt is ~160
    c.linkURL(scan.image_path, (210, 458, 370, 472), relative=0)
    c.setFillColorRGB(0, 0, 0)  # Reset to black

    
    c.drawString(100, 430, "The following violations were observed under the Legal Metrology Rules:")
    
    y = 410
    failed_rules = [chk for chk in (scan.compliance_result or {}).get("checks", []) if chk.get("status") == "fail"]
    for rule in failed_rules:
        c.drawString(120, y, f"- {rule.get('rule_name')}: {rule.get('message')}")
        y -= 20
        
    y -= 20
    deadline = datetime.now(timezone.utc) + timedelta(days=30)
    c.drawString(100, y, f"You are hereby directed to rectify the above defects within 30 days")
    y -= 20
    c.drawString(100, y, f"(Deadline: {deadline.strftime('%Y-%m-%d')}). Failure to comply will result in prosecution.")
    
    y -= 60
    c.drawString(100, y, f"Issued by:")
    c.drawString(100, y-20, f"Officer: {user.full_name or user.username}")
    c.drawString(100, y-40, f"Badge No: {user.badge_number or 'N/A'}")
    
    c.save()
    
    # In a real app we'd upload to Cloudinary or serve statically.
    # We will serve from a new route.
    pdf_url = f"/api/notice/download/{filename}"
    
    # Save to DB
    notice = ImprovementNotice(
        scan_id=scan.id,
        manufacturer_normalized=normalize_manufacturer(scan.manufacturer),
        pdf_url=pdf_url,
        issued_by=user.id,
        deadline_date=deadline
    )
    db.session.add(notice)
    db.session.commit()
    
    return notice.to_dict()
