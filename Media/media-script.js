/* ===== MODERN MEDIA PAGES JAVASCRIPT ===== */

// Global variables
let currentFilter = 'all';
let currentYear = 'all';
let isLoading = false;
let videoData = []; // Store fetched video data
let dataSource = 'config'; // 'config' or 'sheets' - shared across pages
// Initialize from localStorage if present
try {
    const savedSource = localStorage.getItem('media_data_source');
    if (savedSource === 'sheets' || savedSource === 'config') {
        dataSource = savedSource;
    }
} catch (e) { /* ignore storage errors */ }

// Google Sheets Web App URL - same as video manager
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzbDDv0SsGWRrRemZufEkUyDk1A04IsE5jiYFwSNwAwj7ZACs2buWGOYfL_Lj9pzfVK/exec';

// JSONP helper to avoid CORS while getting a readable response
function jsonpRequest(url, params = {}) {
    return new Promise((resolve, reject) => {
        const callbackName = `jsonp_cb_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        params.callback = callbackName;
        const qs = new URLSearchParams(params).toString();
        const script = document.createElement('script');
        script.src = `${url}?${qs}`;
        script.async = true;

        window[callbackName] = (data) => {
            resolve(data);
            delete window[callbackName];
            script.remove();
        };

        script.onerror = () => {
            reject(new Error('JSONP request failed'));
            delete window[callbackName];
            script.remove();
        };

        document.body.appendChild(script);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeMediaPage();
    setupEventListeners();
    loadContent();
    // Listen for sync triggers from manager
    try {
        window.addEventListener('storage', (e) => {
            if (e.key === 'media_sync_trigger') {
                // Re-load videos on public page when manager triggers sync
                if (window.location.pathname.includes('Video.html')) {
                    loadVideoData();
                }
            }
        });
    } catch (e) { }
});

// Initialize page based on current page type
function initializeMediaPage() {
    const path = window.location.pathname;

    if (path.includes('DigitalMedia.html')) {
        initializeDigitalMedia();
    } else if (path.includes('News.html')) {
        initializeNews();
    } else if (path.includes('Video.html')) {
        initializeVideo();
    }
}

// ===== DIGITAL MEDIA FUNCTIONALITY =====
function initializeDigitalMedia() {
    // Animate social cards on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.social-card').forEach(card => {
        observer.observe(card);
    });

    // Add hover effects to social cards
    document.querySelectorAll('.social-card').forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// ===== NEWS FUNCTIONALITY =====
function initializeNews() {
    // Setup filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            // Remove active class from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');

            // Update current filter
            currentFilter = this.dataset.filter;

            // Filter news cards
            filterNewsCards();
        });
    });

    // Add click effects to news cards
    document.querySelectorAll('.news-card').forEach(card => {
        card.addEventListener('click', function () {
            // Add click animation
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
    setupImageModal();
}

function filterNewsCards() {
    const newsCards = document.querySelectorAll('.news-card');

    newsCards.forEach(card => {
        const category = card.dataset.category;

        if (currentFilter === 'all' || category === currentFilter) {
            card.style.display = 'block';
            card.style.animation = 'fadeInUp 0.4s ease-out forwards';
        } else {
            card.style.display = 'none';
        }
    });
}

// ===============================================
// ===== NEW: NEWSPAPER IMAGE MODAL LOGIC =====
// ===============================================

function setupImageModal() {
    // Check if modal already exists to prevent duplication
    if (document.getElementById('imageModal')) return;

    // Create modal HTML and append to body
    const modalHTML = `
        <div id="imageModal" class="modal">
            <div class="modal-content">
                <button class="modal-close" aria-label="Close image viewer">
                    <i class="fas fa-times"></i>
                </button>
                <div class="image-modal-container">
                    <img id="modalImage" src="" alt="Enlarged newspaper clipping">
                    <div id="modalImageTitle" class="image-modal-title"></div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('imageModal');
    const closeBtn = modal.querySelector('.modal-close');

    // Add click listeners to all newspaper cuttings
    document.querySelectorAll('.newspaper-cutting').forEach(cutting => {
        cutting.addEventListener('click', function () {
            const img = this.querySelector('img');
            const imgSrc = img.getAttribute('src');
            const imgTitle = this.dataset.title || 'Newspaper Clipping';
            openImageModal(imgSrc, imgTitle);
        });
    });

    // Close modal event listeners
    closeBtn.addEventListener('click', closeImageModal);
    modal.addEventListener('click', function (e) {
        // Close if the click is on the modal backdrop itself
        if (e.target === modal) {
            closeImageModal();
        }
    });
}

function openImageModal(src, title) {
    const modal = document.getElementById('imageModal');
    if (!modal) return;

    document.getElementById('modalImage').src = src;
    document.getElementById('modalImageTitle').textContent = title;

    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (!modal) return;

    modal.classList.remove('show');
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// ===== VIDEO FUNCTIONALITY =====
function initializeVideo() {
    // Load video data from YouTube API
    loadVideoData();

    // Setup filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            // Remove active class from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');

            // Update current filter
            currentFilter = this.dataset.filter;

            // Show/hide year filters based on selection
            const yearFilters = document.getElementById('yearFilters');
            if (currentFilter === 'vimarsh') {
                yearFilters.style.display = 'flex';
            } else {
                yearFilters.style.display = 'none';
                currentYear = 'all'; // Reset year filter
            }

            // Filter video cards
            filterVideoCards();
        });
    });

    // Setup year filter buttons
    const yearFilterButtons = document.querySelectorAll('.year-filter-btn');
    yearFilterButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            // Remove active class from all year buttons
            yearFilterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');

            // Update current year
            currentYear = this.dataset.year;

            // Filter video cards
            filterVideoCards();
        });
    });

    // Setup video modal
    setupVideoModal();
}

