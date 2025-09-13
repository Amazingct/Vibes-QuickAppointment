"""
Users Blueprint - User management endpoints
Handles user-related API endpoints for profile management
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, User, Service
from typing import Dict, Any

# Create blueprint
users_bp = Blueprint('users', __name__)

@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user's profile"""
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
            'message': 'Profile retrieved successfully'
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': 'server_error',
            'message': 'An unexpected error occurred'
        }), 500

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user's profile"""
    try:
        current_user_id = get_jwt_identity()
        user = User.find_by_id(int(current_user_id))
        
        if not user:
            return jsonify({
                'error': 'user_not_found',
                'message': 'User not found'
            }), 404
        
        # Get JSON data
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'invalid_request',
                'message': 'Request must contain JSON data'
            }), 400
        
        # Validate and update allowed fields
        errors = {}
        
        if 'first_name' in data:
            first_name = data['first_name'].strip()
            if len(first_name) < 2:
                errors['first_name'] = "First name must be at least 2 characters long"
            elif len(first_name) > 50:
                errors['first_name'] = "First name must be less than 50 characters"
            else:
                user.first_name = first_name
        
        if 'last_name' in data:
            last_name = data['last_name'].strip()
            if len(last_name) < 2:
                errors['last_name'] = "Last name must be at least 2 characters long"
            elif len(last_name) > 50:
                errors['last_name'] = "Last name must be less than 50 characters"
            else:
                user.last_name = last_name
        
        if 'avatar_url' in data:
            avatar_url = data['avatar_url'].strip() if data['avatar_url'] else None
            user.avatar_url = avatar_url

        if 'username' in data:
            username = data['username'].strip().lower()
            if len(username) < 3 or len(username) > 20 or not username.replace('_', '').replace('-', '').isalnum():
                errors['username'] = "Invalid username"
            else:
                # Ensure unique
                existing = User.find_by_username(username)
                if existing and existing.id != user.id:
                    errors['username'] = 'Username already taken'
                else:
                    user.username = username
        
        if errors:
            return jsonify({
                'error': 'validation_error',
                'message': 'Please fix the following errors',
                'details': errors
            }), 400
        
        # Save changes
        db.session.commit()
        
        return jsonify({
            'data': user.to_json(),
            'message': 'Profile updated successfully'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'server_error',
            'message': 'An unexpected error occurred'
        }), 500

@users_bp.route('/', methods=['GET'])
@jwt_required()
def list_users():
    """List users with pagination (admin functionality)"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 100)  # Max 100 per page
        search = request.args.get('search', '').strip()
        
        # Build query
        query = User.query.filter_by(is_active=True)
        
        # Add search filter if provided
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                db.or_(
                    User.username.ilike(search_filter),
                    User.first_name.ilike(search_filter),
                    User.last_name.ilike(search_filter),
                    User.email.ilike(search_filter)
                )
            )
        
        # Order by creation date (newest first)
        query = query.order_by(User.created_at.desc())
        
        # Paginate
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        users = [user.to_json() for user in pagination.items]
        
        return jsonify({
            'data': {
                'users': users,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages,
                    'has_next': pagination.has_next,
                    'has_prev': pagination.has_prev
                }
            },
            'message': 'Users retrieved successfully'
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': 'server_error',
            'message': 'An unexpected error occurred'
        }), 500

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id: int):
    """Get specific user by ID"""
    try:
        user = User.find_by_id(user_id)
        
        if not user or not user.is_active:
            return jsonify({
                'error': 'user_not_found',
                'message': 'User not found'
            }), 404
        
        return jsonify({
            'data': user.to_json(),
            'message': 'User retrieved successfully'
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': 'server_error',
            'message': 'An unexpected error occurred'
        }), 500


@users_bp.route('/with-services', methods=['GET'])
@jwt_required()
def list_users_with_services():
    """List users who have at least one service (with pagination and optional search)."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 100)
        search = (request.args.get('search') or '').strip()

        # Join with Service to ensure at least one related service
        query = User.query.join(Service).filter(User.is_active.is_(True))

        if search:
            like = f"%{search}%"
            query = query.filter(
                db.or_(
                    User.username.ilike(like),
                    User.first_name.ilike(like),
                    User.last_name.ilike(like),
                    User.email.ilike(like)
                )
            )

        # Group by to avoid duplicate users due to join
        query = query.group_by(User.id).order_by(User.created_at.desc())

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        users = [user.to_json() for user in pagination.items]

        return jsonify({
            'data': {
                'users': users,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages,
                    'has_next': pagination.has_next,
                    'has_prev': pagination.has_prev
                }
            },
            'message': 'Users with services retrieved successfully'
        }), 200
    except Exception as e:
        return jsonify({
            'error': 'server_error',
            'message': 'An unexpected error occurred'
        }), 500
