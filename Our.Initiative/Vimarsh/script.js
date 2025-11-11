// Navbar color change on scroll
window.addEventListener("scroll", function () {
    const navbar = document.querySelector(".navbar");
    navbar.classList.toggle("scrolled", window.scrollY > 50);
});

// ======================About=====================
// Wait for DOM to be ready before initializing
document.addEventListener("DOMContentLoaded", () => {
    initNavbar();
    initAboutSection();
    initSpeakersSlider(); // <-- Will be updated
    initSpeakersHeading();
    initGallerySection(); // <-- Will be updated
    initArchiveSection();
    initScheduleButton();
    initLightbox();
    initKnowMore();

    lazyLoadImages(); // Initial lazy load
});

function initNavbar() {
    window.addEventListener("scroll", function () {
        const navbar = document.querySelector(".navbar");
        navbar.classList.toggle("scrolled", window.scrollY > 50);
    });
}

function initAboutSection() {
    const aboutSection = document.querySelector(".about");
    if (!aboutSection) return;

    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    aboutSection.classList.add("in-view");
                } else {
                    setTimeout(() => {
                        if (!entry.isIntersecting) {
                            aboutSection.classList.remove("in-view");
                        }
                    }, 200);
                }
            });
        },
        { threshold: 0.5 }
    );

    observer.observe(aboutSection);
}

/**
 * UPDATED FUNCTION
 * Animates the speaker slider using scrollLeft to allow for a native scrollbar.
 */
function initSpeakersSlider() {
    const viewport = document.getElementById("speakersSlider");
    if (!viewport) return;
    const track = viewport.querySelector(".speakers-track");
    const cards = Array.from(track.querySelectorAll(".speaker-card"));
    if (cards.length === 0) return; // Safety check

    // Clone cards *once* for the seamless loop
    const clones = cards.map(c => c.cloneNode(true));
    track.append(...clones);

    function getSpeed() {
        if (window.innerWidth <= 480) return 40; // phones
        if (window.innerWidth <= 768) return 60;  // tablets
        return 65; // desktops
    }

    let animRunning = false;
    let rafId = null;
    let lastTs = null;
    let isAnimatingScroll = false; // Flag to detect JS-driven scroll
    let scrollTimeout = null; // Timeout to resume play after manual scroll

    // Calculate width of original cards + gaps
    const cardStyle = window.getComputedStyle(cards[0]);
    const cardWidth = cards[0].offsetWidth + parseFloat(cardStyle.marginLeft) + parseFloat(cardStyle.marginRight);
    const cardGap = parseFloat(window.getComputedStyle(track).gap) || 30;
    const setWidth = cards.length * (cardWidth + cardGap) - cardGap; // Total width of one set


    function step(ts) {
        if (!animRunning) { lastTs = null; return; }
        if (lastTs == null) lastTs = ts;
        const dt = (ts - lastTs) / 1000;
        lastTs = ts;

        const SPEED_PX_PER_SEC = getSpeed();

        // Animate scrollLeft
        isAnimatingScroll = true; // Set flag
        viewport.scrollLeft += SPEED_PX_PER_SEC * dt;

        // Check for loop reset
        if (viewport.scrollLeft >= setWidth) {
            // Instantly snap back
            viewport.scrollLeft -= setWidth;
        }

        // Unset flag in the next frame
        requestAnimationFrame(() => { isAnimatingScroll = false; });

        rafId = requestAnimationFrame(step);
    }

    function play() {
        if (animRunning) return;
        animRunning = true;
        rafId = requestAnimationFrame(step);
    }

    function pause() {
        animRunning = false;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; lastTs = null; }
    }

    // Pause on manual scroll, resume after 3 seconds
    viewport.addEventListener("scroll", () => {
        if (isAnimatingScroll) return; // Ignore scrolls triggered by step()
        pause();
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(play, 3000);
    }, { passive: true });

    // Pause/resume on hover
    viewport.addEventListener("mouseenter", pause, { passive: true });
    viewport.addEventListener("mouseleave", () => {
        clearTimeout(scrollTimeout); // Prevent hover-out from clashing
        scrollTimeout = setTimeout(play, 120); // Short delay
    }, { passive: true });

    // Only run when visible
    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) play();
            else pause();
        });
    }, { threshold: 0.35 });
    io.observe(viewport);

    // Flip animation (click/tap/keyboard) - UNCHANGED
    track.querySelectorAll(".speaker-card").forEach(card => {
        card.addEventListener("click", () => card.classList.toggle("is-flipped"));
        card.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                card.classList.toggle("is-flipped");
            }
        });
    });

    // start initially if visible
    setTimeout(() => {
        if (viewport.getBoundingClientRect().top < window.innerHeight) play();
    }, 200);
}


function initSpeakersHeading() {
    const heading = document.querySelector(".speakers h2");
    if (!heading) return;

    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                heading.classList.add("is-visible");
            } else {
                heading.classList.remove("is-visible");
            }
        });
    }, { threshold: 0.3 });

    io.observe(heading);
}

/**
 * UPDATED FUNCTION
 * Replaces the CSS animation with a JS-driven scrollLeft animation 
 * to allow for a native scrollbar.
 */
function initGallerySection() {
    const heading = document.querySelector(".gallery h2");
    if (!heading) return;

    const ioHeading = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                heading.classList.add("is-visible");
            } else {
                heading.classList.remove("is-visible");
            }
        });
    }, { threshold: 0.3 });

    ioHeading.observe(heading);

    // ===== NEW JS SLIDER LOGIC FOR GALLERY =====
    const viewport = document.querySelector(".gallery .slider-container");
    if (!viewport) return;
    const track = viewport.querySelector(".slider-track");
    const images = Array.from(track.querySelectorAll("img"));
    if (images.length === 0) return;

    // Clone images once
    const clones = images.map(img => img.cloneNode(true));
    track.append(...clones);

    const SPEED_PX_PER_SEC = 50; // Constant speed for gallery

    let animRunning = false;
    let rafId = null;
    let lastTs = null;
    let isAnimatingScroll = false;
    let scrollTimeout = null;

    // Calculate width of original images + gaps
    const imgStyle = window.getComputedStyle(images[0]);
    const imgWidth = images[0].offsetWidth + parseFloat(imgStyle.marginLeft) + parseFloat(imgStyle.marginRight);
    const imgGap = parseFloat(window.getComputedStyle(track).gap) || 15;
    const setWidth = images.length * (imgWidth + imgGap) - imgGap; // Total width of one set


    function step(ts) {
        if (!animRunning) { lastTs = null; return; }
        if (lastTs == null) lastTs = ts;
        const dt = (ts - lastTs) / 1000;
        lastTs = ts;

        isAnimatingScroll = true;
        viewport.scrollLeft += SPEED_PX_PER_SEC * dt;

        if (viewport.scrollLeft >= setWidth) {
            viewport.scrollLeft -= setWidth;
        }

        requestAnimationFrame(() => { isAnimatingScroll = false; });

        rafId = requestAnimationFrame(step);
    }

    function play() {
        if (animRunning) return;
        animRunning = true;
        rafId = requestAnimationFrame(step);
    }

    function pause() {
        animRunning = false;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; lastTs = null; }
    }

    // Pause on manual scroll
    viewport.addEventListener("scroll", () => {
        if (isAnimatingScroll) return;
        pause();
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(play, 3000);
    }, { passive: true });

    // Pause on hover
    viewport.addEventListener("mouseenter", pause, { passive: true });
    viewport.addEventListener("mouseleave", () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(play, 120);
    }, { passive: true });

    // Pause when not visible
    const ioSlider = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) play();
            else pause();
        });
    }, { threshold: 0.35 });
    ioSlider.observe(viewport);

    // Start if visible
    setTimeout(() => {
        if (viewport.getBoundingClientRect().top < window.innerHeight) play();
    }, 200);
}


