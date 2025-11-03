"""
Estos son los controladores (o vistas en DJANGO) principales de la aplicación Vizinho.
Aquí se gestionan las interacciones del usuario, la lógica de negocio y la
renderización de plantillas HTML. Se utilizan vistas basadas en clases
para aprovechar la reutilización de código y las funcionalidades integradas de Django.
Además de mantener el paradigma de POO.

Se manejan permisos de usuario, validaciones de formularios y mensajes flash
para mejorar la experiencia del usuario. Cada vista está documentada para
facilitar su comprensión y mantenimiento.

Las vistas están organizadas en secciones como autenticación, dashboard,
reportes, multas, perfil, botón de pánico, objetos perdidos y gestión de usuarios.

Cada sección contiene los controladores específicos relacionados con su funcionalidad.

Las vistas hacen uso extensivo de mixins personalizados para gestionar permisos
y comportamientos comunes, asegurando así un código limpio y mantenible.
"""
# Django imports
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse_lazy
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib import messages
from django.core.exceptions import ValidationError
from django.views import View
from django.views.generic import (
    TemplateView, ListView, CreateView,
    UpdateView, DeleteView, DetailView
)

# Local imports
from .models import (
    Reporte, PerfilUsuario, Publicacion, Multa, 
    BotonPanico, ObjetoPerdido, Usuario, DashboardService
)
from .forms import (
    LoginForm, ReporteForm, ProfileForm, PublicacionForm, 
    MultaForm, ObjetoPerdidoForm, CrearUsuarioForm
)


# ========================
# MIXINS PERSONALIZADOS (Propagación de permisos)
# ========================

class SoloAdminMixin(UserPassesTestMixin):
    """Permite acceso exclusivamente a usuarios administradores."""
    def test_func(self):
        return self.request.user.es_administrador()
    
    def handle_no_permission(self):
        # Mensaje y redirección centralizados para mantener una experiencia consistente.
        messages.error(
            self.request, 
            "No tienes permisos para acceder a esta página. Solo administradores."
        )
        return redirect('dashboard')


class PropietarioOAdminMixin(UserPassesTestMixin):
    """
    Habilita edición si el usuario es dueño del objeto o es administrador.
    """
    def test_func(self):
        obj = self.get_object()
        return self.request.user.puede_editar(obj)
    
    def handle_no_permission(self):
        messages.error(
            self.request, 
            "No tienes permisos para editar este contenido."
        )
        return redirect('dashboard')


# ========================
# AUTENTICACIÓN
# ========================

class LoginView(View):
    template_name = "login.html"

    def get(self, request):
        # Redirigir si ya está autenticado para evitar doble login
        if request.user.is_authenticated:
            return self._redirect_to_dashboard(request.user)
        return render(request, self.template_name, {"form": LoginForm()})

    def post(self, request):
        form = LoginForm(request.POST)
        if form.is_valid():
            user = authenticate(
                request,
                username=form.cleaned_data["username"],
                password=form.cleaned_data["password"]
            )
            if user is not None:
                login(request, user)
                messages.success(request, f"¡Bienvenido, {user.username}!")
                return self._redirect_to_dashboard(user)
            form.add_error(None, "Usuario o contraseña incorrectos")
        return render(request, self.template_name, {"form": form})
    
    def _redirect_to_dashboard(self, user):
        # esta es una función interna para redirigir según rol
        if user.es_administrador():
            return redirect("dashboard_admin")
        return redirect("dashboard")


class LogoutView(View):
    def get(self, request):
        username = request.user.username if request.user.is_authenticated else None
        logout(request)
        if username:
            messages.info(request, f"Hasta pronto, {username}")
        return redirect("login")


# ========================
# DASHBOARD
# ========================

class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard.html"
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update(DashboardService.obtener_resumen_vecino(self.request.user))
        return context


class DashboardAdminView(LoginRequiredMixin, SoloAdminMixin, TemplateView):
    template_name = "administrador/dashboard_admin.html"
    
    def get_context_data(self, **kwargs):
        # **kwargs** preserva compatibilidad y permite extender contexto sin romper herencia.
        context = super().get_context_data(**kwargs)
        context.update(DashboardService.obtener_estadisticas_admin())
        return context


# ========================
# REPORTES
# ========================

class ReporteListView(LoginRequiredMixin, ListView):
    model = Reporte
    template_name = "reportes/lista_reportes.html"
    context_object_name = "reportes"
    paginate_by = 10

    def get_queryset(self):
        user = self.request.user
        if user.es_administrador():
            return Reporte.objects.all().order_by("-_fecha")
        return Reporte.objects.del_usuario(user).order_by("-_fecha")

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["es_admin"] = self.request.user.es_administrador()
        return ctx


