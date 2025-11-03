/* ===== MODERN HOME PAGE JAVASCRIPT - YUVA 2025 ===== */

class HomePageAnimations {
    constructor() {
        this.init();
    }

    init() {
        this.animateHeroElements();
        this.animateImpactNumbers();
        this.animateFeatureCards();
        this.animateQuickLinks();
        this.animateCTA();
        this.setupScrollAnimations();
        this.setupParallaxEffects();
        this.setupInteractiveElements();
        this.initializeHomepageGallery();
    }

    // ===== HERO SECTION ANIMATIONS =====
    animateHeroElements() {
        // Animate hero badge with pulse effect
        const heroBadge = document.querySelector('.hero-badge');
        if (heroBadge) {
            heroBadge.style.animation = 'fadeInUp 0.8s ease-out 0.2s both';
        }

        // Animate hero title with staggered effect
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle) {
            heroTitle.style.animation = 'fadeInUp 0.8s ease-out 0.4s both';
        }

        // Animate hero description
        const heroDescription = document.querySelector('.hero-description');
        if (heroDescription) {
            heroDescription.style.animation = 'fadeInUp 0.8s ease-out 0.6s both';
        }

        // Animate home impact items with staggered effect
        const homeImpactItems = document.querySelectorAll('.home-impact-item');
        homeImpactItems.forEach((item, index) => {
            item.style.animation = `fadeInUp 0.8s ease-out ${0.8 + (index * 0.2)}s both`;
        });
    }

    // ===== IMPACT NUMBERS ANIMATION =====
    animateImpactNumbers() {
        const impactNumbers = document.querySelectorAll('.home-impact-number');

        const animateNumber = (element, target) => {
            const duration = 2000;
            const start = 0;
            const increment = target / (duration / 16);
            let current = start;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                element.textContent = Math.floor(current).toLocaleString();
            }, 16);
        };

        // Use Intersection Observer to trigger animation when in view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.dataset.target);
                    if (target) {
                        animateNumber(entry.target, target);
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        impactNumbers.forEach(number => {
            observer.observe(number);
        });
    }

    // ===== FEATURE CARDS ANIMATIONS =====
    animateFeatureCards() {
        const featureCards = document.querySelectorAll('.feature-card');

        featureCards.forEach((card, index) => {
            // Load-time slide-up animation removed

            // Hover animations
            card.addEventListener('mouseenter', () => {
                this.animateFeatureCard(card, 'enter');
            });

            card.addEventListener('mouseleave', () => {
                this.animateFeatureCard(card, 'leave');
            });

            card.addEventListener('click', () => {
                this.animateFeatureCard(card, 'click');
            });
        });
    }

    animateFeatureCard(card, action) {
        if (!card) return;

        switch (action) {
            case 'enter':
                card.style.transform = 'translateY(-12px) scale(1.02)';
                card.style.boxShadow = 'var(--shadow-2xl)';
                break;
            case 'leave':
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = 'var(--shadow-lg)';
                break;
            case 'click':
                card.style.animation = 'bounceIn 0.5s ease-out';
                setTimeout(() => {
                    card.style.animation = '';
                }, 500);
                break;
        }
    }

    // ===== QUICK LINKS ANIMATIONS =====
    animateQuickLinks() {
        const quickLinkCards = document.querySelectorAll('.quick-link-card');

        quickLinkCards.forEach((card, index) => {
            // Load-time slide-up animation removed

            // Hover animations
            card.addEventListener('mouseenter', () => {
                this.animateQuickLinkCard(card, 'enter');
            });

            card.addEventListener('mouseleave', () => {
                this.animateQuickLinkCard(card, 'leave');
            });

            card.addEventListener('click', () => {
                this.animateQuickLinkCard(card, 'click');
            });
        });
    }

    animateQuickLinkCard(card, action) {
        if (!card) return;

        switch (action) {
            case 'enter':
                card.style.transform = 'translateY(-8px) scale(1.02)';
                card.style.boxShadow = 'var(--shadow-2xl)';
                break;
            case 'leave':
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = 'var(--shadow-lg)';
                break;
            case 'click':
                card.style.animation = 'pulse 0.5s ease-out';
                setTimeout(() => {
                    card.style.animation = '';
                }, 500);
                break;
        }
    }

    // ===== CTA SECTION ANIMATIONS =====
    animateCTA() {
        const ctaContent = document.querySelector('.cta-content');
        if (ctaContent) {
            ctaContent.style.animation = 'fadeInUp 0.8s ease-out 0.2s both';
        }

        const ctaButtons = document.querySelectorAll('.btn-primary, .btn-secondary');
        ctaButtons.forEach((button, index) => {
            button.style.animation = `fadeInUp 0.6s ease-out ${0.4 + (index * 0.1)}s both`;
        });
    }

    // ===== SCROLL ANIMATIONS =====
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeInUp 0.8s ease-out both';
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe sections for scroll animations (exclude features and quick links)
        const sections = document.querySelectorAll('.cta-section');
        sections.forEach(section => {
            observer.observe(section);
        });
    }

    // ===== PARALLAX EFFECTS =====
    setupParallaxEffects() {
        // Background parallax disabled to keep backgrounds static
        // and avoid animating large surfaces
    }

    // ===== INTERACTIVE ELEMENTS =====
    setupInteractiveElements() {
        // Add ripple effect to buttons
        const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.createRippleEffect(e);
            });
        });

        // Add typing effect to hero title
        this.setupTypingEffect();

        // Initialize home stats counters
        this.initializeHomeStats();
    }

    createRippleEffect(event) {
        const button = event.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        button.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    setupTypingEffect() {
        const heroTitle = document.querySelector('.hero-title');
        if (!heroTitle) return;

        const titleLines = heroTitle.querySelectorAll('.hero-title-line');
        titleLines.forEach((line, index) => {
            const text = line.textContent;
            line.textContent = '';
            line.style.animation = 'none';

            setTimeout(() => {
                this.typeText(line, text, 50);
            }, 1000 + (index * 1000));
        });
    }

    typeText(element, text, speed) {
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(timer);
            }
        }, speed);
    }

    // ===== HOME STATS =====
    async initializeHomeStats() {
        // Define the elements
        const collegesEl = document.getElementById('home-total-colleges');
        const membersEl = document.getElementById('home-total-members');
        const unitsEl = document.getElementById('home-active-units');
        const lastSyncEl = document.getElementById('home-last-sync');

        // Utility to animate the numbers (from your existing code)
        const animateNumber = (el, target) => {
            if (!el) return;
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) {
                el.textContent = Number(target).toLocaleString();
                return;
            }
            const duration = 1200;
            const start = 0;
            const increment = target / (duration / 16);
            let current = start;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                el.textContent = Math.floor(current).toLocaleString();
            }, 16);
        };

        try {
            // Fetch data from your Google Apps Script backend
            // Make sure to replace 'YOUR_GAS_WEB_APP_URL' if it's not globally defined
            // This URL is the same one used in your unit.js file.
            const GAS_URL = 'https://script.google.com/macros/s/AKfycbzkOBsj6PS_ncTAy3I_hTJV4TWzup322AdUkCjpZZ1M1_RD1EHrLRQjgzdkKdNTR3-I/exec';  // also change in unit.js
            const response = await fetch(`${GAS_URL}?action=public-stats`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.stats) {
                // Use the live data to start the animations
                animateNumber(collegesEl, data.stats.total_colleges || 0);
                animateNumber(membersEl, data.stats.total_members || 0);
                animateNumber(unitsEl, data.stats.active_units || 0);
                if (lastSyncEl) lastSyncEl.textContent = new Date().toLocaleTimeString();
            } else {
                throw new Error(data.error || 'Failed to parse stats');
            }

        } catch (error) {
            console.error("Failed to fetch homepage stats:", error);
            // Display fallback text if the fetch fails
            if (collegesEl) collegesEl.textContent = 'N/A';
            if (membersEl) membersEl.textContent = 'N/A';
            if (unitsEl) unitsEl.textContent = 'N/A';
            if (lastSyncEl) lastSyncEl.textContent = 'Error';
        }
    }
    // ===== NEW: HOMEPAGE GALLERY =====
    // ===== REVISED: HOMEPAGE GALLERY =====
    // ===== FINAL REVISION: HOMEPAGE GALLERY =====
    // ===== UPDATED: HOMEPAGE GALLERY (10 IMAGES, NO CATEGORY FILTER) =====
    async initializeHomepageGallery() {
        const grid = document.getElementById('gallery-preview-grid');
        if (!grid) return;

        try {
            const response = await fetch('/Gallary/images.json');

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const allEvents = await response.json();

            // --- Updated Image Selection Logic ---
            const vimarsh2024 = allEvents.vimarsh2024?.images || [];
            const vimarsh2023 = allEvents.vimarsh2023?.images || [];

            // Get the first 5 photos from 2024 (excluding the logo)
            const photos2024 = vimarsh2024
                .filter(img => img.category !== 'logo')
                .slice(0, 5);

            // Get the first 5 photos from 2023 (excluding the logo)
            const photos2023 = vimarsh2023
                .filter(img => img.category !== 'logo')
                .slice(0, 5);

            const selectedImages = [...photos2024, ...photos2023];

            if (selectedImages.length === 0) {
                grid.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No photos found for recent events.</p>';
                return;
            }

            // --- Create and Append Image Elements ---
            const fragment = document.createDocumentFragment();
            selectedImages.forEach((imgData, index) => {
                const item = document.createElement('figure');
                item.className = 'gallery-preview-item';
                item.style.animationDelay = `${index * 100}ms`;

                const img = document.createElement('img');
                img.src = imgData.src;
                img.alt = imgData.alt;
                img.loading = 'lazy';
                img.decoding = 'async';

                item.appendChild(img);
                fragment.appendChild(item);
            });

            grid.innerHTML = ''; // Clear previous message
            grid.appendChild(fragment);

        } catch (error) {
            console.error('Failed to load homepage gallery:', error);
            grid.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Could not load gallery at this time.</p>';
        }
    }
}

