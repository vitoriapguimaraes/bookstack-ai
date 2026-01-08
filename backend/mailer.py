import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
# Default to the requested team email if not set, though password is still needed
SMTP_USER = os.getenv("SMTP_USER", "bookstackai@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def send_email(to_email: str, subject: str, body_html: str):
    """
    Sends an HTML email using SMTP.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print("⚠️  Email System Warning: SMTP credentials are not set in .env. Email NOT sent.")
        print(f"--- Email Preview ---\nTo: {to_email}\nSubject: {subject}\nBody len: {len(body_html)}\n---------------------")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body_html, 'html'))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
            
        print(f"✅ Email sent successfully to {to_email}")

    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")