class ReporteCreateView(LoginRequiredMixin, CreateView):
    model = Reporte
    form_class = ReporteForm
    template_name = "reportes/crear_reporte.html"
    success_url = reverse_lazy("lista_reportes")

    def form_valid(self, form):
        # El autor del reporte siempre es el usuario autenticado.
        form.instance._vecino = self.request.user
        messages.success(self.request, "Reporte creado exitosamente")
        return super().form_valid(form)
    
    def form_invalid(self, form):
        messages.error(
            self.request, 
            "Error al crear el reporte. Por favor verifica los datos."
        )
        return super().form_invalid(form)


class ReporteUpdateView(LoginRequiredMixin, PropietarioOAdminMixin, UpdateView): 
    model = Reporte
    form_class = ReporteForm
    template_name = "reportes/editar_reporte.html"
    success_url = reverse_lazy("lista_reportes")
    
    def form_valid(self, form):
        messages.success(self.request, "Reporte actualizado exitosamente")
        return super().form_valid(form)


class ReporteDeleteView(LoginRequiredMixin, PropietarioOAdminMixin, DeleteView):
    model = Reporte
    template_name = "reportes/eliminar_reporte.html"
    success_url = reverse_lazy("lista_reportes")
    
    def delete(self, request, *args, **kwargs):
        """
        *args/**kwargs*: Django pasa parámetros de URL a DeleteView.
        No los usamos directamente, pero mantener la firma evita romper la herencia.
        """
        messages.success(request, "Reporte eliminado exitosamente")
        return super().delete(request, *args, **kwargs)


# ========================
# MULTAS
# ========================

class MultaListView(LoginRequiredMixin, ListView):
    model = Multa
    template_name = "multas/lista_multas.html"
    context_object_name = "multas"
    paginate_by = 10 

    def get_queryset(self):
        user = self.request.user
        if user.es_administrador():
            return Multa.objects.all().order_by("-_fecha")
        return Multa.objects.del_usuario(user).order_by("-_fecha")
    
    def get_context_data(self, **kwargs):
        """
        aca los **kwargs conservan variables internas de ListView
        """
        context = super().get_context_data(**kwargs)
        context["es_admin"] = self.request.user.es_administrador()
        
        if not context["es_admin"]:
            context["total_pendiente"] = Multa.objects.total_pendiente_usuario(
                self.request.user
            )
        return context


class MultaCreateView(LoginRequiredMixin, SoloAdminMixin, CreateView):
    model = Multa
    form_class = MultaForm
    template_name = "multas/crear_multa.html"
    success_url = reverse_lazy("lista_multas")

    def form_valid(self, form):
        # *args/**kwargs* no son necesarios aquí ta que dejamos la firma del padre intacta.
        messages.success(self.request, "Multa creada exitosamente")
        return super().form_valid(form)


class MultaUpdateView(LoginRequiredMixin, SoloAdminMixin, UpdateView):
    model = Multa
    form_class = MultaForm
    template_name = "multas/editar_multa.html"
    success_url = reverse_lazy("lista_multas")
    
    def form_valid(self, form):
        messages.success(self.request, "Multa actualizada exitosamente")
        return super().form_valid(form)


class MultaDeleteView(LoginRequiredMixin, SoloAdminMixin, DeleteView):
    model = Multa
    template_name = "multas/eliminar_multa.html"
    success_url = reverse_lazy("lista_multas")
    
    def delete(self, request, *args, **kwargs):
        # kwargs contendrá la pk, mantener firma asegura compatibilidad con DeleteView.
        messages.success(request, "Multa eliminada exitosamente")
        return super().delete(request, *args, **kwargs)


class PagarMultaView(LoginRequiredMixin, View):
    def get(self, request, pk):
        multa = get_object_or_404(Multa, pk=pk)
        if not multa.puede_pagar_usuario(request.user):
            messages.error(request, "No puedes pagar esta multa")
            return redirect("lista_multas")
        return render(request, "multas/pagar_multa.html", {"multa": multa})
    
    def post(self, request, pk):
        multa = get_object_or_404(Multa, pk=pk)
        # revalidamo los permisos para evitar pagos indebidos por manipulacion del cliente.
        if not multa.puede_pagar_usuario(request.user):
            messages.error(request, "No puedes pagar esta multa")
            return redirect("lista_multas")
        
        try:
            multa.pagar()
            messages.success(
                request, 
                f"Pago de Q{multa.monto:.2f} procesado exitosamente"
            )
        except ValidationError as e:
            messages.error(request, f"{str(e)}")
        
        return redirect("lista_multas")

# ========================
# PUBLICACIONES
# ========================

class PublicacionListView(LoginRequiredMixin, ListView):
    model = Publicacion
    template_name = "publicaciones/lista_publicaciones.html"
    context_object_name = "publicaciones"
    paginate_by = 10
    ordering = ["-_fecha"]

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["es_admin"] = self.request.user.es_administrador()
        return ctx

class PublicacionCreateView(LoginRequiredMixin, CreateView):
    model = Publicacion
    form_class = PublicacionForm
    template_name = "publicaciones/crear_publicacion.html"
    success_url = reverse_lazy("lista_publicaciones")

    def form_valid(self, form):
        form.instance._vecino = self.request.user
        messages.success(self.request, "Publicación creada exitosamente")
        return super().form_valid(form)

