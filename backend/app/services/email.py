"""
Email service for sending notifications.

Uses SMTP for sending emails to admins and users.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.core.config import settings


def send_email(
    to_email: str,
    subject: str,
    body_html: str,
    body_text: Optional[str] = None
) -> bool:
    """
    Send an email using SMTP.
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        body_html: HTML content of the email
        body_text: Optional plain text fallback
        
    Returns:
        True if sent successfully, False otherwise
    """
    # Skip if SMTP is not configured
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"[EMAIL DISABLED] Would send to {to_email}: {subject}")
        return True
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM
        msg["To"] = to_email
        
        # Attach plain text and HTML versions
        if body_text:
            msg.attach(MIMEText(body_text, "plain"))
        msg.attach(MIMEText(body_html, "html"))
        
        # Connect and send
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, to_email, msg.as_string())
        
        return True
        
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send to {to_email}: {e}")
        return False


def send_admin_notification(user_email: str, user_name: str) -> bool:
    """
    Notify admin of a new user registration.
    
    Args:
        user_email: New user's email
        user_name: New user's name
        
    Returns:
        True if sent successfully
    """
    subject = f"[Complexhibit] New user registration: {user_email}"
    body_html = f"""
    <html>
    <body>
        <h2>New User Registration</h2>
        <p>A new user has registered and is waiting for approval:</p>
        <ul>
            <li><strong>Name:</strong> {user_name}</li>
            <li><strong>Email:</strong> {user_email}</li>
        </ul>
        <p>Please log in to the admin panel to approve or reject this registration.</p>
        <p><a href="{settings.USER_SERVICE_URL or 'http://localhost:3000'}/admin/users">Go to Admin Panel</a></p>
    </body>
    </html>
    """
    
    return send_email(settings.ADMIN_EMAIL, subject, body_html)


def send_approval_notification(user_email: str, approved: bool) -> bool:
    """
    Notify user that their registration was approved or rejected.
    
    Args:
        user_email: User's email
        approved: Whether the registration was approved
        
    Returns:
        True if sent successfully
    """
    if approved:
        subject = "[Complexhibit] Your account has been approved!"
        body_html = """
        <html>
        <body>
            <h2>Account Approved</h2>
            <p>Your Complexhibit account has been approved. You can now log in and start contributing.</p>
            <p><a href="{0}/auth/login">Log in to Complexhibit</a></p>
        </body>
        </html>
        """.format(settings.USER_SERVICE_URL or 'http://localhost:3000')
    else:
        subject = "[Complexhibit] Registration Update"
        body_html = """
        <html>
        <body>
            <h2>Registration Update</h2>
            <p>We regret to inform you that your registration has not been approved at this time.</p>
            <p>If you believe this is an error, please contact the administrators.</p>
        </body>
        </html>
        """
    
    return send_email(user_email, subject, body_html)
