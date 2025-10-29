from django import forms
from django.core.exceptions import ValidationError

from .models import (
    Reporte, PerfilUsuario, Publicacion, Multa, ObjetoPerdido, Usuario, Comentario
)

# ========================
# AUTENTICACIÓN
# ========================

class LoginForm(forms.Form):
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
        """Valida que el username no esté vacío."""
        data = self.cleaned_data["username"]
        if not data or data.strip() == "":
            raise ValidationError("El nombre de usuario es obligatorio")
        return data.strip()
    
    def clean_password(self):
        """Valida que la contraseña no esté vacía."""
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
    En Django, los ModelForms necesitan acceder directamente a los campos del modelo
    Aunque esto expone campos privados, es una limitación del framework. Usamos labels
    amigables para la UI y validación adicional en clean_* methods.
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
        titulo = self.cleaned_data["_titulo"]
        
        if not titulo or titulo.strip() == "":
            raise ValidationError("El título no puede estar vacío")
        
        titulo = titulo.strip()
        
        if len(titulo) < 5:
            raise ValidationError(
                "El título debe tener al menos 5 caracteres."
            )
        
        if len(titulo) > 200:
            raise ValidationError(
                "El título no puede exceder 200 caracteres."
            )
        
        return titulo
    
    def clean__descripcion(self):
        descripcion = self.cleaned_data["_descripcion"]
        
        if not descripcion or descripcion.strip() == "":
            raise ValidationError("La descripción no puede estar vacía")
        
        descripcion = descripcion.strip()
        
        if len(descripcion) < 10:
            raise ValidationError(
                "La descripción debe tener al menos 10 caracteres para ser útil."
            )
        
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
        """
        Valida la biografía.
        
        Reglas:
        - Máximo 500 caracteres
        """
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
        fields = ["_titulo", "_contenido", "_imagen"]
        labels = {
            "_titulo": "Título de la publicación",
            "_contenido": "Contenido",
            "_imagen": "Imagen (opcional)"
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
            }),
            "_imagen": forms.FileInput(attrs={
                'class': 'form-control',
                'accept': 'image/*'
            })
        }
    
    def clean__titulo(self):
        """Valida el título de la publicación."""
        titulo = self.cleaned_data["_titulo"]
        
        if not titulo or titulo.strip() == "":
            raise ValidationError("El título no puede estar vacío")
        
        titulo = titulo.strip()
        
        if len(titulo) < 5:
            raise ValidationError(
                "El título debe tener al menos 5 caracteres."
            )
        
        return titulo
    
    def clean__contenido(self):
        """Valida el contenido de la publicación."""
        contenido = self.cleaned_data["_contenido"]
        
        if not contenido or contenido.strip() == "":
            raise ValidationError("El contenido no puede estar vacío")
        
        contenido = contenido.strip()
        
        if len(contenido) < 10:
            raise ValidationError(
                "El contenido debe tener al menos 10 caracteres."
            )
        
        return contenido

# ========================
# MULTAS
# ========================
class MultaForm(forms.ModelForm):
    _vecino = forms.ModelChoiceField(
        queryset=Usuario.objects.filter(_rol="vecino"),
        label="Vecino afectado",
        required=True,
        widget=forms.Select(attrs={'class': 'form-control'}),
        empty_label="Selecciona un vecino..."
    )

    class Meta:
        model = Multa
        fields = ["_vecino", "_monto", "_motivo", "_estado"]
        labels = {
            "_vecino": "Vecino afectado",
            "_monto": "Monto de la multa (Q)",
            "_motivo": "Motivo de la multa",
            "_estado": "Estado"
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
            "_estado": forms.Select(attrs={'class': 'form-control'})
        }
    
    def clean__monto(self):
        monto = self.cleaned_data["_monto"]
        
        if monto <= 0:
            raise ValidationError("El monto debe ser mayor a 0")
        
        if monto > 10000:
            raise ValidationError(
                "El monto parece muy alto. Si es correcto, contacta al supervisor."
            )
        
        return monto
    
    def clean__motivo(self):
        """Valida el motivo de la multa."""
        motivo = self.cleaned_data["_motivo"]
        
        if not motivo or motivo.strip() == "":
            raise ValidationError("Debes especificar el motivo de la multa")
        
        motivo = motivo.strip()
        
        if len(motivo) < 10:
            raise ValidationError(
                "El motivo debe ser más descriptivo (mínimo 10 caracteres)."
            )
        
        return motivo


