
  // Funcionalidad de búsqueda en tiempo real
  document.getElementById('searchInput').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.publication-card');
    
    cards.forEach(card => {
      const title = card.getAttribute('data-title');
      const content = card.getAttribute('data-content');
      
      if (title.includes(searchTerm) || content.includes(searchTerm)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });