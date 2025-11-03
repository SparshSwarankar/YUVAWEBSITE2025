document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Intersection Observer for Animations & Side Nav ---
    const sections = document.querySelectorAll('.content-section');
    const navDots = document.querySelectorAll('.side-nav .dot');

    const observerOptions = { rootMargin: '-50% 0px -50% 0px' };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Animate sections on scroll
            if (entry.isIntersecting) {
                entry.target.querySelectorAll('.animate-on-scroll').forEach(el => {
                    el.classList.add('visible');
                });
            }

            // Update active navigation dot
            if (entry.isIntersecting) {
                const targetId = entry.target.id;
                navDots.forEach(dot => {
                    dot.classList.toggle('active', dot.getAttribute('href') === `#${targetId}`);
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));

    // Initial animation for elements already in view
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight) {
            el.classList.add('visible');
        }
    });

    // --- 2. Interactive Map Tooltip ---
    const map = document.querySelector('.interactive-map');
    const tooltip = document.getElementById('map-tooltip');
    if (map && tooltip) {
        map.querySelectorAll('path').forEach(state => {
            state.addEventListener('mousemove', (e) => {
                tooltip.style.display = 'block';
                tooltip.style.left = `${e.pageX + 15}px`;
                tooltip.style.top = `${e.pageY + 15}px`;
                tooltip.textContent = state.getAttribute('data-state');
            });
            state.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        });
    }

    // --- 3. Culinary Journey: Interactive Panorama (Unchanged) ---
    const panoramaContainer = document.getElementById('panorama-container');
    if (panoramaContainer) {
        pannellum.viewer('panorama-container', {
            "type": "equirectangular",
            "panorama": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=3000",
            "autoLoad": true,
            "showControls": false
        });
    }

    // --- 4. Spatial Audio Trigger (Now on Bento item) ---
    const introNarrative = document.getElementById('intro_narrative');
    const ambientAudio = document.getElementById('ambient-audio');
    const audioObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            ambientAudio.play().catch(e => { });
        } else {
            ambientAudio.pause();
        }
    }, { threshold: 0.5 });

    if (introNarrative && ambientAudio) {
        audioObserver.observe(introNarrative);
    }

    // --- 5. Voice UI (Unchanged) ---
    const voiceBtn = document.getElementById('voice-command-btn');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        const commands = {
            "show me the schedule": "event_schedule",
            "what's new": "event_schedule", // Points to the same section now
            "show the map": "cultural_kaleidoscope",
            "show digital india": "digital_india_hub"
        };
        recognition.onstart = () => voiceBtn.classList.add('listening');
        recognition.onend = () => voiceBtn.classList.remove('listening');
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase().trim();
            if (transcript.startsWith("hey bharat")) {
                const command = transcript.substring(10).trim();
                if (commands[command]) {
                    document.getElementById(commands[command]).scrollIntoView({ behavior: 'smooth' });
                }
            }
        };
        voiceBtn.addEventListener('click', () => recognition.start());
    } else {
        voiceBtn.style.display = 'none';
    }
});