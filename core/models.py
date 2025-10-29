from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


# ========================
# CUSTOM MANAGERS
# ========================

class ReporteManager(models.Manager):    
    def pendientes(self):
        return self.filter(_estado="Recibido")
    
    def en_proceso(self):
        return self.filter(_estado="EnProceso")
    
    def resueltos(self):
        return self.filter(_estado="Resuelto")
    
    def del_usuario(self, usuario):
        return self.filter(_vecino=usuario)


class MultaManager(models.Manager):    
    def pendientes(self):
        return self.filter(_estado="Pendiente")
    
    def pagadas(self):
        return self.filter(_estado="Pagada")
    
    def del_usuario(self, usuario):
        return self.filter(_vecino=usuario)
    
    def total_pendiente_usuario(self, usuario):
        resultado = self.filter(
            _vecino=usuario, 
            _estado="Pendiente"
        ).aggregate(total=models.Sum('_monto'))
        return resultado['total'] or 0


# ========================
# USUARIO BASE
# ========================

class Usuario(AbstractUser):
    ROLES = [
        ("vecino", "Vecino"),
        ("admin", "Administrador"),
    ]

    _telefono = models.CharField(max_length=20, null=True, blank=True)
    _rol = models.CharField(max_length=20, choices=ROLES, default="vecino")

    # ===== PROPERTIES CON VALIDACIÓN =====
    
    @property
    def telefono(self):
        return self._telefono

    @telefono.setter
    def telefono(self, value):
        if value and len(value) < 8:
            raise ValidationError("El teléfono debe tener al menos 8 dígitos")
        self._telefono = value

    @property
    def rol(self):
        return self._rol

    @rol.setter
    def rol(self, value):
        roles_validos = dict(self.ROLES).keys()
        if value not in roles_validos:
            raise ValidationError(
                f"Rol inválido: '{value}'. Opciones válidas: {list(roles_validos)}"
            )
        self._rol = value
    
    # ===== MÉTODOS DE UTILIDAD =====
    
    def es_administrador(self):
        return self._rol == "admin" or self.is_superuser
    
    def puede_editar(self, objeto):
        # Administradores pueden editar todo
        if self.es_administrador():
            return True
        
        # Verifica si el objeto pertenece al usuario
        if hasattr(objeto, '_vecino'):
            return objeto._vecino == self
        elif hasattr(objeto, '_usuario'):
            return objeto._usuario == self
        
        return False

    def __str__(self):
        return f"{self.username} ({self.get_rol_display()})"


# ========================
# CONDOMINIO
# ========================

class Condominio(models.Model):    
    _nombre = models.CharField(max_length=100)
    _ubicacion = models.CharField(max_length=200)
    _reglas = models.TextField(null=True, blank=True)

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
    _vecino = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="publicaciones")
    
    class Meta:
        ordering = ['-_fecha']
        verbose_name_plural = "Publicaciones"
    
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
    
    def puede_editar_usuario(self, usuario):
        return usuario.es_administrador()
    
    def __str__(self):  # ✅ Corregido: era _str_
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
    _vecino = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="reportes")

    objects = ReporteManager()

    # ===== PROPERTIES =====
    
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
    
    @property
    def vecino(self):
        return self._vecino

    # ===== MÉTODOS DE TRANSICIÓN DE ESTADO =====
    
    def marcar_en_proceso(self):
        if self._estado != "Recibido":
            raise ValidationError("Solo reportes recibidos pueden pasar a proceso")
        self._estado = "EnProceso"
        self.save()
    
    def marcar_resuelto(self):
        if self._estado == "Resuelto":
            raise ValidationError("Este reporte ya está resuelto")
        self._estado = "Resuelto"
        self.save()
    
    def puede_editar_usuario(self, usuario):
        return self._vecino == usuario or usuario.es_administrador()

    def __str__(self):
        return f"Reporte: {self._titulo} ({self.get_estado_display()})"


# ========================
# PERFIL DE USUARIO
# ========================

class PerfilUsuario(models.Model):
    _usuario = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='perfil')
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
    
    @bio.setter
    def bio(self, value):
        if value and len(value) > 500:
            raise ValidationError("La biografía no puede exceder 500 caracteres")
        self._bio = value

    def __str__(self):  # ✅ Corregido: era _str_
        return f"Perfil de {self._usuario.username}"


# Signal para crear perfil automáticamente
@receiver(post_save, sender=Usuario)
def crear_perfil_usuario(sender, instance, created, **kwargs):
    """Crea automáticamente un perfil cuando se crea un usuario."""
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
    _fecha_pago = models.DateTimeField(null=True, blank=True)  # ✅ Nuevo campo
    _vecino = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="multas")

    objects = MultaManager()

    # ===== PROPERTIES =====
    
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
    def fecha_pago(self):
        return self._fecha_pago

    @property
    def vecino(self):
        return self._vecino
    
    @property
    def esta_pendiente(self):
        """Verifica si la multa está pendiente de pago."""
        return self._estado == "Pendiente"

    # ===== MÉTODOS DE NEGOCIO =====
    
    def pagar(self, metodo_pago=None, transaccion_id=None):
        if self._estado == "Pagada":
            raise ValidationError("Esta multa ya fue pagada")
        
        self._estado = "Pagada"
        self._fecha_pago = timezone.now()
        self.save()
        
        # Hook para extensiones futuras (notificaciones, logging, etc.)
        self._post_pago(metodo_pago, transaccion_id)
    
    def _post_pago(self, metodo_pago, transaccion_id):
        """
        Hook para acciones post-pago.
        """
        pass
    
    def puede_pagar_usuario(self, usuario):
        return self._vecino == usuario and self.esta_pendiente

    def __str__(self):
        return f"Multa de {self._vecino.username}: {self._motivo} ({self.get_estado_display()})"


