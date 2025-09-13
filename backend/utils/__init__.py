"""
Utils package for backend utilities
Contains file operations, mail service, and other helper functions
"""

# Import main classes and functions for easy access
from .files import (
    SpacesManager,
    TempDirectoryManager,
    upload_to_spaces,
    download_from_spaces,
    delete_from_spaces,
    delete_local_file,
    upload_flask_file_to_spaces,
    download_from_spaces_url,
    create_spaces_manager_from_config,
    create_spaces_manager_from_env,
    process_file_with_temp_storage
)

from .mail import (
    MailService,
    EmailRecipient,
    EmailContent,
    EmailTemplate,
    create_mail_service,
    send_welcome_email,
    send_verification_email,
    send_password_reset_email
)

__all__ = [
    # File operations
    'SpacesManager',
    'TempDirectoryManager', 
    'upload_to_spaces',
    'download_from_spaces',
    'delete_from_spaces',
    'delete_local_file',
    'upload_flask_file_to_spaces',
    'download_from_spaces_url',
    'create_spaces_manager_from_config',
    'create_spaces_manager_from_env',
    'process_file_with_temp_storage',
    
    # Mail operations
    'MailService',
    'EmailRecipient',
    'EmailContent',
    'EmailTemplate',
    'create_mail_service',
    'send_welcome_email',
    'send_verification_email',
    'send_password_reset_email'
]
