"""
VCP Project Backend - Main Application
Production-ready Flask application with JWT authentication
"""

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta

from config import Config
from database import db, init_db, User

def create_app() -> Flask:
    """Application factory for creating Flask app"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions - Allow all origins (permissive CORS)
    CORS(app, resources={r"/*": {"origins": "*"}})
    jwt = JWTManager(app)
    init_db(app)
    
    # JWT Configuration
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(seconds=Config.JWT_ACCESS_TOKEN_EXPIRES)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(seconds=Config.JWT_REFRESH_TOKEN_EXPIRES)
    
    # Register blueprints
    register_blueprints(app)
    
    # Register error handlers
    register_error_handlers(app, jwt)
    
    # Health check endpoints
    @app.route('/')
    def health_check():
        return jsonify({
            "status": "healthy",
            "message": "VCP Backend API is running",
            "version": "1.0.0"
        })
    
    @app.route('/api')
    def api_info():
        return jsonify({
            "message": "VCP API v1.0.0",
            "endpoints": {
                "auth": "/api/auth",
                "users": "/api/users"
            }
        })
    
    return app

def register_blueprints(app: Flask):
    """Register all application blueprints with error handling"""
    
    # Authentication blueprint (core functionality)
    try:
        from blueprints.auth import auth_bp
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        print("✓ Auth blueprint registered successfully")
    except ImportError as e:
        print(f"Warning: Could not import auth blueprint: {e}")
    
    # Users blueprint (core functionality)
    try:
        from blueprints.users import users_bp
        app.register_blueprint(users_bp, url_prefix='/api/users')
        print("✓ Users blueprint registered successfully")
    except ImportError as e:
        print(f"Warning: Could not import users blueprint: {e}")

    # Services blueprint
    try:
        from blueprints.services import services_bp
        app.register_blueprint(services_bp, url_prefix='/api/services')
        print("✓ Services blueprint registered successfully")
    except ImportError as e:
        print(f"Warning: Could not import services blueprint: {e}")

    # Bookings blueprint
    try:
        from blueprints.bookings import bookings_bp
        app.register_blueprint(bookings_bp, url_prefix='/api/bookings')
        print("✓ Bookings blueprint registered successfully")
    except ImportError as e:
        print(f"Warning: Could not import bookings blueprint: {e}")

def register_error_handlers(app: Flask, jwt: JWTManager):
    """Register global error handlers and JWT error handlers"""
    
    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'not_found',
            'message': 'The requested resource was not found'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'error': 'internal_server_error',
            'message': 'An internal server error occurred'
        }), 500
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'error': 'bad_request',
            'message': 'Bad request - invalid data provided'
        }), 400
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'error': 'token_expired',
            'message': 'The token has expired'
        }), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'error': 'token_invalid',
            'message': 'The token is invalid'
        }), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'error': 'token_missing',
            'message': 'Authorization token is required'
        }), 401
    
    @jwt.user_identity_loader
    def user_identity_lookup(user):
        """Convert user object to JWT identity (always use string)"""
        return str(user.id) if hasattr(user, 'id') else str(user)
    
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        """Load user from JWT token identity"""
        identity = jwt_data["sub"]
        return User.find_by_id(int(identity))

if __name__ == '__main__':
    app = create_app()
    
    # Create database tables
    with app.app_context():
        db.create_all()
        print("✓ Database tables created successfully")
    
    print(f"🚀 Starting VCP Backend on port {Config.PORT}")
    print("🌐 CORS enabled for: * (all origins)")
    print(f"🗄️  Database: {Config.SQLALCHEMY_DATABASE_URI.split('@')[1] if '@' in Config.SQLALCHEMY_DATABASE_URI else 'PostgreSQL'}")
    
    app.run(
        host='0.0.0.0',
        port=Config.PORT,
        debug=Config.DEBUG
    )
