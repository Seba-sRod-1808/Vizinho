# 🏘️ Vizinho — Sistema de Gestión Comunitaria

**Versión:** v2.0  
**Última actualización:** 26 de octubre de 2025  
**Estado:** Estable y funcional  
**Framework:** Django 5.2.3  
**Lenguaje:** Python 3.13  
**Paradigma:** Programación Orientada a Objetos

---

## ¿Qué es Vizinho?

**Vizinho** es un sistema web diseñado para mejorar la convivencia y la gestión de comunidades, condominios o vecindarios.  
Permite a los vecinos comunicarse, reportar incidencias, pagar multas, recuperar objetos perdidos y activar un botón de pánico en casos de emergencia.  

---

## 🚀 Características principales

### 👥 Roles de usuario
| Rol | Permisos |
|------|-----------|
| **Vecino** | Crear reportes, pagar multas, publicar, activar botón de pánico, subir objetos perdidos |
| **Administrador** | CRUD completo de usuarios, reportes, multas, objetos perdidos y alertas de pánico |
| **Superusuario** | Acceso total al panel de Django admin |

---

### 🧩 Módulos del sistema
- **Autenticación** con control de roles.
- **Publicaciones comunitarias** con imágenes y descripciones.
- **Reportes de incidencias** (baches, alumbrado, basura, etc.).
- **Multas** con registro, edición y pago simulado.
- **Objetos perdidos** con soporte para imágenes.
- **Botón de pánico** con registro de alertas y panel de control para administradores.
- **Dashboard personalizado** según el rol del usuario.

---

## ⚙️ Instalación

### 🔧 Requisitos previos
- Python 3.13 o superior  
- Git  
- pip y venv  
- PostgreSQL o SQLite  

---

### 🖥️ Clonación del repositorio
```bash
git clone https://github.com/Seba-sRod-1808/Vizinho.git
cd Vizinho
```
## Crea un entorno virtual
```python
python -m venv venv
source venv/Scripts/activate     # En Windows
# o
source venv/bin/activate         # En sistemas basados en UNIX
```
## Instala las dependencias
```powershell
pip install -r requirements.txt
```
## Aplica las migraciones necesarias

```powershell
python manage.py makemigrations
python manage.py migrate
```

## Crea un superusurario, recuerda usar un usuario y contraseña que recuerdes.
```powershell
python manage.py createsuperuser
```

## Corre la aplicacion en un entorno local
```powershell
python manage.py runserver
```
## En tu navegador, accede a [http://127.0.0.1:8000/]
