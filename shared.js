// A shared place for functions used across multiple pages

function fadeInContent() {
    const content = document.getElementById('content-container');
    if (content) {
        content.classList.remove('opacity-0');
    }
}

function setupThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (!themeToggleBtn) return;
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

    if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        themeToggleLightIcon.classList.remove('hidden');
    } else {
        themeToggleDarkIcon.classList.remove('hidden');
    }

    themeToggleBtn.addEventListener('click', function() {
        themeToggleDarkIcon.classList.toggle('hidden');
        themeToggleLightIcon.classList.toggle('hidden');
        if (document.documentElement.classList.toggle('dark')) {
            localStorage.setItem('color-theme', 'dark');
        } else {
            localStorage.setItem('color-theme', 'light');
        }
    });
}

function setupScrollToTop() {
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (!scrollToTopBtn) return;

    window.onscroll = function() {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            scrollToTopBtn.classList.remove('hidden', 'opacity-0');
        } else {
            scrollToTopBtn.classList.add('opacity-0');
            setTimeout(() => {
                if (document.body.scrollTop <= 300 && document.documentElement.scrollTop <= 300) {
                    scrollToTopBtn.classList.add('hidden');
                }
            }, 300);
        }
    };

    scrollToTopBtn.onclick = function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
}

async function updateFooter() {
    const footerElement = document.getElementById('site-footer-content');
    if (!footerElement) return;

    try {
        const response = await fetch('/site-config.json');
        const config = await response.json();
        const lastUpdatedDate = new Date(config.lastUpdated).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        footerElement.textContent = `Version ${config.version} | Last Updated: ${lastUpdatedDate}`;
    } catch (error) {
        console.error('Failed to load site config for footer:', error);
        footerElement.textContent = 'Version information unavailable.';
    }
}

// Global initialization for shared components
document.addEventListener('DOMContentLoaded', () => {
    fadeInContent();
    setupThemeToggle();
    setupScrollToTop();
    updateFooter();
});
