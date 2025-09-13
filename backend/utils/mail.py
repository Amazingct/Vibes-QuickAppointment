"""
Email service module using Mailtrap API
Provides functions for sending various types of emails
"""

import os
import sys
import logging
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum

# Add parent directory to path for config import
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import mailtrap as mt
except ImportError:
    mt = None
    logging.warning("Mailtrap not installed. Run: pip install mailtrap")

from config import Config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmailTemplate(Enum):
    """Email template types"""
    WELCOME = "welcome"
    VERIFICATION = "verification"
    PASSWORD_RESET = "password_reset"
    NOTIFICATION = "notification"
    CUSTOM = "custom"


@dataclass
class EmailRecipient:
    """Email recipient data structure"""
    email: str
    name: Optional[str] = None
    
    def to_mailtrap_address(self) -> 'mt.Address':
        """Convert to Mailtrap Address object"""
        if mt is None:
            raise ImportError("Mailtrap not installed")
        return mt.Address(email=self.email, name=self.name)


@dataclass
class EmailContent:
    """Email content data structure"""
    subject: str
    text: Optional[str] = None
    html: Optional[str] = None
    template_id: Optional[str] = None
    template_variables: Optional[Dict[str, Any]] = None


class MailService:
    """Mailtrap email service"""
    
    def __init__(self, api_token: Optional[str] = None, sender_email: Optional[str] = None, sender_name: Optional[str] = None):
        """
        Initialize MailService
        
        Args:
            api_token: Mailtrap API token (if None, loads from config)
            sender_email: Default sender email (if None, loads from config)
            sender_name: Default sender name (if None, uses default)
        """
        if mt is None:
            raise ImportError("Mailtrap not installed. Run: pip install mailtrap")
        
        # Load configuration
        self.api_token = api_token or Config.MAILTRAP
        self.sender_email = sender_email or getattr(Config, 'SENDER_EMAIL', 'noreply@example.com')
        self.sender_name = sender_name or getattr(Config, 'SENDER_NAME', 'Vibe Coding App')
        
        if not self.api_token:
            raise ValueError("Mailtrap API token is required. Set MAILTRAP in environment variables.")
        
        # Initialize Mailtrap client
        self.client = mt.MailtrapClient(token=self.api_token)
        
        logger.info(f"MailService initialized with sender: {self.sender_email}")
    
    def create_sender(self, email: Optional[str] = None, name: Optional[str] = None) -> 'mt.Address':
        """Create sender address"""
        return mt.Address(
            email=email or self.sender_email,
            name=name or self.sender_name
        )
    
    def send_email(self, 
                   recipients: List[EmailRecipient],
                   content: EmailContent,
                   sender_email: Optional[str] = None,
                   sender_name: Optional[str] = None) -> bool:
        """
        Send email to recipients
        
        Args:
            recipients: List of email recipients
            content: Email content
            sender_email: Override default sender email
            sender_name: Override default sender name
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Convert recipients to Mailtrap format
            to_addresses = [recipient.to_mailtrap_address() for recipient in recipients]
            
            # Create sender address
            sender = self.create_sender(sender_email, sender_name)
            
            # Create mail object
            mail_kwargs = {
                'sender': sender,
                'to': to_addresses,
                'subject': content.subject
            }
            
            # Add content based on what's provided
            if content.text:
                mail_kwargs['text'] = content.text
            
            if content.html:
                mail_kwargs['html'] = content.html
            
            # If template is specified, use template instead
            if content.template_id:
                mail_kwargs['template_uuid'] = content.template_id
                if content.template_variables:
                    mail_kwargs['template_variables'] = content.template_variables
            
            # Create and send mail
            mail = mt.Mail(**mail_kwargs)
            response = self.client.send(mail)
            
            logger.info(f"Email sent successfully to {len(recipients)} recipients")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
    
    def send_welcome_email(self, 
                          recipient_email: str, 
                          recipient_name: str,
                          app_name: Optional[str] = None) -> bool:
        """
        Send welcome email to new user
        
        Args:
            recipient_email: User's email address
            recipient_name: User's full name
            app_name: Application name (optional)
            
        Returns:
            bool: True if successful, False otherwise
        """
        app_name = app_name or "Vibe Coding App"
        
        recipient = EmailRecipient(email=recipient_email, name=recipient_name)
        
        content = EmailContent(
            subject=f"Welcome to {app_name}!",
            text=f"""
Hello {recipient_name},

Welcome to {app_name}! We're excited to have you on board.

Getting started is easy:
1. Complete your profile
2. Explore the features
3. Start using the app

If you have any questions, feel free to reach out to our support team.

