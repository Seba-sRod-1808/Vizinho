document.addEventListener('DOMContentLoaded', function() {
    const vecinoSelect = document.querySelector('select[name="_vecino"]');
    const montoInput = document.querySelector('input[name="_monto"]');
    const motivoInput = document.querySelector('textarea[name="_motivo"]');
    const estadoSelect = document.querySelector('select[name="_estado"]');
    
    // Aplicar estilos
    if (vecinoSelect) {
        vecinoSelect.classList.add('form-control');
    }
    
    if (montoInput) {
        montoInput.classList.add('form-control');
        montoInput.setAttribute('placeholder', 'Ej: 150.00');
        montoInput.setAttribute('step', '0.01');
        montoInput.setAttribute('min', '0');
    }
    
    if (motivoInput) {
        motivoInput.classList.add('form-control');
        motivoInput.setAttribute('placeholder', 'Describe el motivo de la multa...');
        motivoInput.setAttribute('maxlength', '500');
    }
    
    if (estadoSelect) {
        estadoSelect.classList.add('form-control');
    }

    // Contador de caracteres para motivo
    const charCount = document.getElementById('charCount');
    const charCounter = document.getElementById('charCounter');
    
    if (motivoInput && charCount) {
        motivoInput.addEventListener('input', function() {
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

        motivoInput.dispatchEvent(new Event('input'));
    }

    // Vista previa en tiempo real
    const previewContent = document.getElementById('previewContent');

    function updatePreview() {
        const vecino = vecinoSelect ? vecinoSelect.options[vecinoSelect.selectedIndex].text : '';
        const monto = montoInput ? montoInput.value.trim() : '';
        const motivo = motivoInput ? motivoInput.value.trim() : '';
        const estado = estadoSelect ? estadoSelect.options[estadoSelect.selectedIndex].text : '';

        if (vecino || monto || motivo) {
            const montoDisplay = monto ? `Q${parseFloat(monto).toFixed(2)}` : 'Q0.00';
            
            previewContent.innerHTML = `
                <div class="preview-amount">${montoDisplay}</div>
                ${vecino && vecino !== '---------' ? `<p><strong>Vecino:</strong> ${vecino}</p>` : ''}
                ${motivo ? `<p><strong>Motivo:</strong> ${motivo}</p>` : ''}
                ${estado && estado !== '---------' ? `<p><strong>Estado:</strong> ${estado}</p>` : ''}
            `;
        } else {
            previewContent.innerHTML = `
                <div class="preview-empty">
                    <i class="bi bi-cash-coin"></i>
                    Comienza a completar el formulario para ver una vista previa
                </div>
            `;
        }
    }

    if (vecinoSelect) vecinoSelect.addEventListener('change', updatePreview);
    if (montoInput) montoInput.addEventListener('input', updatePreview);
    if (motivoInput) motivoInput.addEventListener('input', updatePreview);
    if (estadoSelect) estadoSelect.addEventListener('change', updatePreview);

    // Validación del monto
    if (montoInput) {
        montoInput.addEventListener('blur', function() {
            const value = parseFloat(this.value);
            if (!isNaN(value) && value >= 0) {
                this.value = value.toFixed(2);
            }
        });
    }

    // Confirmación antes de salir si hay cambios
    let formChanged = false;
    const form = document.getElementById('multaForm');
    
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