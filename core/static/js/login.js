    document.addEventListener('DOMContentLoaded', function() {
      // Aplicar estilos a los campos del formulario
      const usernameField = document.querySelector('input[name="username"]');
      const passwordField = document.querySelector('input[name="password"]');
      
      if (usernameField) {
        usernameField.classList.add('form-control');
        usernameField.setAttribute('placeholder', 'Ingresa tu usuario');
      }
      
      if (passwordField) {
        passwordField.classList.add('form-control');
        passwordField.setAttribute('placeholder', 'Ingresa tu contraseña');
      }

      // Animación del logo
      const logo = document.querySelector('.logo-container');
      logo.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1) rotate(5deg)';
      });
      
      logo.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1) rotate(0deg)';
      });
    });