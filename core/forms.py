from django import forms
from django.core.exceptions import ValidationError


from .models import (
    Reporte, PerfilUsuario, Publicacion, Multa, ObjetoPerdido, Usuario, AreaComun, ReservaArea
)

# ========================
# AUTENTICACIÓN
# ========================

class LoginForm(forms.Form):
    """Formulario de login simple: validación mínima y UX clara."""
    username = forms.CharField(
        label="Usuario", 
        max_length=100,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Ingresa tu usuario'
        })
    )
    password = forms.CharField(
        label="Contraseña", 
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Ingresa tu contraseña'
        })
    )

    def clean_username(self):
        """Valida que el username no esté vacío ni en blanco."""
        data = self.cleaned_data["username"]
        if not data or data.strip() == "":
            raise ValidationError("El nombre de usuario es obligatorio")
        return data.strip()
    
    def clean_password(self):
        """Valida que la contraseña no esté vacía (evita feedback ambiguo)."""
        data = self.cleaned_data["password"]
        if not data:
            raise ValidationError("La contraseña es obligatoria")
        return data

# ========================
# REPORTES
# ========================

class ReporteForm(forms.ModelForm):
    """
    NOTA SOBRE ENCAPSULAMIENTO:
    En Django, los ModelForms acceden directamente a los campos del modelo.
    Aunque la convención interna use nombres con underscore, esto es normal
    en ModelForms y está soportado por el framework.
    """
    
    class Meta:
        model = Reporte
        fields = ["_titulo", "_descripcion", "_ubicacion"]
        labels = {
            "_titulo": "Título del reporte",
            "_descripcion": "Descripción detallada del incidente",
            "_ubicacion": "Ubicación exacta"
        }
        widgets = {
            "_titulo": forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ej: Bache en la calle principal'
            }),
            "_descripcion": forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Describe el incidente con el mayor detalle posible...'
            }),
            "_ubicacion": forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ej: Calle 5, entre Av. 3 y 4'
            })
        }

    def clean__titulo(self):
        """Longitud mínima y máxima para evitar spam/títulos vacíos."""
        titulo = self.cleaned_data["_titulo"]
        if not titulo or titulo.strip() == "":
            raise ValidationError("El título no puede estar vacío")
        titulo = titulo.strip()
        if len(titulo) < 5:
            raise ValidationError("El título debe tener al menos 5 caracteres.")
        if len(titulo) > 200:
            raise ValidationError("El título no puede exceder 200 caracteres.")
        return titulo
    
    def clean__descripcion(self):
        """Evita descripciones demasiado cortas; mejora la calidad de los reportes."""
        descripcion = self.cleaned_data["_descripcion"]
        if not descripcion or descripcion.strip() == "":
            raise ValidationError("La descripción no puede estar vacía")
        descripcion = descripcion.strip()
        if len(descripcion) < 10:
            raise ValidationError("La descripción debe tener al menos 10 caracteres para ser útil.")
        return descripcion

# ========================
# PERFIL
# ========================

class ProfileForm(forms.ModelForm):
    class Meta:
        model = PerfilUsuario
        fields = ["_foto", "_bio"]
        labels = {
            "_foto": "Foto de perfil",
            "_bio": "Biografía (máximo 500 caracteres)"
        }
        widgets = {
            "_foto": forms.FileInput(attrs={
                'class': 'form-control',
                'accept': 'image/*'
            }),
            "_bio": forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Cuéntanos un poco sobre ti...',
                'maxlength': 500
            })
        }
    
    def clean__bio(self):
        """Valida longitud de biografía (regla duplicada a nivel modelo, aquí por UX)."""
        bio = self.cleaned_data.get("_bio")
        if bio and len(bio) > 500:
            raise ValidationError(
                "La biografía no puede exceder 500 caracteres. "
                f"Actualmente tiene {len(bio)} caracteres."
            )
        return bio

# ========================
# PUBLICACIONES
# ========================

