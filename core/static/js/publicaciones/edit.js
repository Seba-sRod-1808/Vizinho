
  document.addEventListener('DOMContentLoaded', function() {
    const tituloInput = document.querySelector('input[name="_titulo"]');
    const contenidoInput = document.querySelector('textarea[name="_contenido"]');
    
    // Aplicar estilos
    if (tituloInput) {
      tituloInput.classList.add('form-control');
      tituloInput.setAttribute('placeholder', 'Ej: Reunión de vecinos este sábado');
      tituloInput.setAttribute('maxlength', '200');
    }
    
    if (contenidoInput) {
      contenidoInput.classList.add('form-control');
      contenidoInput.setAttribute('placeholder', 'Escribe aquí el contenido de tu publicación...');
      contenidoInput.setAttribute('maxlength', '2000');
    }

    // Contador de caracteres
    const charCount = document.getElementById('charCount');
    const charCounter = document.getElementById('charCounter');
    
    if (contenidoInput) {
      contenidoInput.addEventListener('input', function() {
        const count = this.value.length;
        charCount.textContent = count;
        
        if (count > 1800) {
          charCounter.classList.add('danger');
          charCounter.classList.remove('warning');
        } else if (count > 1500) {
          charCounter.classList.add('warning');
          charCounter.classList.remove('danger');
        } else {
          charCounter.classList.remove('warning', 'danger');
        }
      });

      // Actualizar contador inicial con el valor existente
      contenidoInput.dispatchEvent(new Event('input'));
    }

    // Vista previa en tiempo real
    const previewContent = document.getElementById('previewContent');

    function updatePreview() {
      const titulo = tituloInput ? tituloInput.value.trim() : '';
      const contenido = contenidoInput ? contenidoInput.value.trim() : '';

      if (titulo || contenido) {
        previewContent.innerHTML = `
          ${titulo ? `<h5>${titulo}</h5>` : ''}
          ${contenido ? `<p>${contenido.replace(/\n/g, '<br>')}</p>` : ''}
        `;
      }
    }

    if (tituloInput) tituloInput.addEventListener('input', updatePreview);
    if (contenidoInput) contenidoInput.addEventListener('input', updatePreview);
    
    // Inicializar vista previa con valores existentes
    updatePreview();

    // Confirmación antes de salir si hay cambios
    let formChanged = false;
    const form = document.getElementById('editForm');
    
    form.addEventListener('input', function() {
      formChanged = true;
    });

    window.addEventListener('beforeunload', function(e) {
      if (formChanged) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    form.addEventListener('submit', function() {
      formChanged = false;
    });
  });