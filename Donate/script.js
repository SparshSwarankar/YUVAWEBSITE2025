// ===== DONATE PAGE JAVASCRIPT - MODERN FLASHY 2025 =====

class DonationManager {
    constructor() {
        this.razorpayKeyId = 'rzp_test_RCnv6goa4rkg0Q'; // Replace with your actual Razorpay Key ID
        this.razorpayKeySecret = 'qRw549IUqi47RQjbTf1d0clN'; // Replace with your actual Razorpay Key Secret
        this.gasWebAppUrl = 'https://script.google.com/macros/s/AKfycbxy8OLvvUcAJOpVhkKAYfGJA55qsv8b_0pTD6QTG9VskVhtTELjCeuUll0jO3U8WbK1gg/exec'; // Your deployed GAS URL
        this.isRecurring = false;
        this.selectedAmount = null;
        this.customAmount = null;
        this.donorInfo = {};
        this.paymentAttempts = 0;
        this.maxRetries = 3;

        this.init();
    }

    init() {
        this.loadRazorpayScript();
        this.bindEvents();
        this.setupFormValidation();
        this.testBackendConnection();
        this.initializeFlashSystem();
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

    // Load Razorpay script dynamically
    loadRazorpayScript() {
        if (window.Razorpay) {
            this.initializeRazorpay();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => this.initializeRazorpay();
        script.onerror = () => this.showError('Payment Gateway Error', 'Failed to load payment gateway. Please refresh the page.');
        document.head.appendChild(script);
    }

    initializeRazorpay() {
        this.showInfo('Payment System Ready', 'Payment gateway loaded successfully');
    }

    bindEvents() {
        // Donation type selection
        document.querySelectorAll('input[name="donationType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                // Check if the user clicked the "recurring" option
                if (e.target.value === 'recurring') {
                    // 1. Show a friendly warning message.
                    this.showWarning(
                        'Feature in Development',
                        'Recurring donations are coming soon! Please select "One-time Donation" for now.'
                    );

                    // 2. Automatically switch the selection back to "One-time".
                    document.getElementById('oneTime').checked = true;

                    // 3. Stop the function here to prevent any UI changes.
                    return;
                }

                // This code below will now only run for the "one-time" selection
                this.isRecurring = false; // It will always be a one-time donation
                this.updateDonationType();
                this.animateFormSection();
            });
        });

