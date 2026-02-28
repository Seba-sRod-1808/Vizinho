# Vizinho - PRD (Product Requirements Document)

## Original Problem Statement
Build a production-ready residential community management platform (Vizinho) as a PWA. Migrate from Django demo to FastAPI + MongoDB + React. Support two roles: Vecino (resident) and Administrador. All UI in Spanish.

## Architecture
- **Backend**: FastAPI + MongoDB (motor async driver)
- **Frontend**: React.js + Tailwind CSS (PWA mobile-first)
- **Auth**: JWT tokens (bcrypt password hashing)
- **Real-time**: WebSocket notifications
- **Images**: Cloudinary integration (configured, needs API keys)
- **Database**: MongoDB with indexes for performance

## User Personas
1. **Vecino (Resident)**: Views feed, creates reports/posts, reports lost items, pays fines, activates panic button, makes reservations
2. **Administrador**: All vecino capabilities + manage users, create fines, update report statuses, deactivate panic alerts, create common areas, view dashboard stats

## Core Requirements (Implemented)
- [x] JWT Authentication (login/register)
- [x] Community Feed (Mural) - create/delete posts
- [x] Incident Reports - CRUD + status workflow (Recibido → EnProceso → Resuelto)
- [x] Fines Management - create (admin), view, pay (vecino)
- [x] Lost & Found - create, mark as found
- [x] Panic Button - activate with confirmation, admin notification
- [x] Common Areas & Reservations - view areas, make reservations
- [x] Profile Management - edit name, phone, bio
- [x] Admin Dashboard - stats overview, user management, multa creation
- [x] Notifications Center - real-time via WebSocket
- [x] Role-based Access Control (vecino/admin)
- [x] Mobile-first responsive design with bottom navigation
- [x] Desktop sidebar layout
- [x] All UI in Spanish

## What's Been Implemented (Feb 28, 2026)
- Complete FastAPI backend with 30+ API endpoints
- MongoDB models with proper indexing
- JWT auth with token refresh
- WebSocket real-time notifications
- Full React PWA frontend with 11 pages
- Mobile-first design with Tailwind CSS
- Admin dashboard with 8 stat cards
- Seed data (admin + vecino1 demo accounts)
- **Cloudinary image upload integration** (Cloud Name: dfclhvrwb) - for posts, reports, lost items, profile photos
- **Encuestas/Votaciones system** - create polls, vote, close, delete, real-time vote counting with percentages

## Testing Results
- Backend: 100% (34/34 tests passed)
- Frontend: 99% (minor mobile nav issue only)

## Prioritized Backlog
### P0 (Critical)
- None remaining

### P1 (High)
- Cloudinary API keys configuration for image uploads
- Password reset flow
- Token refresh mechanism

### P2 (Medium)
- Biometric authentication
- Offline-aware behavior (service worker)
- Push notification integration (FCM/APNs)
- Audit logging
- Rate limiting
- API versioning (/api/v1/)

### P3 (Nice to have)
- Celery background workers
- CDN caching strategy
- Database indexing optimization for 10k+ users
- Privacy-aware resident directory
- Content moderation tools
- Financial reports export