Best regards,
The {app_name} Team
            """.strip(),
            html=f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c5aa0;">Welcome to {app_name}!</h2>
        
        <p>Hello <strong>{recipient_name}</strong>,</p>
        
        <p>Welcome to {app_name}! We're excited to have you on board.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2c5aa0;">Getting started is easy:</h3>
            <ol>
                <li>Complete your profile</li>
                <li>Explore the features</li>
                <li>Start using the app</li>
            </ol>
        </div>
        
        <p>If you have any questions, feel free to reach out to our support team.</p>
        
        <p>Best regards,<br>
        The {app_name} Team</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
            This email was sent from {app_name}. If you didn't create an account, please ignore this email.
        </p>
    </div>
</body>
</html>
            """.strip()
        )
        
        return self.send_email([recipient], content)
    
    def send_verification_email(self, 
                               recipient_email: str, 
                               recipient_name: str,
                               verification_link: str,
                               app_name: Optional[str] = None) -> bool:
        """
        Send email verification link
        
        Args:
            recipient_email: User's email address
            recipient_name: User's full name
            verification_link: Verification URL
            app_name: Application name (optional)
            
        Returns:
            bool: True if successful, False otherwise
        """
        app_name = app_name or "Vibe Coding App"
        
        recipient = EmailRecipient(email=recipient_email, name=recipient_name)
        
        content = EmailContent(
            subject=f"Verify your {app_name} account",
            text=f"""
Hello {recipient_name},

Please verify your email address by clicking the link below:

{verification_link}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

Best regards,
The {app_name} Team
            """.strip(),
            html=f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c5aa0;">Verify your {app_name} account</h2>
        
        <p>Hello <strong>{recipient_name}</strong>,</p>
        
        <p>Please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{verification_link}" 
               style="background-color: #28a745; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
            </a>
        </div>
        
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
            {verification_link}
        </p>
        
        <p><strong>This link will expire in 24 hours.</strong></p>
        
        <p>If you didn't create an account, please ignore this email.</p>
        
        <p>Best regards,<br>
        The {app_name} Team</p>
    </div>
</body>
</html>
            """.strip()
        )
        
        return self.send_email([recipient], content)
    
    def send_password_reset_email(self, 
                                 recipient_email: str, 
                                 recipient_name: str,
                                 reset_link: str,
                                 app_name: Optional[str] = None) -> bool:
        """
        Send password reset email
        
        Args:
            recipient_email: User's email address
            recipient_name: User's full name
            reset_link: Password reset URL
            app_name: Application name (optional)
            
        Returns:
            bool: True if successful, False otherwise
        """
        app_name = app_name or "Vibe Coding App"
        
        recipient = EmailRecipient(email=recipient_email, name=recipient_name)
        
        content = EmailContent(
            subject=f"Reset your {app_name} password",
            text=f"""
Hello {recipient_name},

You requested to reset your password for {app_name}.

Click the link below to reset your password:

{reset_link}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
The {app_name} Team
            """.strip(),
            html=f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c5aa0;">Reset your {app_name} password</h2>
        
        <p>Hello <strong>{recipient_name}</strong>,</p>
        
        <p>You requested to reset your password for {app_name}.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" 
               style="background-color: #dc3545; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
            </a>
        </div>
        
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
            {reset_link}
        </p>
        
        <p><strong>This link will expire in 1 hour.</strong></p>
        
        <p>If you didn't request this, please ignore this email.</p>
        
        <p>Best regards,<br>
        The {app_name} Team</p>
    </div>
</body>
</html>
            """.strip()
        )
        
        return self.send_email([recipient], content)
    
    def send_notification_email(self, 
                               recipient_email: str, 
                               recipient_name: str,
                               notification_title: str,
                               notification_message: str,
                               app_name: Optional[str] = None) -> bool:
        """
        Send general notification email
        
        Args:
            recipient_email: User's email address
            recipient_name: User's full name
            notification_title: Title of the notification
            notification_message: Notification message
            app_name: Application name (optional)
            
        Returns:
            bool: True if successful, False otherwise
        """
        app_name = app_name or "Vibe Coding App"
        
        recipient = EmailRecipient(email=recipient_email, name=recipient_name)
        
        content = EmailContent(
            subject=f"{app_name}: {notification_title}",
            text=f"""
Hello {recipient_name},

{notification_message}

Best regards,
The {app_name} Team
            """.strip(),
            html=f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c5aa0;">{notification_title}</h2>
        
        <p>Hello <strong>{recipient_name}</strong>,</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            {notification_message}
        </div>
        
        <p>Best regards,<br>
        The {app_name} Team</p>
    </div>
</body>
</html>
            """.strip()
        )
        
        return self.send_email([recipient], content)


# Utility functions for easy usage
def create_mail_service() -> Optional[MailService]:
    """
    Create MailService instance from configuration
    
    Returns:
        MailService instance or None if configuration is incomplete
    """
    try:
        return MailService()
    except Exception as e:
        logger.error(f"Failed to create MailService: {e}")
        return None


def send_welcome_email(recipient_email: str, recipient_name: str) -> bool:
    """
    Utility function to send welcome email
    
    Args:
        recipient_email: User's email address
        recipient_name: User's full name
        
    Returns:
        bool: True if successful, False otherwise
    """
    mail_service = create_mail_service()
    if not mail_service:
        return False
    
    return mail_service.send_welcome_email(recipient_email, recipient_name)


def send_verification_email(recipient_email: str, recipient_name: str, verification_link: str) -> bool:
    """
    Utility function to send verification email
    
    Args:
        recipient_email: User's email address
        recipient_name: User's full name
        verification_link: Verification URL
        
    Returns:
        bool: True if successful, False otherwise
    """
    mail_service = create_mail_service()
    if not mail_service:
        return False
    
    return mail_service.send_verification_email(recipient_email, recipient_name, verification_link)


def send_password_reset_email(recipient_email: str, recipient_name: str, reset_link: str) -> bool:
    """
    Utility function to send password reset email
    
    Args:
        recipient_email: User's email address
        recipient_name: User's full name
        reset_link: Password reset URL
        
    Returns:
        bool: True if successful, False otherwise
    """
    mail_service = create_mail_service()
    if not mail_service:
        return False
    
    return mail_service.send_password_reset_email(recipient_email, recipient_name, reset_link)


if __name__ == "__main__":
    # Example usage
    print("Mail service module loaded successfully!")
    
    # Test configuration
    try:
        mail_service = create_mail_service()
        if mail_service:
            print("✅ Mail service configured successfully!")
        else:
            print("❌ Mail service configuration failed. Check your MAILTRAP environment variable.")
    except Exception as e:
        print(f"❌ Error: {e}")
