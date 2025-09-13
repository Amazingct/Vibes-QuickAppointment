from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from datetime import datetime
import bcrypt
from typing import Optional, Dict, Any, List
from email_validator import validate_email, EmailNotValidError
from sqlalchemy import CheckConstraint
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.types import Numeric

# Initialize database
db = SQLAlchemy()
migrate = Migrate()

def init_db(app: Flask) -> None:
    """Initialize database with Flask app"""
    db.init_app(app)
    migrate.init_app(app, db)

class User(db.Model):
    """User model for authentication and user management"""
    __tablename__ = 'users'
    
    # Primary fields
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False)
    
    # Profile fields
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    avatar_url = db.Column(db.String(255), nullable=True)
    
    # Account status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    verification_token = db.Column(db.String(255), nullable=True)
    # OTP verification fields
    verification_otp = db.Column(db.String(10), nullable=True)
    verification_otp_expires_at = db.Column(db.DateTime, nullable=True)
    # Password reset OTP fields
    reset_otp = db.Column(db.String(10), nullable=True)
    reset_otp_expires_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login_at = db.Column(db.DateTime, nullable=True)
    
    def __init__(self, email: str, username: str, password: str, first_name: str, last_name: str):
        """Initialize user with required fields"""
        self.email = email.lower().strip()
        self.username = username.lower().strip()
        self.first_name = first_name.strip()
        self.last_name = last_name.strip()
        self.set_password(password)
        
    def set_password(self, password: str) -> None:
        """Hash and set user password"""
        if len(password) < 6:
            raise ValueError("Password must be at least 6 characters long")
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
    def check_password(self, password: str) -> bool:
        """Check if provided password matches user's password"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
        
    def update_last_login(self) -> None:
        """Update last login timestamp"""
        self.last_login_at = datetime.utcnow()
        db.session.commit()
        
    @staticmethod
    def validate_email_format(email: str) -> bool:
        """Validate email format"""
        try:
            validate_email(email)
            return True
        except EmailNotValidError:
            return False
            
    @staticmethod
    def find_by_email(email: str) -> Optional['User']:
        """Find user by email"""
        return User.query.filter_by(email=email.lower().strip()).first()
        
    @staticmethod
    def find_by_username(username: str) -> Optional['User']:
        """Find user by username"""
        return User.query.filter_by(username=username.lower().strip()).first()
        
    @staticmethod
    def find_by_id(user_id: int) -> Optional['User']:
        """Find user by ID"""
        return User.query.get(user_id)
        
    def to_json(self) -> Dict[str, Any]:
        """Convert user to JSON representation (excluding sensitive data)"""
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': f"{self.first_name} {self.last_name}",
            'avatar_url': self.avatar_url,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None
        }
        
    def __repr__(self) -> str:
        return f'<User {self.username}>'


class Service(db.Model):
    """Service model representing a bookable service offered by a user"""
    __tablename__ = 'services'

    # Fields
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False, index=True)
    duration_minutes = db.Column(db.Integer, nullable=False)
    price = db.Column(Numeric(10, 2), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    images = db.Column(ARRAY(db.String), nullable=False, default=list)
    category = db.Column(db.String(100), nullable=True, index=True)

    # Relationships
    user = db.relationship('User', backref=db.backref('services', lazy=True))

    # Constraints
    __table_args__ = (
        CheckConstraint("duration_minutes IN (30, 45, 60, 120)", name='ck_services_duration_minutes_valid'),
        CheckConstraint("price >= 0", name='ck_services_price_non_negative'),
    )

    def to_json(self) -> Dict[str, Any]:
        """Convert service to JSON representation"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'duration_minutes': self.duration_minutes,
            'price': float(self.price) if self.price is not None else None,
            'description': self.description,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'images': self.images or [],
            'category': self.category,
            'provider': {
                'id': self.user.id if self.user else None,
                'username': self.user.username if self.user else None,
                'avatar_url': self.user.avatar_url if self.user else None
            }
        }

    @staticmethod
    def validate_payload(data: Dict[str, Any]) -> Dict[str, str]:
        """Validate incoming payload for creating/updating a service. Returns errors dict."""
        errors: Dict[str, str] = {}

        if 'name' in data:
            name = (data.get('name') or '').strip()
            if not name:
                errors['name'] = 'Name is required'
            elif len(name) > 100:
                errors['name'] = 'Name must be at most 100 characters'
        else:
            errors['name'] = 'Name is required'

        if 'duration_minutes' in data:
            try:
                duration = int(data.get('duration_minutes'))
            except (TypeError, ValueError):
                errors['duration_minutes'] = 'Duration must be an integer'
            else:
                if duration not in (30, 45, 60, 120):
                    errors['duration_minutes'] = 'Duration must be one of 30, 45, 60, 120'
        else:
            errors['duration_minutes'] = 'Duration is required'

        if 'price' in data:
            try:
                price_val = float(data.get('price'))
            except (TypeError, ValueError):
                errors['price'] = 'Price must be a number'
            else:
                if price_val < 0:
                    errors['price'] = 'Price must be non-negative'
        else:
            errors['price'] = 'Price is required'

        if 'images' in data:
            images = data.get('images')
            if images is not None and not isinstance(images, list):
                errors['images'] = 'Images must be a list of URLs'

        return errors


