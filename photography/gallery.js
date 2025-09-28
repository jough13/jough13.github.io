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

    // State
    let photosData = [];
    let currentPhotoIndex = 0;
    let toastTimeout;

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

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
            photosData = await response.json();
            
            // Initial sort by newest date first
            sortPhotos('date');
            renderGrid();
            updateActiveSortButton('date');

        } catch (error) {
            galleryGrid.innerHTML = `<p class="text-red-400 col-span-full">${error.message}</p>`;
        }
    }

    // --- NEW SORTING LOGIC ---
    function sortPhotos(sortBy) {
        switch(sortBy) {
            case 'date':
                photosData.sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
                break;
            case 'name':
                photosData.sort((a, b) => a.title.localeCompare(b.title)); // A-Z
                break;
            case 'shuffle':
                shuffleArray(photosData);
                break;
        }
    }

    function updateActiveSortButton(activeSort) {
        document.querySelectorAll('.sort-btn').forEach(btn => {
            if (btn.dataset.sort === activeSort) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function renderGrid() {
        galleryGrid.innerHTML = '';
        photosData.forEach((photo, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            // Use the photo URL as a unique key for the index, since the array index will change
            item.dataset.photoUrl = photo.url; 

            if (photo.url.includes('girl_at_pole_by_jough_dcytyn~2.jpg')) item.id = 'photo-girl-at-pole';
            if (photo.url.includes('girl_on_stairs_by_jough_dcyic1.jpg')) item.id = 'photo-girl-on-stairs';
            
            item.innerHTML = `<img src="${photo.url}" alt="${photo.title}" loading="lazy">`;
            item.addEventListener('click', () => {
                // Find the correct index in the currently sorted array before opening
                const originalIndex = photosData.findIndex(p => p.url === item.dataset.photoUrl);
                openModal(originalIndex);
            });
            galleryGrid.appendChild(item);
        });
    }

    function openModal(index) {
        if (index < 0 || index >= photosData.length) return;
        currentPhotoIndex = index;
        const photo = photosData[index];
        
        lightboxImg.src = photo.url;
        lightboxImg.alt = photo.title;
        lightboxTitle.textContent = photo.title;
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
    
    // --- EVENT LISTENERS ---
    sortControls.addEventListener('click', (e) => {
        if (e.target.classList.contains('sort-btn')) {
            const sortBy = e.target.dataset.sort;
            sortPhotos(sortBy);
            renderGrid();
            updateActiveSortButton(sortBy);
        }
    });

    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    nextBtn.addEventListener('click', () => openModal((currentPhotoIndex + 1) % photosData.length));
    prevBtn.addEventListener('click', () => openModal((currentPhotoIndex - 1 + photosData.length) % photosData.length));
    
    copyLinkBtn.addEventListener('click', () => {
        const photo = photosData[currentPhotoIndex];
        if (!photo) return;
        const urlToCopy = window.location.origin + photo.url;
        navigator.clipboard.writeText(urlToCopy)
            .then(() => showToast('Link Copied!'))
            .catch(err => console.error('Failed to copy text: ', err));
    });

    document.addEventListener('keydown', (e) => {
        if (modal.classList.contains('hidden')) return;
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowRight') nextBtn.click();
        if (e.key === 'ArrowLeft') prevBtn.click();
    });

    initGallery();
});
