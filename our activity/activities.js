// ===== MODERN ACTIVITIES PAGE JAVASCRIPT - 2025 =====

class ActivitiesPageManager {
    constructor() {
        this.init();
    }

    init() {
        this.initializeFlashSystem();
        this.animateElementsOnScroll();
        // Welcome notification
        this.showInfo('Welcome!', 'Explore the core activities of YUVA.');
    }

    // ===== FLASH NOTIFICATION SYSTEM (Consistent with About Us page) =====
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
        const icons = {
            success: 'fas fa-check',
            error: 'fas fa-times',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        notification.innerHTML = `
            <div class="flash-icon"><i class="${icons[type]}"></i></div>
            <div class="flash-content">
                <div class="flash-title">${title}</div>
                <div class="flash-message">${message}</div>
            </div>
            <button class="flash-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
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

    showInfo(title, message) {
        this.showFlashNotification('info', title, message, 4000);
    }

    // ===== SCROLL-BASED ANIMATIONS =====
    animateElementsOnScroll() {
        const animatedElements = document.querySelectorAll('.activity-card');
        if (!animatedElements.length) return;

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1 // Trigger when 10% of the element is visible
        });

        animatedElements.forEach(el => {
            observer.observe(el);
        });
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    new ActivitiesPageManager();
});