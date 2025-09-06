from django.views import View
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from .forms import LoginForm


class LoginView(View):
    template_name = "login.html"

    def get(self, request):
        form = LoginForm()
        return render(request, self.template_name, {"form": form})

    def post(self, request):
        form = LoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data["username"]
            password = form.cleaned_data["password"]
            user = authenticate(request, username=username, password=password)
            if user:
                login(request, user)
                return redirect("dashboard")  # ajustaremos después
            else:
                form.add_error(None, "Usuario o contraseña incorrectos")
        return render(request, self.template_name, {"form": form})


class LogoutView(View):
    def get(self, request):
        logout(request)
        return redirect("login")
