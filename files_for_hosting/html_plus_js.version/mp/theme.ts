// Типы для системы тем
interface ThemeConfig {
    isDark: boolean;
    className: string;
    sunIcon: string;
    moonIcon: string;
    sunTitle: string;
    moonTitle: string;
}

// Конфигурация тем
const themeConfig: ThemeConfig = {
    isDark: true,
    className: 'dark-theme',
    sunIcon: '☀️',
    moonIcon: '🌙',
    sunTitle: 'Переключить на светлую тему',
    moonTitle: 'Переключить на темную тему'
};

// Класс для управления темами //
class ThemeManager {
    private toggleBtn: HTMLElement | null;
    private config: ThemeConfig;

    constructor(config: ThemeConfig) {
        this.config = config;
        this.toggleBtn = null;
        this.init();
    }

    private init(): void {
        document.addEventListener('DOMContentLoaded', () => {
            this.toggleBtn = document.getElementById('theme-toggle');
            if (!this.toggleBtn) {
                console.error('Кнопка переключения темы не найдена');
                return;
            }

            this.loadTheme();
            this.setupEventListeners();
            this.addAnimations();
        });
    }

    private loadTheme(): void {
        const themePref = localStorage.getItem('theme');
        this.config.isDark = themePref === null ? true : themePref === 'dark';
        
        if (themePref === null) {
            localStorage.setItem('theme', 'dark');
        }
        
        this.setTheme(this.config.isDark);
    }

    private setupEventListeners(): void {
        if (!this.toggleBtn) return;

        // Обработчик клика
        this.toggleBtn.addEventListener('click', () => {
            this.config.isDark = !this.config.isDark;
            this.setTheme(this.config.isDark);
            localStorage.setItem('theme', this.config.isDark ? 'dark' : 'light');
        });

        // Обработчик прокрутки
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });

        // Обработчик клавиатуры
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            this.handleKeyboard(e);
        });
    }

    private setTheme(isDark: boolean): void {
        if (!this.toggleBtn) return;

        if (isDark) {
            document.body.classList.add(this.config.className);
            this.toggleBtn.textContent = this.config.sunIcon;
            this.toggleBtn.title = this.config.sunTitle;
        } else {
            document.body.classList.remove(this.config.className);
            this.toggleBtn.textContent = this.config.moonIcon;
            this.toggleBtn.title = this.config.moonTitle;
        }
    }

    private handleScroll(): void {
        if (!this.toggleBtn) return;

        if (window.scrollY > 100) {
            this.toggleBtn.style.transform = 'scale(0.9)';
        } else {
            this.toggleBtn.style.transform = 'scale(1)';
        }
    }

    private handleKeyboard(e: KeyboardEvent): void {
        if (e.altKey && e.key === 't') {
            e.preventDefault();
            if (this.toggleBtn) {
                this.toggleBtn.click();
            }
        }
    }

    private addAnimations(): void {
        if (!this.toggleBtn) return;

        // Анимация появления
        this.toggleBtn.style.opacity = '0';
        this.toggleBtn.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            if (this.toggleBtn) {
                this.toggleBtn.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                this.toggleBtn.style.opacity = '1';
                this.toggleBtn.style.transform = 'scale(1)';
            }
        }, 500);

        // Эффект пульсации при первом посещении
        const hasVisited = localStorage.getItem('hasVisited');
        if (!hasVisited) {
            localStorage.setItem('hasVisited', 'true');
            this.addPulseAnimation();
        }

        // Уведомление о горячих клавишах
        if (!localStorage.getItem('keyboardHintShown')) {
            setTimeout(() => {
                this.showKeyboardHint();
            }, 2000);
        }
    }

    private addPulseAnimation(): void {
        if (!this.toggleBtn) return;

        this.toggleBtn.style.animation = 'pulse 2s ease-in-out';
        
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
            if (this.toggleBtn) {
                this.toggleBtn.style.animation = '';
            }
        }, 2000);
    }

    private showKeyboardHint(): void {
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
        }, 5000);
        
        localStorage.setItem('keyboardHintShown', 'true');
    }
}

// Инициализация менеджера тем
new ThemeManager(themeConfig); 