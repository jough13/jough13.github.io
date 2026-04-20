// public/js/ui.js
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db, auth } from "./firebase-config.js";
import { ADMIN_EMAIL } from "./auth.js";

// --- LOADER LOGIC ---
export function showLoader() { 
    const loader = document.getElementById('global-loader');
    if (loader) loader.style.display = 'flex'; 
}
export function hideLoader() { 
    const loader = document.getElementById('global-loader');
    if (loader) loader.style.display = 'none'; 
}

// --- THEME LOGIC ---
export function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeButton(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeButton('dark');
    }
}

export function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton(newTheme);
    
    // We will call these safely if they exist on the window object
    if(window.isotopeChart && window.updateDashboard) window.updateDashboard(); 
    if(window.doseChart && window.updateDoseDashboard) window.updateDoseDashboard(); 
    if(window.decayChartInstance && window.updateDecayChart) window.updateDecayChart();
}

function updateThemeButton(theme) {
    const btn = document.getElementById('theme-btn');
    if (btn) btn.innerHTML = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}

// --- NAVIGATION & UI TOGGLES ---
export function showSection(sectionId) {
    document.querySelectorAll('.module').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
    });
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
    }
    if(sectionId === 'calendar-view' && window.calendar) {
        setTimeout(() => { window.calendar.render(); }, 100);
    }
}

export function togglePRI() {
    const locType = document.getElementById('wp-loc-type').value;
    const tempWrapper = document.getElementById('wp-temp-wrapper');
    const priWrapper = document.getElementById('wp-pri-wrapper');
    
    if(locType === 'pri') {
        tempWrapper.style.display = 'none';
        priWrapper.style.display = 'flex';
        document.getElementById('wp-boundary').value = '';
    } else {
        tempWrapper.style.display = 'flex';
        priWrapper.style.display = 'none';
        if(window.calculateBoundary) window.calculateBoundary(); 
    }
}

export function toggleNA(inputId, checkbox) {
    const el = document.getElementById(inputId);
    if (!el) return;
    if (checkbox.checked) {
        el.dataset.previousValue = el.value; 
        el.value = '';
        el.disabled = true;
        el.required = false;
        el.style.backgroundColor = '#e9ecef';
    } else {
        el.value = el.dataset.previousValue || '';
        el.disabled = false;
        el.required = true;
        el.style.backgroundColor = '';
    }
}

// --- CANVASES (SIGNATURE & SKETCHPAD) ---
export function initSignaturePad() {
    const canvas = document.getElementById('sig-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0, lastY = 0;

    ctx.strokeStyle = '#005A9C'; 
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault(); 
        let clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        let clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();

        [lastX, lastY] = [x, y];
        window.sigPadDirty = true; 
    }

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        [lastX, lastY] = [e.clientX - rect.left, e.clientY - rect.top];
    });
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);

    canvas.addEventListener('touchstart', (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        [lastX, lastY] = [e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top];
    }, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', () => isDrawing = false);
}

export function clearSignature() {
    const canvas = document.getElementById('sig-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        window.sigPadDirty = false;
    }
}

export function initSketchPad() {
    const canvas = document.getElementById('sketch-canvas');
    if (!canvas) return;
    
    canvas.width = canvas.parentElement.clientWidth - 20; 
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let isDrawing = false;
    let lastX = 0, lastY = 0;
    let isEraser = false;

    const colorPicker = document.getElementById('sketch-color');
    const sizePicker = document.getElementById('sketch-size');
    const eraserBtn = document.getElementById('sketch-eraser');

    if (eraserBtn) {
        eraserBtn.addEventListener('click', () => {
            isEraser = !isEraser;
            eraserBtn.style.backgroundColor = isEraser ? '#d9534f' : '';
            eraserBtn.style.color = isEraser ? 'white' : '';
        });
    }

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault(); 
        
        let clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        let clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        ctx.lineWidth = sizePicker ? sizePicker.value : 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = isEraser ? '#fafafa' : (colorPicker ? colorPicker.value : '#000000');

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();

        [lastX, lastY] = [x, y];
        window.sketchPadDirty = true; 
    }

    // Event listeners for sketchpad
    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        [lastX, lastY] = [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY];
    });
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);

    canvas.addEventListener('touchstart', (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        [lastX, lastY] = [(e.touches[0].clientX - rect.left) * scaleX, (e.touches[0].clientY - rect.top) * scaleY];
    }, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', () => isDrawing = false);
}

