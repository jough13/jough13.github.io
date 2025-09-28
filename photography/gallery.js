// In /photos/gallery.js

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
    const copyLinkBtn = document.getElementById('lightbox-directlink');
    const downloadBtn = document.getElementById('lightbox-download');
    const toast = document.getElementById('toast-notification');

    let photosData = [];
    let currentPhotoIndex = 0;
    let toastTimeout;

    // --- NEW FUNCTION ---
    // Shows the toast message, then hides it after 3 seconds
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

            if (photo.url.includes('girl_at_pole_by_jough_dcytyn~2.jpg')) {
                item.id = 'photo-girl-at-pole';
            }
            if (photo.url.includes('girl_on_stairs_by_jough_dcyic1.jpg')) {
                item.id = 'photo-girl-on-stairs';
            }
            
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

        // Only need to set the download link's href now
        downloadBtn.href = photo.url;
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
    
    // --- EVENT LISTENERS ---
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

    // --- UPDATED EVENT LISTENER ---
    copyLinkBtn.addEventListener('click', () => {
        const photo = photosData[currentPhotoIndex];
        if (!photo) return;
        
        // Create the full URL to copy
        const urlToCopy = window.location.origin + photo.url;

        navigator.clipboard.writeText(urlToCopy).then(() => {
            showToast('Link Copied!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
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
