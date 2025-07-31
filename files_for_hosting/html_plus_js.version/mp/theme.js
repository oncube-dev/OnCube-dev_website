// Система переключения тем
document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('theme-toggle');
    const darkClass = 'dark-theme';
    
    // Получаем сохраненную тему из localStorage
    let themePref = localStorage.getItem('theme');
    let isDark = themePref === null ? true : themePref === 'dark';
    
    // Если темы нет в localStorage, сразу записываем 'dark' для единообразия
    if (themePref === null) {
        localStorage.setItem('theme', 'dark');
    }
    
    // Применяем тему при загрузке
    setTheme(isDark);
    
    // Обработчик клика по кнопке переключения темы
    toggleBtn.addEventListener('click', function() {
        isDark = !isDark;
        setTheme(isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
    
    // Функция для установки темы
    function setTheme(isDark) {
        if (isDark) {
            document.body.classList.add(darkClass);
            toggleBtn.textContent = '☀️';
            toggleBtn.title = 'Переключить на светлую тему';
        } else {
            document.body.classList.remove(darkClass);
            toggleBtn.textContent = '🌙';
            toggleBtn.title = 'Переключить на темную тему';
        }
    }
    
    // Добавляем анимацию появления кнопки
    toggleBtn.style.opacity = '0';
    toggleBtn.style.transform = 'scale(0.8)';
    
    setTimeout(() => {
        toggleBtn.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        toggleBtn.style.opacity = '1';
        toggleBtn.style.transform = 'scale(1)';
    }, 500);
    
    // Добавляем эффект пульсации при первом посещении
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
        localStorage.setItem('hasVisited', 'true');
        toggleBtn.style.animation = 'pulse 2s ease-in-out';
        
        // Создаем CSS анимацию
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
        
        // Удаляем анимацию после завершения
        setTimeout(() => {
            toggleBtn.style.animation = '';
        }, 2000);
    }
});

// Дополнительные функции для улучшения UX
window.addEventListener('scroll', function() {
    const toggleBtn = document.getElementById('theme-toggle');
    
    // Добавляем эффект при прокрутке
    if (window.scrollY > 100) {
        toggleBtn.style.transform = 'scale(0.9)';
    } else {
        toggleBtn.style.transform = 'scale(1)';
    }
});

// Добавляем поддержку клавиатуры (Alt+T для переключения темы)
document.addEventListener('keydown', function(e) {
    if (e.altKey && e.key === 't') {
        e.preventDefault();
        const toggleBtn = document.getElementById('theme-toggle');
        toggleBtn.click();
    }
});

// Добавляем уведомление о горячих клавишах при первом посещении
if (!localStorage.getItem('keyboardHintShown')) {
    setTimeout(() => {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1001;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = '💡 Совет: Alt+T для переключения темы';
        
        // Добавляем CSS анимацию
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Удаляем уведомление через 5 секунд
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
        
        localStorage.setItem('keyboardHintShown', 'true');
    }, 2000);
} 