# ========================
# BOTON DE PANICO
# ========================

class BotonPanico(models.Model):
    _usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="alertas_panico")
    _mensaje = models.CharField(max_length=255, default="Alerta de pánico activada")
    _fecha = models.DateTimeField(auto_now_add=True)
    _activo = models.BooleanField(default=True)
    _fecha_desactivacion = models.DateTimeField(null=True, blank=True)  # ✅ Nuevo campo
    _desactivado_por = models.ForeignKey(  # ✅ Nuevo campo
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="alertas_desactivadas"
    )

    class Meta:
        ordering = ['-_fecha']
        verbose_name_plural = "Botones de Pánico"

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
    
    @property
    def fecha_desactivacion(self):
        return self._fecha_desactivacion

    def desactivar(self, usuario_admin=None):
        if not self._activo:
            raise ValidationError("Esta alerta ya está desactivada")
        
        if usuario_admin and not usuario_admin.es_administrador():
            raise ValidationError("Solo administradores pueden desactivar alertas")
        
        self._activo = False
        self._fecha_desactivacion = timezone.now()
        self._desactivado_por = usuario_admin
        self.save()

    def __str__(self):
        estado = "ACTIVA" if self._activo else "Desactivada"
        return f"[{estado}] Alerta de {self._usuario.username} - {self._fecha}"


# ========================
# OBJETOS PERDIDOS
# ========================

class ObjetoPerdido(models.Model):
    _titulo = models.CharField(max_length=100)
    _descripcion = models.TextField()
    _imagen = models.ImageField(upload_to="objetos_perdidos/", null=True, blank=True)
    _fecha = models.DateTimeField(auto_now_add=True)
    _usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="objetos_perdidos")
    _encontrado = models.BooleanField(default=False)  # ✅ Nuevo campo
    _fecha_encuentro = models.DateTimeField(null=True, blank=True)  # ✅ Nuevo campo

    class Meta:
        ordering = ['-_fecha']
        verbose_name_plural = "Objetos Perdidos"

    @property
    def titulo(self):
        return self._titulo

    @property
    def descripcion(self):
        return self._descripcion

    @property
    def imagen(self):
        return self._imagen
    
    @property
    def fecha(self):
        return self._fecha

    @property
    def usuario(self):
        return self._usuario
    
    @property
    def encontrado(self):
        return self._encontrado

    def marcar_encontrado(self, usuario=None):
        if self._encontrado:
            raise ValidationError("Este objeto ya fue marcado como encontrado")
        
        self._encontrado = True
        self._fecha_encuentro = timezone.now()
        self.save()

    def __str__(self):
        estado = "✓ Encontrado" if self._encontrado else "Perdido"
        return f"[{estado}] {self._titulo} - {self._usuario.username}"


# ========================
# SERVICIO DE DASHBOARD
# ========================

class DashboardService:
    """
    Separa lógica de negocio de las vistas
    """
    
    @staticmethod
    def obtener_estadisticas_admin():
        """
        Obtiene estadísticas para el dashboard de administrador.
        
        Returns:
            dict: Diccionario con estadísticas del sistema
        """
        return {
            "reportes_pendientes": Reporte.objects.pendientes().count(),
            "reportes_en_proceso": Reporte.objects.en_proceso().count(),
            "multas_pendientes": Multa.objects.pendientes().count(),
            "monto_multas_pendientes": Multa.objects.pendientes().aggregate(
                total=models.Sum('_monto')
            )['total'] or 0,
            "publicaciones_recientes": Publicacion.objects.all()[:5],
            "alertas_activas": BotonPanico.objects.filter(_activo=True).count(),
            "objetos_perdidos_activos": ObjetoPerdido.objects.filter(_encontrado=False).count(),
        }
    
    @staticmethod
    def obtener_resumen_vecino(usuario):
        return {
            "mis_reportes": Reporte.objects.del_usuario(usuario).count(),
            "reportes_pendientes": Reporte.objects.del_usuario(usuario).filter(_estado="Recibido").count(),
            "mis_multas": Multa.objects.del_usuario(usuario).count(),
            "multas_pendientes": Multa.objects.del_usuario(usuario).filter(_estado="Pendiente").count(),
            "total_multas_pendientes": Multa.objects.total_pendiente_usuario(usuario),
            "ultimas_publicaciones": Publicacion.objects.all()[:5],
        }