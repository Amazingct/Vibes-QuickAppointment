#!/usr/bin/env python3
"""
Simple test script to debug server startup issues
"""

import os
import sys

def test_environment():
    """Test environment variables"""
    print("🔍 Testing Environment Variables...")
    
    required_vars = [
        'DATABASE_URL',
        'SECRET_KEY', 
        'JWT_SECRET_KEY'
    ]
    
    missing_vars = []
    for var in required_vars:
        value = os.environ.get(var)
        if value:
            # Hide sensitive values
            display_value = value if var == 'DATABASE_URL' else '***'
            print(f"✅ {var}: {display_value}")
        else:
            missing_vars.append(var)
            print(f"❌ {var}: Not set")
    
    if missing_vars:
        print(f"\n❌ Missing environment variables: {', '.join(missing_vars)}")
        return False
    
    print("✅ All required environment variables are set")
    return True

def test_imports():
    """Test importing modules"""
    print("\n🔍 Testing Imports...")
    
    try:
        from config import Config
        print("✅ Config imported successfully")
    except Exception as e:
        print(f"❌ Config import failed: {e}")
        return False
    
    try:
        from database import db, User
        print("✅ Database models imported successfully")
    except Exception as e:
        print(f"❌ Database import failed: {e}")
        return False
    
    try:
        from main import create_app
        print("✅ Main app imported successfully")
    except Exception as e:
        print(f"❌ Main app import failed: {e}")
        return False
    
    return True

def test_app_creation():
    """Test creating the Flask app"""
    print("\n🔍 Testing App Creation...")
    
    try:
        from main import create_app
        app = create_app()
        print("✅ Flask app created successfully")
        
        # Test app context
        with app.app_context():
            from database import db
            print("✅ App context works")
            
        return True, app
    except Exception as e:
        print(f"❌ App creation failed: {e}")
        return False, None

def main():
    """Main test function"""
    print("🧪 VCP Backend Server Test")
    print("=" * 40)
    
    # Test environment
    if not test_environment():
        print("\n❌ Environment test failed")
        sys.exit(1)
    
    # Test imports
    if not test_imports():
        print("\n❌ Import test failed")
        sys.exit(1)
    
    # Test app creation
    success, app = test_app_creation()
    if not success:
        print("\n❌ App creation test failed")
        sys.exit(1)
    
    print("\n✅ All tests passed!")
    print("🚀 Server should be able to start successfully")
    
    # Try to start the server
    print("\n🔄 Attempting to start server...")
    try:
        app.run(host='0.0.0.0', port=5002, debug=True)
    except Exception as e:
        print(f"❌ Server startup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
