document.addEventListener('DOMContentLoaded', function() {
    const tituloInput = document.querySelector('input[name="_titulo"]');
    const descripcionInput = document.querySelector('textarea[name="_descripcion"]');
    const imagenInput = document.querySelector('input[name="_imagen"]');
    const imagePreview = document.getElementById('imagePreview');
    const fileName = document.getElementById('fileName');
    const uploadText = document.getElementById('uploadText');
    
    // Aplicar estilos
    if (tituloInput) {
        tituloInput.classList.add('form-control');
        tituloInput.setAttribute('placeholder', 'Ej: Llaves de casa');
        tituloInput.setAttribute('maxlength', '200');
    }
    
    if (descripcionInput) {
        descripcionInput.classList.add('form-control');
        descripcionInput.setAttribute('placeholder', 'Describe el objeto con el mayor detalle posible...');
        descripcionInput.setAttribute('maxlength', '1000');
    }

    if (imagenInput) {
        imagenInput.classList.add('file-input-hidden');
    }

    // Contador de caracteres
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

        // Actualizar contador inicial con el valor existente
        descripcionInput.dispatchEvent(new Event('input'));
    }

    // Preview de imagen
    if (imagenInput) {
        imagenInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            
            if (file) {
                fileName.textContent = `Archivo seleccionado: ${file.name}`;
                uploadText.textContent = 'Cambiar Fotografía';
                
                // Validar tamaño (10MB máximo)
                const maxSize = 10 * 1024 * 1024;
                if (file.size > maxSize) {
                    alert('⚠️ El archivo es demasiado grande. El tamaño máximo es 10MB.');
                    imagenInput.value = '';
                    fileName.textContent = '';
                    return;
                }
                
                // Validar tipo
                const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                if (!validTypes.includes(file.type)) {
                    alert('⚠️ Formato no válido. Solo se aceptan archivos JPG y PNG.');
                    imagenInput.value = '';
                    fileName.textContent = '';
                    return;
                }
                
                // Mostrar preview
                const reader = new FileReader();
                reader.onload = function(event) {
                    if (imagePreview.classList.contains('no-image-placeholder')) {
                        const img = document.createElement('img');
                        img.src = event.target.result;
                        img.className = 'image-preview';
                        img.alt = 'Preview';
                        imagePreview.parentNode.replaceChild(img, imagePreview);
                    } else {
                        imagePreview.src = event.target.result;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Vista previa del contenido
    const previewContent = document.getElementById('previewContent');

    function updatePreview() {
        const titulo = tituloInput ? tituloInput.value.trim() : '';
        const descripcion = descripcionInput ? descripcionInput.value.trim() : '';

        if (titulo || descripcion) {
            previewContent.innerHTML = `
                ${titulo ? `<h5>${titulo}</h5>` : ''}
                ${descripcion ? `<p>${descripcion.replace(/\n/g, '<br>')}</p>` : ''}
            `;
        } else {
            previewContent.innerHTML = `
                <div class="preview-empty">
                    <i class="bi bi-bag"></i>
                    Los campos están vacíos
                </div>
            `;
        }
    }

    if (tituloInput) tituloInput.addEventListener('input', updatePreview);
    if (descripcionInput) descripcionInput.addEventListener('input', updatePreview);
    
    // Inicializar vista previa con valores existentes
    updatePreview();

    // Confirmación antes de salir
    let formChanged = false;
    const form = document.getElementById('editObjectForm');
    
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