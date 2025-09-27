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
        const response = await fetch(`/site-config.json?v=${new Date().getTime()}`);
        const config = await response.json();
        
        const lastUpdatedDate = new Date(config.lastUpdated).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC' 
        });
        footerElement.textContent = `Version ${config.version} | Last Updated: ${lastUpdatedDate}`;
    } catch (error) {
        console.error('Failed to load site config for footer:', error);
        footerElement.textContent = 'Version information unavailable.';
    }
}

/**
 * Finds the active page link in the sidebar and applies a visual highlight.
 * It compares the current page's URL with the href of each link.
 */
function highlightActiveLink() {
    // Get the current page's path, treating '/' and '/index.html' as the same for matching.
    let currentPath = window.location.pathname;
    if (currentPath.endsWith('/')) {
        currentPath += 'index.html';
    }

    const navLinks = document.querySelectorAll('aside a.project-link');

    navLinks.forEach(link => {
        // Get the full path from the link's href attribute for a reliable comparison.
        const linkPath = new URL(link.href).pathname;
        
        // Check if the current page's path exactly matches the link's path.
        if (currentPath === linkPath) {
            // Add TailwindCSS classes to create a visual "ring" around the active link.
            // This is a clear and theme-friendly way to show the active state.
            link.classList.add('ring-2', 'ring-offset-2', 'ring-sky-400', 'dark:ring-offset-slate-800');
        }
    });
}


// Global initialization for shared components
document.addEventListener('DOMContentLoaded', () => {
    fadeInContent();
    setupThemeToggle();
    setupScrollToTop();
    updateFooter();
    highlightActiveLink(); // <-- We now call the new function on every page load
});
