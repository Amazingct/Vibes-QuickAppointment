"""
Services Blueprint - CRUD for services with search/filter/sort/pagination
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from typing import Any, Dict, List
from decimal import Decimal

from database import db, Service, User
from utils.files import upload_flask_file_to_spaces
from werkzeug.utils import secure_filename

services_bp = Blueprint('services', __name__)


def parse_sort_param(sort_param: str):
    """Parse sort parameter like 'created_at:desc' or 'price:asc'"""
    default = (Service.created_at.desc(),)
    if not sort_param:
        return default
    parts = sort_param.split(',') if ',' in sort_param else [sort_param]
    sort_columns = []
    for part in parts:
        segs = part.split(':')
        col = (segs[0] or '').strip()
        direction = (segs[1] if len(segs) > 1 else 'desc').lower().strip()
        column_attr = getattr(Service, col, None)
        if column_attr is None:
            continue
        sort_columns.append(column_attr.desc() if direction == 'desc' else column_attr.asc())
    return tuple(sort_columns) if sort_columns else default


@services_bp.route('/', methods=['GET'])
@jwt_required()
def list_services():
    """List services with filters, search, sort, and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 12, type=int), 100)
        search = (request.args.get('search') or '').strip()
        category = (request.args.get('category') or '').strip()
        username = (request.args.get('username') or '').strip()
        is_active = request.args.get('is_active')
        sort = request.args.get('sort', 'created_at:desc')

        query = Service.query

        # Active filter
        if is_active is not None:
            if str(is_active).lower() in ('true', '1', 'yes'):
                query = query.filter(Service.is_active.is_(True))
            elif str(is_active).lower() in ('false', '0', 'no'):
                query = query.filter(Service.is_active.is_(False))

        # Category filter
        if category:
            query = query.filter(Service.category == category)

        # Username filter (provider)
        if username:
            query = query.join(User).filter(User.username == username)

        # Search across name and description
        if search:
            like = f"%{search}%"
            query = query.filter(db.or_(Service.name.ilike(like), Service.description.ilike(like)))

        # Sort
        for order_clause in parse_sort_param(sort):
            query = query.order_by(order_clause)

        # Pagination
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        services = [svc.to_json() for svc in pagination.items]

        return jsonify({
            'data': {
                'services': services,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages,
                    'has_next': pagination.has_next,
                    'has_prev': pagination.has_prev
                }
            },
            'message': 'Services retrieved successfully'
        }), 200
    except Exception:
        return jsonify({
            'error': 'server_error',
            'message': 'An unexpected error occurred'
        }), 500


@services_bp.route('/', methods=['POST'])
@jwt_required()
def create_service():
    """Create a new service for the current user"""
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json() or {}

        errors = Service.validate_payload(data)
        if errors:
            return jsonify({'error': 'validation_error', 'message': 'Invalid data provided', 'details': errors}), 400

        service = Service(
            user_id=current_user_id,
            name=data['name'].strip(),
            duration_minutes=int(data['duration_minutes']),
            price=Decimal(str(data['price'])),
            description=data.get('description'),
            is_active=bool(data.get('is_active', True)),
            images=data.get('images') or [],
            category=(data.get('category') or None)
        )

        db.session.add(service)
        db.session.commit()

        return jsonify({'data': service.to_json(), 'message': 'Service created successfully'}), 201
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'server_error', 'message': 'An unexpected error occurred'}), 500


@services_bp.route('/<int:service_id>', methods=['GET'])
@jwt_required()
def get_service(service_id: int):
    try:
        service = Service.query.get(service_id)
        if not service:
            return jsonify({'error': 'service_not_found', 'message': 'Service not found'}), 404
        return jsonify({'data': service.to_json(), 'message': 'Service retrieved successfully'}), 200
    except Exception:
        return jsonify({'error': 'server_error', 'message': 'An unexpected error occurred'}), 500