        // Amount selection
        document.querySelectorAll('input[name="amount"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.selectedAmount = e.target.value;
                this.customAmount = null;
                this.updateAmountDisplay();
                this.animateAmountSelection();
            });
        });

        // Custom amount input
        const customAmountInput = document.getElementById('customAmount');
        if (customAmountInput) {
            customAmountInput.addEventListener('input', (e) => {
                this.customAmount = parseFloat(e.target.value) || null;
                this.selectedAmount = null;
                this.updateAmountDisplay();
                this.animateAmountSelection();
            });

            customAmountInput.addEventListener('focus', () => {
                document.querySelector('input[name="amount"][value="custom"]').checked = true;
                this.selectedAmount = 'custom';
                this.updateAmountDisplay();
            });
        }

        // Form submission
        const donateForm = document.getElementById('donateForm');
        if (donateForm) {
            donateForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processDonation();
            });
        }

        // Real-time form validation
        document.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => {
                this.clearFieldError(field);
                this.clearFlashMessages();
            });
        });

        // ===== NEW EVENT BINDINGS =====

        // 80G Tax Exemption Checkbox
        const wants80G = document.getElementById('wants80G');
        if (wants80G) {
            wants80G.addEventListener('change', () => {
                const taxFields = document.getElementById('tax-exemption-fields');
                const aadhaarInput = document.getElementById('aadhaarNumber');
                const panInput = document.getElementById('panNumber'); // ADDED THIS

                if (wants80G.checked) {
                    taxFields.style.display = 'block';
                    aadhaarInput.setAttribute('required', 'true');
                    panInput.setAttribute('required', 'true'); // ADDED THIS
                } else {
                    taxFields.style.display = 'none';
                    aadhaarInput.removeAttribute('required');
                    panInput.removeAttribute('required'); // ADDED THIS
                    this.clearFieldError(aadhaarInput);
                    this.clearFieldError(panInput); // ADDED THIS
                }
            });
        }

        // Agree to Terms Checkbox
        const agreeToTerms = document.getElementById('agreeToTerms');
        const donateButton = document.getElementById('donateButton');
        if (agreeToTerms && donateButton) {
            agreeToTerms.addEventListener('change', () => {
                if (agreeToTerms.checked) {
                    donateButton.disabled = false;
                } else {
                    donateButton.disabled = true;
                }
            });
        }
    }

    setupFormValidation() {
        // ===== UPDATED VALIDATION RULES =====
        this.validationRules = {
            firstName: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-Z\s.-]+$/,
                message: 'Please enter a valid first name'
            },
            surname: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-Z\s.-]+$/,
                message: 'Please enter a valid surname'
            },
            donorEmail: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            donorPhone: {
                required: true,
                pattern: /^[6-9]\d{9}$/,
                message: 'Please enter a valid 10-digit mobile number'
            },
            donorAddress: {
                required: true,
                minLength: 10,
                message: 'Please enter your full address (min 10 characters)'
            },
            aadhaarNumber: {
                required: false, // This will be set to true dynamically if 80G is checked
                pattern: /^\d{12}$/,
                message: 'Aadhaar must be 12 digits'
            },
            panNumber: {
                required: true, // CHANGED: This is now required (but will be checked dynamically)
                pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i,
                message: 'PAN must be in the format ABCDE1234F'
            }
        };
    }

    // ===== ANIMATION METHODS =====
    animateFormSection() {
        const formSections = document.querySelectorAll('.form-section');
        formSections.forEach((section, index) => {
            section.style.animation = `fadeInUp 0.5s ease-out ${index * 0.1}s both`;
        });
    }

    animateAmountSelection() {
        const amountOptions = document.querySelectorAll('.amount-option');
        amountOptions.forEach((option, index) => {
            option.style.animation = `bounceIn 0.3s ease-out ${index * 0.05}s both`;
        });
    }

    updateDonationType() {
        const recurringElements = document.querySelectorAll('.recurring-only');
        const oneTimeElements = document.querySelectorAll('.one-time-only');

        if (this.isRecurring) {
            recurringElements.forEach(el => el.style.display = 'block');
            oneTimeElements.forEach(el => el.style.display = 'none');
            this.updateDonateButton('Start Monthly Donation');
            this.showInfo('Monthly Donation', 'You\'re setting up a recurring monthly donation');
        } else {
            recurringElements.forEach(el => el.style.display = 'none');
            oneTimeElements.forEach(el => el.style.display = 'block');
            // UPDATED button text to match HTML
            this.updateDonateButton('Continue to Payment');
            this.showInfo('One-time Donation', 'You\'re making a one-time contribution');
        }
    }

    updateAmountDisplay() {
        const amountDisplay = document.getElementById('amountDisplay');
        if (!amountDisplay) return;

        const amount = this.getFinalAmount();
        if (amount) {
            amountDisplay.textContent = `₹${amount.toLocaleString('en-IN')}`;
            amountDisplay.classList.add('show');
            amountDisplay.style.animation = 'bounceIn 0.5s ease-out';
        } else {
            amountDisplay.classList.remove('show');
        }
    }

    getFinalAmount() {
        if (this.customAmount && this.customAmount > 0) {
            return this.customAmount;
        }
        if (this.selectedAmount && this.selectedAmount !== 'custom') {
            return parseFloat(this.selectedAmount);
        }
        return null;
    }

    updateDonateButton(text) {
        const donateButton = document.getElementById('donateButton');
        if (donateButton) {
            const buttonText = donateButton.querySelector('.button-text');
            if (buttonText) {
                buttonText.textContent = text;
            }
        }
    }

    getGasUrl() {
        if (!this.gasWebAppUrl || this.gasWebAppUrl.includes('YOUR_SCRIPT_ID_HERE')) {
            this.showError('Configuration Error', 'Backend configuration missing. Please contact support.');
            throw new Error('GAS Web App URL not configured');
        }
        return this.gasWebAppUrl;
    }

    async makeRequest(method, endpoint, data = null) {
        const url = `${this.getGasUrl()}?path=${endpoint}`;

        const options = {
            method: method,
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'omit',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
                'Accept': 'application/json'
            }
        };

        if (data && method === 'POST') {
            if (typeof data === 'object') {
                options.body = JSON.stringify(data);
            } else {
                options.body = data;
            }
        }

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return result;

        } catch (error) {
            throw error;
        }
    }

    async testBackendConnection() {
        try {
            this.showInfo('Connecting...', 'Testing backend connection...');

            const response = await this.makeRequest('POST', 'test');

            if (response.success) {
                this.showSuccess('Connection Successful', 'Backend is ready to process donations');
            } else {
                this.showWarning('Connection Issue', 'Backend connection issue detected. Please refresh the page.');
            }

        } catch (error) {
            this.showError('Connection Failed', 'Unable to connect to backend. Please check your internet connection.');
        }
    }

    validateField(field) {
        const fieldName = field.name;
        const rules = this.validationRules[fieldName];

        if (!rules) return true;

        // ===== DYNAMIC VALIDATION ADDED =====
        // Dynamically check 'required' status for Aadhaar
        if (fieldName === 'aadhaarNumber' || fieldName === 'panNumber') {
            rules.required = document.getElementById('wants80G').checked;
        }

        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        if (rules.required && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }
        else if (value && rules.pattern && !rules.pattern.test(value)) {
            isValid = false;
            errorMessage = rules.message;
        }
        else if (value && rules.minLength && value.length < rules.minLength) {
            isValid = false;
            errorMessage = `Minimum ${rules.minLength} characters required`;
        }

        // Special check for PAN: it's optional, but if filled, it must be valid
        if (fieldName === 'panNumber' && value && !rules.pattern.test(value.toUpperCase())) {
            isValid = false;
            errorMessage = rules.message;
        }

        this.showFieldError(field, errorMessage);
        return isValid;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);

        if (message) {
            field.classList.add('error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            field.parentNode.appendChild(errorDiv);
        }
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    validateForm() {
        // ===== UPDATED FIELDS TO VALIDATE =====
        const requiredFields = ['firstName', 'surname', 'donorEmail', 'donorPhone', 'donorAddress'];
        let isValid = true;

        this.clearErrors();

        requiredFields.forEach(fieldName => {
            const field = document.querySelector(`[name="${fieldName}"]`);
            if (field && !this.validateField(field)) {
                isValid = false;
            }
        });

        // ===== ADDED: Conditional validation for 80G fields =====
        const wants80G = document.getElementById('wants80G').checked;
        if (wants80G) {
            const aadhaarField = document.querySelector('[name="aadhaarNumber"]');
            if (aadhaarField && !this.validateField(aadhaarField)) {
                isValid = false;
            }

            const panField = document.querySelector('[name="panNumber"]');
            if (panField && panField.value.trim() && !this.validateField(panField)) {
                // Validate PAN only if it's filled out
                isValid = false;
            }
        }

        const amount = this.getFinalAmount();
        if (!amount || amount < 1) {
            this.showError('Amount Required', 'Please select or enter a valid donation amount');
            isValid = false;
        }

        // ===== ADDED: Check for agreement =====
        const agreeToTerms = document.getElementById('agreeToTerms').checked;
        if (!agreeToTerms) {
            this.showError('Agreement Required', 'You must agree that donations are non-refundable');
            isValid = false;
        }

        // This button state is now handled by the checkbox, but we keep the validation feedback
        // this.updateDonateButtonState(isValid); 
        return isValid;
    }

    clearErrors() {
        document.querySelectorAll('.form-group .form-input.error').forEach(input => {
            input.classList.remove('error');
        });

        document.querySelectorAll('.error-message').forEach(error => {
            error.remove();
        });
    }

    clearFlashMessages() {
        // Clear flash messages when user starts typing
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

    updateDonateButtonState(isValid) {
        // This is now primarily controlled by the 'agreeToTerms' checkbox
        // but we respect the 'disabled' state from validation.
        const donateButton = document.getElementById('donateButton');
        const agreeToTerms = document.getElementById('agreeToTerms').checked;
        if (donateButton) {
            donateButton.disabled = !isValid || !agreeToTerms;
        }
    }

    collectDonorInfo() {
        // ===== UPDATED to collect all new fields =====
        this.donorInfo = {
            firstName: document.querySelector('[name="firstName"]')?.value.trim(),
            surname: document.querySelector('[name="surname"]')?.value.trim(),
            email: document.querySelector('[name="donorEmail"]')?.value.trim(),
            phone: document.querySelector('[name="donorPhone"]')?.value.trim(),
            address: document.querySelector('[name="donorAddress"]')?.value.trim(),
            amount: this.getFinalAmount(),
            isRecurring: this.isRecurring,
            wants80G: document.getElementById('wants80G').checked,
            aadhaar: document.querySelector('[name="aadhaarNumber"]')?.value.trim(),
            pan: document.querySelector('[name="panNumber"]')?.value.trim().toUpperCase()
        };
    }

    async processDonation() {
        if (!this.validateForm()) {
            this.showError('Form Validation', 'Please fill all required fields correctly');
            return;
        }

        this.clearFlashMessages();
        this.collectDonorInfo();
        this.setLoading(true);
        this.paymentAttempts++;

        this.showInfo('Processing...', 'Preparing your donation...');

        try {
            this.getGasUrl();

            if (this.isRecurring) {
                await this.processRecurringDonation();
            } else {
                await this.processOneTimeDonation();
            }
        } catch (error) {
            await this.handlePaymentError(error);
        } finally {
            this.setLoading(false);
        }
    }

    async processOneTimeDonation() {
        this.showInfo('Creating Order', 'Setting up your payment...');

        const orderId = await this.createOrder();

        // ===== UPDATED PREFILL with new name structure =====
        const options = {
            key: this.razorpayKeyId,
            amount: this.donorInfo.amount * 100,
            currency: 'INR',
            name: 'YUVA Delhi',
            description: 'Donation to YUVA Delhi',
            image: '/Images/YUVA logo.png',
            order_id: orderId,
            prefill: {
                name: `${this.donorInfo.firstName} ${this.donorInfo.surname}`,
                email: this.donorInfo.email,
                contact: this.donorInfo.phone
            },
            theme: {
                color: '#555879'
            },
            handler: (response) => {
                this.handlePaymentSuccess(response);
            },
            modal: {
                ondismiss: () => {
                    this.showWarning('Payment Cancelled', 'Payment was cancelled by user');
                }
            }
        };

        const razorpay = new Razorpay(options);
        razorpay.open();
    }

    async processRecurringDonation() {
        this.showInfo('Setting Up Subscription', 'Creating your monthly donation...');

        try {
            const subscription = await this.createSubscription();

            // ===== UPDATED PREFILL with new name structure =====
            const options = {
                key: this.razorpayKeyId,
                subscription_id: subscription.id,
                name: 'YUVA Delhi',
                description: 'Monthly Donation to YUVA Delhi',
                image: '/Images/YUVA logo.png',
                prefill: {
                    name: `${this.donorInfo.firstName} ${this.donorInfo.surname}`,
                    email: this.donorInfo.email,
                    contact: this.donorInfo.phone
                },
                theme: {
                    color: '#555879'
                },
                handler: (response) => {
                    this.handleSubscriptionSuccess(response);
                },
                modal: {
                    ondismiss: () => {
                        this.showWarning('Subscription Cancelled', 'Subscription was cancelled by user');
                    }
                }
            };

            const razorpay = new Razorpay(options);
            razorpay.open();
        } catch (error) {
            this.showError('Subscription Error', 'Failed to create subscription');
        }
    }

    async createOrder() {
        try {
            const data = {
                amount: this.donorInfo.amount,
                currency: 'INR',
                receipt: `receipt_${Date.now()}`
            };

            const result = await this.makeRequest('POST', 'create-order', data);

            if (!result.success) {
                throw new Error(result.error || 'Failed to create order');
            }

            return result.order.id;
        } catch (error) {
            throw error;
        }
    }

    async createSubscription() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                });
            }, 1000);
        });
    }

    async handlePaymentSuccess(response) {
        this.showSuccess('Payment Successful!', 'Your payment has been processed successfully');

        try {
            const data = {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
            };

            const result = await this.makeRequest('POST', 'verify-payment', data);

            if (result.success) {
                this.showSuccess('Thank You!', 'Your donation has been processed successfully. We appreciate your support!');

                // ===== UPDATED: This now sends all new donor info =====
                await this.sendDonationData({
                    ...this.donorInfo,
                    paymentId: response.razorpay_payment_id,
                    orderId: response.razorpay_order_id,
                    signature: response.razorpay_signature
                });

                this.resetForm(); // Reset form AFTER sending data
            } else {
                await this.sendNotificationToBackend('verification-failed', {
                    // ===== UPDATED: Send new name structure =====
                    firstName: this.donorInfo.firstName,
                    surname: this.donorInfo.surname,
                    email: this.donorInfo.email,
                    amount: this.donorInfo.amount,
                    isRecurring: this.isRecurring
                });
                this.showError('Verification Failed', 'Payment verification failed. We have been notified and will resolve this within 24-48 hours.');
            }
        } catch (error) {
            await this.sendNotificationToBackend('verification-failed', {
                // ===== UPDATED: Send new name structure =====
                firstName: this.donorInfo.firstName,
                surname: this.donorInfo.surname,
                email: this.donorInfo.email,
                amount: this.donorInfo.amount,
                isRecurring: this.isRecurring
            });
            this.showError('Verification Failed', 'Payment verification failed. We have been notified and will resolve this within 24-48 hours.');
        }
    }

    async handleSubscriptionSuccess(response) {
        this.showSuccess('Subscription Active!', 'Thank you for setting up monthly donations! Your subscription has been activated.');

        // ===== UPDATED: Send all new donor info =====
        await this.sendDonationData({
            ...this.donorInfo,
            subscriptionId: response.razorpay_subscription_id,
            paymentId: response.razorpay_payment_id
        });

        this.resetForm();
    }

    async sendDonationData(data) {
        try {
            // This 'data' object now contains all new fields from collectDonorInfo
            const result = await this.makeRequest('POST', 'save-donation', data);

            if (!result.success) {
                throw new Error(result.error || 'Failed to save donation data');
            }

            this.showSuccess('Data Saved', 'Your donation information has been recorded');
            return true;
        } catch (error) {
            this.showError('Data Save Failed', `Failed to save donation data: ${error.message}`);

            await this.sendNotificationToBackend('payment-failed', {
                // ===== UPDATED: Send new name structure =====
                firstName: data.firstName,
                surname: data.surname,
                email: data.email,
                amount: data.amount,
                isRecurring: data.isRecurring,
                errorReason: `Data saving failed: ${error.message}`
            });
            return false;
        }
    }

    setLoading(loading) {
        const donateButton = document.getElementById('donateButton');
        if (donateButton) {
            if (loading) {
                donateButton.classList.add('loading');
                donateButton.disabled = true; // Disable when loading
            } else {
                // ===== UPDATED: Re-enable *only* if the terms are still checked =====
                const agreeToTerms = document.getElementById('agreeToTerms').checked;
                donateButton.classList.remove('loading');
                donateButton.disabled = !agreeToTerms;
            }
        }
    }

    resetForm() {
        document.getElementById('donateForm')?.reset();
        this.selectedAmount = null;
        this.customAmount = null;
        this.isRecurring = false;
        this.paymentAttempts = 0;
        this.updateAmountDisplay();
        this.updateDonationType();

        this.clearErrors();

        // ===== ADDED: Reset new fields to their default state =====
        document.getElementById('tax-exemption-fields').style.display = 'none';
        document.getElementById('donateButton').disabled = true;

        // Animate form reset
        setTimeout(() => {
            this.animateFormSection();
        }, 100);
    }

    async handlePaymentError(error) {
        let errorMessage = 'Payment processing failed. Please try again.';
        let errorReason = 'Unknown error';

        if (error.message) {
            errorReason = error.message;
            if (error.message.includes('insufficient')) {
                errorMessage = 'Payment failed due to insufficient funds. Please check your account balance.';
            } else if (error.message.includes('expired')) {
                errorMessage = 'Payment failed due to expired card. Please use a different payment method.';
            } else if (error.message.includes('declined')) {
                errorMessage = 'Payment was declined by your bank. Please contact your bank or try a different card.';
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error occurred. Please check your internet connection and try again.';
            }
        }

        await this.sendNotificationToBackend('payment-failed', {
            // ===== UPDATED: Send new name structure =====
            firstName: this.donorInfo.firstName,
            surname: this.donorInfo.surname,
            email: this.donorInfo.email,
            amount: this.donorInfo.amount,
            isRecurring: this.isRecurring,
            errorReason: errorReason
        });

        this.showError('Payment Failed', errorMessage);

        if (this.paymentAttempts >= this.maxRetries) {
            this.paymentAttempts = 0;
            this.showError('Max Retries Reached', 'Maximum retry attempts reached. Please contact support if the issue persists.');
        }
    }

    async sendNotificationToBackend(endpoint, data) {
        try {
            const result = await this.makeRequest('POST', endpoint, data);
            return result.success;
        } catch (error) {
            return false;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DonationManager();
});

// Utility functions for enhanced UX
class DonationUtils {
    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    static animateValue(element, start, end, duration) {
        const startTimestamp = performance.now();
        const step = (timestamp) => {
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const current = Math.floor(progress * (end - start) + start);
            element.textContent = this.formatCurrency(current);
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };
        requestAnimationFrame(step);
    }

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
}

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DonationManager, DonationUtils };
}