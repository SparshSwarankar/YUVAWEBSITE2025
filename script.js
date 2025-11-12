/**
 * PageTransitionSystem Class (mobile back fix + bfcache-safe)
 */
class PageTransitionSystem {
    constructor() {
        this.pageTitles = {
            'home.html': 'National YUVA',
            '/About/AboutUs.html': 'About Us',
            '/About/whoiswho.html': 'Who is Who',
            '/Our.Initiative/vimarsh2025.html': 'Vimarsh 2025',
            '/Our.Initiative/Bharatparv.html': 'Bharat Parv',
            '/Our.Initiative/ritam.html': 'Ritam',
            '/Our.Initiative/ims.html': 'Indraprasth Media Sambad',
            '/Our.Initiative/Samarpan.html': 'Samarpan',
            '/Our.Initiative/NatyaTarang.html': 'Natya Tarang',
            'activities.html': 'Activities',
            'medico.html': 'Medico YUVA',
            'media-manthan.html': 'Media Manthan',
            'nidhi.html': 'Nidhi Manthan',
            'tech.html': 'Tech YUVA',
            'distance-learning.html': 'YUVA Distance Learning',
            'digital-media.html': 'In Digital Media',
            'news.html': 'In the News',
            'recordings.html': 'Events Recordings',
            'past-events.html': 'Past Events',
            'upcoming-events.html': 'Upcoming Events',
            'photos.html': 'Photo Gallery',
            'videos.html': 'Video Gallery',
            'chronicles.html': 'Campus Chronicles',
            'volunteer.html': 'Become a Volunteer',
            'internship.html': 'Internship',
            'fellowship.html': 'Fellowship',
            'alumni.html': 'YUVA Alumni',
            'unit-registration.html': 'Unit Registration',
            'donate.html': 'Donate'
        };
        this.setupOverlay();
        this.setupBFCacheGuards();
        this.updateHeaderOnPageLoad();
        this.attachLinkHandlers();
    }

    setupOverlay() {
        const overlay = document.createElement('div');
        overlay.classList.add('page-transition-overlay');
        overlay.innerHTML = `<div class="loader"></div>`;
        document.body.appendChild(overlay);

        const style = document.createElement('style');
        style.textContent = `
            .page-transition-overlay {
                position: fixed; inset: 0; width: 100%; height: 100%;
                backdrop-filter: blur(8px);
                background: rgba(0,0,0,0.3);
                display: none; justify-content: center; align-items: center;
                z-index: 9999; opacity: 0; transition: opacity 0.3s ease;
                pointer-events: none;
            }
            .page-transition-overlay.active {
                display: flex; opacity: 1; pointer-events: all;
            }
            .loader {
                width: 60px; height: 60px;
                border: 6px solid rgba(255,255,255,0.3);
                border-top-color: #000080; border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        `;
        document.head.appendChild(style);
    }

    setupBFCacheGuards() {
        const hideOverlay = () => {
            const overlay = document.querySelector('.page-transition-overlay');
            if (overlay) {
                overlay.classList.remove('active');
                // Force reflow to ensure hidden state is applied even when restored from cache
                void overlay.offsetHeight;
                overlay.style.display = ''; // keep CSS control
            }
        };

        // When the page is shown (including when coming back from bfcache)
        window.addEventListener('pageshow', (evt) => {
            // evt.persisted === true means it was restored from bfcache
            hideOverlay();
        });

        // Extra safety when navigating history without full reloads (some Android cases)
        window.addEventListener('popstate', hideOverlay);

        // Optional: show overlay on unload for normal forward navigations too
        // (not strictly required since we show it during link click)
        window.addEventListener('beforeunload', () => {
            const overlay = document.querySelector('.page-transition-overlay');
            if (overlay) overlay.classList.add('active');
        });
    }

    getPageTitleFromPath(pathname) {
        // Try full path key first
        if (this.pageTitles[pathname]) return this.pageTitles[pathname];
        // Then try only the filename
        const base = pathname.split('/').pop() || '';
        if (this.pageTitles[base]) return this.pageTitles[base];
        // Special-case home
        if (pathname.endsWith('/') || base === '' || base === 'home.html') return this.pageTitles['home.html'] || 'Home';
        return 'Page';
    }

    updateHeaderOnPageLoad() {
        const headerActions = document.querySelector('.header-actions');
        const currentPath = window.location.pathname;

        if (headerActions) headerActions.style.display = 'flex';

        const isHomePage = currentPath.endsWith('home.html') || currentPath.endsWith('/');
        if (!isHomePage) {
            const headerContent = document.querySelector('.header-content');
            if (headerContent && !headerContent.querySelector('.page-title')) {
                const pageTitle = document.createElement('div');
                pageTitle.className = 'page-title';
                pageTitle.textContent = this.getPageTitleFromPath(currentPath);
                headerContent.appendChild(pageTitle);
            }
        }
    }

    attachLinkHandlers() {
        const sidebarLinks = document.querySelectorAll('.sidebar a[href]:not(.dropdown-btn)');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href') || '';
                // Allow external links and hash links
                if (href.startsWith('http') || href.startsWith('#')) return;

                // Prevent default and run the transition
                e.preventDefault();
                this.transitionToPage(href);
            }, { passive: false });
        });
    }

    async transitionToPage(url) {
        const overlay = document.querySelector('.page-transition-overlay');
        if (overlay) {
            overlay.classList.add('active');
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        // Use assign so it adds to history (back works)
        window.location.assign(url);
    }
}

// ---- Main application logic ----
document.addEventListener("DOMContentLoaded", () => {
    new PageTransitionSystem();

    // Your existing sidebar/menu code unchanged
    const body = document.body;
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.querySelector(".toggle-btn");
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const dropdownBtns = document.querySelectorAll(".dropdown-btn");

    const openSidebar = () => {
        body.classList.add("sidebar-active");
        if (sidebar) sidebar.classList.add("active");
        if (hamburgerMenu) hamburgerMenu.classList.add("is-active");
    };

    const closeSidebar = () => {
        body.classList.remove("sidebar-active");
        if (sidebar) sidebar.classList.remove("active");
        if (hamburgerMenu) hamburgerMenu.classList.remove("is-active");
    };

    if (toggleBtn) {
        toggleBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            body.classList.contains("sidebar-active") ? closeSidebar() : openSidebar();
        });
    }

    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', (event) => {
            event.stopPropagation();
            body.classList.contains("sidebar-active") ? closeSidebar() : openSidebar();
        });
    }

    document.addEventListener('click', (event) => {
        const clickedOutside =
            body.classList.contains('sidebar-active') &&
            sidebar && !sidebar.contains(event.target) &&
            (!hamburgerMenu || !hamburgerMenu.contains(event.target)) &&
            (!toggleBtn || !toggleBtn.contains(event.target));
        if (clickedOutside) closeSidebar();
    });

    dropdownBtns.forEach((btn) => {
        btn.addEventListener("click", function () {
            this.parentElement.classList.toggle("active");
        });
    });
});