@services_bp.route('/<int:service_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_service(service_id: int):
    try:
        current_user_id = int(get_jwt_identity())
        service = Service.query.get(service_id)
        if not service:
            return jsonify({'error': 'service_not_found', 'message': 'Service not found'}), 404
        if service.user_id != current_user_id:
            return jsonify({'error': 'forbidden', 'message': 'You do not have permission to update this service'}), 403

        data = request.get_json() or {}

        # Partial validation: only validate present fields
        errors: Dict[str, str] = {}
        if 'name' in data or 'duration_minutes' in data or 'price' in data or 'images' in data:
            errors = Service.validate_payload({
                'name': data.get('name', service.name),
                'duration_minutes': data.get('duration_minutes', service.duration_minutes),
                'price': data.get('price', service.price),
                'images': data.get('images', service.images),
            })
        if errors:
            return jsonify({'error': 'validation_error', 'message': 'Invalid data provided', 'details': errors}), 400

        if 'name' in data:
            service.name = data['name'].strip()
        if 'duration_minutes' in data:
            service.duration_minutes = int(data['duration_minutes'])
        if 'price' in data:
            service.price = Decimal(str(data['price']))
        if 'description' in data:
            service.description = data.get('description')
        if 'is_active' in data:
            service.is_active = bool(data.get('is_active'))
        if 'images' in data:
            service.images = data.get('images') or []
        if 'category' in data:
            service.category = data.get('category') or None

        db.session.commit()

        return jsonify({'data': service.to_json(), 'message': 'Service updated successfully'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'server_error', 'message': 'An unexpected error occurred'}), 500


@services_bp.route('/<int:service_id>', methods=['DELETE'])
@jwt_required()
def delete_service(service_id: int):
    try:
        current_user_id = int(get_jwt_identity())
        service = Service.query.get(service_id)
        if not service:
            return jsonify({'error': 'service_not_found', 'message': 'Service not found'}), 404
        if service.user_id != current_user_id:
            return jsonify({'error': 'forbidden', 'message': 'You do not have permission to delete this service'}), 403

        db.session.delete(service)
        db.session.commit()
        return jsonify({'message': 'Service deleted successfully'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'server_error', 'message': 'An unexpected error occurred'}), 500


@services_bp.route('/upload-image', methods=['POST'])
@jwt_required()
def upload_service_image():
    """Upload one or more images to Spaces and return public URL(s).

    Accepts either:
    - single file in field 'file'
    - multiple files in field 'files'
    """
    try:
        current_user_id = int(get_jwt_identity())

        # Multiple files case
        if 'files' in request.files:
            files = request.files.getlist('files')
            if not files:
                return jsonify({'error': 'invalid_request', 'message': 'No files provided'}), 400

            urls: List[str] = []
            for file in files:
                if not file or file.filename == '':
                    continue
                filename = secure_filename(file.filename)
                spaces_key = f"uploads/services/{current_user_id}/{filename}"
                public_url = upload_flask_file_to_spaces(
                    file, spaces_key, content_type=file.content_type, make_unique=True
                )
                if public_url:
                    urls.append(public_url)

            if not urls:
                return jsonify({'error': 'upload_failed', 'message': 'Failed to upload files'}), 500

            return jsonify({'data': {'urls': urls}, 'message': 'Files uploaded successfully'}), 201

        # Single file case
        if 'file' not in request.files:
            return jsonify({'error': 'invalid_request', 'message': 'No file in request'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'invalid_request', 'message': 'No file selected'}), 400

        filename = secure_filename(file.filename)
        spaces_key = f"uploads/services/{current_user_id}/{filename}"
        public_url = upload_flask_file_to_spaces(
            file, spaces_key, content_type=file.content_type, make_unique=True
        )

        if public_url:
            return jsonify({'data': {'url': public_url}, 'message': 'Upload successful'}), 201
        else:
            return jsonify({'error': 'upload_failed', 'message': 'Upload failed'}), 500

    except Exception:
        return jsonify({'error': 'server_error', 'message': 'An unexpected error occurred'}), 500



@services_bp.route('/categories', methods=['GET'])
@jwt_required()
def list_categories():
    """Return unique list of service categories (non-null, non-empty)."""
    try:
        categories_query = (
            db.session.query(Service.category)
            .filter(Service.category.isnot(None))
            .filter(db.func.trim(Service.category) != '')
            .distinct()
            .order_by(Service.category.asc())
        )

        categories = [row[0] for row in categories_query.all()]

        return jsonify({
            'data': {
                'categories': categories,
                'count': len(categories)
            },
            'message': 'Categories retrieved successfully'
        }), 200
    except Exception:
        return jsonify({'error': 'server_error', 'message': 'An unexpected error occurred'}), 500


# Accept requests without trailing slash to avoid 308 redirects (CORS preflight friendly)
@services_bp.route('', methods=['GET'])
@jwt_required()
def list_services_no_slash():
    return list_services()


@services_bp.route('', methods=['POST'])
@jwt_required()
def create_service_no_slash():
    return create_service()
