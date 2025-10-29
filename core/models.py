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
    _imagen = models.ImageField(
        upload_to="publicaciones/",
        null=True,
        blank=True,
        verbose_name='Imagen de la publicación'
    )
    
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
    
    @property
    def imagen(self):
        return self._imagen
    
    def ultimos_comentarios(self, limit=5):
        return self.comentarios.order_by('-_fecha')[:limit]
    
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
        ("Rechazado", "Rechazado"),
    ]

    _titulo = models.CharField(max_length=200)
    _descripcion = models.TextField()
    _estado = models.CharField(max_length=20, choices=ESTADOS, default="Recibido")
    _fecha = models.DateTimeField(auto_now_add=True)
    _ubicacion = models.CharField(max_length=200)
    _vecino = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="reportes")

    objects = ReporteManager()

    _comentario_admin = models.TextField(
        null=True,
        blank=True,
        verbose_name='Comentario del administrador'
    )

    _fecha_resolucion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de resolución'
    )

    _resuelto_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reportes_resueltos',
        verbose_name='Resuelto por'
    )

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

    @property
    def comentario_admin(self):
        return self._comentario_admin

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

    def marcar_resuelto(self, admin_usuario, comentario=None):

        if not admin_usuario.es_administrador():
            raise ValidationError("Solo administradores pueden resolver reportes")
        
        if self._estado == "Resuelto":
            raise ValidationError("Este reporte ya está resuelto")
        
        self._estado = "Resuelto"
        self._fecha_resolucion = timezone.now()
        self._resuelto_por = admin_usuario
        if comentario:
            self._comentario_admin = comentario
        self.save()

    def rechazar(self, admin_usuario, motivo):
        if not admin_usuario.es_administrador():
            raise ValidationError("Solo administradores pueden rechazar reportes")
        
        if not motivo or motivo.strip() == "":
            raise ValidationError("Debes proporcionar un motivo para rechazar")
        
        self._estado = "Rechazado"
        self._fecha_resolucion = timezone.now()
        self._resuelto_por = admin_usuario
        self._comentario_admin = motivo
        self.save()

    def agregar_comentario_admin(self, admin_usuario, comentario):
        if not admin_usuario.es_administrador():
            raise ValidationError("Solo administradores pueden comentar")
        
        self._comentario_admin = comentario
        self.save()

    def total_comentarios(self):
        return self.comentarios.count()
        
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

# ========================
# SISTEMA DE COMENTARIOS
# ========================

class Comentario(models.Model):
    """
    Modelo genérico de comentarios para Reportes y Publicaciones.
    
    Usa composición para relacionarse con diferentes modelos.
    Patrón: Composition over Inheritance
    
    NUEVO: Sistema de comentarios flexible
    """
    
    # Relaciones opcionales (uno y solo uno debe estar presente)
    _reporte = models.ForeignKey(
        'Reporte',
        on_delete=models.CASCADE,
        related_name='comentarios',
        null=True,
        blank=True,
        verbose_name='Reporte relacionado'
    )
    
    _publicacion = models.ForeignKey(
        'Publicacion',
        on_delete=models.CASCADE,
        related_name='comentarios',
        null=True,
        blank=True,
        verbose_name='Publicación relacionada'
    )
    
    # Datos del comentario
    _contenido = models.TextField(verbose_name='Contenido del comentario')
    _autor = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='comentarios',
        verbose_name='Autor'
    )
    _fecha = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    _editado = models.BooleanField(default=False, verbose_name='¿Fue editado?')
    _fecha_edicion = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de edición')
    
    class Meta:
        ordering = ['_fecha']
        verbose_name = 'Comentario'
        verbose_name_plural = 'Comentarios'
    
    # ===== PROPERTIES =====
    
    @property
    def contenido(self):
        return self._contenido
    
    @property
    def autor(self):
        return self._autor
    
    @property
    def fecha(self):
        return self._fecha
    
    @property
    def editado(self):
        return self._editado
    
    @property
    def reporte(self):
        return self._reporte
    
    @property
    def publicacion(self):
        return self._publicacion
    
    def editar_contenido(self, nuevo_contenido, usuario):
        if not self.puede_editar(usuario):
            raise ValidationError("No tienes permisos para editar este comentario")
        
        self._contenido = nuevo_contenido
        self._editado = True
        self._fecha_edicion = timezone.now()
        self.save()
    
    def puede_editar(self, usuario):

        return self._autor == usuario or usuario.es_administrador()
    
    def puede_eliminar(self, usuario):
        return self._autor == usuario or usuario.es_administrador()
    
    def get_objeto_relacionado(self):
        if self._reporte:
            return self._reporte
        elif self._publicacion:
            return self._publicacion
        return None
    
    def get_tipo_objeto(self):
        if self._reporte:
            return 'reporte'
        elif self._publicacion:
            return 'publicacion'
        return None
    
    def clean(self):
        relaciones_activas = sum([
            bool(self._reporte),
            bool(self._publicacion)
        ])
        
        if relaciones_activas == 0:
            raise ValidationError("El comentario debe estar relacionado con un Reporte o Publicación")
        
        if relaciones_activas > 1:
            raise ValidationError("El comentario solo puede estar relacionado con UN objeto")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        objeto = self.get_objeto_relacionado()
        tipo = self.get_tipo_objeto()
        return f"Comentario de {self._autor.username} en {tipo} ({objeto})"

# ========================
# MANAGER DE COMENTARIOS
# ========================

class ComentarioManager(models.Manager):
    
    def de_reporte(self, reporte):
        return self.filter(_reporte=reporte)
    
    def de_publicacion(self, publicacion):
        return self.filter(_publicacion=publicacion)
    
    def del_usuario(self, usuario):
        return self.filter(_autor=usuario)
    
    def recientes(self, limit=10):
        return self.order_by('-_fecha')[:limit]