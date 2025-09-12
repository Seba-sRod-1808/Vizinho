from django.urls import path
from .views import (
    LoginView, LogoutView, 
    ReporteListView, ReporteCreateView, ReporteUpdateView, ReporteDeleteView, 
    DashboardView, ProfileDetailView, ProfileUpdateView
    )
from .views import (
    MultaListView, MultaCreateView, MultaUpdateView,
    MultaDeleteView, PagarMultaView
)

urlpatterns = [
    path("", DashboardView.as_view(), name="dashboard"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("reportes/", ReporteListView.as_view(), name="lista_reportes"),
    path("reportes/nuevo/", ReporteCreateView.as_view(), name="crear_reporte"),
    path("reportes/<int:pk>/editar/", ReporteUpdateView.as_view(), name="editar_reporte"),
    path("reportes/<int:pk>/eliminar/", ReporteDeleteView.as_view(), name="eliminar_reporte"),
    path("perfil/", ProfileDetailView.as_view(), name="ver_perfil"),
    path("perfil/editar/", ProfileUpdateView.as_view(), name="editar_perfil"),
]

urlpatterns += [
    path("multas/", MultaListView.as_view(), name="lista_multas"),
    path("multas/nueva/", MultaCreateView.as_view(), name="crear_multa"),
    path("multas/<int:pk>/editar/", MultaUpdateView.as_view(), name="editar_multa"),
    path("multas/<int:pk>/eliminar/", MultaDeleteView.as_view(), name="eliminar_multa"),
    path("multas/<int:pk>/pagar/", PagarMultaView.as_view(), name="pagar_multa"),
]

urlpatterns += [
    path("publicaciones/", PublicacionListView.as_view(), name="lista_publicaciones"),
    path("publicaciones/nueva/", PublicacionCreateView.as_view(), name="crear_publicacion"),
    path("publicaciones/<int:pk>/editar/", PublicacionUpdateView.as_view(), name="editar_publicacion"),
    path("publicaciones/<int:pk>/eliminar/", PublicacionDeleteView.as_view(), name="eliminar_publicacion"),
]
