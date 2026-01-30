// JavaScript básico para Dreamplay
console.log('🎬 Dreamplay cargado correctamente');

// Navegación suave
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Efecto de scroll en el header
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(45, 27, 105, 0.95)';
    } else {
        header.style.background = 'linear-gradient(135deg, #2D1B69, #1a103a)';
    }
});

// Contador animado para estadísticas
function animateCounter(element, target, duration) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start) + '+';
        }
    }, 16);
}

// Iniciar contadores cuando son visibles
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statCards = entry.target.querySelectorAll('.stat-card h3');
            statCards.forEach(card => {
                const target = parseInt(card.textContent);
                animateCounter(card, target, 2000);
            });
            observer.unobserve(entry.target);
        }
    });
});

observer.observe(document.querySelector('.stats'));

// Mensaje de bienvenida
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dreamplay listo para usar');
});