function initArchiveSection() {
    const archiveHeading = document.querySelector(".archives h2");
    const cards = document.querySelectorAll(".archive-card");
    if (!archiveHeading || !cards.length) return;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
            }
        });
    }, { threshold: 0.2 });

    observer.observe(archiveHeading);
    cards.forEach(card => observer.observe(card));

    // Subtle tilt effect on hover
    cards.forEach(card => {
        card.addEventListener("mousemove", e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / 10) * -1;
            const rotateY = (x - centerX) / 10;
            card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        card.addEventListener("mouseleave", () => {
            card.style.transform = "rotateX(0) rotateY(0)";
        });
    });
}

// ✅ Add this entire new function
// âœ… MOVE this OUTSIDE the function, at the top of your script
const isScheduleReady = false;

function initScheduleButton() {
    // Find all the necessary elements first
    const scheduleButton = document.getElementById('schedule-btn');
    const scheduleModal = document.getElementById('scheduleModal');
    const closeModalButton = document.getElementById('closeScheduleModal');

    if (scheduleButton && scheduleModal && closeModalButton) {
        scheduleButton.addEventListener('click', function (event) {
            if (!isScheduleReady) {
                event.preventDefault();
                scheduleModal.style.display = 'flex';
            }
            // If isScheduleReady is true, the link works normally
        });

        closeModalButton.addEventListener('click', () => {
            scheduleModal.style.display = 'none';
        });

        scheduleModal.addEventListener('click', (event) => {
            if (event.target === scheduleModal) {
                scheduleModal.style.display = 'none';
            }
        });
    }
}


// ===== LAZY IMAGE LOADING =====
function lazyLoadImages() {
    const images = document.querySelectorAll(".gallery-item img");

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.dataset.src;
                if (src) {
                    img.src = src;
                    img.onload = () => {
                        img.classList.add("loaded"); // fade-in effect
                        img.dataset.loaded = "true";
                    };
                    img.removeAttribute("data-src");
                }
                obs.unobserve(img);
            }
        });
    }, { rootMargin: "100px" });

    images.forEach(img => observer.observe(img));
}

function initLightbox() {
    // ===== FILTER FUNCTIONALITY =====
    const filterBtns = document.querySelectorAll(".filter-btn");
    const galleryItems = document.querySelectorAll(".gallery-item");

    // Only run filter logic if buttons exist
    if (filterBtns.length > 0 && galleryItems.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelector(".filter-btn.active")?.classList.remove("active");
                btn.classList.add("active");

                const year = btn.dataset.filter;

                galleryItems.forEach(item => {
                    if (year === "all" || item.dataset.year === year) {
                        item.classList.remove("hide");
                    } else {
                        item.classList.add("hide");
                    }
                });
                lazyLoadImages(); // Re-run lazy load for newly visible items
            });
        });
    }

    // ===== LIGHTBOX FUNCTIONALITY =====
    const lightbox = document.getElementById("lightbox");

    // ✅ IMPORTANT: Only run the rest of the code if the lightbox exists on the page
    if (lightbox) {
        const lightboxImg = document.querySelector(".lightbox-content");
        const closeBtn = document.querySelector("#lightbox .close");
        const prevArrow = document.querySelector(".lightbox-arrow.left");
        const nextArrow = document.querySelector(".lightbox-arrow.right");

        let currentIndex = -1;

        function getVisibleImages() {
            return [...document.querySelectorAll(".gallery-item:not(.hide) img.loaded")];
        }

        function showLightbox(index) {
            const visibleImages = getVisibleImages();
            if (!visibleImages.length) return;
            currentIndex = index;
            lightbox.style.display = "flex";
            lightboxImg.src = visibleImages[currentIndex].src;
        }

        // Open lightbox on click
        document.addEventListener("click", e => {
            if (e.target.matches(".gallery-item img.loaded")) {
                const visibleImages = getVisibleImages();
                const index = visibleImages.indexOf(e.target);
                if (index !== -1) showLightbox(index);
            }
        });

        // Close lightbox
        if (closeBtn) {
            closeBtn.addEventListener("click", () => lightbox.style.display = "none");
        }

        lightbox.addEventListener("click", e => {
            if (e.target === lightbox) lightbox.style.display = "none";
        });

        // Navigate with arrows
        if (prevArrow) {
            prevArrow.addEventListener("click", () => {
                const visibleImages = getVisibleImages();
                if (!visibleImages.length) return;
                currentIndex = (currentIndex - 1 + visibleImages.length) % visibleImages.length;
                lightboxImg.src = visibleImages[currentIndex].src;
            });
        }

        if (nextArrow) {
            nextArrow.addEventListener("click", () => {
                const visibleImages = getVisibleImages();
                if (!visibleImages.length) return;
                currentIndex = (currentIndex + 1) % visibleImages.length;
                lightboxImg.src = visibleImages[currentIndex].src;
            });
        }

        // Keyboard support
        document.addEventListener("keydown", e => {
            if (lightbox.style.display === "flex") {
                if (e.key === "Escape") lightbox.style.display = "none";
                if (e.key === "ArrowLeft" && prevArrow) prevArrow.click();
                if (e.key === "ArrowRight" && nextArrow) nextArrow.click();
            }
        });
    }
}


