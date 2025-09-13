"""
Authentication Blueprint - User registration and login
Handles authentication API endpoints for signup and login
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from database import db, User
from typing import Dict, Any
import uuid
import random
from datetime import datetime, timedelta
from utils.mail import create_mail_service, EmailRecipient, EmailContent
from config import Config

# Create blueprint
auth_bp = Blueprint('auth', __name__)

def validate_signup_data(data: Dict[str, Any]) -> Dict[str, str]:
    """Validate signup request data and return errors if any"""
    errors = {}
    
    # Required fields
    required_fields = ['email', 'username', 'password', 'first_name', 'last_name']
    for field in required_fields:
        if not data.get(field) or not data[field].strip():
            errors[field] = f"{field.replace('_', ' ').title()} is required"
    
    if errors:
        return errors
    
    # Email validation
    email = data['email'].strip().lower()
    if not User.validate_email_format(email):
        errors['email'] = "Invalid email format"
    
    # Check if email already exists
    if User.find_by_email(email):
        errors['email'] = "Email already registered"
    
    # Username validation
    username = data['username'].strip().lower()
    if len(username) < 3:
        errors['username'] = "Username must be at least 3 characters long"
    elif len(username) > 20:
        errors['username'] = "Username must be less than 20 characters"
    elif not username.replace('_', '').replace('-', '').isalnum():
        errors['username'] = "Username can only contain letters, numbers, hyphens, and underscores"
    
    # Check if username already exists
    if User.find_by_username(username):
        errors['username'] = "Username already taken"
    
    # Password validation
    password = data['password']
    if len(password) < 6:
        errors['password'] = "Password must be at least 6 characters long"
    elif len(password) > 100:
        errors['password'] = "Password must be less than 100 characters"
    
    # Name validation
    first_name = data['first_name'].strip()
    last_name = data['last_name'].strip()
    
    if len(first_name) < 2:
        errors['first_name'] = "First name must be at least 2 characters long"
    elif len(first_name) > 50:
        errors['first_name'] = "First name must be less than 50 characters"
        
    if len(last_name) < 2:
        errors['last_name'] = "Last name must be at least 2 characters long"
    elif len(last_name) > 50:
        errors['last_name'] = "Last name must be less than 50 characters"
    
    return errors

def validate_login_data(data: Dict[str, Any]) -> Dict[str, str]:
    """Validate login request data and return errors if any"""
    errors = {}
    
    # Required fields
    if not data.get('login') or not data['login'].strip():
        errors['login'] = "Email or username is required"
    
    if not data.get('password'):
        errors['password'] = "Password is required"
    
    return errors

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Register a new user account"""
    try:
        # Get JSON data
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'invalid_request',
                'message': 'Request must contain JSON data'
            }), 400
        
        # Validate input data
        errors = validate_signup_data(data)
        if errors:
            return jsonify({
                'error': 'validation_error',
                'message': 'Please fix the following errors',
                'details': errors
            }), 400
        
        # Create new user
        try:
            user = User(
                email=data['email'],
                username=data['username'],
                password=data['password'],
                first_name=data['first_name'],
                last_name=data['last_name']
            )
            
            # Generate verification token
            user.verification_token = str(uuid.uuid4())
            # Generate OTP (6 digits) expiring in 10 minutes
            otp = f"{random.randint(100000, 999999)}"
            user.verification_otp = otp
            user.verification_otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
            
            # Save to database
            db.session.add(user)
            db.session.commit()
            
            # Send OTP email (best-effort)
            try:
                mail_service = create_mail_service()
                if mail_service:
                    mail_service.send_email(
                        [EmailRecipient(email=user.email, name=f"{user.first_name} {user.last_name}")],
                        EmailContent(
                            subject="Your verification code",
                            text=f"Your verification code is {otp}. It expires in 10 minutes.",
                            html=f"<p>Your verification code is <strong>{otp}</strong>. It expires in 10 minutes.</p>"
                        )
                    )
            except Exception:
                pass

            # Create JWT tokens
            access_token = create_access_token(identity=str(user.id))
            refresh_token = create_refresh_token(identity=str(user.id))
            
            return jsonify({
                'data': {
                    'user': user.to_json(),
                    'access_token': access_token,
                    'refresh_token': refresh_token
                },
                'message': 'Account created successfully. Please verify your email with the OTP sent.'
            }), 201
            
        except ValueError as e:
            return jsonify({
                'error': 'validation_error',
                'message': str(e)
            }), 400
        except Exception as e:
            db.session.rollback()
            return jsonify({
                'error': 'registration_failed',
                'message': 'Failed to create account. Please try again.'
            }), 500
    
    except Exception as e:
        return jsonify({
            'error': 'server_error',
            'message': 'An unexpected error occurred'
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user with email/username and password"""
    try:
        # Get JSON data
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'invalid_request',
                'message': 'Request must contain JSON data'
            }), 400
        
        # Validate input data
        errors = validate_login_data(data)
        if errors:
            return jsonify({
                'error': 'validation_error',
                'message': 'Please fix the following errors',
                'details': errors
            }), 400
        
        login_field = data['login'].strip().lower()
        password = data['password']
        
        # Find user by email or username
        user = None
        if '@' in login_field:
            user = User.find_by_email(login_field)
        else:
            user = User.find_by_username(login_field)
        
        # Check if user exists and password is correct
        if not user or not user.check_password(password):
            return jsonify({
                'error': 'invalid_credentials',
                'message': 'Invalid email/username or password'
            }), 401
        
        # Check if account is active
        if not user.is_active:
            return jsonify({
                'error': 'account_disabled',
                'message': 'Your account has been disabled. Please contact support.'
            }), 401

        # Enforce email verification via OTP
        if not user.is_verified:
            return jsonify({
                'error': 'email_not_verified',
                'message': 'Please verify your email with the OTP sent to proceed.'
            }), 401
        
        # Update last login
        user.update_last_login()
        
        # Create JWT tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return jsonify({
            'data': {
                'user': user.to_json(),
                'access_token': access_token,
                'refresh_token': refresh_token
            },
            'message': 'Login successful'
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': 'server_error',
            'message': 'An unexpected error occurred'
        }), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token using refresh token"""
    try:
        current_user_id = get_jwt_identity()
        user = User.find_by_id(int(current_user_id))
        
        if not user or not user.is_active:
            return jsonify({
                'error': 'invalid_user',
                'message': 'User not found or account disabled'
            }), 401
        
        # Create new access token
        new_access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'data': {
                'access_token': new_access_token
            },
            'message': 'Token refreshed successfully'
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': 'server_error',
            'message': 'An unexpected error occurred'
        }), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user information"""
    try:
        current_user_id = get_jwt_identity()
        user = User.find_by_id(int(current_user_id))
        
        if not user:
            return jsonify({
                'error': 'user_not_found',
                'message': 'User not found'
            }), 404
        
        return jsonify({
            'data': user.to_json(),
            'message': 'User information retrieved successfully'
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': 'server_error',
            'message': 'An unexpected error occurred'
        }), 500

@auth_bp.route('/validate', methods=['POST'])
@jwt_required()
def validate_token():
    """Validate if current JWT token is valid"""
    try:
        current_user_id = get_jwt_identity()
        user = User.find_by_id(int(current_user_id))
        
        if not user or not user.is_active:
            return jsonify({
                'error': 'invalid_token',
                'message': 'Token is invalid or user account is disabled'
            }), 401
        
        return jsonify({
            'data': {
                'valid': True,
                'user_id': user.id,
                'username': user.username
            },
            'message': 'Token is valid'
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': 'server_error',
            'message': 'An unexpected error occurred'
        }), 500


@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verify user's email using OTP"""
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        otp = (data.get('otp') or '').strip()

        if not email or not otp:
            return jsonify({'error': 'invalid_request', 'message': 'Email and OTP are required'}), 400

        user = User.find_by_email(email)
        if not user:
            return jsonify({'error': 'user_not_found', 'message': 'User not found'}), 404

        if user.is_verified:
            return jsonify({'data': {'verified': True}, 'message': 'Email already verified'}), 200

        now = datetime.utcnow()
        if not user.verification_otp or not user.verification_otp_expires_at or now > user.verification_otp_expires_at:
            return jsonify({'error': 'otp_invalid', 'message': 'OTP is invalid or expired'}), 400

        if otp != user.verification_otp:
            return jsonify({'error': 'otp_invalid', 'message': 'Invalid OTP'}), 400

        # Mark verified and clear OTP fields
        user.is_verified = True
        user.verification_otp = None
        user.verification_otp_expires_at = None
        db.session.commit()

        return jsonify({'data': {'verified': True}, 'message': 'Email verified successfully'}), 200
    except Exception:
        return jsonify({'error': 'server_error', 'message': 'An unexpected error occurred'}), 500


