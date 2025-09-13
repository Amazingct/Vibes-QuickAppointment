import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Production-ready configuration class"""
    
    # Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY', 'fallback-secret-key-change-immediately')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'fallback-jwt-secret-change-immediately')
    DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    # Database Configuration - Always use PostgreSQL from environment
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    if not SQLALCHEMY_DATABASE_URI:
        raise ValueError("DATABASE_URL environment variable is required")
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # CORS Configuration
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',')
    
    # JWT Configuration
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 3600))  # 1 hour default
    JWT_REFRESH_TOKEN_EXPIRES = int(os.environ.get('JWT_REFRESH_TOKEN_EXPIRES', 2592000))  # 30 days default
    
    # Port Configuration
    PORT = int(os.environ.get('PORT', 5002))
    
    # DigitalOcean Spaces Configuration
    SPACES_ENDPOINT_URL = os.environ.get('SPACES_ENDPOINT_URL')
    SPACES_ACCESS_KEY = os.environ.get('SPACES_ACCESS_KEY')
    SPACES_SECRET_KEY = os.environ.get('SPACES_SECRET_KEY')
    SPACES_BUCKET_NAME = os.environ.get('SPACES_BUCKET_NAME')
    SPACES_REGION = os.environ.get('SPACES_REGION', 'nyc3')
    
    # Email Configuration
    MAILTRAP = os.environ.get('MAILTRAP')
    SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@example.com')
    SENDER_NAME = os.environ.get('SENDER_NAME', 'Vibe Coding App')

# Single configuration for production-ready setup
config = {
    'default': Config,
    'production': Config
}
