// ===== YUVA VERTICALS - GENERAL JAVASCRIPT =====
class VerticalPageManager {
    constructor() {
        this.init();
    }
    init() {
        this.initializeFlashSystem();
        // Get page title to customize welcome message
        const pageTitle = document.title.split('-')[0].replace('YUVA India', 'Page').trim();
        this.showInfo('Welcome!', `Exploring the ${pageTitle} vertical.`);
    }

    // Dynamic Flash Notification System
    initializeFlashSystem() {
        if (!document.getElementById('flash-container')) {
            const flashContainer = document.createElement('div');
            flashContainer.id = 'flash-container';
            flashContainer.className = 'flash-container';
            document.body.appendChild(flashContainer);
        }
    }
    showFlashNotification(type, title, message, duration = 5000) {
        const container = document.getElementById('flash-container');
        if (!container) return;
        const notification = document.createElement('div');
        notification.className = `flash-notification ${type}`;
        const icons = { success: 'fas fa-check', error: 'fas fa-times', warning: 'fas fa-exclamation-triangle', info: 'fas fa-info-circle' };
        notification.innerHTML = `<div class="flash-icon"><i class="${icons[type]}"></i></div><div class="flash-content"><div class="flash-title">${title}</div><div class="flash-message">${message}</div></div><button class="flash-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
        container.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        if (duration > 0) setTimeout(() => this.removeFlashNotification(notification), duration);
    }
    removeFlashNotification(notification) {
        if (notification && notification.parentElement) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
    }
    showInfo(title, message) { this.showFlashNotification('info', title, message, 4000); }
}

document.addEventListener('DOMContentLoaded', () => { new VerticalPageManager(); });