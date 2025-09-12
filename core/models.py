from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver


# ========================
# USUARIO BASE
# ========================
class Usuario(AbstractUser):
    """
    Clase base de usuario del sistema.
    Extiende AbstractUser e incluye getters/setters para encapsulamiento.
    """
    _telefono = models.CharField(max_length=20, null=True, blank=True)

    # Getters/Setters
    def get_telefono(self):
        return self._telefono

    def set_telefono(self, tel):
        self._telefono = tel

    # decorador property para acceso directo en plantillas
    @property
    def telefono(self):
        return self._telefono

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

    @property
    def direccion(self):
        return self._direccion

    @property
    def zona(self):
        return self._zona

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

    @property
    def cargo(self):
        return self._cargo

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

    @property
    def nombre(self):
        return self._nombre

    @property
    def ubicacion(self):
        return self._ubicacion

    @property
    def reglas(self):
        return self._reglas

    def __str__(self):
        return f"Condominio: {self._nombre}"

# ========================
# PUBLICACION
# ========================
class Publicacion(models.Model):
    _titulo = models.CharField(max_length=200)
    _contenido = models.TextField()
    _fecha = models.DateTimeField(auto_now_add=True)
    _vecino = models.ForeignKey(Vecino, on_delete=models.CASCADE, related_name="publicaciones")
    
    @property
    def titulo(self):
        return self._titulo

    @property
    def contenido(self):
        return self._contenido

    @property
    def fecha(self):
        return self._fecha

    @property
    def vecino(self):
        return self._vecino
    
    def _str_(self):
        return f"{self._titulo} ({self._vecino.username})"
    

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

    _vecino = models.ForeignKey(Vecino, on_delete=models.CASCADE, related_name="reportes")

    def get_estado(self):
        return self._estado

    def set_estado(self, estado):
        if estado in dict(self.ESTADOS):
            self._estado = estado

    # Properties publicas para plantillas, se utiliza el decorador property para evitar conflictos con el campo
    @property
    def titulo(self):
        return self._titulo

    @property
    def descripcion(self):
        return self._descripcion

    @property
    def estado(self):
        return self._estado

    @property
    def fecha(self):
        return self._fecha

    @property
    def ubicacion(self):
        return self._ubicacion

    def __str__(self):
        return f"Reporte: {self._titulo} ({self._estado})"

# ========================
# PERFIL DE USUARIO
# ========================
class PerfilUsuario(models.Model):
    _usuario = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    _foto = models.ImageField(upload_to="perfiles/", null=True, blank=True)
    _bio = models.TextField(null=True, blank=True)

    @property
    def usuario(self):
        return self._usuario

    @property
    def foto(self):
        return self._foto

    @property
    def bio(self):
        return self._bio

    def _str_(self):
        return f"Perfil de {self._usuario.username}"

# Crear perfil automático al crear usuario
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def crear_perfil(sender, instance, created, **kwargs):
    if created:
        PerfilUsuario.objects.create(_usuario=instance)

# ========================
# MULTAS
# ========================

class Multa(models.Model):
    ESTADOS = [
        ("Pendiente", "Pendiente"),
        ("Pagada", "Pagada"),
    ]

    _monto = models.FloatField()
    _motivo = models.CharField(max_length=255)
    _estado = models.CharField(max_length=50, choices=ESTADOS, default="Pendiente")
    _fecha = models.DateTimeField(auto_now_add=True)
    _vecino = models.ForeignKey(Vecino, on_delete=models.CASCADE, related_name="multas")

 # DECORADORES PARA MANTENER ENCAPSULAMIENTO
    @property
    def monto(self):
        return self._monto

    @property
    def motivo(self):
        return self._motivo

    @property
    def estado(self):
        return self._estado

    @property
    def fecha(self):
        return self._fecha

    @property
    def vecino(self):
        return self._vecino

    def pagar(self):
        self._estado = "Pagada"
        self.save()

    def __str__(self):
        return f"Multa de {self._vecino.username}: {self._motivo} ({self._estado})"

# ========================
# BOTON DE PANICO
# ========================

class BotonPanico(models.Model):
    _usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="alertas_panico")
    _mensaje = models.CharField(max_length=255, default="Alerta de pánico activada")
    _fecha = models.DateTimeField(auto_now_add=True)
    _activo = models.BooleanField(default=True)

    @property
    def usuario(self):
        return self._usuario

    @property
    def mensaje(self):
        return self._mensaje

    @property
    def fecha(self):
        return self._fecha

    @property
    def activo(self):
        return self._activo

    def desactivar(self):
        self._activo = False
        self.save()

    def __str(self):
        return f"Alerta de {self._usuario.username} - {self._fecha}"
