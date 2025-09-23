// A shared place for functions used across multiple pages

// NOTE: This function's fetch path has been updated to '/posts.json'
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

// NOTE: This function's fetch path has been updated to '/posts.json'
async function generateTagCloud() {
    const tagContainer = document.getElementById('tag-cloud');
    if (!tagContainer) return;

    try {
        const response = await fetch('/posts.json');
        const posts = await response.json();

        // Use a Set to automatically handle duplicates
        const uniqueTags = new Set();
        posts.forEach(post => {
            post.tags.forEach(tag => uniqueTags.add(tag));
        });

        // Convert Set to an array and sort alphabetically
        const sortedTags = Array.from(uniqueTags).sort();

        const tagsHtml = sortedTags.map(tag => `
            <a href="/tag.html?tag=${encodeURIComponent(tag)}" class="bg-slate-200 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full dark:bg-slate-700 dark:text-slate-300 hover:bg-sky-200 dark:hover:bg-sky-800 no-underline transition-colors">#${tag}</a>
        `).join(' ');

        tagContainer.innerHTML = tagsHtml;

    } catch (error) {
        tagContainer.innerHTML = '<p class="text-xs text-red-500">Could not load tags.</p>';
        console.error("Error generating tag cloud:", error);
    }
}