class PublicacionForm(forms.ModelForm):
    class Meta:
        model = Publicacion
        fields = ["_titulo", "_contenido"]
        labels = {
            "_titulo": "Título de la publicación",
            "_contenido": "Contenido"
        }
        widgets = {
            "_titulo": forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ej: Reunión de vecinos este sábado'
            }),
            "_contenido": forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 5,
                'placeholder': 'Escribe tu mensaje para la comunidad...'
            })
        }
    
    def clean__titulo(self):
        """Filtro de títulos triviales para mejorar la calidad del feed."""
        titulo = self.cleaned_data["_titulo"]
        if not titulo or titulo.strip() == "":
            raise ValidationError("El título no puede estar vacío")
        titulo = titulo.strip()
        if len(titulo) < 5:
            raise ValidationError("El título debe tener al menos 5 caracteres.")
        return titulo
    
    def clean__contenido(self):
        """Evita publicaciones con contenido demasiado corto."""
        contenido = self.cleaned_data["_contenido"]
        if not contenido or contenido.strip() == "":
            raise ValidationError("El contenido no puede estar vacío")
        contenido = contenido.strip()
        if len(contenido) < 10:
            raise ValidationError("El contenido debe tener al menos 10 caracteres.")
        return contenido

# ========================
# MULTAS
# ========================

class MultaForm(forms.ModelForm):
    vecino = forms.ModelChoiceField(
        queryset=Usuario.objects.filter(_rol="vecino"),
        label="Vecino afectado",
        required=True,
        widget=forms.Select(attrs={'class': 'form-control'}),
        empty_label="Selecciona un vecino..."
    )

    class Meta:
        model = Multa
        fields = ["vecino", "_monto", "_motivo"]
        labels = {
            "vecino": "Vecino afectado",
            "_monto": "Monto de la multa (Q)",
            "_motivo": "Motivo de la multa",
        }
        widgets = {
            "_monto": forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': '0.00',
                'step': '0.01',
                'min': '0'
            }),
            "_motivo": forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Describe el motivo de la multa...'
            }),
        }

    def save(self, commit=True):
        """Asigna el vecino y fuerza el estado inicial a 'Pendiente'."""
        instance = super().save(commit=False)
        instance._vecino = self.cleaned_data["vecino"]
        instance._estado = "Pendiente"
        if commit:
            instance.save()
        return instance

    
    def clean__monto(self):
        """Reglas de negocio básicas para evitar montos inválidos o absurdos."""
        monto = self.cleaned_data["_monto"]
        if monto <= 0:
            raise ValidationError("El monto debe ser mayor a 0")
        if monto > 10000:
            raise ValidationError("El monto parece muy alto. Si es correcto, contacta al supervisor.")
        return monto
    
    def clean__motivo(self):
        """Evita motivos vacíos o demasiado breves (mejora trazabilidad)."""
        motivo = self.cleaned_data["_motivo"]
        if not motivo or motivo.strip() == "":
            raise ValidationError("Debes especificar el motivo de la multa")
        motivo = motivo.strip()
        if len(motivo) < 10:
            raise ValidationError("El motivo debe ser más descriptivo (mínimo 10 caracteres).")
        return motivo
    
# ========================
# OBJETOS PERDIDOS
# ========================
class ObjetoPerdidoForm(forms.ModelForm):

    # Campos públicos para la template
    titulo = forms.CharField(
        label="¿Qué objeto perdiste?",
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Ej: Llaves con llavero azul'
        })
    )

    descripcion = forms.CharField(
        label="Descripción detallada",
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 4,
            'placeholder': 'Describe el objeto...'
        })
    )

    imagen = forms.ImageField(
        required=False,
        label="Fotografía",
        widget=forms.FileInput(attrs={
            'class': 'form-control',
            'accept': 'image/*'
        })
    )

    class Meta:
        model = ObjetoPerdido
        fields = ["titulo", "descripcion", "imagen"]

    def save(self, commit=True):
        obj = super().save(commit=False)
        obj._titulo = self.cleaned_data["titulo"]
        obj._descripcion = self.cleaned_data["descripcion"]

        if self.cleaned_data.get("imagen"):
            obj._imagen = self.cleaned_data["imagen"]

        if commit:
            obj.save()
        return obj


# ========================
# GESTIÓN DE USUARIOS
# ========================

