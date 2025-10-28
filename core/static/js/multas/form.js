document.addEventListener('DOMContentLoaded', function() {
    // Buscar campos del formulario
    const tituloInput = document.querySelector('input[name="_titulo"]');
    const descripcionInput = document.querySelector('textarea[name="_descripcion"]');
    const ubicacionInput = document.querySelector('input[name="_ubicacion"]');
    
    // Aplicar estilos a los campos
    if (tituloInput) {
        tituloInput.classList.add('form-control');
        tituloInput.setAttribute('placeholder', 'Ej: Fuga de agua en calle principal');
        tituloInput.setAttribute('maxlength', '200');
    }
    
    if (descripcionInput) {
        descripcionInput.classList.add('form-control');
        descripcionInput.setAttribute('placeholder', 'Describe detalladamente el problema o incidente...');
        descripcionInput.setAttribute('maxlength', '1000');
    }
    
    if (ubicacionInput) {
        ubicacionInput.classList.add('form-control');
        ubicacionInput.setAttribute('placeholder', 'Ej: Calle 5, casa #123');
    }

    // Contador de caracteres para descripción
    const charCount = document.getElementById('charCount');
    const charCounter = document.getElementById('charCounter');
    
    if (descripcionInput && charCount) {
        descripcionInput.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = count;
            
            if (count > 900) {
                charCounter.classList.add('danger');
                charCounter.classList.remove('warning');
            } else if (count > 750) {
                charCounter.classList.add('warning');
                charCounter.classList.remove('danger');
            } else {
                charCounter.classList.remove('warning', 'danger');
            }
        });

        // Actualizar contador inicial
        descripcionInput.dispatchEvent(new Event('input'));
    }

    // Vista previa en tiempo real
    const previewContent = document.getElementById('previewContent');

    function updatePreview() {
        const titulo = tituloInput ? tituloInput.value.trim() : '';
        const descripcion = descripcionInput ? descripcionInput.value.trim() : '';
        const ubicacion = ubicacionInput ? ubicacionInput.value.trim() : '';

        if (titulo || descripcion || ubicacion) {
            previewContent.innerHTML = `
                ${titulo ? `<h5>${titulo}</h5>` : ''}
                ${descripcion ? `<p>${descripcion.replace(/\n/g, '<br>')}</p>` : ''}
                ${ubicacion ? `<p style="color: #6b7280;"><i class="bi bi-geo-alt-fill"></i> ${ubicacion}</p>` : ''}
            `;
        } else {
            previewContent.innerHTML = `
                <div class="preview-empty">
                    <i class="bi bi-file-text"></i>
                    Comienza a escribir para ver una vista previa de tu reporte
                </div>
            `;
        }
    }

    if (tituloInput) tituloInput.addEventListener('input', updatePreview);
    if (descripcionInput) descripcionInput.addEventListener('input', updatePreview);
    if (ubicacionInput) ubicacionInput.addEventListener('input', updatePreview);

    // Confirmación antes de salir si hay cambios
    let formChanged = false;
    const form = document.getElementById('reportForm');
    
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