function initKnowMore() {
    // Reveal animation on scroll
    const sections = document.querySelectorAll('.km-section');
    const navLinks = document.querySelectorAll('.year-nav a');

    const revealOnScroll = () => {
        sections.forEach(sec => {
            const top = sec.getBoundingClientRect().top;
            if (top < window.innerHeight - 100) {
                sec.classList.add('visible');
            }
        });

        let current = "";
        sections.forEach(sec => {
            const sectionTop = sec.offsetTop - 200;
            if (pageYOffset >= sectionTop) {
                current = sec.getAttribute("id");
            }
        });
        navLinks.forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href") === "#" + current) {
                link.classList.add("active");
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    window.addEventListener('load', revealOnScroll);

    // Smooth scroll
    navLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (href && href.startsWith("#")) {
            link.addEventListener("click", e => {
                e.preventDefault();
                const target = document.querySelector(href);
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: "smooth"
                });
            });
        }
    });

    // =============================
    // Custom 2025 Alert
    // =============================
    let is2025Ready = false;
    const nav2025 = document.getElementById("nav2025");
    const alert2025 = document.getElementById("alert2025");
    const closeAlert = document.getElementById("closeAlert");

    if (nav2025) {
        nav2025.addEventListener("click", e => {
            if (!is2025Ready) {
                e.preventDefault();
                alert2025.style.display = "flex";
            }
        });
    }

    if (closeAlert) {
        closeAlert.addEventListener("click", () => {
            alert2025.style.display = "none";
        });
    }

    // =============================
    // 3D Tilt Image Effect
    // =============================
    document.querySelectorAll('.km-img').forEach(container => {
        const img = container.querySelector('img');
        let rotateX = 0, rotateY = 0;
        let targetX = 0, targetY = 0;

        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            targetX = ((centerY - y) / centerY) * 10;
            targetY = ((x - centerX) / centerX) * 10;
        });

        container.addEventListener('mouseleave', () => {
            targetX = 0;
            targetY = 0;
        });

        function animate() {
            rotateX += (targetX - rotateX) * 0.08;
            rotateY += (targetY - rotateY) * 0.08;
            img.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            requestAnimationFrame(animate);
        }
        animate();
    });

    // =============================
    // Mobile Sidebar Functionality
    // =============================
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const yearNav = document.getElementById('year-nav');
    let isMobile = window.innerWidth <= 760;

    window.addEventListener('resize', () => {
        isMobile = window.innerWidth <= 760;
        if (!isMobile) {
            yearNav.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            yearNav.classList.toggle('active');
            document.body.style.overflow = yearNav.classList.contains('active') ? 'hidden' : '';
        });
    }

    if (yearNav && hamburgerMenu) {
        document.addEventListener('click', (e) => {
            if (yearNav.classList.contains('active') &&
                !yearNav.contains(e.target) &&
                !hamburgerMenu.contains(e.target)) {
                yearNav.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href) return;

            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    yearNav.classList.remove('active');
                    document.body.style.overflow = '';

                    setTimeout(() => {
                        window.scrollTo({
                            top: target.offsetTop - 80,
                            behavior: 'smooth'
                        });
                    }, 300);
                }
            }
        });
    });
}