# Django core
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse_lazy
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin

# Django views
from django.views import View
from django.views.generic import (
    TemplateView, ListView, CreateView,
    UpdateView, DeleteView, DetailView
)

# local models
from .models import Reporte, PerfilUsuario, Publicacion, Multa, BotonPanico, ObjetoPerdido, Usuario

# local forms
from .forms import (
    LoginForm, ReporteForm,
    ProfileForm, PublicacionForm, MultaForm, ObjetoPerdidoForm,
    CrearUsuarioForm
)

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
        if user is not None:
            login(request, user)
            if user.rol == "admin" or user.is_superuser:
                return redirect("dashboard_admin")
            else:
                return redirect("dashboard")

        else:
            form.add_error(None, "Usuario o contraseña incorrectos")
        return render(request, self.template_name, {"form": form})

class LogoutView(View):
    def get(self, request):
        logout(request)
        return redirect("login")

class SoloAdminMixin(UserPassesTestMixin):
    def test_func(self):
        user = self.request.user
        return user.is_superuser or user.rol == "admin"
    
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
class MultaListView(LoginRequiredMixin, ListView):
    model = Multa
    template_name = "multas/lista_multas.html"
    context_object_name = "multas"

    def get_queryset(self):
        user = self.request.user
        if user.rol == "admin" or user.is_superuser:
            return Multa.objects.all()
        else:
            return Multa.objects.filter(_vecino=user)

class MultaCreateView(LoginRequiredMixin, SoloAdminMixin, CreateView):
    model = Multa
    form_class = MultaForm
    template_name = "multas/crear_multa.html"
    success_url = reverse_lazy("lista_multas")

    def form_valid(self, form):
        form.instance._vecino = self.request.user
        return super().form_valid(form)

class MultaUpdateView(LoginRequiredMixin, SoloAdminMixin, UpdateView):
    model = Multa
    form_class = MultaForm
    template_name = "multas/editar_multa.html"
    success_url = reverse_lazy("lista_multas")

class MultaDeleteView(LoginRequiredMixin, SoloAdminMixin, DeleteView):
    model = Multa
    template_name = "multas/eliminar_multa.html"
    success_url = reverse_lazy("lista_multas")

#SIMULACION!! no es funcional, solamente es para mostrar la idea. No verifica fondos reales, aunque en un futuro
# podria integrarse con una pasarela de pagos simulada.
class PagarMultaView(LoginRequiredMixin, View):
    def post(self, request, pk):
        multa = get_object_or_404(Multa, pk=pk, _vecino=request.user)
        multa.pagar()
        return redirect("lista_multas")

class PublicacionListView(LoginRequiredMixin, ListView):
    model = Publicacion
    template_name = "publicaciones/lista_publicaciones.html"
    context_object_name = "publicaciones"
    ordering = ["-_fecha"]

class PublicacionCreateView(LoginRequiredMixin, CreateView):
    model = Publicacion
    form_class = PublicacionForm
    template_name = "publicaciones/crear_publicacion.html"
    success_url = reverse_lazy("lista_publicaciones")

    def form_valid(self, form):
        form.instance._vecino = self.request.user
        return super().form_valid(form)

class PublicacionUpdateView(LoginRequiredMixin, UpdateView):
    model = Publicacion
    form_class = PublicacionForm
    template_name = "publicaciones/editar_publicacion.html"
    success_url = reverse_lazy("lista_publicaciones")

class PublicacionDeleteView(LoginRequiredMixin, DeleteView):
    model = Publicacion
    template_name = "publicaciones/eliminar_publicacion.html"
    success_url = reverse_lazy("lista_publicaciones")
    
class ActivarBotonPanicoView(LoginRequiredMixin, View):
    def post(self, request):
        BotonPanico.objects.create(_usuario=request.user)
        return redirect("historial_panico")

class HistorialBotonPanicoView(LoginRequiredMixin, ListView):
    model = BotonPanico
    template_name = "panico/historial_panico.html"
    context_object_name = "alertas"

    def get_queryset(self):
        return BotonPanico.objects.filter(_usuario=self.request.user).order_by("-_fecha")

class DashboardAdminView(LoginRequiredMixin, SoloAdminMixin, TemplateView):
    template_name = "administrador/dashboard_admin.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)  
        # el get_context_data method es usado para agregar
        # datos que se pasarán a la plantilla al renderizar el controlador y permite
        # personalizar el contexto que estará disponible en la plantilla.
        context["reportes_pendientes"] = Reporte.objects.filter(_estado="Recibido").count()
        context["multas_pendientes"] = Multa.objects.filter(_estado=False).count()
        context["publicaciones_recientes"] = Publicacion.objects.order_by("-_fecha")[:5]
        context["alertas_activas"] = BotonPanico.objects.filter(_activo=True).count()
        return context

class ListaObjetosPerdidosView(LoginRequiredMixin, ListView):
    model = ObjetoPerdido
    template_name = "objeto-perdido/lista_objetos.html"
    context_object_name = "objetos"
    ordering = ["-_fecha"]

class CrearObjetoPerdidoView(LoginRequiredMixin, CreateView):
    model = ObjetoPerdido
    template_name = "objeto-perdido/crear_objeto.html"
    form_class = ObjetoPerdidoForm
    success_url = reverse_lazy("lista_objetos_perdidos")

    def form_valid(self, form):
        form.instance._usuario = self.request.user
        return super().form_valid(form)

class CrearUsuarioView(LoginRequiredMixin, SoloAdminMixin, CreateView):
    model = Usuario
    form_class = CrearUsuarioForm
    template_name = "administrador/crear_usuario.html"
    success_url = reverse_lazy("dashboard_admin")

    def form_valid(self, form):
        # valida que solo admin o un superuser puedan crear usuarios
        if self.request.user.rol == "admin" or self.request.user.is_superuser:
            return super().form_valid(form)
        else:
            form.add_error(None, "No tienes permiso para crear usuarios.")
            return self.form_invalid(form)