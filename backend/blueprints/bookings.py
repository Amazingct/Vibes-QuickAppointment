"""
Bookings Blueprint - CRUD for bookings
Allows clients to create booking requests and providers to manage them
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from typing import Dict, Any
from datetime import datetime

from database import db, Booking, Service, User
from utils.mail import create_mail_service, EmailRecipient, EmailContent

bookings_bp = Blueprint('bookings', __name__)


@bookings_bp.route('/', methods=['GET'])
@jwt_required()
def list_bookings():
    """List bookings for current user (as client or provider), with filters and pagination"""
    try:
        current_user_id = int(get_jwt_identity())
        role = (request.args.get('role') or 'provider').lower()  # provider|client
        status = (request.args.get('status') or '').strip().lower()
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 100)

        query = Booking.query
        if role == 'client':
            query = query.filter(Booking.client_id == current_user_id)
        else:
            query = query.filter(Booking.provider_id == current_user_id)

        if status:
            query = query.filter(Booking.status == status)

        query = query.order_by(Booking.time_booked.asc())

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        data = [b.to_json() for b in pagination.items]

        return jsonify({
            'data': {
                'bookings': data,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages,
                    'has_next': pagination.has_next,
                    'has_prev': pagination.has_prev
                }
            },
            'message': 'Bookings retrieved successfully'
        }), 200
    except Exception:
        return jsonify({'error': 'server_error', 'message': 'An unexpected error occurred'}), 500


@bookings_bp.route('/', methods=['POST'])
@jwt_required()
def create_booking():
    """Create a new booking as the current user (client)"""
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json() or {}

        errors = Booking.validate_payload(data)
        if errors:
            return jsonify({'error': 'validation_error', 'message': 'Invalid data provided', 'details': errors}), 400

        service = Service.query.get(int(data['service_id']))
        if not service:
            return jsonify({'error': 'service_not_found', 'message': 'Service not found'}), 404

        # provider is the owner of the service
        provider_id = service.user_id

        time_booked = datetime.fromisoformat(str(data['time_booked']).replace('Z', '+00:00'))

        booking = Booking(
            client_id=current_user_id,
            service_id=service.id,
            provider_id=provider_id,
            time_booked=time_booked,
            status=(data.get('status') or 'pending').lower()
        )

        db.session.add(booking)
        db.session.commit()

        # Send email notifications (best-effort)
        try:
            mail_service = create_mail_service()
            if mail_service:
                # Reload with relationships
                db.session.refresh(booking)
                provider = User.find_by_id(booking.provider_id)
                client = User.find_by_id(booking.client_id)
                service_obj = Service.query.get(booking.service_id)

                when_str = booking.time_booked.isoformat() if booking.time_booked else ''
                service_name = service_obj.name if service_obj else 'a service'

                # Notify provider
                if provider and provider.email:
                    mail_service.send_email(
                        [EmailRecipient(email=provider.email, name=f"{provider.first_name} {provider.last_name}")],
                        EmailContent(
                            subject=f"New booking request for {service_name}",
                            text=f"You have a new booking request on {when_str} from {client.first_name if client else 'a client'}.",
                            html=f"<p>You have a new booking request for <strong>{service_name}</strong> on <strong>{when_str}</strong> from <strong>{(client.first_name + ' ' + client.last_name) if client else 'a client'}</strong>.</p>"
                        )
                    )

                # Notify client
                if client and client.email:
                    mail_service.send_email(
                        [EmailRecipient(email=client.email, name=f"{client.first_name} {client.last_name}")],
                        EmailContent(
                            subject=f"Your booking request for {service_name} was submitted",
                            text=f"Your booking request on {when_str} has been submitted to the provider.",
                            html=f"<p>Your booking request for <strong>{service_name}</strong> on <strong>{when_str}</strong> has been submitted to the provider.</p>"
                        )
                    )
        except Exception:
            pass  # Best-effort email; do not fail the request

        return jsonify({'data': booking.to_json(), 'message': 'Booking created successfully'}), 201
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'server_error', 'message': 'An unexpected error occurred'}), 500


@bookings_bp.route('/<int:booking_id>', methods=['GET'])
@jwt_required()
def get_booking(booking_id: int):
    try:
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'booking_not_found', 'message': 'Booking not found'}), 404
        return jsonify({'data': booking.to_json(), 'message': 'Booking retrieved successfully'}), 200
    except Exception:
        return jsonify({'error': 'server_error', 'message': 'An unexpected error occurred'}), 500


@bookings_bp.route('/<int:booking_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_booking(booking_id: int):
    """Update a booking. Provider can accept/reject/cancel; client can cancel own pending/accepted."""
    try:
        current_user_id = int(get_jwt_identity())
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'booking_not_found', 'message': 'Booking not found'}), 404

        data = request.get_json() or {}

        # Authorization: provider or client owns the booking
        if current_user_id not in (booking.provider_id, booking.client_id):
            return jsonify({'error': 'forbidden', 'message': 'You do not have permission to update this booking'}), 403

        errors = Booking.validate_payload(data, for_update=True)
        if errors:
            return jsonify({'error': 'validation_error', 'message': 'Invalid data provided', 'details': errors}), 400

        old_status = booking.status
        old_time = booking.time_booked

        if 'status' in data:
            booking.status = (data['status'] or 'pending').lower()

        if 'time_booked' in data and data.get('time_booked'):
            booking.time_booked = datetime.fromisoformat(str(data['time_booked']).replace('Z', '+00:00'))

        db.session.commit()

        # Send email notifications (best-effort)
        try:
            mail_service = create_mail_service()
            if mail_service:
                db.session.refresh(booking)
                provider = User.find_by_id(booking.provider_id)
                client = User.find_by_id(booking.client_id)
                service_obj = Service.query.get(booking.service_id)

                when_str = booking.time_booked.isoformat() if booking.time_booked else ''
                service_name = service_obj.name if service_obj else 'a service'

                # Notify client of status/time changes
                if client and client.email and (booking.status != old_status or booking.time_booked != old_time):
                  mail_service.send_email(
                      [EmailRecipient(email=client.email, name=f"{client.first_name} {client.last_name}")],
                      EmailContent(
                          subject=f"Your booking for {service_name} was updated",
                          text=f"Status: {booking.status}. Time: {when_str}",
                          html=f"<p>Your booking for <strong>{service_name}</strong> was updated.</p><p><strong>Status:</strong> {booking.status}<br/><strong>Time:</strong> {when_str}</p>"
                      )
                  )

                # Notify provider of client reschedule/cancel, or provider actions (optional)
                if provider and provider.email and (booking.status != old_status or booking.time_booked != old_time):
                  mail_service.send_email(
                      [EmailRecipient(email=provider.email, name=f"{provider.first_name} {provider.last_name}")],
                      EmailContent(
                          subject=f"Booking for {service_name} was updated",
                          text=f"Status: {booking.status}. Time: {when_str}",
                          html=f"<p>A booking for <strong>{service_name}</strong> was updated.</p><p><strong>Status:</strong> {booking.status}<br/><strong>Time:</strong> {when_str}</p>"
                      )
                  )
        except Exception:
            pass  # Best-effort email; do not fail the request

        return jsonify({'data': booking.to_json(), 'message': 'Booking updated successfully'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'server_error', 'message': 'An unexpected error occurred'}), 500


@bookings_bp.route('/<int:booking_id>', methods=['DELETE'])
@jwt_required()
def delete_booking(booking_id: int):
    try:
        current_user_id = int(get_jwt_identity())
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'booking_not_found', 'message': 'Booking not found'}), 404

        if current_user_id not in (booking.provider_id, booking.client_id):
            return jsonify({'error': 'forbidden', 'message': 'You do not have permission to delete this booking'}), 403

        db.session.delete(booking)
        db.session.commit()
        return jsonify({'message': 'Booking deleted successfully'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'server_error', 'message': 'An unexpected error occurred'}), 500


# Non-trailing-slash compatibility to avoid redirects
@bookings_bp.route('', methods=['GET'])
@jwt_required()
def list_bookings_no_slash():
    return list_bookings()

@bookings_bp.route('', methods=['POST'])
@jwt_required()
def create_booking_no_slash():
    return create_booking()


@bookings_bp.route('/slots', methods=['GET'])
@jwt_required()
def get_booked_slots():
    """Return booked slots (pending and accepted) for given filters.

    Query params:
    - service_id (optional)
    - provider_id (optional)
    - start (optional ISO datetime)
    - end (optional ISO datetime)
    """
    try:
        # Filters
        service_id = request.args.get('service_id', type=int)
        provider_id = request.args.get('provider_id', type=int)
        start = request.args.get('start')
        end = request.args.get('end')

        query = Booking.query.filter(Booking.status.in_(['pending', 'accepted']))

        if service_id:
            query = query.filter(Booking.service_id == service_id)
        if provider_id:
            query = query.filter(Booking.provider_id == provider_id)

        if start:
            try:
                start_dt = datetime.fromisoformat(str(start).replace('Z', '+00:00'))
                query = query.filter(Booking.time_booked >= start_dt)
            except Exception:
                return jsonify({'error': 'validation_error', 'message': 'Invalid start datetime'}), 400

        if end:
            try:
                end_dt = datetime.fromisoformat(str(end).replace('Z', '+00:00'))
                query = query.filter(Booking.time_booked <= end_dt)
            except Exception:
                return jsonify({'error': 'validation_error', 'message': 'Invalid end datetime'}), 400

        slots = query.order_by(Booking.time_booked.asc()).all()

        data = [
            {
                'booking_id': b.id,
                'service_id': b.service_id,
                'provider_id': b.provider_id,
                'time_booked': b.time_booked.isoformat(),
                'status': b.status
            }
            for b in slots
        ]

        return jsonify({'data': {'slots': data, 'count': len(data)}, 'message': 'Booked slots retrieved successfully'}), 200
    except Exception:
        return jsonify({'error': 'server_error', 'message': 'An unexpected error occurred'}), 500


