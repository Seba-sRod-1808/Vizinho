document.addEventListener('DOMContentLoaded', function() {
    const deleteForm = document.getElementById('deleteForm');
    const deleteButton = document.getElementById('deleteButton');
    
    deleteForm.addEventListener('submit', function(e) {
        // Confirmación adicional de seguridad
        const confirmDelete = confirm('⚠️ ÚLTIMA ADVERTENCIA\n\n¿Realmente deseas eliminar esta multa?\n\nEsta acción NO se puede deshacer y se perderá todo el historial asociado.');
        
        if (!confirmDelete) {
            e.preventDefault();
            return false;
        }
        
        // Deshabilitar botón para evitar doble clic
        deleteButton.disabled = true;
        deleteButton.innerHTML = '<i class="bi bi-hourglass-split"></i> Eliminando...';
    });
});