class Booking(db.Model):
    """Booking model representing a booking request for a service"""
    __tablename__ = 'bookings'

    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False, index=True)
    provider_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False, default='pending', index=True)
    time_booked = db.Column(db.DateTime, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
  

    # Relationships
    client = db.relationship('User', foreign_keys=[client_id])
    provider = db.relationship('User', foreign_keys=[provider_id])
    service = db.relationship('Service')

    __table_args__ = (
        CheckConstraint("status IN ('pending','accepted','rejected','canceled','cancelled')", name='ck_bookings_status_valid'),
    )

    def to_json(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'client': {
                'id': self.client.id if self.client else self.client_id,
                'username': self.client.username if self.client else None,
                'avatar_url': self.client.avatar_url if self.client else None,
                'email': self.client.email if self.client else None,
                'first_name': self.client.first_name if self.client else None,
                'last_name': self.client.last_name if self.client else None,
                'full_name': (f"{self.client.first_name} {self.client.last_name}") if self.client else None
            },
            'provider': {
                'id': self.provider.id if self.provider else self.provider_id,
                'username': self.provider.username if self.provider else None,
                'avatar_url': self.provider.avatar_url if self.provider else None,
                'email': self.provider.email if self.provider else None,
                'first_name': self.provider.first_name if self.provider else None,
                'last_name': self.provider.last_name if self.provider else None,
                'full_name': (f"{self.provider.first_name} {self.provider.last_name}") if self.provider else None
            },
            'service': {
                'id': self.service.id if self.service else self.service_id,
                'name': self.service.name if self.service else None
            },
            'status': self.status,
            'time_booked': self.time_booked.isoformat() if self.time_booked else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    @staticmethod
    def validate_payload(data: Dict[str, Any], for_update: bool = False) -> Dict[str, str]:
        errors: Dict[str, str] = {}

        def require(field: str):
            if not for_update and field not in data:
                errors[field] = f"{field} is required"

        require('service_id')
        require('time_booked')

        # Validate status when provided
        if 'status' in data:
            status = (data.get('status') or '').strip().lower()
            if status not in ('pending', 'accepted', 'rejected', 'canceled', 'cancelled'):
                errors['status'] = "Status must be one of: pending, accepted, rejected, canceled/cancelled"

        # Validate time_booked format
        if 'time_booked' in data and data.get('time_booked'):
            try:
                # Accept ISO-8601 string
                datetime.fromisoformat(str(data.get('time_booked')).replace('Z', '+00:00'))
            except Exception:
                errors['time_booked'] = 'time_booked must be an ISO-8601 datetime string'

        return errors