class CrearUsuarioForm(forms.ModelForm):
    """
    Form de alta de usuarios por admin (no self-signup).
    'password' y 'password_confirm' se validan cruzado en clean().
    """
    password = forms.CharField(
        label="Contraseña",
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Mínimo 8 caracteres'
        }),
        help_text="La contraseña debe tener al menos 8 caracteres"
    )
    
    password_confirm = forms.CharField(
        label="Confirmar contraseña",
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Repite la contraseña'
        })
    )

    class Meta:
        model = Usuario
        fields = ["username", "email", "_telefono", "_rol", "password"]
        labels = {
            "username": "Nombre de usuario",
            "email": "Correo electrónico",
            "_telefono": "Teléfono",
            "_rol": "Rol del usuario"
        }
        widgets = {
            "username": forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'usuario123'
            }),
            "email": forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': 'correo@ejemplo.com'
            }),
            "_telefono": forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '12345678'
            }),
            "_rol": forms.Select(attrs={'class': 'form-control'})
        }
    
    def clean_username(self):
        """Formato permitido y unicidad para username."""
        username = self.cleaned_data["username"]
        if len(username) < 4:
            raise ValidationError("El nombre de usuario debe tener al menos 4 caracteres.")
        if not username.replace('_', '').isalnum():
            raise ValidationError("El nombre de usuario solo puede contener letras, números y guiones bajos.")
        if Usuario.objects.filter(username=username).exists():
            raise ValidationError("Este nombre de usuario ya está en uso.")
        return username
    
    def clean_email(self):
        """Evita registros duplicados por email; campo obligatorio."""
        email = self.cleaned_data["email"]
        if not email:
            raise ValidationError("El correo electrónico es obligatorio")
        if Usuario.objects.filter(email=email).exists():
            raise ValidationError("Este correo electrónico ya está registrado.")
        return email
    
    def clean__telefono(self):
        """Normaliza y valida número telefónico (solo dígitos, min 8)."""
        telefono = self.cleaned_data.get("_telefono")
        if telefono:
            telefono = telefono.replace(" ", "").replace("-", "")
            if not telefono.isdigit():
                raise ValidationError("El teléfono solo debe contener números.")
            if len(telefono) < 8:
                raise ValidationError("El teléfono debe tener al menos 8 dígitos.")
        return telefono
    
    def clean_password(self):
        """Complejidad mínima de contraseña."""
        password = self.cleaned_data["password"]
        if len(password) < 8:
            raise ValidationError("La contraseña debe tener al menos 8 caracteres.")
        if password.isdigit():
            raise ValidationError("La contraseña no puede ser solo números.")
        return password
    
    def clean(self):
        """
        Validación cruzada de contraseñas. 
        PS. Django propaga **kwargs al constructor del form, peero aquí no es necesario,
        pero este método centraliza la regla de igualdad entre password y confirmación.
        """
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        password_confirm = cleaned_data.get("password_confirm")
        if password and password_confirm and password != password_confirm:
            raise ValidationError("Las contraseñas no coinciden. Por favor verifica.")
        return cleaned_data

    def save(self, commit=True):
        """
        Guarda el usuario seteando contraseña encriptada.
        commit=True mantiene la firma estándar de ModelForm.save().
        """
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password"])
        if commit:
            user.save()
        return user

# ========================
# Áreas Comunes
# ========================

