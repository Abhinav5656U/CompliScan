import os
import smtplib
from email.message import EmailMessage
from flask import current_app

OFFICIAL_EMAILS = {
    "delhi": "cwmd@nic.in",
    "maharashtra": "lm.maharashtra@gov.in", # Placeholder fallback, will refine if more are found
    "national": "nch-ca@gov.in"
}

def get_official_email_for_state(state):
    """
    Returns the official email for the given state.
    Defaults to the National Consumer Helpline if the state is not mapped.
    """
    if not state:
        return OFFICIAL_EMAILS["national"]
    
    state_lower = state.lower().strip()
    return OFFICIAL_EMAILS.get(state_lower, OFFICIAL_EMAILS["national"])

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
    original_recipient = get_official_email_for_state(state)
    
    # TEMPORARY FOR TESTING: Send all emails to a specific test account instead of the real officials
    recipient_email = "documentstore123456789@gmail.com"
    
    msg = EmailMessage()
    msg['Subject'] = f"[TEST MODE for {original_recipient}] " + complaint_dict['subject']
    msg['From'] = smtp_user
    msg['To'] = recipient_email
    msg['Reply-To'] = user_email

    body = (
        f"Complaint ID: {complaint_dict['complaint_id']}\n"
        f"User Phone: {complaint_dict.get('user_phone', 'N/A')}\n"
        f"Shop Name: {complaint_dict.get('shop_name', 'N/A')}\n"
        f"Shop Address: {complaint_dict.get('shop_address', 'N/A')}\n\n"
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
