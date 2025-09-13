# 🏘️ Vizinho

**Vizinho** es una aplicación web orientada a objetos desarrollada en **Python con Django** bajo el patrón **MVC (Modelo-Vista-Controlador)**.  
Su propósito es mejorar la **gestión comunitaria** en condominios o vecindarios mediante herramientas de participación ciudadana, seguridad y transparencia.

---

## 🚀 Funcionalidades actuales (MVP)
- **Login / Logout** (usuarios con rol por defecto: `vecino`).
- **Publicaciones**: muro comunitario con CRUD de mensajes.
- **Reportes**: registro de incidencias (baches, alumbrado, etc.).
- **Multas**: consulta y pago simulado de multas.
- **Botón de pánico**: alertas de emergencia e historial.
- **Dashboard amigable**: accesible para todas las edades.

---

## 🛠️ Arquitectura
El sistema sigue los principios de **POO**:
- **Encapsulamiento**: atributos privados con `@property` para acceso seguro.
- **Herencia**: por ejemplo el modelo `Usuario` base con roles (`vecino` / `admin`).
- **Asociaciones**: relaciones entre usuarios, reportes, multas y publicaciones.

### Patrones aplicados
- **MVC**: separación clara entre lógica, vistas y plantillas.
- **SaaS Ready**: preparado para escalar a múltiples condominios.

---

##  Estructura del proyecto
-vizinho/
-│
-├── core/ # Aplicación principal
-│ ├── models.py # Modelos POO (Usuario, Reporte, Publicacion, Multa, BotonPanico)
-│ ├── views.py # Controladores (CBV con LoginRequiredMixin)
-│ ├── forms.py # Formularios (Django Forms)
-│ └── urls.py # Rutas del módulo
-│
-├── templates/ # Vistas HTML con Bootstrap 5
-│ ├── base.html # Layout general
-│ ├── dashboard.html # Panel principal
-│ ├── publicaciones/ # CRUD de publicaciones
-│ ├── reportes/ # CRUD de reportes
-│ ├── multas/ # CRUD de multas
-│ └── panico/ # Botón de pánico
-│
-└── manage.py # Script principal