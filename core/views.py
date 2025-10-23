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
from .models import Reporte, PerfilUsuario, Publicacion, Multa, BotonPanico, ObjetoPerdido

# local forms
from .forms import (
    LoginForm, ReporteForm,
    ProfileForm, PublicacionForm, MultaForm, ObjetoPerdidoForm
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
class MultaListView(LoginRequiredMixin, ListView):
    model = Multa
    template_name = "multas/lista_multas.html"
    context_object_name = "multas"

    def get_queryset(self):
        return Multa.objects.filter(_vecino=self.request.user)

class MultaCreateView(LoginRequiredMixin, CreateView):
    model = Multa
    form_class = MultaForm
    template_name = "multas/crear_multa.html"
    success_url = reverse_lazy("lista_multas")

    def form_valid(self, form):
        form.instance._vecino = self.request.user
        return super().form_valid(form)

class MultaUpdateView(LoginRequiredMixin, UpdateView):
    model = Multa
    form_class = MultaForm
    template_name = "multas/editar_multa.html"
    success_url = reverse_lazy("lista_multas")

class MultaDeleteView(LoginRequiredMixin, DeleteView):
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

class SoloAdminMixin(UserPassesTestMixin):
    def test_func(self):
        return self.request.user.rol == "admin"

class DashboardAdminView(LoginRequiredMixin, SoloAdminMixin, TemplateView):
    template_name = "admin/dashboard_admin.html"

    def get_context_data(self, **kwargs):
        from .models import Reporte, Multa, Publicacion, BotonPanico
        context = super().get_context_data(**kwargs)
        context["reportes_pendientes"] = Reporte.objects.filter(_estado="Recibido").count()
        context["multas_pendientes"] = Multa.objects.filter(_pagada=False).count()
        context["publicaciones_recientes"] = Publicacion.objects.order_by("-_fecha")[:5]
        context["alertas_activas"] = BotonPanico.objects.filter(_activo=True).count()
        return context

class ListaObjetosPerdidosView(LoginRequiredMixin, ListView):
    model = ObjetoPerdido
    template_name = "" # Pendiente la template
    context_object_name = "objetos"
    ordering = ["-_fecha"]

class CrearObjetoPerdidoView(LoginRequiredMixin, CreateView):
    model = ObjetoPerdido
    template_name = "" # Pendiente la template
    form_class = ObjetoPerdidoForm
    success_url = reverse_lazy() # Pendiente de template

    def form_valid(self, form):
        form.instance._usuario = self.request.user
        return super().form_valid(form)