"""
Email service for sending notifications.

Uses SMTP for sending emails to admins and users.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.core.config import settings


# Frontend base URL for email links (from environment)
FRONTEND_URL = settings.FRONTEND_URL


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
        
        print(f"[EMAIL SENT] To: {to_email}, Subject: {subject}")
        return True
        
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send to {to_email}: {e}")
        return False


def send_registration_confirmation(user_email: str, user_name: str) -> bool:
    """
    Send confirmation email to user after registration.
    
    Args:
        user_email: New user's email
        user_name: New user's name
        
    Returns:
        True if sent successfully
    """
    subject = "[Complexhibit] Thank you for registering!"
    body_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5;">Welcome to Complexhibit!</h2>
            
            <p>Dear {user_name},</p>
            
            <p>Thank you for registering on <strong>Complexhibit</strong>, your gateway to exploring 
            art exhibitions and cultural heritage data.</p>
            
            <p>Your registration request has been received and is currently pending approval 
            by our administrators. We will review your request as soon as possible and 
            notify you of the outcome via email.</p>
            
            <p>In the meantime, feel free to explore our public resources:</p>
            
            <p style="text-align: center;">
                <a href="{FRONTEND_URL}" 
                   style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #4F46E5, #7C3AED); 
                          color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Visit Complexhibit
                </a>
            </p>
            
            <p>If you have any questions, please don't hesitate to contact our team.</p>
            
            <p>Best regards,<br>
            <strong>The Complexhibit Team</strong></p>
        </div>
    </body>
    </html>
    """
    
    return send_email(user_email, subject, body_html)


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
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5;">New User Registration</h2>
            
            <p>A new user has registered and is waiting for approval:</p>
            
            <table style="margin: 20px 0; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 16px; background: #F3F4F6; font-weight: bold;">Name:</td>
                    <td style="padding: 8px 16px;">{user_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 16px; background: #F3F4F6; font-weight: bold;">Email:</td>
                    <td style="padding: 8px 16px;">{user_email}</td>
                </tr>
            </table>
            
            <p>Please log in to the admin panel to approve or reject this registration:</p>
            
            <p style="text-align: center;">
                <a href="{FRONTEND_URL}/admin/users" 
                   style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7C3AED, #9333EA); 
                          color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Go to Admin Panel
                </a>
            </p>
        </div>
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
        body_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #10B981;">🎉 Account Approved!</h2>
                
                <p>Great news! Your Complexhibit account has been approved by our administrators.</p>
                
                <p>You can now log in and start contributing to our knowledge graph of art exhibitions 
                and cultural heritage.</p>
                
                <p style="text-align: center; margin: 30px 0;">
                    <a href="{FRONTEND_URL}/auth/login" 
                       style="display: inline-block; padding: 14px 28px; background: linear-gradient(to right, #10B981, #059669); 
                              color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Log in to Complexhibit
                    </a>
                </p>
                
                <p>Once logged in, you'll be able to:</p>
                <ul>
                    <li>Insert new exhibitions, artworks, and actors</li>
                    <li>Contribute to the cultural heritage knowledge base</li>
                    <li>Access advanced search and SPARQL queries</li>
                </ul>
                
                <p>Welcome aboard!<br>
                <strong>The Complexhibit Team</strong></p>
            </div>
        </body>
        </html>
        """
    else:
        subject = "[Complexhibit] Registration Update"
        body_html = """
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #EF4444;">Registration Update</h2>
                
                <p>We regret to inform you that your registration request for Complexhibit 
                has not been approved at this time.</p>
                
                <p>If you believe this is an error or would like more information, 
                please contact our administrators.</p>
                
                <p>Best regards,<br>
                <strong>The Complexhibit Team</strong></p>
            </div>
        </body>
        </html>
        """
    
    return send_email(user_email, subject, body_html)
