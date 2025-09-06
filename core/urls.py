from django.urls import path
from .views import (
    LoginView, LogoutView, 
    ReporteListView, ReporteCreateView, ReporteUpdateView, ReporteDeleteView
    )

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("reportes/", ReporteListView.as_view(), name="lista_reportes"),
    path("reportes/nuevo/", ReporteCreateView.as_view(), name="crear_reporte"),
    path("reportes/<int:pk>/editar/", ReporteUpdateView.as_view(), name="editar_reporte"),
    path("reportes/<int:pk>/eliminar/", ReporteDeleteView.as_view(), name="eliminar_reporte"),
]
