from django.views import View
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from .forms import LoginForm, ReporteForm
from django.views.generic import ListView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from django.contrib.auth.mixins import LoginRequiredMixin
from .models import Reporte
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import DetailView, UpdateView
from .models import PerfilUsuario
from .forms import ProfileForm


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
                return redirect("dashboard") # aun no implementado // equipo de fabric y joseph
            else:
                form.add_error(None, "Usuario o contraseña incorrectos")
        return render(request, self.template_name, {"form": form})


class LogoutView(View):
    def get(self, request):
        logout(request)
        return redirect("login")

class ReporteListView(LoginRequiredMixin, ListView):
    model = Reporte
    template_name = "reportes/lista_reportes.html"
    context_object_name = "reportes"

    def get_queryset(self):
        return Reporte.objects.filter(_vecino=self.request.user)


class ReporteCreateView(LoginRequiredMixin, CreateView):
    model = Reporte
    form_class = ReporteForm
    template_name = "reportes/crear_reporte.html"
    success_url = reverse_lazy("lista_reportes")

    def form_valid(self, form):
        form.instance._vecino = self.request.user
        return super().form_valid(form)


class ReporteUpdateView(LoginRequiredMixin, UpdateView):
    model = Reporte
    form_class = ReporteForm
    template_name = "reportes/editar_reporte.html"
    success_url = reverse_lazy("lista_reportes")


class ReporteDeleteView(LoginRequiredMixin, DeleteView):
    model = Reporte
    template_name = "reportes/eliminar_reporte.html"
    success_url = reverse_lazy("lista_reportes")

class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard.html"

class ProfileDetailView(LoginRequiredMixin, DetailView):
    model = PerfilUsuario
    template_name = "perfil/ver_perfil.html"

    def get_object(self):
        return PerfilUsuario.objects.get(_usuario=self.request.user)

class ProfileUpdateView(LoginRequiredMixin, UpdateView):
    model = PerfilUsuario
    form_class = ProfileForm
    template_name = "perfil/editar_perfil.html"
    success_url = reverse_lazy("ver_perfil")

    def get_object(self):
        return PerfilUsuario.objects.get(_usuario=self.request.user)