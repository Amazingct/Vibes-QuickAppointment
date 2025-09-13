QuickAppointment - Universal Service Booking App

## Problem Statement
Target: Solo service providers (fitness trainers, tutors, barbers, consultants, therapists, etc.) who need a simple way to let clients book appointments online without phone calls or manual scheduling conflicts.

Pain Points:
- Double bookings from manual scheduling
- Constant phone interruptions during work sessions
- No easy way for clients to see available times
- Send Notifications when service get booked
- Time wasted on back-and-forth scheduling calls

## Core Features (MVP)
1. User Authentication - All users must register/login (can be both service provider AND client)
2. Service Creation - Any user can create services they offer (name, duration, price, description)
3. Service Discovery - Browse all available services from different users
4. Booking System - Any user can book services from other users
5. Unified Dashboard - Shows your offered services, bookings you've made, and bookings others made with you

## User Personas
**Alex**: Fitness trainer who also books massage therapy sessions and tutoring for their kids. Offers training services while booking other services.
**Jordan**: Freelance graphic designer who offers design consultations AND books personal training and haircuts. Both provider and client.
**Sam**: College student who tutors math and also books barber appointments. Earns money tutoring while spending on other services.

## Example Use Cases
- **Two-Way Marketplace**: Alex offers fitness training while booking massage therapy from Jordan
- **Student Economy**: Sam tutors math to earn money, then books haircuts and other services
- **Freelancer Network**: Jordan offers design consultations and books fitness training from Alex
- **Community Platform**: Everyone can both offer their skills and book services they need

## Platform Benefits
- **Network Effect**: More users = more services available AND more potential clients
- **Simplified UI**: One dashboard for everything instead of separate provider/client interfaces
- **Social Aspect**: Users can rate and review each other in both directions
- **Flexibility**: Start as a client, become a provider later (or both simultaneously)

## Technical Stack
- Frontend: React + TypeScript
- Backend: Flask + SQLAlchemy
- Database: PostgreSQL
- Authentication: JWT

## Database Schema
- users (id, email, password_hash, name, phone, bio, created_at)
- services (id, provider_id, name, duration_minutes, price, description, is_active)
- time_slots (id, provider_id, service_id, date, start_time, is_available)
- bookings (id, slot_id, client_id, created_at, status)
- notifications (id, user_id, message, is_read, created_at)

## 2-Day Development Plan
**Day 1**: Backend + Database (User auth, service CRUD, booking system, notification system)
**Day 2**: Frontend + Integration (Unified dashboard, service discovery, booking flow)

## Success Criteria
- User can register/login and create their profile
- User can create a service they offer (name, duration, price)
- User can browse and book services from other users
- User sees unified dashboard: services they offer + bookings they made + bookings others made with them
- Basic notifications when someone books your service
- No crashes, basic error handling

## Key Simplifications for 2-Day Scope
- Multi-user but single-instance deployment
- Fixed time intervals (30min, 45min, 1hr, 2hr options)
- No payment processing (price display only)
- Basic in-app notifications only (no email/SMS)
- No cancellation system (bookings are final)
- No rating/review system
- Desktop-first design