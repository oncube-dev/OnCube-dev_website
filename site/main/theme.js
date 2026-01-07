document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('theme-toggle');
    
    document.body.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            showThemeNotification();
        });
    
    function showThemeNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1001;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(8px);
        `;
        notification.textContent = '🎨 Темная тема зафиксирована';
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
        toggleBtn.textContent = '🌙';
        toggleBtn.title = 'Темная тема (фиксированная)';
        
        toggleBtn.style.opacity = '0';
        toggleBtn.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            toggleBtn.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            toggleBtn.style.opacity = '1';
            toggleBtn.style.transform = 'scale(1)';
        }, 500);
        
        const hasVisited = localStorage.getItem('hasVisited');
        if (!hasVisited) {
            localStorage.setItem('hasVisited', 'true');
            toggleBtn.style.animation = 'pulse 2s ease-in-out';
            
            const style = document.createElement('style');
            style.textContent = `
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
            
            setTimeout(() => {
                toggleBtn.style.animation = '';
            }, 2000);
        }
    }
});

window.addEventListener('scroll', function() {
    const toggleBtn = document.getElementById('theme-toggle');
    
    if (window.scrollY > 100) {
        toggleBtn.style.transform = 'scale(0.9)';
    } else {
        toggleBtn.style.transform = 'scale(1)';
    }
});

document.addEventListener('keydown', function(e) {
    if (e.altKey && e.key === 't') {
        e.preventDefault();
        const toggleBtn = document.getElementById('theme-toggle');
        toggleBtn.click();
    }
});
