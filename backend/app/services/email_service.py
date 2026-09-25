import os
import smtplib
from email.message import EmailMessage
from flask import current_app

OFFICIAL_EMAILS = {
    # Legal Metrology / Consumer Affairs (INGRAM)
    "consumer_national": "nch-ca@gov.in",
    "lm_delhi": "cwmd@nic.in",
    "lm_maharashtra": "lm.maharashtra@gov.in",
    
    # Food Safety (FSSAI)
    "fssai_national": "enforcement1@fssai.gov.in", # Placeholder FSSAI enforcement email
    "fssai_delhi": "do.delhi@fssai.gov.in",
    "fssai_maharashtra": "do.mumbai@fssai.gov.in"
}

def get_official_email(state, is_food_safety=False):
    """
    Returns the official email for the given state and authority type.
    Defaults to the National Consumer Helpline or FSSAI National if the state is not mapped.
    """
    state_key = (state or "").lower().strip()
    
    if is_food_safety:
        # Check for FSSAI specific state emails
        return OFFICIAL_EMAILS.get(f"fssai_{state_key}", OFFICIAL_EMAILS["fssai_national"])
    else:
        # Check for Legal Metrology / NCH state emails
        return OFFICIAL_EMAILS.get(f"lm_{state_key}", OFFICIAL_EMAILS["consumer_national"])

def send_complaint_email(complaint_dict, scan_data, user_email, pdf_path=None):
    """
    Sends the complaint via SMTP to the relevant official.
    """
    smtp_server = current_app.config.get("SMTP_SERVER")
    smtp_port = current_app.config.get("SMTP_PORT")
    smtp_user = current_app.config.get("SMTP_USER")
    smtp_password = current_app.config.get("SMTP_PASSWORD")

    if not all([smtp_server, smtp_port, smtp_user, smtp_password]):
        current_app.logger.error("SMTP configuration is missing. Cannot send email.")
        return False, "SMTP configuration is missing."

    state = scan_data.get('state', '')
    
    # Determine if this is a food safety issue based on violations
    violations = scan_data.get('violations', [])
    is_food_safety = any("health" in v.lower() or "greenwashing" in v.lower() or "fssai" in v.lower() for v in violations)
    
    original_recipient = get_official_email(state, is_food_safety)
    
    # TEMPORARY FOR TESTING: Send all emails to a specific test account instead of the real officials
    recipient_email = "documentstore123456789@gmail.com"
    
    authority_name = "Food Safety and Standards Authority of India (FSSAI)" if is_food_safety else "Department of Consumer Affairs (INGRAM)"
    portal_link = "https://foscos.fssai.gov.in/consumergrievance" if is_food_safety else "https://consumerhelpline.gov.in/"
    
    msg = EmailMessage()
    msg['Subject'] = f"[{authority_name} Complaint - TEST MODE for {original_recipient}] " + complaint_dict['subject']
    msg['From'] = smtp_user
    msg['To'] = recipient_email
    msg['Reply-To'] = user_email

    body = (
        f"Complaint ID: {complaint_dict['complaint_id']}\n"
        f"User Phone: {complaint_dict.get('user_phone', 'N/A')}\n"
        f"Shop Name: {complaint_dict.get('shop_name', 'N/A')}\n"
        f"Shop Address: {complaint_dict.get('shop_address', 'N/A')}\n\n"
        f"Please note: A copy of this complaint has been directed to be filed on the official portal: {portal_link}\n\n"
        f"--- Complaint Details ---\n"
        f"{complaint_dict['body']}\n\n"
        f"--- System Context ---\n"
        f"Product: {scan_data.get('product_name', 'Unknown')}\n"
        f"Violations Detected: {len(scan_data.get('violations', []))}\n"
    )
    
    msg.set_content(body)
    
    if pdf_path and os.path.exists(pdf_path):
        import mimetypes
        ctype, encoding = mimetypes.guess_type(pdf_path)
        if ctype is None or encoding is not None:
            ctype = 'application/octet-stream'
        maintype, subtype = ctype.split('/', 1)
        with open(pdf_path, 'rb') as f:
            pdf_data = f.read()
        msg.add_attachment(pdf_data, maintype=maintype, subtype=subtype, filename=os.path.basename(pdf_path))

    try:
        # Use SMTP_SSL for port 465, otherwise starttls for 587
        if int(smtp_port) == 465:
            server = smtplib.SMTP_SSL(smtp_server, int(smtp_port))
        else:
            server = smtplib.SMTP(smtp_server, int(smtp_port))
            server.starttls()
            
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        return True, "Email sent successfully"
    except Exception as e:
        current_app.logger.error(f"Failed to send email: {e}")
        return False, str(e)
