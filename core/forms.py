from django import forms
from .models import Reporte

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
