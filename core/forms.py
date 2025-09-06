from django import forms

class LoginForm(forms.Form):
    username = forms.CharField(label="Usuario", max_length=100)
    password = forms.CharField(label="Contraseña", widget=forms.PasswordInput)

    def clean_username(self):
        data = self.cleaned_data["username"]
        if not data:
            raise forms.ValidationError("El nombre de usuario es obligatorio")
        return data