# ========================
# OBJETOS PERDIDOS
# ========================
class ObjetoPerdidoForm(forms.ModelForm):
    class Meta:
        model = ObjetoPerdido
        fields = ["_titulo", "_descripcion", "_imagen"]
        labels = {
            "_titulo": "¿Qué objeto perdiste?",
            "_descripcion": "Descripción detallada",
            "_imagen": "Fotografía del objeto (opcional)"
        }
        widgets = {
            "_titulo": forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ej: Llaves con llavero azul'
            }),
            "_descripcion": forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Describe el objeto con el mayor detalle posible...'
            }),
            "_imagen": forms.FileInput(attrs={
                'class': 'form-control',
                'accept': 'image/*'
            })
        }
    
    def clean__titulo(self):
        """Valida el título del objeto perdido."""
        titulo = self.cleaned_data["_titulo"]
        
        if not titulo or titulo.strip() == "":
            raise ValidationError("Debes especificar qué objeto perdiste")
        
        titulo = titulo.strip()
        
        if len(titulo) < 3:
            raise ValidationError(
                "El título debe tener al menos 3 caracteres."
            )
        
        return titulo
    
    def clean__descripcion(self):
        """Valida la descripción del objeto perdido."""
        descripcion = self.cleaned_data["_descripcion"]
        
        if not descripcion or descripcion.strip() == "":
            raise ValidationError("La descripción es necesaria para identificar el objeto")
        
        descripcion = descripcion.strip()
        
        if len(descripcion) < 10:
            raise ValidationError(
                "La descripción debe ser más detallada (mínimo 10 caracteres)."
            )
        
        return descripcion


# ========================
# GESTIÓN DE USUARIOS
# ========================
class CrearUsuarioForm(forms.ModelForm):
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
        username = self.cleaned_data["username"]
        
        if len(username) < 4:
            raise ValidationError(
                "El nombre de usuario debe tener al menos 4 caracteres."
            )
        
        if not username.replace('_', '').isalnum():
            raise ValidationError(
                "El nombre de usuario solo puede contener letras, números y guiones bajos."
            )
        
        if Usuario.objects.filter(username=username).exists():
            raise ValidationError(
                "Este nombre de usuario ya está en uso."
            )
        
        return username
    
    def clean_email(self):
        email = self.cleaned_data["email"]
        
        if not email:
            raise ValidationError("El correo electrónico es obligatorio")
        
        # Verificar que no exista ya
        if Usuario.objects.filter(email=email).exists():
            raise ValidationError(
                "Este correo electrónico ya está registrado."
            )
        
        return email
    
    def clean__telefono(self):
        telefono = self.cleaned_data.get("_telefono")
        
        if telefono:
            # Remover espacios y guiones
            telefono = telefono.replace(" ", "").replace("-", "")
            
            if not telefono.isdigit():
                raise ValidationError(
                    "El teléfono solo debe contener números."
                )
            
            if len(telefono) < 8:
                raise ValidationError(
                    "El teléfono debe tener al menos 8 dígitos."
                )
        
        return telefono
    
    def clean_password(self):
        # este metodo valida la complejidad de la contraseña, asegurando que tenga al menos 8 caracteres y no sea solo numérica
        password = self.cleaned_data["password"]
        
        if len(password) < 8:
            raise ValidationError(
                "La contraseña debe tener al menos 8 caracteres."
            )
        
        if password.isdigit():
            raise ValidationError(
                "La contraseña no puede ser solo números."
            )
        
        return password
    
    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        password_confirm = cleaned_data.get("password_confirm")
        
        if password and password_confirm and password != password_confirm:
            raise ValidationError(
                "Las contraseñas no coinciden. Por favor verifica."
            )
        
        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password"])
        
        if commit:
            user.save()
        
        return user
    

class ComentarioForm(forms.ModelForm):
    """
    Formulario para crear/editar comentarios.
    Funciona tanto para Reportes como para Publicaciones.
    """
    
    class Meta:
        model = Comentario
        fields = ["_contenido"]
        labels = {
            "_contenido": "Comentario"
        }
        widgets = {
            "_contenido": forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Escribe tu comentario aquí...'
            })
        }
    
    def clean__contenido(self):
        """Valida el contenido del comentario."""
        contenido = self.cleaned_data["_contenido"]
        
        if not contenido or contenido.strip() == "":
            raise ValidationError("El comentario no puede estar vacío")
        
        contenido = contenido.strip()
        
        if len(contenido) < 3:
            raise ValidationError("El comentario debe tener al menos 3 caracteres")
        
        if len(contenido) > 500:
            raise ValidationError("El comentario no puede exceder 500 caracteres")
        
        return contenido


# ========================
# FORMULARIO DE RESOLUCIÓN DE REPORTE
# ========================

class ResolverReporteForm(forms.Form):
    ACCIONES = [
        ('resolver', 'Marcar como Resuelto'),
        ('rechazar', 'Rechazar Reporte'),
        ('comentar', 'Solo Agregar Comentario'),
    ]
    
    accion = forms.ChoiceField(
        choices=ACCIONES,
        label="Acción",
        widget=forms.RadioSelect(attrs={'class': 'form-check-input'}),
        initial='resolver'
    )
    
    comentario = forms.CharField(
        label="Comentario / Motivo",
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 4,
            'placeholder': 'Explica la resolución o motivo del rechazo...'
        }),
        required=False
    )
    
    def clean(self):
        cleaned_data = super().clean()
        accion = cleaned_data.get('accion')
        comentario = cleaned_data.get('comentario', '').strip()
        
        if accion == 'rechazar' and not comentario:
            raise ValidationError({
                'comentario': 'Debes proporcionar un motivo para rechazar el reporte'
            })
        
        if accion == 'comentar' and not comentario:
            raise ValidationError({
                'comentario': 'Debes escribir un comentario'
            })
        
        return cleaned_data
