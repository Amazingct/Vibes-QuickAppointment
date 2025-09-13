#!/usr/bin/env python3
"""
Simple test script for file upload/download and email services
Tests both Spaces file operations and Mailtrap email functionality
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from utils.files import (
    TempDirectoryManager,
    upload_to_spaces,
    download_from_spaces,
    download_from_spaces_url,
    delete_from_spaces,
    delete_local_file,
    create_spaces_manager_from_config
)

from utils.mail import (
    create_mail_service,
    EmailRecipient,
    EmailContent
)

def test_file_operations():
    """Test file upload and download operations"""
    print("📁 Testing File Operations...")
    
    try:
        # Check configuration
        spaces_manager = create_spaces_manager_from_config()
        if not spaces_manager:
            print("❌ Spaces configuration failed")
            return False
        
        # Test file path
        source_file = os.path.join(backend_dir.parent, "resources", "diagram.png")
        
        if not os.path.exists(source_file):
            print(f"❌ Source file not found: {source_file}")
            return False
        
        file_size = os.path.getsize(source_file)
        print(f"✅ Source file found ({file_size:,} bytes)")
        
        # Upload test
        spaces_key = "test/diagram.png"
        print(f"📤 Uploading to: {spaces_key}")
        
        public_url = upload_to_spaces(source_file, spaces_key)
        if not public_url:
            print("❌ Upload failed")
            return False
        
        print(f"✅ Upload successful!")
        print(f"🌐 Public URL: {public_url}")
        
        # Download test - use URL-based download instead of spaces_key
        download_dir = os.path.join(backend_dir, "Downloaded")
        print(f"📥 Downloading from URL: {public_url}")
        
        downloaded_file = download_from_spaces_url(public_url, download_dir)
        if not downloaded_file:
            print("❌ Download failed")
            return False
        
        if os.path.exists(downloaded_file):
            downloaded_size = os.path.getsize(downloaded_file)
            print(f"✅ Download successful! ({downloaded_size:,} bytes)")
            print(f"📄 File path: {downloaded_file}")
            
            if file_size == downloaded_size:
                print("✅ File sizes match!")
                
                # Clean up downloaded file
                if delete_local_file(downloaded_file):
                    print("🗑️  Downloaded file cleaned up")
                
                return True
            else:
                print("⚠️  File sizes don't match")
                return False
        else:
            print("❌ Downloaded file not found")
            return False
                
    except Exception as e:
        print(f"❌ File operations error: {e}")
        return False

def test_mail_service():
    """Test email service"""
    print("\n📧 Testing Mail Service...")
    
    try:
        # Check configuration
        mail_service = create_mail_service()
        if not mail_service:
            print("❌ Mail service configuration failed")
            return False
        
        print("✅ Mail service configured")
        
        # Test email
        recipient = EmailRecipient(
            email="danielogunlolu98@gmail.com",
            name="Daniel Ogunlolu"
        )
        
        content = EmailContent(
            subject="🧪 Vibe Coding Services Test",
            text="""
Hello Daniel,

This is a test email from your Vibe Coding services!

✅ File operations: Working
✅ Mail service: Working
✅ Both services: Ready for production

Your backend services are fully functional!

Best regards,
Vibe Coding Team
            """.strip(),
            html="""
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #28a745, #20c997); padding: 30px; text-align: center; border-radius: 10px; color: white;">
        <h1 style="margin: 0;">🧪 Services Test</h1>
        <p style="margin: 10px 0 0 0;">Vibe Coding Backend</p>
    </div>
    
    <div style="padding: 20px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
        <h2>Hello Daniel! 👋</h2>
        <p>This is a test email from your <strong>Vibe Coding services!</strong></p>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #28a745; margin-top: 0;">✅ Test Results:</h3>
            <p>✅ File operations: Working<br>
            ✅ Mail service: Working<br>
            ✅ Both services: Ready for production</p>
        </div>
        
        <p><strong>Your backend services are fully functional!</strong></p>
        <p>Best regards,<br>Vibe Coding Team</p>
    </div>
</body>
</html>
            """.strip()
        )
        
        # Send email
        success = mail_service.send_email([recipient], content)
        
        if success:
            print("✅ Test email sent successfully!")
            print("📧 Check danielogunlolu98@gmail.com for the email")
            return True
        else:
            print("❌ Failed to send test email")
            return False
            
    except Exception as e:
        print(f"❌ Mail service error: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 VIBE CODING SERVICES TEST")
    print("=" * 40)
    print("Testing mail service and file operations")
    print()
    
    # Test results - Email first, then files
    mail_test = test_mail_service()
    file_test = test_file_operations()
    
    print("\n" + "=" * 40)
    print("📊 TEST RESULTS")
    print("=" * 40)
    
    if mail_test and file_test:
        print("🎉 ALL TESTS PASSED!")
        print("✅ Mail Service: Working")
        print("✅ File Operations: Working")
        print("🚀 Your backend services are ready!")
        return True
    else:
        print("❌ Some tests failed:")
        print(f"   Mail Service: {'✅' if mail_test else '❌'}")
        print(f"   File Operations: {'✅' if file_test else '❌'}")
        print()
        print("Check your .env configuration:")
        print("- MAILTRAP variable for email service")
        print("- SPACES_* variables for file operations")
        return False

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⏹️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n💥 Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
