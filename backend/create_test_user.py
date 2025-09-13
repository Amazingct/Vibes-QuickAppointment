#!/usr/bin/env python3
"""
Create test user for development and testing
Run this script to create a test user that matches the demo credentials in the frontend
"""

import sys
import os

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import create_app
from database import db, User

def create_test_user():
    """Create a test user with demo credentials"""
    app = create_app()
    
    with app.app_context():
        try:
            # Check if test user already exists
            existing_user = User.find_by_email('test@example.com')
            if existing_user:
                print("✅ Test user already exists:")
                print(f"   Email: {existing_user.email}")
                print(f"   Username: {existing_user.username}")
                print(f"   Name: {existing_user.first_name} {existing_user.last_name}")
                print(f"   Active: {existing_user.is_active}")
                return existing_user
            
            # Create new test user
            print("🔧 Creating test user...")
            user = User(
                email='test@example.com',
                username='testuser',
                password='testpassword123',  # This will be hashed automatically
                first_name='Test',
                last_name='User'
            )
            
            # Save to database
            db.session.add(user)
            db.session.commit()
            
            print("✅ Test user created successfully:")
            print(f"   Email: {user.email}")
            print(f"   Username: {user.username}")
            print(f"   Name: {user.first_name} {user.last_name}")
            print(f"   Password: testpassword123")
            print(f"   User ID: {user.id}")
            print(f"   Active: {user.is_active}")
            
            return user
            
        except Exception as e:
            print(f"❌ Error creating test user: {e}")
            db.session.rollback()
            return None

if __name__ == '__main__':
    print("🚀 Creating test user for VCP application...\n")
    
    user = create_test_user()
    
    if user:
        print(f"\n🎉 Test user ready!")
        print(f"   You can now login with:")
        print(f"   Email: test@example.com")
        print(f"   Password: testpassword123")
    else:
        print(f"\n❌ Failed to create test user")
        sys.exit(1)

