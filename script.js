/**
 * PageTransitionSystem Class
 * This class handles the smooth transition overlay and dynamic header titles.
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
            .page-transition-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; backdrop-filter: blur(8px); background: rgba(0,0,0,0.3); display: none; justify-content: center; align-items: center; z-index: 9999; opacity: 0; transition: opacity 0.3s ease; }
            .page-transition-overlay.active { display: flex; opacity: 1; }
            .loader { width: 60px; height: 60px; border: 6px solid rgba(255,255,255,0.3); border-top-color: #000080; border-radius: 50%; animation: spin 1s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `;
        document.head.appendChild(style);
    }
    updateHeaderOnPageLoad() {
        const headerActions = document.querySelector('.header-actions');
        const currentPath = window.location.pathname;
        const isHomePage = currentPath.endsWith('home.html') || currentPath.endsWith('/');
        if (headerActions) {
            headerActions.style.display = 'flex';
        }
        if (!isHomePage) {
            const headerContent = document.querySelector('.header-content');
            if (headerContent && !headerContent.querySelector('.page-title')) {
                const pageTitle = document.createElement('div');
                pageTitle.className = 'page-title';
                const currentPage = currentPath.split("/").pop();
                pageTitle.textContent = this.pageTitles[currentPage] || 'Page';
                headerContent.appendChild(pageTitle);
            }
        }
    }
    attachLinkHandlers() {
        const sidebarLinks = document.querySelectorAll('.sidebar a[href]:not(.dropdown-btn)');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href.startsWith('http') || href.startsWith('#')) return;
                e.preventDefault();
                this.transitionToPage(href);
            });
        });
    }
    async transitionToPage(url) {
        const overlay = document.querySelector('.page-transition-overlay');
        overlay.classList.add('active');
        await new Promise(resolve => setTimeout(resolve, 300));
        window.location.href = url;
    }
}

/**
 * Main application logic
 */
document.addEventListener("DOMContentLoaded", () => {
    // --- Initialize Page Transitions ---
    new PageTransitionSystem();

    // --- Cache all necessary DOM elements once ---
    const body = document.body;
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.querySelector(".toggle-btn");
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const dropdownBtns = document.querySelectorAll(".dropdown-btn");

    // --- Function to open the sidebar ---
    const openSidebar = () => {
        body.classList.add("sidebar-active");
        if (sidebar) sidebar.classList.add("active");
        if (hamburgerMenu) hamburgerMenu.classList.add("is-active");
    };

    // --- Function to close the sidebar ---
    const closeSidebar = () => {
        body.classList.remove("sidebar-active");
        if (sidebar) sidebar.classList.remove("active");
        if (hamburgerMenu) hamburgerMenu.classList.remove("is-active");
    };

    // --- Desktop Toggle Button Functionality ---
    if (toggleBtn) {
        toggleBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            if (body.classList.contains("sidebar-active")) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    // --- Mobile Hamburger Menu Functionality ---
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', (event) => {
            event.stopPropagation();
            if (body.classList.contains("sidebar-active")) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    // --- Combined "Click Outside" Functionality to close the sidebar ---
    document.addEventListener('click', (event) => {
        if (body.classList.contains('sidebar-active') && !sidebar.contains(event.target) && !hamburgerMenu.contains(event.target) && !toggleBtn.contains(event.target)) {
            closeSidebar();
        }
    });

    // --- Dropdown Functionality ---
    dropdownBtns.forEach((btn) => {
        btn.addEventListener("click", function () {
            this.parentElement.classList.toggle("active");
        });
    });
});