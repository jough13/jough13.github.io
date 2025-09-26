// A shared place for functions used across multiple pages

function renderPosts(postsToRender, containerId = 'posts-container') {
    const postsContainer = document.getElementById(containerId);
    if (!postsContainer) return;

    postsContainer.innerHTML = ''; 

    if (postsToRender.length === 0) {
        postsContainer.innerHTML = '<p class="text-slate-600 dark:text-slate-400">No posts found matching your criteria.</p>';
        return;
    }

    for (const post of postsToRender) {
        const articleElement = document.createElement('article');
        articleElement.className = 'mb-12';
        
        const postDate = new Date(post.date).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        // Links now use absolute paths (e.g., /tag.html) to work from any page
        const tagsHtml = post.tags.map(tag => `
            <a href="/tag.html?tag=${encodeURIComponent(tag)}" class="bg-sky-100 text-sky-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full dark:bg-sky-900 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-800 no-underline transition-colors">${tag}</a>
        `).join(' ');

        articleElement.innerHTML = `
            <div class="prose prose-lg dark:prose-invert max-w-none">
                <h2 class="mb-1">
                    <a href="/post.html?p=${post.file}" class="no-underline hover:text-sky-500">
                        <strong>${post.title}</strong>
                    </a>
                </h2>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-0">${postDate}</p>
                <p class="not-prose text-slate-600 dark:text-slate-400">${post.summary}</p>
                <div class="not-prose mt-4">${tagsHtml}</div>
            </div>`;
        postsContainer.appendChild(articleElement);
    }
}

function setupThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    if(!themeToggleBtn) return;
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

        if (localStorage.getItem('color-theme')) {
            if (localStorage.getItem('color-theme') === 'light') {
                document.documentElement.classList.add('dark');
                localStorage.setItem('color-theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('color-theme', 'light');
            }
        } else {
            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('color-theme', 'light');
            } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('color-theme', 'dark');
            }
        }
    });
}

function setupScrollToTop() {
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (!scrollToTopBtn) return;
    
    window.onscroll = function() {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            scrollToTopBtn.classList.remove('hidden');
            scrollToTopBtn.classList.remove('opacity-0');
        } else {
            scrollToTopBtn.classList.add('opacity-0');
            setTimeout(() => {
                 scrollToTopBtn.classList.add('hidden');
            }, 300);
        }
    };

    scrollToTopBtn.onclick = function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
}

async function generateTagCloud() {
    const tagContainer = document.getElementById('tag-cloud');
    if (!tagContainer) return;

    try {
        const response = await fetch('/posts.json');
        const posts = await response.json();

        const uniqueTags = new Set();
        posts.forEach(post => {
            post.tags.forEach(tag => uniqueTags.add(tag));
        });

        // Get all unique tags and sort them alphabetically
        let sortedTags = Array.from(uniqueTags).sort();
        
        // Set a limit on how many tags to show
        sortedTags = sortedTags.slice(0, 20); // You can change 20 to your desired limit

        // Links now use absolute paths (e.g., /tag.html) to work from any page
        const tagsHtml = sortedTags.map(tag => `
            <a href="/tag.html?tag=${encodeURIComponent(tag)}" class="bg-slate-200 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full dark:bg-slate-700 dark:text-slate-300 hover:bg-sky-200 dark:hover:bg-sky-800 no-underline transition-colors">#${tag}</a>
        `).join(' ');

        tagContainer.innerHTML = tagsHtml;

    } catch (error) {
        tagContainer.innerHTML = '<p class="text-xs text-red-500">Could not load tags.</p>';
        console.error("Error generating tag cloud:", error);
    }
}

function initHeaderCanvas() {
    const canvas = document.getElementById('interactive-header-canvas');
    const dustTrigger = document.getElementById('dust-trigger');
    if (!canvas || !dustTrigger) return; // Exit if elements don't exist

    const ctx = canvas.getContext('2d');
    let particles = [];
    
    // Function to check if dark mode is active
    const isDarkMode = () => document.documentElement.classList.contains('dark');

    // Adjust canvas size to its container
    function resizeCanvas() {
        const parent = canvas.parentElement;
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Set initial size

    // Defines a single dust particle
    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 2 + 1; // Particle size
            this.speedX = Math.random() * 3 - 1.5; // Horizontal movement
            this.speedY = Math.random() * 3 - 1.5; // Vertical movement
            this.alpha = 1; // Opacity
            this.decay = Math.random() * 0.015 + 0.005; // Fade out speed
        }

        // Move the particle and fade it out
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.alpha -= this.decay;
        }

        // Draw the particle on the canvas
        draw() {
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            // Use a color that works for both light and dark themes
            ctx.fillStyle = isDarkMode() ? 'rgba(226, 232, 240, 0.7)' : 'rgba(100, 116, 139, 0.7)';
            ctx.fill();
        }
    }

    // Creates a burst of particles when triggered
    function createDustBurst() {
        // Find the position of the word "Dust." relative to the canvas
        const rect = dustTrigger.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        const x = rect.left - canvasRect.left + (rect.width / 2);
        const y = rect.top - canvasRect.top + (rect.height / 2);

        // Create 30 particles for the effect
        for (let i = 0; i < 30; i++) {
            particles.push(new Particle(x, y));
        }
    }

    // Listen for mouseover on the word "Dust."
    dustTrigger.addEventListener('mouseover', createDustBurst);

    // Main animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas each frame
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            // Remove particles that have faded away
            if (particles[i].alpha <= 0) {
                particles.splice(i, 1);
            }
        }
        requestAnimationFrame(animate); // Loop forever
    }

    animate(); // Start the animation loop
}
