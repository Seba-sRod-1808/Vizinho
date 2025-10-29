document.addEventListener('DOMContentLoaded', function() {
    // Calcular estadísticas
    const cards = document.querySelectorAll('.multa-card');
    let pendingCount = 0;
    let paidCount = 0;
    
    cards.forEach(card => {
        const status = card.dataset.estado;
        if (status === 'Pendiente' || status === 'Vencida') {
            pendingCount++;
        } else if (status === 'Pagada') {
            paidCount++;
        }
    });
    
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('paidCount').textContent = paidCount;
    
    // Funcionalidad de búsqueda y filtros
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    
    function filterMultas() {
        const searchTerm = searchInput.value.toLowerCase();
        const statusValue = statusFilter.value;
        
        cards.forEach(card => {
            const motivo = card.dataset.motivo;
            const vecino = card.dataset.vecino;
            const status = card.dataset.estado;
            
            const matchesSearch = motivo.includes(searchTerm) || vecino.includes(searchTerm);
            const matchesStatus = !statusValue || status === statusValue;
            
            if (matchesSearch && matchesStatus) {
                card.style.display = 'grid';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    searchInput.addEventListener('input', filterMultas);
    statusFilter.addEventListener('change', filterMultas);
});