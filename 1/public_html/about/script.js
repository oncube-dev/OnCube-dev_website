// Типы для TypeScript
// Константы
const MOBILE_BREAKPOINT = 768;
const DESKTOP_FPS = 60;
const MOBILE_FPS = 30;
const DESKTOP_SPEED = 0.005;
const MOBILE_SPEED = 0.002;

// Динамическое переливание градиентов
function createDynamicGradients() {
    const gradients = [
        document.getElementById('gradient1'),
        document.getElementById('gradient2'),
        document.getElementById('gradient3')
    ].filter(Boolean);

    // Определяем мобильное устройство
    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    
    // Скрываем лишние градиенты на мобильных для производительности
    if (isMobile && gradients.length > 1) {
        if (gradients[1]) gradients[1].style.display = 'none';
        if (gradients[2]) gradients[2].style.display = 'none';
    }

    let time = 0;
    let lastTime = 0;
    const frameRate = isMobile ? MOBILE_FPS : DESKTOP_FPS;
    const frameInterval = 1000 / frameRate;

    function interpolateColor(color1, color2, factor) {
        return {
            r: Math.round(color1.r + (color2.r - color1.r) * factor),
            g: Math.round(color1.g + (color2.g - color1.g) * factor),
            b: Math.round(color1.b + (color2.b - color1.b) * factor)
        };
    }

    function updateGradients(currentTime) {
        // Ограничиваем FPS только на мобильных
        if (isMobile && currentTime - lastTime < frameInterval) {
            requestAnimationFrame(updateGradients);
            return;
        }
        lastTime = currentTime;

        // Обычная скорость для десктопа, медленная для мобильных
        time += isMobile ? MOBILE_SPEED : DESKTOP_SPEED;
        
        gradients.forEach((gradient, index) => {
            if (!gradient || (isMobile && index > 0)) return; // Только первый градиент на мобильных
            
            const phase = time + index * Math.PI / 3;
            
            // Используем только два основных цвета для плавного перехода
            const orange = { r: 255, g: 165, b: 0 };
            const purple = { r: 147, g: 51, b: 234 };
            
            // Плавный переход между оранжевым и фиолетовым
            const transition = (Math.sin(phase * 0.5) + 1) / 2; // от 0 до 1
            const currentColor = interpolateColor(orange, purple, transition);
            const oppositeColor = interpolateColor(purple, orange, transition);
            
            // Обычная прозрачность для десктопа, сниженная для мобильных
            const opacity1 = isMobile ? 0.6 : 0.7;
            const opacity2 = isMobile ? 0.4 : 0.5;
            const opacity3 = isMobile ? 0.5 : 0.6;
            
            // Обычная скорость вращения для десктопа, медленная для мобильных
            const angle = (phase * (isMobile ? 5 : 10)) % 360;
            
            // Обычное движение для десктопа, минимальное для мобильных
            const pos1 = 35 + (isMobile ? 3 : 5) * Math.sin(phase * (isMobile ? 0.2 : 0.3));
            const pos2 = 65 + (isMobile ? 3 : 5) * Math.cos(phase * (isMobile ? 0.2 : 0.3));
            
            gradient.style.background = `
                radial-gradient(circle at ${pos1}% ${pos2}%, 
                    rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${opacity1}) 0%, 
                    rgba(${oppositeColor.r}, ${oppositeColor.g}, ${oppositeColor.b}, ${opacity2 * 0.2}) 50%, 
                    transparent 70%),
                radial-gradient(circle at ${pos2}% ${pos1}%, 
                    rgba(${oppositeColor.r}, ${oppositeColor.g}, ${oppositeColor.b}, ${opacity2}) 0%, 
                    rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${opacity1 * 0.2}) 50%, 
                    transparent 70%),
                conic-gradient(from ${angle}deg, 
                    rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${opacity3}) 0deg, 
                    rgba(${oppositeColor.r}, ${oppositeColor.g}, ${oppositeColor.b}, ${opacity3}) 180deg, 
                    rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${opacity3}) 360deg)
            `;
        });
        
        requestAnimationFrame(updateGradients);
    }
    
    requestAnimationFrame(updateGradients);
}

// Анимация появления карточек
function animateCards() {
    const cards = document.querySelectorAll('.creator-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    const target = entry.target;
                    target.style.opacity = '1';
                    target.style.transform = 'translateY(0)';
                }, index * 200); // Задержка для каждой следующей карточки
            }
        });
    }, { threshold: 0.1 });

    cards.forEach((card) => {
        const cardElement = card;
        cardElement.style.opacity = '0';
        cardElement.style.transform = 'translateY(30px)';
        cardElement.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// Обработка наведения на карточки
function setupCardHoverEffects() {
    const cards = document.querySelectorAll('.creator-card');
    
    cards.forEach((card) => {
        const cardElement = card;
        
        cardElement.addEventListener('mouseenter', () => {
            cardElement.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        cardElement.addEventListener('mouseleave', () => {
            cardElement.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Утилиты для производительности
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = window.setTimeout(() => func(...args), wait);
    };
}

// Инициализация всех функций после загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    createDynamicGradients();
    animateCards();
    setupCardHoverEffects();
});

// Обработка изменения размера окна с debounce для производительности
window.addEventListener('resize', debounce(() => {
    // Перезапускаем градиенты при изменении размера окна
    createDynamicGradients();
}, 250)); 