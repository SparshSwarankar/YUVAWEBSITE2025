document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
    const volunteerForm = document.getElementById('volunteer-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.fa-spinner');
    const statusModal = document.getElementById('statusModal');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const closeModal = document.getElementById('closeModal');

    // --- CONFIGURATION ---
    const scriptURL = 'https://script.google.com/macros/s/AKfycbwS1mZsiONZXzx_Gzj9usc0D9yd8Y4Ee6dVNrbcC3lgZGQUMFfeKAFLSNL_qy4rvvqQ/exec';
    const razorpayKey = 'rzp_live_RCnlaKffG5VeY0'; // Your public Razorpay Key ID

    // --- Main Event Listener ---
    volunteerForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!volunteerForm.checkValidity()) {
            volunteerForm.reportValidity();
            return;
        }
        createOrderAndPay();
    });

    /**
     * Step 1: Create an order on the backend using 'text/plain'.
     */
    async function createOrderAndPay() {
        setLoading(true);
        const formData = Object.fromEntries(new FormData(volunteerForm).entries());

        try {
            const response = await fetch(scriptURL, {
                method: 'POST',
                // ✨ KEY CHANGE: Using text/plain as requested
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'createOrder', ...formData }),
            });

            // ✨ KEY CHANGE: Parsing the response as text first, then as JSON
            const responseText = await response.text();
            if (!response.ok) {
                let errorMsg = `Server error: ${response.status}`;
                try { errorMsg = JSON.parse(responseText).message; } catch (e) { }
                throw new Error(errorMsg);
            }

            const result = JSON.parse(responseText);

            if (result.status === 'success' && result.orderId) {
                initializePayment(result.orderId, formData);
            } else {
                throw new Error(result.message || 'Failed to create payment order.');
            }
        } catch (error) {
            console.error('Order Creation Error:', error);
            showModal('error', 'Error!', `Could not initiate payment. ${error.message}`);
            setLoading(false);
        }
    }

    /**
     * Step 2: Initialize Razorpay checkout with a server-generated Order ID.
     */
    function initializePayment(orderId, formData) {
        const options = {
            key: razorpayKey,
            amount: 30000, // 300 INR in paise
            currency: "INR",
            name: "Vimarsh 2K25 Volunteer",
            description: "Registration Fee",
            image: "/Images/Vimarsh2025_logo.jpg",
            order_id: orderId,
            handler: function (response) {
                confirmPayment({
                    orderId: response.razorpay_order_id,
                    paymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature,
                    formData: formData
                });
            },
            prefill: {
                name: formData.name,
                email: formData.email,
                contact: formData.phone
            },
            theme: { color: "#8b0000" },
            modal: {
                ondismiss: function () {
                    showModal('error', 'Payment Canceled', 'You have closed the payment window.');
                    setLoading(false);
                }
            }
        };

        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response) {
            console.error('Payment Failed:', response.error);
            showModal('error', 'Payment Failed!', `Details: ${response.error.description}.`);
            setLoading(false);
        });
        rzp.open();
    }

    /**
     * Step 3: Confirm the payment on the backend using 'text/plain'.
     */
    async function confirmPayment(paymentData) {
        try {
            const response = await fetch(scriptURL, {
                method: 'POST',
                // ✨ KEY CHANGE: Using text/plain as requested
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'confirmPayment', ...paymentData }),
            });

            // ✨ KEY CHANGE: Parsing the response as text first, then as JSON
            const responseText = await response.text();
            if (!response.ok) {
                let errorMsg = `Server error: ${response.status}`;
                try { errorMsg = JSON.parse(responseText).message; } catch (e) { }
                throw new Error(errorMsg);
            }

            const result = JSON.parse(responseText);

            if (result.status === 'success') {
                showModal('success', 'Registration Successful!', 'Thank you! Your payment has been confirmed. Please check your email.');
                volunteerForm.reset();
            } else {
                throw new Error(result.message || 'Payment confirmation failed.');
            }
        } catch (error) {
            console.error('Confirmation Error:', error);
            showModal('error', 'Confirmation Failed', `Your payment was successful, but we couldn't confirm it on our server. Please contact support. Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    // --- Helper Functions (No changes needed below) ---
    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        btnText.textContent = isLoading ? 'Processing...' : 'Pay & Register';
        btnSpinner.style.display = isLoading ? 'inline-block' : 'none';
    }

    function showModal(type, title, message) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalIcon.innerHTML = type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-times-circle"></i>';
        modalIcon.className = `icon ${type}`;
        if (type === 'error') {
            modalMessage.innerHTML += `<br><br>If the problem persists, please contact us at 
            <a href="mailto:yuvavimarsh.helpdesk@gmail.com">yuvavimarsh.helpdesk@gmail.com</a>.`;
        }
        statusModal.style.display = 'flex';
    }

    closeModal.onclick = () => { statusModal.style.display = "none"; };
    window.onclick = (event) => {
        if (event.target == statusModal) {
            statusModal.style.display = "none";
        }
    };
});