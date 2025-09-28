document.addEventListener('DOMContentLoaded', () => {
    const galleryGrid = document.getElementById('gallery-grid');
    const modal = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDate = document.getElementById('lightbox-date');
    const lightboxDesc = document.getElementById('lightbox-desc');
    const closeModalBtn = document.getElementById('close-modal');
    const nextBtn = document.getElementById('next-photo');
    const prevBtn = document.getElementById('prev-photo');

    let photosData = [];
    let currentPhotoIndex = 0;

    async function initGallery() {
        try {
            // It now fetches the JSON file from the same directory
            const response = await fetch('photos.json'); 
            if (!response.ok) throw new Error('Photo data not found.');
            photosData = await response.json();
            renderGrid();
        } catch (error) {
            galleryGrid.innerHTML = `<p class="text-red-400 col-span-full">${error.message}</p>`;
        }
    }

function renderGrid() {
        if (!photosData.length) {
            galleryGrid.innerHTML = '<p class="text-slate-400">No photos to display.</p>';
            return;
        }
        galleryGrid.innerHTML = '';
        photosData.forEach((photo, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.dataset.index = index;

            // -- START of new code --
            // Check the filename and assign a specific ID for custom cropping
            if (photo.url.includes('girl_at_pole_by_jough_dcytyn~2.jpg')) {
                item.id = 'photo-girl-at-pole';
            }
            if (photo.url.includes('girl_on_stairs_by_jough_dcyic1.jpg')) {
                item.id = 'photo-girl-on-stairs';
            }
            // -- END of new code --

            item.innerHTML = `<img src="${photo.url}" alt="${photo.title}" loading="lazy">`;
            item.addEventListener('click', () => openModal(index));
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
        lightboxDate.textContent = photo.date;
        lightboxDesc.textContent = photo.description;
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
    
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    nextBtn.addEventListener('click', () => {
        const nextIndex = (currentPhotoIndex + 1) % photosData.length;
        openModal(nextIndex);
    });

    prevBtn.addEventListener('click', () => {
        const prevIndex = (currentPhotoIndex - 1 + photosData.length) % photosData.length;
        openModal(prevIndex);
    });

    document.addEventListener('keydown', (e) => {
        if (modal.classList.contains('hidden')) return;
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowRight') nextBtn.click();
        if (e.key === 'ArrowLeft') prevBtn.click();
    });

    initGallery();
});