@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    """Resend OTP to user's email"""
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()

        if not email:
            return jsonify({'error': 'invalid_request', 'message': 'Email is required'}), 400

        user = User.find_by_email(email)
        if not user:
            return jsonify({'error': 'user_not_found', 'message': 'User not found'}), 404

        if user.is_verified:
            return jsonify({'data': {'verified': True}, 'message': 'Email already verified'}), 200

        otp = f"{random.randint(100000, 999999)}"
        user.verification_otp = otp
        user.verification_otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
        db.session.commit()

        try:
            mail_service = create_mail_service()
            if mail_service:
                mail_service.send_email(
                    [EmailRecipient(email=user.email, name=f"{user.first_name} {user.last_name}")],
                    EmailContent(
                        subject="Your verification code",
                        text=f"Your verification code is {otp}. It expires in 10 minutes.",
                        html=f"<p>Your verification code is <strong>{otp}</strong>. It expires in 10 minutes.</p>"
                    )
                )
        except Exception:
            pass

        return jsonify({'message': 'OTP resent successfully'}), 200
    except Exception:
        return jsonify({'error': 'server_error', 'message': 'An unexpected error occurred'}), 500


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change password for current user"""
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json() or {}
        old_password = data.get('old_password')
        new_password = data.get('new_password')

        if not old_password or not new_password:
            return jsonify({'error': 'invalid_request', 'message': 'Old and new passwords are required'}), 400

        user = User.find_by_id(current_user_id)
        if not user or not user.check_password(old_password):
            return jsonify({'error': 'invalid_credentials', 'message': 'Old password is incorrect'}), 401

        if len(new_password) < 6 or len(new_password) > 100:
            return jsonify({'error': 'validation_error', 'message': 'New password length must be between 6 and 100 characters'}), 400

        user.set_password(new_password)
        db.session.commit()

        return jsonify({'message': 'Password changed successfully'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'server_error', 'message': 'An unexpected error occurred'}), 500


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Initiate password reset by sending OTP to email"""
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        if not email:
            return jsonify({'error': 'invalid_request', 'message': 'Email is required'}), 400

        user = User.find_by_email(email)
        # Respond success even if user not found to avoid user enumeration
        if not user:
            return jsonify({'message': 'If the email exists, a reset code has been sent'}), 200

        otp = f"{random.randint(100000, 999999)}"
        user.reset_otp = otp
        user.reset_otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
        db.session.commit()

        try:
            mail_service = create_mail_service()
            if mail_service:
                mail_service.send_email(
                    [EmailRecipient(email=user.email, name=f"{user.first_name} {user.last_name}")],
                    EmailContent(
                        subject="Your password reset code",
                        text=f"Your password reset code is {otp}. It expires in 10 minutes.",
                        html=f"<p>Your password reset code is <strong>{otp}</strong>. It expires in 10 minutes.</p>"
                    )
                )
        except Exception:
            pass

        return jsonify({'message': 'If the email exists, a reset code has been sent'}), 200
    except Exception:
        return jsonify({'error': 'server_error', 'message': 'An unexpected error occurred'}), 500


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using OTP"""
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        otp = (data.get('otp') or '').strip()
        new_password = data.get('new_password')

        if not email or not otp or not new_password:
            return jsonify({'error': 'invalid_request', 'message': 'Email, otp and new_password are required'}), 400

        user = User.find_by_email(email)
        if not user:
            return jsonify({'error': 'user_not_found', 'message': 'User not found'}), 404

        now = datetime.utcnow()
        if not user.reset_otp or not user.reset_otp_expires_at or now > user.reset_otp_expires_at:
            return jsonify({'error': 'otp_invalid', 'message': 'Reset code is invalid or expired'}), 400

        if otp != user.reset_otp:
            return jsonify({'error': 'otp_invalid', 'message': 'Invalid reset code'}), 400

        if len(new_password) < 6 or len(new_password) > 100:
            return jsonify({'error': 'validation_error', 'message': 'New password length must be between 6 and 100 characters'}), 400

        user.set_password(new_password)
        user.reset_otp = None
        user.reset_otp_expires_at = None
        db.session.commit()

        return jsonify({'message': 'Password reset successfully'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'server_error', 'message': 'An unexpected error occurred'}), 500
