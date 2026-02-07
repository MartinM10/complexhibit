"""
Email service for sending notifications.

Uses SMTP for sending emails to admins and users.
Supports HTTP proxy tunneling for restricted network environments.
"""

import os
import smtplib
import socket
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from urllib.parse import urlparse

try:
    import socks
    SOCKS_AVAILABLE = True
except ImportError:
    SOCKS_AVAILABLE = False

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
    # Skip if SMTP is not configured (no host)
    if not settings.SMTP_HOST:
        print(f"[EMAIL DISABLED] Would send to {to_email}: {subject}")
        # Return True so we don't warn the user if email is intentionally disabled
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
        
        # Sanitize password (remove spaces often found in App Passwords)
        smtp_password = settings.SMTP_PASSWORD
        if smtp_password:
            smtp_password = smtp_password.replace(" ", "")

        # Configure proxy if needed
        proxy_configured = False
        http_proxy = os.environ.get('HTTP_PROXY') or os.environ.get('http_proxy')
        smtp_host = settings.SMTP_HOST
        
        if http_proxy and SOCKS_AVAILABLE:
            try:
                # Parse proxy URL (e.g., http://jano8.sci.uma.es:3128)
                parsed = urlparse(http_proxy if '://' in http_proxy else f'http://{http_proxy}')
                proxy_host = parsed.hostname
                proxy_port = parsed.port or 3128
                
                # If running in Docker, the proxy might not be reachable by hostname
                # Try to use the Docker host gateway instead
                try:
                    # Try to resolve the proxy hostname first
                    proxy_ip = socket.gethostbyname(proxy_host)
                    print(f"[EMAIL] Resolved proxy {proxy_host} to {proxy_ip}")
                    proxy_host = proxy_ip
                except socket.gaierror:
                    # If proxy hostname doesn't resolve, we might be in Docker
                    # Try using the default gateway (host machine)
                    print(f"[EMAIL] Could not resolve proxy hostname, checking for Docker environment...")
                    try:
                        # Get default gateway (Docker host)
                        with open('/proc/net/route') as f:
                            for line in f:
                                fields = line.strip().split()
                                if fields[1] == '00000000':  # Default route
                                    gateway_hex = fields[2]
                                    gateway_ip = '.'.join([str(int(gateway_hex[i:i+2], 16)) for i in range(6, -1, -2)])
                                    print(f"[EMAIL] Using Docker gateway as proxy: {gateway_ip}:{proxy_port}")
                                    proxy_host = gateway_ip
                                    break
                    except Exception as e:
                        print(f"[EMAIL WARNING] Failed to detect Docker gateway: {e}")
                
                print(f"[EMAIL] Configuring HTTP proxy: {proxy_host}:{proxy_port}")
                
                # Resolve SMTP host to IPv4 only (PySocks doesn't support IPv6)
                try:
                    # Get all addresses and filter for IPv4
                    addr_info = socket.getaddrinfo(smtp_host, settings.SMTP_PORT, socket.AF_INET, socket.SOCK_STREAM)
                    if addr_info:
                        smtp_host = addr_info[0][4][0]  # Get first IPv4 address
                        print(f"[EMAIL] Resolved {settings.SMTP_HOST} to IPv4: {smtp_host}")
                except Exception as e:
                    print(f"[EMAIL WARNING] Failed to resolve IPv4 address: {e}")
                
                # Set up SOCKS to use HTTP proxy for all socket connections
                socks.set_default_proxy(socks.HTTP, proxy_host, proxy_port)
                socket.socket = socks.socksocket
                proxy_configured = True
                print("[EMAIL] Proxy configured successfully")
            except Exception as e:
                print(f"[EMAIL WARNING] Failed to configure proxy: {e}. Attempting direct connection...")
        elif http_proxy and not SOCKS_AVAILABLE:
            print("[EMAIL WARNING] HTTP_PROXY set but PySocks not available. Install PySocks for proxy support.")

        try:
            if settings.SMTP_PORT == 465:
                # Use implicit SSL for port 465
                print(f"[EMAIL] Connecting with SSL to {smtp_host}:{settings.SMTP_PORT}...")
                with smtplib.SMTP_SSL(smtp_host, settings.SMTP_PORT, timeout=30) as server:
                    if settings.SMTP_USER and smtp_password:
                        server.login(settings.SMTP_USER, smtp_password)
                    server.sendmail(settings.SMTP_FROM, to_email, msg.as_string())
            else:
                # Use STARTTLS for 587 or others
                print(f"[EMAIL] Connecting with STARTTLS to {smtp_host}:{settings.SMTP_PORT}...")
                with smtplib.SMTP(smtp_host, settings.SMTP_PORT, timeout=30) as server:
                    # Only use STARTTLS if not connecting to a local relay
                    if settings.SMTP_PORT != 1025:
                        server.starttls()
                    
                    # Only authenticate if credentials are provided
                    if settings.SMTP_USER and smtp_password:
                        server.login(settings.SMTP_USER, smtp_password)
                    
                    server.sendmail(settings.SMTP_FROM, to_email, msg.as_string())
            
            print(f"[EMAIL SENT] To: {to_email}, Subject: {subject}")
            return True
        finally:
            # Restore original socket if we modified it
            if proxy_configured:
                import importlib
                importlib.reload(socket)
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"[EMAIL ERROR] Authentication failed. Check SMTP_USER and SMTP_PASSWORD. Error: {e}")
        return False
    except (smtplib.SMTPConnectError, TimeoutError, ConnectionRefusedError) as e:
        print(f"[EMAIL ERROR] Connection failed. Check SMTP_HOST/PORT and Firewall/Proxy settings. Error: {e}")
        return False
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send to {to_email}. Error type: {type(e).__name__}, Detail: {e}")
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
