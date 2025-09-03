# Vizinho

**Vizinho** es una aplicación web orientada a objetos desarrollada en **Python/Django**, diseñada para la gestión de condominios y comunidades vecinales.  
El proyecto sigue estrictamente el paradigma **POO (Programación Orientada a Objetos)** con herencia, encapsulamiento, composición y MVC/MVT.

---

## Características principales

- **Reportes comunitarios**
- **Publicaciones** para vecinos.
- **Módulo de objetos perdidos/encontrados**.
- **Reservas de áreas comunes**.
- **Gestión de multas**
- **Botón de pánico** para emergencias.
- **Registro de visitas**.
- **Roles de usuario:** Vecino y Administrador.
- **Configuración de condominio** (solo administradores).

---

## Estado actual (v0.1.0)

- Proyecto Django inicializado (`vizinho`).
- App principal `core` creada.
- Configuración de `AUTH_USER_MODEL` con clase `Usuario`.
- Modelos base implementados:
  - `Usuario`, `Vecino`, `Administrador`
  - `Condominio`
  - `Reporte`

---

## Workflow de ramas

- **main** → rama estable (producción).  
- **develop** → rama de integración.  
- **feature/** → nuevas funcionalidades.  
- **bugfix/** → correcciones en develop.  
- **hotfix/** → correcciones urgentes en main.  

 Antes de contribuir, asegúrate de trabajar en una rama `feature/nombre` y abrir un Pull Request hacia `develop`.

---

## Instalación y ejecución

1. Clonar el repo:
   ```bash
   git clone https://github.com/Seba-sRod-1808/Vizinho.git
   cd Vizinho