// ===== YOUTUBE API INTEGRATION =====
async function loadVideoData() {
    if (isLoading) return;

    isLoading = true;
    showVideoLoadingState();

    try {
        // If Sheets is selected, load Sheets first (if available)
        const mergedVideos = [];
        const seenIds = new Set();

        if (dataSource === 'sheets') {
            console.log('Loading videos from Google Sheets...');
            const sheetsRaw = await jsonpRequest(WEB_APP_URL, { action: 'getVideos' });
            const norm = normalizeSheetsData(sheetsRaw);
            if (norm.success && norm.videos && norm.videos.length > 0) {
                const sheetVideos = norm.videos.map(video => {
                    const publishedYear = new Date(video.publishedAt).getFullYear().toString();
                    const v = {
                        id: video.id,
                        title: video.title,
                        description: video.description ? video.description.substring(0, 150) + '...' : 'No description available',
                        thumbnail: video.thumbnail || `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
                        publishedAt: video.publishedAt,
                        publishedYear: publishedYear,
                        viewCount: video.viewCount || 'N/A',
                        duration: video.duration || 'N/A',
                        category: video.category,
                        year: video.year
                    };
                    return v;
                });
                sheetVideos.forEach(v => { if (!seenIds.has(v.id)) { seenIds.add(v.id); mergedVideos.push(v); } });
                console.log('Videos loaded from Google Sheets:', mergedVideos.length);
            } else {
                console.log('No videos in Google Sheets');
                showFlashMessage('warning', 'No Videos', 'No videos found in Google Sheets. Showing Config videos only.');
            }
        }

        // Always load from config for public page; then merge (avoid duplicates)
        console.log('Loading videos from Config File...');

        if (!window.YOUTUBE_CONFIG || !window.VIDEO_CONFIG) {
            throw new Error('YouTube configuration not loaded');
        }

        const apiKey = window.YOUTUBE_CONFIG.API_KEY;
        if (!apiKey || apiKey === 'YOUR_YOUTUBE_API_KEY_HERE') {
            throw new Error('YouTube API key not configured');
        }

        // Get video IDs from config
        const videoIds = window.VIDEO_CONFIG.map(video => video.id).join(',');

        if (!videoIds) {
            throw new Error('No videos configured');
        }

        // Fetch video details from YouTube API
        const response = await fetch(
            `${window.YOUTUBE_CONFIG.API_URL}?part=snippet,statistics,contentDetails&id=${videoIds}&key=${apiKey}`
        );

        if (!response.ok) {
            throw new Error(`YouTube API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.items && data.items.length > 0) {
            // Process and store video data
            const configVideosProcessed = data.items.map(item => {
                const configVideo = window.VIDEO_CONFIG.find(v => v.id === item.id);
                const publishedYear = new Date(item.snippet.publishedAt).getFullYear().toString();
                return {
                    id: item.id,
                    title: item.snippet.title,
                    description: item.snippet.description.substring(0, 150) + '...',
                    thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
                    publishedAt: item.snippet.publishedAt,
                    publishedYear: publishedYear,
                    viewCount: item.statistics?.viewCount ? formatNumber(item.statistics.viewCount) : 'N/A',
                    duration: item.contentDetails?.duration ? formatDuration(item.contentDetails.duration) : 'N/A',
                    category: configVideo ? configVideo.category : 'all'
                };
            });

            // Merge config-derived videos with any sheet videos gathered earlier
            configVideosProcessed.forEach(v => { if (!seenIds.has(v.id)) { seenIds.add(v.id); mergedVideos.push(v); } });
            videoData = mergedVideos;

            // Render videos
            renderVideoCards();
            showFlashMessage('success', 'Videos Loaded', `Loaded ${videoData.length} videos`, 3000);
        } else {
            throw new Error('No video data received from YouTube API');
        }

    } catch (error) {
        console.error('Error loading video data:', error);
        showFlashMessage('error', 'API Error', 'Failed to load videos. Please add videos using the video manager.');
        loadFallbackVideoData();
    } finally {
        isLoading = false;
        hideVideoLoadingState();
    }
}
// Normalize Google Sheets responses to a consistent structure
function normalizeSheetsData(data) {
    try {
        if (!data) return { success: false };
        // Some backends wrap inside data.data or data
        const inner = (data.data && data.data.videos !== undefined) ? data.data
            : (data.data && data.data.data ? data.data.data : (data.videos ? data : null));
        if (inner && Array.isArray(inner.videos)) {
            return { success: true, videos: inner.videos, count: inner.videos.length };
        }
    } catch (e) {
        console.log('normalizeSheetsData error', e);
    }
    return { success: false };
}

function loadFallbackVideoData() {
    // Fallback data when API is not available
    if (window.VIDEO_CONFIG && window.VIDEO_CONFIG.length > 0) {
        videoData = window.VIDEO_CONFIG.map(video => ({
            id: video.id,
            title: video.title,
            description: video.description,
            thumbnail: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
            publishedAt: video.publishedAt,
            viewCount: 'N/A',
            duration: 'N/A',
            category: video.category
        }));
    } else {
        // No videos available
        videoData = [];
        const videoGrid = document.querySelector('.video-grid');
        if (videoGrid) {
            videoGrid.innerHTML = `
                <div class="no-videos-message">
                    <i class="fas fa-video-slash"></i>
                    <h3>No Videos Available</h3>
                    <p>Please add videos using the <a href="video-manager.html">Video Manager</a></p>
                </div>
            `;
        }
    }

    renderVideoCards();
}

function renderVideoCards() {
    const videoGrid = document.querySelector('.video-grid');
    if (!videoGrid) return;

    // Clear existing content
    videoGrid.innerHTML = '';

    // Filter videos based on current filter
    const filteredVideos = currentFilter === 'all'
        ? videoData
        : videoData.filter(video => video.category === currentFilter);

    // Render video cards
    filteredVideos.forEach(video => {
        const videoCard = createVideoCard(video);
        videoGrid.appendChild(videoCard);
    });

    // Re-setup video modal for new cards
    setupVideoModal();
}

function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.setAttribute('data-category', video.category);
    card.setAttribute('data-year', video.publishedYear);

    const publishedDate = new Date(video.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    card.innerHTML = `
        <div class="video-thumbnail" data-video-id="${video.id}">
            <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
            <div class="play-button">
                <i class="fas fa-play"></i>
            </div>
            <div class="video-duration">${video.duration}</div>
        </div>
        <div class="video-content">
            <h3 class="video-title">${video.title}</h3>
            <p class="video-description">${video.description}</p>
            <div class="video-meta">
                <div class="video-views">
                    <i class="fas fa-eye"></i>
                    <span>${video.viewCount} views</span>
                </div>
                <div class="video-date">
                    <i class="fas fa-calendar"></i>
                    <span>${publishedDate}</span>
                </div>
            </div>
        </div>
    `;

    return card;
}

function showVideoLoadingState() {
    const videoGrid = document.querySelector('.video-grid');
    if (!videoGrid) return;

    videoGrid.innerHTML = `
        <div class="video-loading-skeleton">
            <div class="skeleton-card"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
        </div>
        <div class="video-loading-skeleton">
            <div class="skeleton-card"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
        </div>
        <div class="video-loading-skeleton">
            <div class="skeleton-card"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
        </div>
    `;
}

function hideVideoLoadingState() {
    // Loading state will be replaced by actual video cards
}

// Utility functions
function formatNumber(num) {
    if (num === 'N/A') return num;
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(parseInt(num));
}

function formatDuration(duration) {
    if (duration === 'N/A') return duration;

    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 'N/A';

    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function filterVideoCards() {
    const videoCards = document.querySelectorAll('.video-card');

    videoCards.forEach(card => {
        const category = card.dataset.category;
        const year = card.dataset.year;

        let showCard = false;

        // Check category filter
        if (currentFilter === 'all' || category === currentFilter) {
            // If Vimarsh is selected, also check year filter
            if (currentFilter === 'vimarsh' && currentYear !== 'all') {
                if (year === currentYear) {
                    showCard = true;
                }
            } else {
                showCard = true;
            }
        }

        if (showCard) {
            card.style.display = 'block';
            card.style.animation = 'fadeInUp 0.4s ease-out forwards';
        } else {
            card.style.display = 'none';
        }
    });
}

function setupVideoModal() {
    // Create modal HTML
    const modalHTML = `
        <div id="videoModal" class="modal">
            <div class="modal-content">
                <button class="modal-close" onclick="closeVideoModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="video-player" id="videoPlayer">
                    <!-- YouTube iframe will be inserted here -->
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add click listeners to video thumbnails
    document.querySelectorAll('.video-thumbnail').forEach(thumbnail => {
        thumbnail.addEventListener('click', function () {
            const videoId = this.dataset.videoId;
            const videoTitle = this.closest('.video-card').querySelector('.video-title').textContent;
            openVideoModal(videoId, videoTitle);
        });
    });
}

function openVideoModal(videoId, title) {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');

    // Create YouTube iframe
    player.innerHTML = `
        <iframe 
            width="100%" 
            height="100%" 
            src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
    `;

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');

    modal.classList.remove('show');
    player.innerHTML = '';
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
document.addEventListener('click', function (e) {
    const modal = document.getElementById('videoModal');
    if (e.target === modal) {
        closeVideoModal();
    }
});

// ===== LOADING FUNCTIONALITY =====
function loadContent() {
    if (isLoading) return;

    isLoading = true;

    // Show loading skeletons
    showLoadingSkeletons();

    // Simulate loading delay
    setTimeout(() => {
        hideLoadingSkeletons();
        isLoading = false;
    }, 1500);
}

function showLoadingSkeletons() {
    const contentCards = document.querySelectorAll('.social-card, .news-card, .video-card');

    contentCards.forEach(card => {
        card.style.opacity = '0.5';

        // Add loading animation
        const skeleton = document.createElement('div');
        skeleton.className = 'loading-skeleton';
        skeleton.style.position = 'absolute';
        skeleton.style.top = '0';
        skeleton.style.left = '0';
        skeleton.style.right = '0';
        skeleton.style.bottom = '0';
        skeleton.style.borderRadius = 'var(--radius-xl)';

        card.style.position = 'relative';
        card.appendChild(skeleton);
    });
}

function hideLoadingSkeletons() {
    const contentCards = document.querySelectorAll('.social-card, .news-card, .video-card');

    contentCards.forEach(card => {
        card.style.opacity = '1';

        // Remove loading skeleton
        const skeleton = card.querySelector('.loading-skeleton');
        if (skeleton) {
            skeleton.remove();
        }
    });
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add ripple effect to buttons
    document.querySelectorAll('.filter-btn, .social-link, .news-link').forEach(button => {
        button.addEventListener('click', function (e) {
            createRippleEffect(e, this);
        });
    });
}

function createRippleEffect(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait) {
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

function throttle(func, limit) {
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

// ===== SCROLL ANIMATIONS =====
const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

// Observe all cards for scroll animations
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.social-card, .news-card, .video-card').forEach(card => {
        scrollObserver.observe(card);
    });
});

// ===== KEYBOARD NAVIGATION =====
document.addEventListener('keydown', function (e) {
    // Close modal with Escape key
    if (e.key === 'Escape') {
        const modal = document.getElementById('videoModal');
        if (modal && modal.classList.contains('show')) {
            closeVideoModal();
        } else if (imageModal && imageModal.classList.contains('show')) {
            closeImageModal();
        }
    }
});

// ===== PERFORMANCE OPTIMIZATION =====
// Lazy load images
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
});

// ===== ERROR HANDLING =====
window.addEventListener('error', function (e) {
    console.error('Media page error:', e.error);
    // You can add error reporting here
});

// ===== RESIZE HANDLER =====
window.addEventListener('resize', debounce(function () {
    // Handle responsive adjustments
    const modal = document.getElementById('videoModal');
    if (modal && modal.classList.contains('show')) {
        // Adjust video player size on resize
        const player = document.getElementById('videoPlayer');
        if (player) {
            const aspectRatio = 16 / 9;
            const maxWidth = Math.min(window.innerWidth * 0.9, 800);
            const maxHeight = Math.min(window.innerHeight * 0.9, 450);

            if (maxWidth / aspectRatio <= maxHeight) {
                player.style.width = maxWidth + 'px';
                player.style.height = (maxWidth / aspectRatio) + 'px';
            } else {
                player.style.width = (maxHeight * aspectRatio) + 'px';
                player.style.height = maxHeight + 'px';
            }
        }
    }
}, 250));

// ===== FLASH MESSAGE SYSTEM =====
function showFlashMessage(type, title, message, duration = 5000) {
    // Ensure flash container exists
    let container = document.getElementById('flash-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'flash-container';
        container.className = 'flash-container';
        document.body.appendChild(container);
    }

    const messageEl = document.createElement('div');
    messageEl.className = `flash-notification ${type}`;

    const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    messageEl.innerHTML = `
        <div class="flash-icon">
            <i class="${iconMap[type] || iconMap.info}"></i>
        </div>
        <div class="flash-content">
            <div class="flash-title">${title}</div>
            <div class="flash-message">${message}</div>
        </div>
        <button class="flash-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(messageEl);

    // Trigger animation
    setTimeout(() => {
        messageEl.classList.add('show');
    }, 100);

    // Auto remove
    setTimeout(() => {
        messageEl.classList.remove('show');
        setTimeout(() => {
            if (messageEl.parentElement) {
                messageEl.remove();
            }
        }, 300);
    }, duration);
}

// ===== DATA SOURCE MANAGEMENT =====
function setDataSource(source) {
    dataSource = source;
    console.log('Data source set to:', source);
    try { localStorage.setItem('media_data_source', dataSource); } catch (e) { }
}
function getDataSource() { return dataSource; }

// ===== EXPORT FUNCTIONS FOR GLOBAL ACCESS =====
window.openVideoModal = openVideoModal;
window.closeVideoModal = closeVideoModal;
window.showFlashMessage = showFlashMessage;
window.setDataSource = setDataSource;
window.getDataSource = getDataSource;
