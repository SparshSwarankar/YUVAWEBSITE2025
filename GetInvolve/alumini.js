/* ===== YUVA ALUMNI PAGE - JAVASCRIPT 2025 ===== */

const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwvQIv_Z5hgaQJzkqr0wxIvjHSLVJByHv5Vd-i1DwGCCwnZ1BdHpswnWx23cwZQ4Wq6/exec';

/**
 * FlashNotification System
 * Manages displaying success, error, and info pop-up messages.
 */
class FlashNotification {
    constructor() {
        this.initializeFlashSystem();
    }

    initializeFlashSystem() {
        const existingContainer = document.getElementById('flash-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        // Create fresh container and append directly to body
        const flashContainer = document.createElement('div');
        flashContainer.id = 'flash-container';
        flashContainer.className = 'flash-container';

        // Ensure it's added to body, not inside any other element
        document.body.appendChild(flashContainer);
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

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

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

/**
 * AlumniPage Class
 * Manages all interactive elements on the alumni page.
 */
class AlumniPage {
    constructor() {
        this.flash = new FlashNotification();
        this.form = document.getElementById('alumni-form');

        if (this.form) {
            this.initializeForm();
        }

        this.initializeAnimations();
        this.initializeCounters();
        this.setupScrollAnimations();
        this.loadFeaturedAlumni();
        this.initializeImageUploadHelper();
    }

    initializeForm() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async handleSubmit(e) {
        e.preventDefault();

        const submitButton = this.form.querySelector('.btn-submit');
        const originalButtonText = submitButton.innerHTML;

        submitButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Submitting...`;
        submitButton.disabled = true;

        // Validate form
        if (!this.validateForm()) {
            this.flash.showError('Incomplete Form', 'Please fill out all required fields.');
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
            return;
        }

        const formData = new FormData(this.form);

        // Process interests checkboxes
        const interests = Array.from(this.form.querySelectorAll('input[name="interests"]:checked'))
            .map(checkbox => checkbox.value)
            .join(', ');
        formData.set('interests', interests);

        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                this.flash.showSuccess('Welcome to YUVA Alumni!', 'Your registration was successful. Check your email for details.');
                this.form.reset();

                // Scroll to top after successful submission
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 1000);
            } else {
                throw new Error(result.error || 'Submission failed');
            }

        } catch (error) {
            console.error('Submission Error:', error);
            this.flash.showError('Submission Failed', 'Unable to submit your registration. Please try again or contact support.');
        } finally {
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        }
    }

    validateForm() {
        const requiredFields = this.form.querySelectorAll('[required]');
        for (let field of requiredFields) {
            if (!field.value.trim()) {
                field.focus();
                return false;
            }
        }
        return true;
    }

    initializeAnimations() {
        // Tilt effect for benefit cards
        const benefitCards = document.querySelectorAll('[data-tilt]');

        benefitCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = (y - centerY) / 10;
                const rotateY = (centerX - x) / 10;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            });
        });
    }

    initializeCounters() {
        const counters = document.querySelectorAll('.stat-number');
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    this.animateCounter(entry.target);
                    entry.target.classList.add('counted');
                }
            });
        }, observerOptions);

        counters.forEach(counter => observer.observe(counter));
    }

    animateCounter(element) {
        const target = parseInt(element.getAttribute('data-count'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                element.textContent = Math.floor(current) + '+';
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target + '+';
            }
        };

        updateCounter();
    }

    setupScrollAnimations() {
        // 1. ADDED: Define the options for the observer.
        // This tells it to trigger when 10% of an element is visible.
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        // 2. ADDED: Select all the sections on the page you want to animate.
        // You can add more selectors here (e.g., '.spotlight-section').
        const sectionsToAnimate = document.querySelectorAll('.perks-section, .roles-section, .form-section');

        const observer = new IntersectionObserver((entries, observer) => { // <-- Pass 'observer' here
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeInUp 0.8s ease-out forwards';
                    entry.target.style.opacity = 1;

                    // Stop observing the element once it has been animated
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // 3. ADDED: Tell the observer which elements to watch.
        sectionsToAnimate.forEach(section => {
            section.style.opacity = 0; // Hide the section initially
            observer.observe(section);
        });
    }

    async loadFeaturedAlumni() {
        const storiesContainer = document.querySelector('.stories-carousel');
        if (!storiesContainer) return;

        // The skeleton loader is already in the HTML.
        try {
            // Simulate a network delay to make the loader visible
            await new Promise(resolve => setTimeout(resolve, 1500));

            const response = await fetch(`${GAS_WEB_APP_URL}?action=getFeaturedAlumni`);
            const result = await response.json();

            if (result.success && result.data.length > 0) {
                storiesContainer.innerHTML = ''; // Clear the skeleton loaders
                result.data.forEach(story => {
                    const storyCard = document.createElement('div');
                    storyCard.className = 'story-card';
                    storyCard.style.animation = 'fadeIn 0.5s ease-out forwards';
                    storyCard.innerHTML = `
                        <div class="story-image">
                            <img src="${story.ImageURL}" alt="${story.Name}">
                            <div class="story-badge">${story.Badge}</div>
                        </div>
                        <div class="story-content">
                            <h3>${story.Name}</h3>
                            <p class="story-role">${story.Role}</p>
                            <p class="story-text">"${story.Quote}"</p>
                            <div class="story-stats">
                                <span><i class="fas fa-building"></i> ${story.Batch} Batch</span>
                                <span><i class="fas fa-map-marker-alt"></i> ${story.City}</span>
                            </div>
                        </div>
                    `;
                    storiesContainer.appendChild(storyCard);

                    // Get the image element we just created
                    const imgElement = storyCard.querySelector('.story-image img');

                    // This function will add the 'loaded' class to make the image visible
                    const revealImage = () => {
                        imgElement.classList.add('loaded');
                    };

                    // Check if the image is already cached by the browser
                    if (imgElement.complete) {
                        revealImage();
                    } else {
                        // If not, add an event listener to run the function when it's done loading
                        imgElement.addEventListener('load', revealImage);
                    }
                });

                // Show success notification
                this.flash.showSuccess('Stories Loaded!', 'Featured alumni are now displayed.', 3000);

            } else {
                // Handle cases where fetch is successful but no data is returned
                throw new Error(result.error || 'No featured alumni data found.');
            }
        } catch (error) {
            console.error('Failed to load featured alumni:', error);
            // Replace skeleton loader with an error message
            storiesContainer.innerHTML = `<p class="error-message">Could not load alumni stories. Please try again later.</p>`;
        }
    }
    initializeImageUploadHelper() {
        const imageUrlInput = document.getElementById('imageUrl');
        const stepsContainer = document.getElementById('image-upload-steps');

        if (!imageUrlInput || !stepsContainer) return;

        const showSteps = () => {
            // Check if the steps are already visible to prevent repeating the action
            if (stepsContainer.classList.contains('show')) {
                return;
            }

            // Show the flash notification
            this.flash.showInfo('Image Link Required', 'Please provide a public URL to your photo.', 6000);

            // Add the instruction content to the div
            stepsContainer.innerHTML = `
                <h4><i class="fas fa-info-circle"></i>How to get your Image URL:</h4>
                <ul>
                    <li>
                        <span class="step-number">1</span>
                        <div>Go to <a href="https://postimages.org/" target="_blank">Postimages.org</a> and upload your photo.</div>
                    </li>
                    <li>
                        <span class="step-number">2</span>
                        <div>After the upload is complete, look for the field labeled <strong>"Direct Link"</strong> and copy the URL.</div>
                    </li>
                    <li>
                        <span class="step-number">3</span>
                        <div>Paste the <strong>Direct Link</strong> you copied into the input field above. That's it!</div>
                    </li>
                </ul>
            `;
            // Add the 'show' class to trigger the CSS slide-down animation
            stepsContainer.classList.add('show');
        };

        // Listen for a 'focus' event (when the user clicks into the input box)
        imageUrlInput.addEventListener('focus', showSteps);
    }
}

// Global scroll functions for buttons
function scrollToForm() {
    const formSection = document.getElementById('registration-form');
    if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function scrollToStories() {
    const storiesSection = document.getElementById('stories');
    if (storiesSection) {
        storiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const alumniPage = new AlumniPage();
    setTimeout(() => {
        alumniPage.flash.showSuccess('Welcome, YUVA Alumni!', 'We are glad to have you back.', 4000);
    }, 1000);

    // Add smooth scrolling to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    // Form input focus animations
    const inputs = document.querySelectorAll('.form-group input, .form-group select');
    inputs.forEach(input => {
        input.addEventListener('focus', function () {
            this.parentElement.classList.add('focused');
        });
        input.addEventListener('blur', function () {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
    });
});