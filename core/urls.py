from django.urls import path
from .views import (
    DashboardView,
    # Reportes
    ReporteListView, ReporteCreateView, ReporteUpdateView, ReporteDeleteView,
    # Publicaciones
    PublicacionListView, PublicacionCreateView, PublicacionUpdateView, PublicacionDeleteView,
    # Multas
    MultaListView, MultaCreateView, MultaUpdateView, MultaDeleteView, PagarMultaView,
    # Auth
    LoginView, LogoutView, 
    # Perfiles
    ProfileDetailView, ProfileUpdateView,
    # Boton Panico
    ActivarBotonPanicoView, HistorialBotonPanicoView
    # Admin
    ,DashboardAdminView,
    # Objeto Perdido
    ListaObjetosPerdidosView, CrearObjetoPerdidoView, 
    #creacion de usuarios por admin
    CrearUsuarioView,
    # Areas Comunes
    ListaAreasView, CrearAreaView, CrearReservaView,
)

urlpatterns = [
    path("", DashboardView.as_view(), name="dashboard"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),

    # Reportes
    path("reportes/", ReporteListView.as_view(), name="lista_reportes"),
    path("reportes/nuevo/", ReporteCreateView.as_view(), name="crear_reporte"),
    path("reportes/<int:pk>/editar/", ReporteUpdateView.as_view(), name="editar_reporte"),
    path("reportes/<int:pk>/eliminar/", ReporteDeleteView.as_view(), name="eliminar_reporte"),

    # Publicaciones
    path("publicaciones/", PublicacionListView.as_view(), name="lista_publicaciones"),
    path("publicaciones/nueva/", PublicacionCreateView.as_view(), name="crear_publicacion"),
    path("publicaciones/<int:pk>/editar/", PublicacionUpdateView.as_view(), name="editar_publicacion"),
    path("publicaciones/<int:pk>/eliminar/", PublicacionDeleteView.as_view(), name="eliminar_publicacion"),

    # Multas
    path("multas/", MultaListView.as_view(), name="lista_multas"),
    path("multas/nueva/", MultaCreateView.as_view(), name="crear_multa"),
    path("multas/<int:pk>/editar/", MultaUpdateView.as_view(), name="editar_multa"),
    path("multas/<int:pk>/eliminar/", MultaDeleteView.as_view(), name="eliminar_multa"),
    path("multas/<int:pk>/pagar/", PagarMultaView.as_view(), name="pagar_multa"),

    # Perfil usuario
    path("perfil/", ProfileDetailView.as_view(), name="ver_perfil"),
    path("perfil/editar/", ProfileUpdateView.as_view(), name="editar_perfil"),

    #Boton Panico
    path("panico/activar/", ActivarBotonPanicoView.as_view(), name="activar_panico"),
    path("panico/historial/", HistorialBotonPanicoView.as_view(), name="historial_panico"),

    #Vista de administracion
    path("administrador/dashboard/", DashboardAdminView.as_view(), name="dashboard_admin"),

    ##Objetos Perdidos 
    path("objetos-perdidos/", ListaObjetosPerdidosView.as_view(), name="lista_objetos_perdidos"),
    path("objetos-perdidos/nuevo/", CrearObjetoPerdidoView.as_view(), name="crear_objeto_perdido"),

    #Creacion de usuarios por admin
    path("administrador/crear-usuario/", CrearUsuarioView.as_view(), name="crear_usuario"),

    # Areas Comunes
    path("", ListaAreasView.as_view(), name="lista_areas"),
    path("nueva/", CrearAreaView.as_view(), name="crear_area"),
    path("reservar/", CrearReservaView.as_view(), name="crear_reserva"),
]