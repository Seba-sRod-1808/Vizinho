from django import forms

from .models import (
    Reporte, PerfilUsuario, Publicacion, Multa, ObjetoPerdido, Usuario
)

class LoginForm(forms.Form):
    username = forms.CharField(label="Usuario", max_length=100)
    password = forms.CharField(label="Contraseña", widget=forms.PasswordInput)

    def clean_username(self):
        data = self.cleaned_data["username"]
        if not data:
            raise forms.ValidationError("El nombre de usuario es obligatorio")
        return data
    
class ReporteForm(forms.ModelForm):
    class Meta:
        model = Reporte
        fields = ["_titulo", "_descripcion", "_ubicacion"]

    def clean__titulo(self):
        titulo = self.cleaned_data["_titulo"]
        if len(titulo) < 5:
            raise forms.ValidationError("El título debe tener al menos 5 caracteres.")
        return titulo

class ProfileForm(forms.ModelForm):
    class Meta:
        model = PerfilUsuario
        fields = ["_foto", "_bio"]

class PublicacionForm(forms.ModelForm):
    class Meta:
        model = Publicacion
        fields = ["_titulo", "_contenido"]
class MultaForm(forms.ModelForm):
    class Meta:
        model = Multa
        fields = ["_monto", "_motivo"]

class ObjetoPerdidoForm(forms.ModelForm):
    class Meta:
        model = ObjetoPerdido
        fields = ["_titulo", "_descripcion", "_imagen"]
        labels = {
            "_titulo": "Título del objeto",
            "_descripcion": "Descripción",
            "_imagen": "Fotografía",
        }

class CrearUsuarioForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput, label="Contraseña")

    class Meta:
        model = Usuario
        fields = ["username", "email", "_telefono", "_rol", "password"]
        labels = {
            "username": "Nombre de usuario",
            "email": "Correo electrónico",
            "_telefono": "Teléfono",
            "_rol": "Rol del usuario",
        }

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password"])
        if commit:
            user.save()
        return user
    