export function clearSketch() {
    const canvas = document.getElementById('sketch-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        window.sketchPadDirty = false;
    }
}

// --- MODALS ---
export async function openModal(collectionName, docId) {
    const modal = document.getElementById('inspector-modal');
    const modalBody = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');
    
    modalBody.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; padding: 20px;"><div class="mini-spinner"></div><span style="font-weight: bold; color: var(--nav-bg);">Fetching database record...</span></div>';
    title.textContent = `${collectionName.replace('_', ' ').toUpperCase()} RECORD`;
    modal.style.display = 'flex';
    
    try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            window.currentOpenDoc = { collection: collectionName, id: docId, fullData: data };
            
            let html = '';
            for (const [key, value] of Object.entries(data)) {
                let displayKey = key.replace(/_/g, ' ').toUpperCase();
                if (key === 'chp_approval_status') displayKey = 'RSO APPROVAL STATUS'; 

                if (key === 'rso_approval_status') {
                    if (value === 'Approved') {
                        html += `<p style="background: #5cb85c; color: white; padding: 5px; border-radius: 4px; display: inline-block;"><strong>🔒 RSO STATUS:</strong> APPROVED</p>`;
                    } else {
                        html += `<p style="background: #f0ad4e; color: #333; padding: 5px; border-radius: 4px; display: inline-block;"><strong>RSO STATUS:</strong> ${value}</p>`;
                    }
                }
                const approveBtn = document.getElementById('modal-approve-btn');
                if (approveBtn) {
                    approveBtn.style.display = (collectionName === 'work_plans' && data.rso_approval_status !== 'Approved') ? 'inline-block' : 'none';
                }

                const rwpBtn = document.getElementById('modal-rwp-btn');
                if (rwpBtn) rwpBtn.style.display = collectionName === 'work_plans' ? 'inline-block' : 'none';
                
                if (key === 'checklist' && typeof value === 'object') {
                    html += `<h4>Evaluation Checklist:</h4><ul>`;
                    for(const [checkKey, checkVal] of Object.entries(value)) {
                        html += `<li>${checkKey.replace('_', ' ')}: <b>${checkVal ? 'PASS' : 'FAIL'}</b></li>`;
                    }
                    html += `</ul>`;
                } else if (key === 'source_id') {
                    let sourceDisplay = value;
                    if (value && value !== 'DELETED') {
                        try {
                            const srcSnap = await getDoc(doc(db, 'sources', value));
                            if (srcSnap.exists()) {
                                sourceDisplay = `${srcSnap.data().serial_number} (${srcSnap.data().isotope})`;
                            } else {
                                sourceDisplay = "Source not found in vault";
                            }
                        } catch(e) { console.log("Could not resolve source."); }
                    }
                    html += `<p><strong>SOURCE:</strong> ${sourceDisplay}</p>`;
                } else if (key === 'signature_data' && value) {
                    html += `<p><strong>SIGNATURE:</strong><br><img src="${value}" style="max-width: 100%; border: 1px solid #ccc; border-radius: 4px; margin-top: 10px; background: white;" /></p>`;
                } else if (key === 'sketch_data' && value) {
                    html += `<p><strong>SETUP BOUNDARY SKETCH:</strong><br><img src="${value}" style="max-width: 100%; border: 2px solid #ccc; border-radius: 4px; margin-top: 10px; background: white;" /></p>`;
                } else if(key.includes('_url')) {
                    if (value && value !== 'null') {
                        html += `<p><strong>${displayKey.replace(' URL', '')}:</strong> <a href="${value}" target="_blank" style="color: #005A9C;">View Uploaded File</a></p>`;
                    } else {
                        html += `<p><strong>${displayKey.replace(' URL', '')}:</strong> <span style="color: #999; font-style: italic;">No file attached</span></p>`;
                    }
                } else {
                    html += `<p><strong>${displayKey}:</strong> ${value}</p>`;
                }
            }
            modalBody.innerHTML = html;
        } else {
            modalBody.innerHTML = '<p>Record not found.</p>';
        }
    } catch (err) {
        modalBody.innerHTML = '<p style="color:red;">Error retrieving data.</p>';
        console.error(err);
    }
}

export function closeModal() {
    document.getElementById('inspector-modal').style.display = 'none';
    window.currentOpenDoc = null;
}

export function closeConfirmModal() {
    document.getElementById('delete-confirm-modal').style.display = 'none';
}
