document.addEventListener('DOMContentLoaded', function() {
    // Buscar campos del formulario
    const bioInput = document.querySelector('textarea[name="_bio"]');
    const fotoInput = document.getElementById('id__foto');
    const photoPreview = document.getElementById('photoPreview');
    const fileName = document.getElementById('fileName');
    const uploadText = document.getElementById('uploadText');
    
    // Aplicar estilos al textarea
    if (bioInput) {
        bioInput.classList.add('form-control');
        bioInput.setAttribute('placeholder', 'Escribe algo sobre ti...');
        bioInput.setAttribute('maxlength', '500');
    }

    // Contador de caracteres para biografía
    const charCount = document.getElementById('charCount');
    const charCounter = document.getElementById('charCounter');
    
    if (bioInput && charCount) {
        bioInput.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = count;
            
            if (count > 450) {
                charCounter.classList.add('danger');
                charCounter.classList.remove('warning');
            } else if (count > 400) {
                charCounter.classList.add('warning');
                charCounter.classList.remove('danger');
            } else {
                charCounter.classList.remove('warning', 'danger');
            }
        });

        // Actualizar contador inicial
        bioInput.dispatchEvent(new Event('input'));
    }

    // Preview de la foto
    if (fotoInput) {
        fotoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            
            if (file) {
                // Mostrar nombre del archivo
                fileName.textContent = `Archivo seleccionado: ${file.name}`;
                uploadText.textContent = 'Cambiar Foto';
                
                // Validar tamaño (5MB máximo)
                const maxSize = 5 * 1024 * 1024; // 5MB en bytes
                if (file.size > maxSize) {
                    alert('⚠️ El archivo es demasiado grande. El tamaño máximo es 5MB.');
                    fotoInput.value = '';
                    fileName.textContent = '';
                    return;
                }
                
                // Validar tipo de archivo
                const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                if (!validTypes.includes(file.type)) {
                    alert('⚠️ Formato no válido. Solo se aceptan archivos JPG y PNG.');
                    fotoInput.value = '';
                    fileName.textContent = '';
                    return;
                }
                
                // Mostrar preview
                const reader = new FileReader();
                reader.onload = function(event) {
                    // Si es una imagen placeholder, reemplazarla
                    if (photoPreview.classList.contains('no-photo-placeholder')) {
                        const img = document.createElement('img');
                        img.src = event.target.result;
                        img.className = 'current-photo';
                        img.alt = 'Preview';
                        photoPreview.parentNode.replaceChild(img, photoPreview);
                    } else {
                        photoPreview.src = event.target.result;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Confirmación antes de salir si hay cambios
    let formChanged = false;
    const form = document.getElementById('profileForm');
    
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