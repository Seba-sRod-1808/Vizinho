# Changelog Vizinho v2.1 - Refactorización POO

## [2.1.0] - 2025-10-29

### Added
- Custom Managers
- DashboardService para lógica de negocio
- Campos de auditoría
- Validación en property setters
- Mensajes de éxito/error en todas las vistas
- Paginación en listas
- PropietarioOAdminMixin para control de permisos

### Changed
- Refactorizado models.py siguiendo principios POO
- Simplificado views.py separando lógica de negocio
- Mejorado forms.py con mejor validación

### Removed
- Clases Vecino y Administrador (no se usaban)
- Getters/setters redundantes

### Fixed
- Typo en __str__ methods
- Import incorrecto de messages
- ProfileDetailView ahora usa get_or_create

## [2.0.0] - 2025-10-26
- Versión original estable

