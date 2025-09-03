from django.db import models
from django.contrib.auth.models import AbstractUser


# ========================
# USUARIO BASE
# ========================
class Usuario(AbstractUser):
    """
    Clase base de usuario del sistema.
    Extiende AbstractUser e incluye getters/setters para encapsulamiento.
    """
    _telefono = models.CharField(max_length=20, null=True, blank=True)

    def get_telefono(self):
        return self._telefono

    def set_telefono(self, tel):
        self._telefono = tel

    def __str__(self):
        return f"{self.username} ({self.email})"


# ========================
# VECINO
# ========================
class Vecino(Usuario):
    _direccion = models.CharField(max_length=255)
    _zona = models.CharField(max_length=100, null=True, blank=True)

    def get_direccion(self):
        return self._direccion

    def set_direccion(self, direccion):
        self._direccion = direccion

    def get_zona(self):
        return self._zona

    def set_zona(self, zona):
        self._zona = zona

    def __str__(self):
        return f"Vecino: {self.username} - {self._direccion}"


# ========================
# ADMINISTRADOR
# ========================
class Administrador(Usuario):
    _cargo = models.CharField(max_length=100, default="Administrador")

    def get_cargo(self):
        return self._cargo

    def set_cargo(self, cargo):
        self._cargo = cargo

    def __str__(self):
        return f"Administrador: {self.username} ({self._cargo})"


# ========================
# CONDOMINIO
# ========================
class Condominio(models.Model):
    _nombre = models.CharField(max_length=100)
    _ubicacion = models.CharField(max_length=200)
    _reglas = models.TextField(null=True, blank=True)

    def get_nombre(self):
        return self._nombre

    def set_nombre(self, nombre):
        self._nombre = nombre

    def get_reglas(self):
        return self._reglas

    def set_reglas(self, reglas):
        self._reglas = reglas

    def __str__(self):
        return f"Condominio: {self._nombre}"


# ========================
# REPORTE
# ========================
class Reporte(models.Model):
    ESTADOS = [
        ("Recibido", "Recibido"),
        ("EnProceso", "En proceso"),
        ("Resuelto", "Resuelto"),
    ]

    _titulo = models.CharField(max_length=200)
    _descripcion = models.TextField()
    _estado = models.CharField(max_length=20, choices=ESTADOS, default="Recibido")
    _fecha = models.DateTimeField(auto_now_add=True)
    _ubicacion = models.CharField(max_length=200)

    # Relación con Vecino (un vecino puede tener varios reportes)
    _vecino = models.ForeignKey(Vecino, on_delete=models.CASCADE, related_name="reportes")

    def get_estado(self):
        return self._estado

    def set_estado(self, estado):
        if estado in dict(self.ESTADOS):
            self._estado = estado

    def __str__(self):
        return f"Reporte: {self._titulo} ({self._estado})"