class AreaComunForm(forms.ModelForm):
    """Formulario para administradores: crear o editar áreas comunes."""
    
    # Definir los campos manualmente
    nombre = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'ej: Salón de Eventos, Piscina'
        })
    )
    
    descripcion = forms.CharField(
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 4,
            'placeholder': 'Describe las características...'
        })
    )
    
    capacidad = forms.IntegerField(
        min_value=1,
        widget=forms.NumberInput(attrs={
            'class': 'form-control',
            'min': 1,
            'placeholder': '0'
        })
    )
    
    disponible = forms.BooleanField(
        required=False,
        initial=True,
        widget=forms.CheckboxInput(attrs={
            'class': 'form-check-input'
        })
    )
    
    imagen = forms.ImageField(
        required=False,
        widget=forms.FileInput(attrs={
            'class': 'form-control',
            'accept': 'image/*'
        })
    )
    
    class Meta:
        model = AreaComun
        fields = []  # Vacío porque los definimos manualmente arriba
        
    def __init__(self, *args, **kwargs):
        """Inicializar el formulario con valores existentes"""
        super().__init__(*args, **kwargs)
        
        if self.instance and self.instance.pk:
            # Si estamos editando, cargar los valores
            self.fields['nombre'].initial = self.instance.nombre
            self.fields['descripcion'].initial = self.instance.descripcion
            self.fields['capacidad'].initial = self.instance.capacidad
            self.fields['disponible'].initial = self.instance.disponible
    
    def save(self, commit=True):
        """Sobrescribir save para asignar valores a los campos privados"""
        instance = super().save(commit=False)
        
        # Asignar a los campos privados usando las properties
        instance.nombre = self.cleaned_data['nombre']
        instance.descripcion = self.cleaned_data['descripcion']
        instance.capacidad = self.cleaned_data['capacidad']
        instance.disponible = self.cleaned_data['disponible']
        
        if 'imagen' in self.cleaned_data and self.cleaned_data['imagen']:
            instance.imagen = self.cleaned_data['imagen']
        
        if commit:
            instance.save()
        
        return instance

# ========================
# Reserva de Áreas Comunes
# ========================

class ReservaAreaForm(forms.ModelForm):
    area = forms.ModelChoiceField(
        queryset=AreaComun.objects.filter(_disponible=True),
        widget=forms.Select(attrs={'class': 'form-select'}),
        label='Área a reservar'
    )
    
    fecha = forms.DateField(
        widget=forms.DateInput(attrs={
            'class': 'form-control',
            'type': 'date'
        })
    )
    
    hora_inicio = forms.TimeField(
        widget=forms.TimeInput(attrs={
            'class': 'form-control',
            'type': 'time'
        })
    )
    
    hora_fin = forms.TimeField(
        widget=forms.TimeInput(attrs={
            'class': 'form-control',
            'type': 'time'
        })
    )
    
    motivo = forms.CharField(
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 3,
            'placeholder': 'Describe el motivo de tu reserva...'
        })
    )
    
    class Meta:
        model = ReservaArea
        fields = []
    
    def __init__(self, *args, **kwargs):
        area_id = kwargs.pop('area_id', None)
        super().__init__(*args, **kwargs)
        
        # Si viene un área específica, ocultarla y pre-seleccionarla
        if area_id:
            self.fields['area'].initial = area_id
            self.fields['area'].widget = forms.HiddenInput()
    
    def clean(self):
        cleaned_data = super().clean()
        area = cleaned_data.get('area')
        fecha = cleaned_data.get('fecha')
        hora_inicio = cleaned_data.get('hora_inicio')
        hora_fin = cleaned_data.get('hora_fin')
        
        if not all([area, fecha, hora_inicio, hora_fin]):
            return cleaned_data
        
        # Validar que hora_inicio sea antes que hora_fin
        if hora_inicio >= hora_fin:
            raise ValidationError("La hora de inicio debe ser anterior a la hora de fin.")
        
        # Validar que no haya solapamiento con otras reservas
        solapadas = ReservaArea.objects.filter(
            _area=area,
            _fecha=fecha
        )
        
        # Si estamos editando, excluir la reserva actual
        if self.instance.pk:
            solapadas = solapadas.exclude(pk=self.instance.pk)
        
        for reserva in solapadas:
            if (hora_inicio < reserva._hora_fin and hora_fin > reserva._hora_inicio):
                raise ValidationError("Ya existe una reserva en ese horario.")
        
        return cleaned_data
    
    def save(self, commit=True):
        instance = super().save(commit=False)
        
        # Asignar directamente a los campos privados con underscore
        instance._area = self.cleaned_data['area']
        instance._fecha = self.cleaned_data['fecha']
        instance._hora_inicio = self.cleaned_data['hora_inicio']
        instance._hora_fin = self.cleaned_data['hora_fin']
        instance._motivo = self.cleaned_data['motivo']
        
        if commit:
            instance.save()
        
        return instance