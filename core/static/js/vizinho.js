/**
 * ================================================
 * VIZINHO - Animaciones Minimalistas v2.1
 * ================================================
 * 
 * Animaciones sutiles, smooth y low-profile
 * Sin librerías externas | Vanilla JS puro
 * Optimizado para performance
 */

(function() {
  'use strict';

  // ===== CONFIGURACIÓN =====
  const CONFIG = {
    transitionSpeed: 200,      // ms - Velocidad de transiciones
    scrollSpeed: 400,          // ms - Velocidad de scroll suave
    fadeSpeed: 300,            // ms - Velocidad de fade
    alertDuration: 5000,       // ms - Duración de alertas
    hoverDelay: 50,            // ms - Delay en hovers
    rippleColor: 'rgba(255, 255, 255, 0.3)',
    rippleDuration: 600        // ms - Duración del ripple
  };

  // ===== INIT AL CARGAR =====
  document.addEventListener('DOMContentLoaded', function() {
    initSmoothScroll();
    initActiveLinks();
    initCardAnimations();
    initButtonAnimations();
    initFormAnimations();
    initTableAnimations();
    initAlertAnimations();
    initTooltips();
    initSidebarAnimations();
    initLoadingStates();
    initKeyboardShortcuts();
    
    console.log('%c ✓ vizinho.js cargado ', 'background: #2563eb; color: white; padding: 2px 6px; border-radius: 3px;');
  });

  // ===== 1. SMOOTH SCROLL =====
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '#!') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // Añadir clase temporal de highlight
          target.style.transition = 'background-color 600ms ease';
          const originalBg = target.style.backgroundColor;
          target.style.backgroundColor = 'rgba(37, 99, 235, 0.05)';
          
          setTimeout(() => {
            target.style.backgroundColor = originalBg;
          }, 600);
        }
      });
    });
  }

  // ===== 2. ACTIVE LINKS (SIDEBAR) =====
  function initActiveLinks() {
    const currentPath = window.location.pathname;
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    
    sidebarLinks.forEach(link => {
      const linkPath = new URL(link.href).pathname;
      
      if (currentPath === linkPath) {
        link.classList.add('active');
      }
      
      // Smooth hover effect
      link.addEventListener('mouseenter', function() {
        if (!this.classList.contains('active')) {
          this.style.transition = `padding-left ${CONFIG.transitionSpeed}ms ease`;
        }
      });
    });
  }

  // ===== 3. CARD ANIMATIONS =====
  function initCardAnimations() {
    const cards = document.querySelectorAll('.card, .stat-card');
    
    // Fade in on load
    cards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(10px)';
      
      setTimeout(() => {
        card.style.transition = `all ${CONFIG.fadeSpeed}ms ease`;
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 50); // Staggered animation
    });
    
    // Subtle hover effect
    cards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.transition = `transform ${CONFIG.transitionSpeed}ms ease, box-shadow ${CONFIG.transitionSpeed}ms ease`;
        this.style.transform = 'translateY(-2px)';
      });
      
      card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
      });
    });
  }

  // ===== 4. BUTTON ANIMATIONS =====
  function initButtonAnimations() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
      // Ripple effect en click
      button.addEventListener('click', function(e) {
        createRipple(e, this);
      });
      
      // Subtle scale en hover
      button.addEventListener('mouseenter', function() {
        this.style.transition = `transform ${CONFIG.hoverDelay}ms ease`;
        this.style.transform = 'scale(1.02)';
      });
      
      button.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
      });
      
      // Press effect
      button.addEventListener('mousedown', function() {
        this.style.transform = 'scale(0.98)';
      });
      
      button.addEventListener('mouseup', function() {
        this.style.transform = 'scale(1.02)';
      });
    });
  }

  // ===== 5. FORM ANIMATIONS =====
  function initFormAnimations() {
    const inputs = document.querySelectorAll('.form-control, .form-select');
    
    inputs.forEach(input => {
      // Focus animation
      input.addEventListener('focus', function() {
        this.style.transition = `all ${CONFIG.transitionSpeed}ms ease`;
        this.parentElement.style.transform = 'scale(1.01)';
      });
      
      input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
      });
      
      // Label float effect (si existe)
      const label = input.previousElementSibling;
      if (label && label.tagName === 'LABEL') {
        input.addEventListener('focus', () => {
          label.style.transition = `all ${CONFIG.transitionSpeed}ms ease`;
          label.style.transform = 'translateY(-2px)';
          label.style.color = 'var(--primary)';
        });
        
        input.addEventListener('blur', () => {
          if (!input.value) {
            label.style.transform = 'translateY(0)';
            label.style.color = '';
          }
        });
      }
    });
  }

  // ===== 6. TABLE ANIMATIONS =====
  function initTableAnimations() {
    const tableRows = document.querySelectorAll('.table tbody tr');
    
    tableRows.forEach((row, index) => {
      // Fade in inicial
      row.style.opacity = '0';
      row.style.transform = 'translateX(-10px)';
      
      setTimeout(() => {
        row.style.transition = `all ${CONFIG.fadeSpeed}ms ease`;
        row.style.opacity = '1';
        row.style.transform = 'translateX(0)';
      }, index * 30);
      
      // Hover effect
      row.addEventListener('mouseenter', function() {
        this.style.transition = `background ${CONFIG.hoverDelay}ms ease, transform ${CONFIG.hoverDelay}ms ease`;
        this.style.transform = 'translateX(3px)';
      });
      
      row.addEventListener('mouseleave', function() {
        this.style.transform = 'translateX(0)';
      });
    });
  }

  // ===== 7. ALERT ANIMATIONS =====
  function initAlertAnimations() {
    const alerts = document.querySelectorAll('.alert');
    
    alerts.forEach(alert => {
      // Slide in desde arriba
      alert.style.opacity = '0';
      alert.style.transform = 'translateY(-20px)';
      
      setTimeout(() => {
        alert.style.transition = `all ${CONFIG.fadeSpeed}ms ease`;
        alert.style.opacity = '1';
        alert.style.transform = 'translateY(0)';
      }, 100);
      
      // Auto-dismiss con fade out
      setTimeout(() => {
        alert.style.transition = `all ${CONFIG.fadeSpeed}ms ease`;
        alert.style.opacity = '0';
        alert.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
          alert.remove();
        }, CONFIG.fadeSpeed);
      }, CONFIG.alertDuration);
    });
  }

  // ===== 8. TOOLTIPS SIMPLES =====
  function initTooltips() {
    const elements = document.querySelectorAll('[data-tooltip]');
    
    elements.forEach(element => {
      element.addEventListener('mouseenter', function(e) {
        const tooltipText = this.getAttribute('data-tooltip');
        const tooltip = createTooltip(tooltipText);
        
        document.body.appendChild(tooltip);
        
        const rect = this.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
        
        setTimeout(() => {
          tooltip.style.opacity = '1';
          tooltip.style.transform = 'translateY(0)';
        }, 10);
        
        this._tooltip = tooltip;
      });
      
      element.addEventListener('mouseleave', function() {
        if (this._tooltip) {
          this._tooltip.style.opacity = '0';
          this._tooltip.style.transform = 'translateY(-5px)';
          
          setTimeout(() => {
            if (this._tooltip) {
              this._tooltip.remove();
            }
          }, CONFIG.transitionSpeed);
        }
      });
    });
  }

  // ===== 9. SIDEBAR ANIMATIONS =====
  function initSidebarAnimations() {
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    
    sidebarLinks.forEach((link, index) => {
      link.style.opacity = '0';
      link.style.transform = 'translateX(-10px)';
      
      setTimeout(() => {
        link.style.transition = `all ${CONFIG.fadeSpeed}ms ease`;
        link.style.opacity = '1';
        link.style.transform = 'translateX(0)';
      }, index * 40);
    });
  }

  // ===== 10. LOADING STATES =====
  function initLoadingStates() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      form.addEventListener('submit', function() {
        const submitBtn = this.querySelector('button[type="submit"]');
        
        if (submitBtn && !submitBtn.disabled) {
          const originalContent = submitBtn.innerHTML;
          submitBtn.disabled = true;
          submitBtn.style.transition = `all ${CONFIG.transitionSpeed}ms ease`;
          submitBtn.style.opacity = '0.6';
          
          // Spinner simple
          submitBtn.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            procesando...
          `;
          
          // Backup: restaurar después de 10 segundos
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.innerHTML = originalContent;
          }, 10000);
        }
      });
    });
  }

  // ===== 11. KEYBOARD SHORTCUTS =====
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
      // ESC para cerrar modales
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal.show');
        if (openModal && typeof bootstrap !== 'undefined') {
          const modal = bootstrap.Modal.getInstance(openModal);
          if (modal) modal.hide();
        }
      }
      
      // Ctrl/Cmd + K para buscar
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"], input[name="search"]');
        if (searchInput) {
          searchInput.focus();
          searchInput.style.transition = `all ${CONFIG.transitionSpeed}ms ease`;
          searchInput.style.transform = 'scale(1.05)';
          setTimeout(() => {
            searchInput.style.transform = 'scale(1)';
          }, CONFIG.transitionSpeed);
        }
      }
    });
  }

  // ===== UTILIDADES =====

  // Crear efecto ripple
  function createRipple(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = CONFIG.rippleColor;
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = `ripple ${CONFIG.rippleDuration}ms ease-out`;
    ripple.style.pointerEvents = 'none';
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, CONFIG.rippleDuration);
  }

  // Crear tooltip
  function createTooltip(text) {
    const tooltip = document.createElement('div');
    tooltip.textContent = text;
    tooltip.style.position = 'absolute';
    tooltip.style.background = 'rgba(15, 23, 42, 0.95)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '6px 12px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '0.8rem';
    tooltip.style.fontFamily = 'IBM Plex Mono, monospace';
    tooltip.style.zIndex = '9999';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.whiteSpace = 'nowrap';
    tooltip.style.opacity = '0';
    tooltip.style.transform = 'translateY(-5px)';
    tooltip.style.transition = `all ${CONFIG.transitionSpeed}ms ease`;
    
    return tooltip;
  }

  // Fade out helper
  function fadeOut(element, callback) {
    element.style.transition = `opacity ${CONFIG.fadeSpeed}ms ease`;
    element.style.opacity = '0';
    
    setTimeout(() => {
      element.style.display = 'none';
      if (callback) callback();
    }, CONFIG.fadeSpeed);
  }

  // Fade in helper
  function fadeIn(element, display = 'block') {
    element.style.display = display;
    element.style.opacity = '0';
    
    setTimeout(() => {
      element.style.transition = `opacity ${CONFIG.fadeSpeed}ms ease`;
      element.style.opacity = '1';
    }, 10);
  }

  // ===== CSS INJECTION PARA ANIMACIONES =====
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .fade-in-up {
      animation: fadeInUp ${CONFIG.fadeSpeed}ms ease;
    }
    
    /* Smooth transitions para todo */
    * {
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Loading spinner */
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .spinner-border {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      vertical-align: text-bottom;
      border: 0.15em solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }
    
    .spinner-border-sm {
      width: 0.875rem;
      height: 0.875rem;
      border-width: 0.12em;
    }
  `;
  document.head.appendChild(style);

  // ===== EXPONER API GLOBAL =====
  window.vizinho = {
    fadeOut: fadeOut,
    fadeIn: fadeIn,
    createRipple: createRipple,
    config: CONFIG
  };

  // ===== LAZY LOAD IMAGES =====
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          img.style.transition = `opacity ${CONFIG.fadeSpeed}ms ease`;
          img.style.opacity = '0';
          
          img.src = img.dataset.src;
          
          img.onload = () => {
            img.style.opacity = '1';
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          };
        }
      });
    });

    document.querySelectorAll('img.lazy').forEach(img => {
      imageObserver.observe(img);
    });
  }

  // ===== PAGE TRANSITION =====
  window.addEventListener('beforeunload', function() {
    document.body.style.transition = `opacity ${CONFIG.fadeSpeed}ms ease`;
    document.body.style.opacity = '0';
  });

  // ===== SCROLL ANIMATIONS =====
  let scrollTimeout;
  window.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);
    
    // Añadir clase cuando está scrolleando
    document.body.classList.add('scrolling');
    
    scrollTimeout = setTimeout(() => {
      document.body.classList.remove('scrolling');
    }, 150);
  }, { passive: true });

  // ===== LOG EN DESARROLLO =====
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log(`%c⚡ Animaciones: ${Object.keys(CONFIG).length} configuraciones`,
                'color: #10b981; font-family: monospace;');
  }

})();

// ===== HELPER GLOBAL PARA CONFIRM =====
window.confirmAction = function(message = '¿estás seguro?') {
  return new Promise((resolve) => {
    const result = confirm(message);
    resolve(result);
  });
};

// ===== COPY TO CLIPBOARD =====
window.copyToClipboard = function(text, button) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      if (button) {
        const original = button.innerHTML;
        button.innerHTML = '<i class="bi bi-check"></i> copiado';
        button.style.transition = 'all 200ms ease';
        button.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
          button.style.transform = 'scale(1)';
          setTimeout(() => {
            button.innerHTML = original;
          }, 100);
        }, 1500);
      }
    });
  }
};