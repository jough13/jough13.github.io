document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const galleryGrid = document.getElementById('gallery-grid');
    const modal = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDate = document.getElementById('lightbox-date');
    const lightboxDesc = document.getElementById('lightbox-desc');
    const closeModalBtn = document.getElementById('close-modal');
    const nextBtn = document.getElementById('next-photo');
    const prevBtn = document.getElementById('prev-photo');
    const copyLinkBtn = document.getElementById('lightbox-directlink');
    const downloadBtn = document.getElementById('lightbox-download');
    const toast = document.getElementById('toast-notification');
    const sortControls = document.getElementById('sort-controls');
    const categoryFilter = document.getElementById('category-filter');

    // State
    let allPhotos = []; // This will hold the original, unmodified list of all photos
    let photosToDisplay = []; // This will hold the currently filtered and sorted list
    let currentPhotoIndex = 0;
    let toastTimeout;

    function showToast(message) {
        clearTimeout(toastTimeout);
        toast.textContent = message;
        toast.classList.add('show');
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    async function initGallery() {
        try {
            const response = await fetch('photos.json'); 
            if (!response.ok) throw new Error('Photo data not found.');
            allPhotos = await response.json();
            
            populateCategoryFilter();
            
            // Set initial state: sorted by date (newest first) with no filter
            document.querySelector('.sort-btn[data-sort="date"]').classList.add('active');
            updateGallery();

        } catch (error) {
            galleryGrid.innerHTML = `<p class="text-red-400 col-span-full">${error.message}</p>`;
        }
    }

    function populateCategoryFilter() {
        const categories = [...new Set(allPhotos.map(p => p.category))];
        categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
        categories.sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    function updateGallery() {
        // 1. Apply Filter
        const selectedCategory = categoryFilter.value;
        let filteredPhotos = allPhotos;
        if (selectedCategory !== 'all') {
            filteredPhotos = allPhotos.filter(p => p.category === selectedCategory);
        }

        // 2. Apply Sort
        const activeSortBtn = document.querySelector('.sort-btn.active');
        const sortBy = activeSortBtn ? activeSortBtn.dataset.sort : 'date'; // Default to date sort

        switch(sortBy) {
            case 'date':
                filteredPhotos.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'name':
                filteredPhotos.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'shuffle':
                for (let i = filteredPhotos.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [filteredPhotos[i], filteredPhotos[j]] = [filteredPhotos[j], filteredPhotos[i]];
                }
                break;
        }

        photosToDisplay = filteredPhotos;
        renderGrid();
    }
    
    function renderGrid() {
        galleryGrid.innerHTML = '';
        if (photosToDisplay.length === 0) {
            galleryGrid.innerHTML = '<p class="text-slate-400 text-center col-span-full">No photos match the selected category.</p>';
            return;
        }
        photosToDisplay.forEach((photo) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.dataset.photoUrl = photo.url; 

            if (photo.url.includes('girl_at_pole_by_jough_dcytyn~2.jpg')) item.id = 'photo-girl-at-pole';
            if (photo.url.includes('girl_on_stairs_by_jough_dcyic1.jpg')) item.id = 'photo-girl-on-stairs';
            
            item.innerHTML = `<img src="${photo.url}" alt="${photo.title}" loading="lazy">`;
            item.addEventListener('click', () => {
                const originalIndex = photosToDisplay.findIndex(p => p.url === item.dataset.photoUrl);
                openModal(originalIndex);
            });
            galleryGrid.appendChild(item);
        });
    }

    function openModal(index) {
        if (index < 0 || index >= photosToDisplay.length) return;
        currentPhotoIndex = index;
        const photo = photosToDisplay[index];
        
        lightboxImg.src = photo.url;
        lightboxImg.alt = photo.title;
        lightboxTitle.textContent = photo.title;
        // Format the date for better readability
        lightboxDate.textContent = new Date(photo.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
        lightboxDesc.textContent = photo.description;
        downloadBtn.href = photo.url;
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
    
    // --- Event Listeners ---
    categoryFilter.addEventListener('change', updateGallery);

    sortControls.addEventListener('click', (e) => {
        if (e.target.classList.contains('sort-btn')) {
            document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            updateGallery();
        }
    });

    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    nextBtn.addEventListener('click', () => openModal((currentPhotoIndex + 1) % photosToDisplay.length));
    prevBtn.addEventListener('click', () => openModal((currentPhotoIndex - 1 + photosToDisplay.length) % photosToDisplay.length));
    
    copyLinkBtn.addEventListener('click', () => {
        const photo = photosToDisplay[currentPhotoIndex];
        if (!photo) return;
        const urlToCopy = window.location.origin + photo.url;
        navigator.clipboard.writeText(urlToCopy)
            .then(() => showToast('Link Copied!'))
            .catch(err => {
                console.error('Failed to copy text: ', err)
                showToast('Error copying link.');
            });
    });

    document.addEventListener('keydown', (e) => {
        if (modal.classList.contains('hidden')) return;
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowRight') nextBtn.click();
        if (e.key === 'ArrowLeft') prevBtn.click();
    });

    initGallery();
});
