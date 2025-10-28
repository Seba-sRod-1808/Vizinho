// Ocultar loading overlay cuando la página cargue
    window.addEventListener('load', function() {
      document.getElementById('loadingOverlay').classList.add('hidden');
    });
    
    // Agregar clase active basada en la URL actual
    document.addEventListener('DOMContentLoaded', function() {
      const currentPath = window.location.pathname;
      const links = document.querySelectorAll('.sidebar a');
      
      links.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
          link.classList.add('active');
        }
      });
    });