// ===== FLASH NOTIFICATION SYSTEM =====
class FlashNotification {
    constructor() {
        this.initializeFlashSystem();
    }

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

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, duration);
        }
    }

    showSuccess(title, message, duration = 5000) {
        this.showFlashNotification('success', title, message, duration);
    }

    showError(title, message, duration = 5000) {
        this.showFlashNotification('error', title, message, duration);
    }

    showWarning(title, message, duration = 5000) {
        this.showFlashNotification('warning', title, message, duration);
    }

    showInfo(title, message, duration = 5000) {
        this.showFlashNotification('info', title, message, duration);
    }
}

// ===== UTILITY FUNCTIONS =====
class HomeUtils {
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
}

// ===== INITIALIZE ON DOM LOAD =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize animations
    new HomePageAnimations();

    // Initialize flash notifications
    window.flashNotification = new FlashNotification();

    // Add ripple effect styles
    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Show welcome message
    setTimeout(() => {
        if (window.flashNotification) {
            window.flashNotification.showSuccess('Welcome!', 'YUVA India page loaded successfully', 3000);
        }
    }, 2000);
});



// ===== EXPORT FOR GLOBAL ACCESS =====
window.HomePageAnimations = HomePageAnimations;
window.FlashNotification = FlashNotification;
window.HomeUtils = HomeUtils;
