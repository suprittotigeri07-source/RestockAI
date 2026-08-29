import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from src.utils.logger import logger
from src.utils.config import settings

def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    """Sends a password reset email using the configured SMTP server."""
    if not settings.SMTP_HOST or not settings.SMTP_PORT:
        logger.warning(f"SMTP not configured. Mocking email to {to_email} with link {reset_link}")
        return True

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Reset Your Password - RestockAI"
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_email

    text = f"""
Hello,

We received a request to reset your password for RestockAI.

Please click the link below to create a new password:
{reset_link}

This link will expire in 30 minutes.
If you did not request a password reset, you can safely ignore this email.

Regards,
RestockAI Team
"""
    
    html = f"""
    <html>
      <body>
        <p>Hello,</p>
        <p>We received a request to reset your password for RestockAI.</p>
        <p>
           <a href="{reset_link}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:5px;">
             Reset Password
           </a>
        </p>
        <p>Or click this link: <a href="{reset_link}">{reset_link}</a></p>
        <p>This link will expire in 30 minutes.</p>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
        <p>Regards,<br>RestockAI Team</p>
      </body>
    </html>
    """

    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html, "html")
    msg.attach(part1)
    msg.attach(part2)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, to_email, msg.as_string())
        logger.info(f"Password reset email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset email to {to_email}: {e}")
        return False