class PublicacionUpdateView(LoginRequiredMixin, SoloAdminMixin, UpdateView):
    model = Publicacion
    form_class = PublicacionForm
    template_name = "publicaciones/editar_publicacion.html"
    success_url = reverse_lazy("lista_publicaciones")
    
    def form_valid(self, form):
        messages.success(self.request, "Publicación actualizada exitosamente")
        return super().form_valid(form)

class PublicacionDeleteView(LoginRequiredMixin, SoloAdminMixin, DeleteView):
    model = Publicacion
    template_name = "publicaciones/eliminar_publicacion.html"
    success_url = reverse_lazy("lista_publicaciones")
    
    def delete(self, request, *args, **kwargs):
        messages.success(request, "Publicación eliminada exitosamente")
        return super().delete(request, *args, **kwargs)

# ========================
# PERFIL
# ========================

class ProfileDetailView(LoginRequiredMixin, DetailView):
    model = PerfilUsuario
    template_name = "perfil/ver_perfil.html"

    def get_object(self):
        """
        Garantiza existencia del perfil (evita DoesNotExist).
        Nota: no se reciben *args/**kwargs aquí en tu implementación,
        pero DetailView está preparado para pasarlos si fuese necesario.
        """
        perfil, created = PerfilUsuario.objects.get_or_create(
            _usuario=self.request.user
        )
        if created:
            messages.info(
                self.request, 
                "Se ha creado tu perfil automáticamente"
            )
        return perfil

class ProfileUpdateView(LoginRequiredMixin, UpdateView):
    model = PerfilUsuario
    form_class = ProfileForm
    template_name = "perfil/editar_perfil.html"
    success_url = reverse_lazy("ver_perfil")

    def get_object(self):
        """Obtiene o crea el perfil del usuario autenticado."""
        perfil, created = PerfilUsuario.objects.get_or_create(
            _usuario=self.request.user
        )
        return perfil
    
    def form_valid(self, form):
        messages.success(self.request, "Perfil actualizado exitosamente")
        return super().form_valid(form)

# ========================
# BOTÓN DE PÁNICO
# ========================

class ActivarBotonPanicoView(LoginRequiredMixin, View):
    """Crea una alerta de pánico y notifica a administradores vía canal existente."""
    def get(self, request):
        return render(request, "panico/activar_panico.html")
    
    def post(self, request):
        try:
            # Crear alerta
            BotonPanico.objects.create(_usuario=request.user)
            messages.success(
                request, 
                "¡Alerta de pánico activada correctamente! "
                "Los administradores han sido notificados."
            )
            return redirect("historial_panico")
        except Exception as e:
            messages.error(
                request, 
                f"Error al activar alerta: {str(e)}"
            )
            return redirect("dashboard")

class HistorialBotonPanicoView(LoginRequiredMixin, ListView):
    model = BotonPanico
    template_name = "panico/historial_panico.html"
    context_object_name = "alertas"
    paginate_by = 10

    def get_queryset(self):
        """
        Listado condicional, admins ven todas mientras que los usuarios ven solo las propias.
        """
        user = self.request.user
        if user.es_administrador():
            return BotonPanico.objects.all().order_by("-_fecha")
        return BotonPanico.objects.filter(_usuario=user).order_by("-_fecha")

# ========================
# OBJETOS PERDIDOS
# ========================

class ListaObjetosPerdidosView(LoginRequiredMixin, ListView):
    
    model = ObjetoPerdido
    template_name = "objeto-perdido/lista_objetos.html"
    context_object_name = "objetos"
    paginate_by = 12

    def get_queryset(self):
        # Ordena por encontrados primero, luego por fecha descendente
        return ObjetoPerdido.objects.all().order_by("_encontrado", "-_fecha")

class CrearObjetoPerdidoView(LoginRequiredMixin, CreateView):
    model = ObjetoPerdido
    template_name = "objeto-perdido/crear_objeto.html"
    form_class = ObjetoPerdidoForm
    success_url = reverse_lazy("lista_objetos_perdidos")

    def form_valid(self, form):
        form.instance._usuario = self.request.user
        messages.success(
            self.request, 
            "Objeto reportado exitosamente. Esperamos que lo encuentres pronto."
        )
        return super().form_valid(form)


# ========================
# GESTIÓN DE USUARIOS
# ========================

class CrearUsuarioView(LoginRequiredMixin, SoloAdminMixin, CreateView):
    model = Usuario
    form_class = CrearUsuarioForm
    template_name = "crear-usuario/crear_usuario.html"
    success_url = reverse_lazy("dashboard_admin")

    def form_valid(self, form):
        messages.success(
            self.request, 
            f"Usuario '{form.instance.username}' creado exitosamente"
        )
        return super().form_valid(form)
    
    def form_invalid(self, form):
        messages.error(
            self.request, 
            "Error al crear usuario. Por favor verifica los datos ingresados."
        )
        return super().form_invalid(form)
