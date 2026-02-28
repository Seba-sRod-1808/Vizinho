# Vizinho - PRD (Product Requirements Document)

## Original Problem Statement
Build a production-ready residential community management platform (Vizinho) as a PWA + React Native mobile app. Migrate from Django demo to FastAPI + MongoDB + React. Support two roles: Vecino and Admin. All UI in Spanish.

## Architecture
- **Backend**: FastAPI + MongoDB (motor async driver) + WebSocket
- **PWA Frontend**: React.js + Tailwind CSS (mobile-first responsive)
- **Mobile App**: React Native (Expo SDK 52) - iOS & Android
- **Auth**: JWT tokens (bcrypt, SecureStore for native)
- **Images**: Cloudinary (Cloud: dfclhvrwb)
- **Real-time**: WebSocket notifications
- **Database**: MongoDB with 12+ indexes

## What's Been Implemented (Feb 28, 2026)

### Backend (FastAPI)
- 35+ API endpoints with JWT auth
- Encuestas/Votaciones system (create, vote, close, delete)
- WebSocket real-time notifications
- Cloudinary signed upload signatures
- MongoDB with proper indexing
- Role-based access control (vecino/admin)

### PWA (React + Tailwind)
- 11 pages: Login, Feed, Reportes, Encuestas, Multas, Objetos Perdidos, Areas Comunes, Perfil, Admin Dashboard, Notificaciones
- Enhanced mobile UX: bottom nav with active indicators, side drawer with animations, touch feedback, haptic vibrations, install prompt, page transitions
- Cloudinary image upload on posts, reports, lost items, profile photos
- PWA manifest for standalone install
- Desktop sidebar layout
- Spanish UI throughout

### React Native (Expo)
- Complete project at `/app/vizinho-mobile/`
- 10 screens: Login, Feed, Reportes, Encuestas, Areas, Perfil, Multas, Objetos Perdidos, Notificaciones, Admin
- React Navigation (bottom tabs + native stack)
- SecureStore for JWT tokens
- Pull-to-refresh on all lists
- Shared API with PWA backend
- Design tokens (colors, spacing, radius)
- Dependencies installed and ready for `npx expo start`

## Testing Results
- Backend: 100% (34/34 tests passed across 3 iterations)
- Frontend: 95-100% (drawer animation minor issue, all core flows working)

## Prioritized Backlog
### P0 - None remaining

### P1
- Service Worker for offline caching (PWA)
- Push notifications via FCM/APNs (React Native)
- Password reset flow
- Token refresh mechanism

### P2
- Biometric auth (React Native)
- Image picker integration (React Native - expo-image-picker configured)
- Rate limiting (backend)
- API versioning (/api/v1/)
- Audit logging

### P3
- Celery background workers
- CDN caching strategy
- Resident directory with privacy controls
- Content moderation tools
- Financial reports export
- Dark mode theme
