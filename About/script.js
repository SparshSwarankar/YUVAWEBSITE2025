
// ===== ABOUT US PAGE JAVASCRIPT - MODERN FLASHY 2025 =====

class AboutPageManager {
    constructor() {
        this.init();
    }

    init() {
        this.initializeFlashSystem();
        this.bindEvents();
        this.animateElements();
        this.animateCounters();
        this.showInfo('Page Ready', 'About Us page loaded successfully');
    }

    // ===== FLASH NOTIFICATION SYSTEM =====
    initializeFlashSystem() {
        // Create flash container if it doesn't exist
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
            <div class="flash-icon">
                <i class="${icons[type]}"></i>
            </div>
            <div class="flash-content">
                <div class="flash-title">${title}</div>
                <div class="flash-message">${message}</div>
            </div>
            <button class="flash-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.removeFlashNotification(notification);
            }, duration);
        }

        return notification;
    }

    removeFlashNotification(notification) {
        if (notification && notification.parentElement) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }

    // ===== ENHANCED ERROR HANDLING =====
    showError(title, message) {
        this.showFlashNotification('error', title, message, 8000);
    }

    showSuccess(title, message) {
        this.showFlashNotification('success', title, message, 6000);
    }

    showWarning(title, message) {
        this.showFlashNotification('warning', title, message, 5000);
    }

    showInfo(title, message) {
        this.showFlashNotification('info', title, message, 4000);
    }

    // ===== EVENT BINDING =====
    bindEvents() {
        // Impact cards hover effects - let CSS handle the animations
        const impactItems = document.querySelectorAll('.about-impact-item');
        impactItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                this.animateImpactCard(item, 'click');
            });
        });

        // Objective cards hover effects
        const objectiveCards = document.querySelectorAll('.objective-card');
        objectiveCards.forEach((card, index) => {
            card.addEventListener('mouseenter', () => {
                this.animateObjectiveCard(card, 'enter');
            });
            
            card.addEventListener('mouseleave', () => {
                this.animateObjectiveCard(card, 'leave');
            });

            card.addEventListener('click', () => {
                this.animateObjectiveCard(card, 'click');
            });
        });

        // Value cards hover effects
        const valueCards = document.querySelectorAll('.value-card');
        valueCards.forEach((card, index) => {
            card.addEventListener('mouseenter', () => {
                this.animateValueCard(card, 'enter');
            });
            
            card.addEventListener('mouseleave', () => {
                this.animateValueCard(card, 'leave');
            });

            card.addEventListener('click', () => {
                this.animateValueCard(card, 'click');
            });
        });

        // CTA buttons
        const ctaButtons = document.querySelectorAll('.cta-button');
        ctaButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.animateButton(button);
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearFlashMessages();
            }
        });
    }

    // ===== ANIMATION METHODS =====
    animateElements() {
        // Let CSS handle hero animations - they are already defined in CSS
        // Only handle additional animations that need JavaScript

        // Animate About YUVA card
        const aboutYuvaCard = document.querySelector('.about-yuva-card');
        if (aboutYuvaCard) {
            aboutYuvaCard.style.animation = 'fadeInUp 0.8s ease-out 0.2s both';
        }

        // Animate objective cards
        const objectiveCards = document.querySelectorAll('.objective-card');
        objectiveCards.forEach((card, index) => {
            card.style.animation = `fadeInUp 0.6s ease-out ${0.1 + (index * 0.1)}s both`;
        });

        // Animate value cards
        const valueCards = document.querySelectorAll('.value-card');
        valueCards.forEach((card, index) => {
            card.style.animation = `fadeInUp 0.6s ease-out ${0.1 + (index * 0.1)}s both`;
        });

        // Animate stats cards
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            card.style.animation = `fadeInUp 0.6s ease-out ${0.1 + (index * 0.1)}s both`;
        });

        // Animate CTA card
        const ctaCard = document.querySelector('.cta-card');
        if (ctaCard) {
            ctaCard.style.animation = 'fadeInUp 0.8s ease-out 0.5s both';
        }
    }

    animateImpactCard(card, action) {
        if (!card) return;

        switch (action) {
            case 'click':
                card.style.animation = 'pulse 0.5s ease-out';
                setTimeout(() => {
                    card.style.animation = '';
                }, 500);
                break;
        }
    }

    animateObjectiveCard(card, action) {
        if (!card) return;

        switch (action) {
            case 'enter':
                card.style.transform = 'translateY(-8px) scale(1.02)';
                break;
            case 'leave':
                card.style.transform = 'translateY(0) scale(1)';
                break;
            case 'click':
                card.style.animation = 'pulse 0.5s ease-out';
                setTimeout(() => {
                    card.style.animation = '';
                }, 500);
                break;
        }
    }

    animateValueCard(card, action) {
        if (!card) return;

        switch (action) {
            case 'enter':
                card.style.transform = 'translateY(-8px) scale(1.02)';
                break;
            case 'leave':
                card.style.transform = 'translateY(0) scale(1)';
                break;
            case 'click':
                card.style.animation = 'pulse 0.5s ease-out';
                setTimeout(() => {
                    card.style.animation = '';
                }, 500);
                break;
        }
    }

    animateButton(button) {
        if (!button) return;
        
        button.style.animation = 'pulse 0.3s ease-out';
        setTimeout(() => {
            button.style.animation = '';
        }, 300);
    }

    // ===== COUNTER ANIMATION =====
    animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => {
            observer.observe(counter);
        });
    }

    animateCounter(element) {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); // 60fps
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current).toLocaleString();
        }, 16);
    }

    // ===== UTILITY FUNCTIONS =====
    clearFlashMessages() {
        const flashContainer = document.getElementById('flash-container');
        if (flashContainer) {
            const notifications = flashContainer.querySelectorAll('.flash-notification');
            notifications.forEach(notification => {
                if (notification.classList.contains('info')) {
                    this.removeFlashNotification(notification);
                }
            });
        }
    }

    // ===== PUBLIC API =====
    getState() {
        return {
            initialized: true,
            flashSystem: !!document.getElementById('flash-container')
        };
    }
}

// ===== INITIALIZATION =====
let aboutPageManager;

document.addEventListener('DOMContentLoaded', () => {
    try {
        aboutPageManager = new AboutPageManager();
        console.log('About Page Manager initialized successfully');
    } catch (error) {
        console.error('Failed to initialize About Page Manager:', error);
    }
});

// ===== GLOBAL FUNCTIONS FOR COMPATIBILITY =====
window.toggleSidebar = window.toggleSidebar || function() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    const isVisible = sidebar.classList.contains('open');
    sidebar.classList.toggle('open', !isVisible);
};

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AboutPageManager };
}
