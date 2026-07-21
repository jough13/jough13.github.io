document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const form = document.getElementById('bridal-form');
    const tableBody = document.getElementById('appointments-body');
    const emptyState = document.getElementById('empty-state');
    const tableContainer = document.querySelector('.table-container');
    
    const exportBtn = document.getElementById('export-btn');
    const importFile = document.getElementById('import-file');
    
    // Modals
    const settingsModal = document.getElementById('settings-modal');
    const settingsOpenBtn = document.getElementById('settings-open-btn');
    const settingsCloseBtn = document.getElementById('settings-close-btn');
    const loadDummyBtn = document.getElementById('load-dummy-btn');

    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const editCloseBtn = document.getElementById('edit-close-btn');

    const dialogModal = document.getElementById('dialog-modal');
    const dialogTitle = document.getElementById('dialog-title');
    const dialogMessage = document.getElementById('dialog-message');
    const dialogButtons = document.getElementById('dialog-buttons');

    // Archive Toggles
    const viewUpcomingBtn = document.getElementById('view-upcoming-btn');
    const viewPastBtn = document.getElementById('view-past-btn');
    let currentView = 'upcoming'; 

    // Data Store
    let appointments = JSON.parse(localStorage.getItem('poshBridalAppointments')) || [];

    function saveAppointments() {
        localStorage.setItem('poshBridalAppointments', JSON.stringify(appointments));
    }

    // --- Custom Dialog System ---
    function showDialog({ title, message, isConfirm, confirmText = "OK", confirmColor = "var(--primary-color)", onConfirm }) {
        dialogTitle.textContent = title;
        dialogMessage.textContent = message;
        dialogButtons.innerHTML = ''; 

        if (isConfirm) {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'secondary-btn';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.onclick = () => { dialogModal.style.display = 'none'; };

            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'submit-btn';
            confirmBtn.style.backgroundColor = confirmColor;
            confirmBtn.textContent = confirmText;
            confirmBtn.onclick = () => {
                dialogModal.style.display = 'none';
                if (onConfirm) onConfirm();
            };

            dialogButtons.appendChild(cancelBtn);
            dialogButtons.appendChild(confirmBtn);
        } else {
            const okBtn = document.createElement('button');
            okBtn.className = 'submit-btn';
            okBtn.style.backgroundColor = confirmColor;
            okBtn.textContent = confirmText;
            okBtn.onclick = () => {
                dialogModal.style.display = 'none';
                if (onConfirm) onConfirm();
            };
            
            dialogButtons.appendChild(okBtn);
        }
        dialogModal.style.display = 'flex';
    }

    // --- Dashboard Metrics Updater ---
    function updateDashboard(upcomingApps) {
        const nextUpEl = document.getElementById('dash-next-up');
        const nextDateEl = document.getElementById('dash-next-date');
        const contractsEl = document.getElementById('dash-contracts');
        const depositsEl = document.getElementById('dash-deposits');

        if (upcomingApps.length === 0) {
            nextUpEl.textContent = 'None';
            nextDateEl.textContent = '--';
            contractsEl.textContent = '0';
            depositsEl.textContent = '0';
            return;
        }

        const nextApp = upcomingApps[0]; 
        const missingContracts = upcomingApps.filter(app => !app.contractSigned).length;
        const missingDeposits = upcomingApps.filter(app => !app.depositMade).length;

        const dateObj = new Date(nextApp.weddingDate + 'T00:00:00');
        const dateString = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        nextUpEl.textContent = nextApp.clientName;
        nextDateEl.textContent = dateString;
        contractsEl.textContent = missingContracts;
        depositsEl.textContent = missingDeposits;
    }

    // --- Render Logic ---
    function renderAppointments() {
        tableBody.innerHTML = '';
        
        const todayStr = new Date().toISOString().split('T')[0];

        const upcomingApps = appointments.filter(app => app.weddingDate >= todayStr);
        const pastApps = appointments.filter(app => app.weddingDate < todayStr);

        upcomingApps.sort((a, b) => new Date(a.weddingDate) - new Date(b.weddingDate));
        pastApps.sort((a, b) => new Date(b.weddingDate) - new Date(a.weddingDate));

        updateDashboard(upcomingApps);

        const displayApps = currentView === 'upcoming' ? upcomingApps : pastApps;

        if (displayApps.length === 0) {
            emptyState.style.display = 'block';
            tableContainer.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        tableContainer.style.display = 'block';

        displayApps.forEach(app => {
            const row = document.createElement('tr');

            const dateObj = new Date(app.weddingDate + 'T00:00:00');
            const dateString = dateObj.toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
            });

            const contractBadge = `<span class="status-badge ${app.contractSigned ? 'status-yes' : 'status-no'}">${app.contractSigned ? 'Signed' : 'Pending'}</span>`;
            const depositBadge = `<span class="status-badge ${app.depositMade ? 'status-yes' : 'status-no'}">${app.depositMade ? 'Paid' : 'Unpaid'}</span>`;

            // If notes exist, show a preview snippet. If not, just a dash.
            const notesSnippet = app.notes ? app.notes : '<span style="color: #ccc;">-</span>';

            row.innerHTML = `
                <td class="sticky-col"><strong>${app.clientName}</strong></td>
                <td><strong>${dateString}</strong></td>
                <td>${app.phone}</td>
                <td><a href="mailto:${app.email}" class="text-link">${app.email}</a></td>
                <td>${app.location}</td>
                <td>${app.hairCount}</td>
                <td>${app.makeupCount}</td>
                <td class="notes-cell">${notesSnippet}</td>
                <td>${contractBadge}</td>
                <td>${depositBadge}</td>
                <td class="action-buttons">
                    <button class="action-btn edit-btn" data-id="${app.id}">Edit</button>
                    <button class="action-btn print-btn" data-id="${app.id}">Print</button>
                    <button class="action-btn delete-btn" data-id="${app.id}">Remove</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        attachActionListeners();
    }

    // --- Action Button Listeners (Edit, Print, Remove) ---
    function attachActionListeners() {
        // DELETE
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                showDialog({
                    title: 'Remove Appointment?',
                    message: 'Are you sure you want to delete this wedding? This cannot be undone.',
                    isConfirm: true,
                    confirmText: 'Delete',
                    confirmColor: '#C62828', 
                    onConfirm: () => {
                        appointments = appointments.filter(app => app.id !== id);
                        saveAppointments();
                        renderAppointments();
                    }
                });
            });
        });

        // EDIT
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const app = appointments.find(a => a.id === id);
                if(app) {
                    document.getElementById('edit-id').value = app.id;
                    document.getElementById('edit-clientName').value = app.clientName;
                    document.getElementById('edit-email').value = app.email;
                    document.getElementById('edit-phone').value = app.phone;
                    document.getElementById('edit-weddingDate').value = app.weddingDate;
                    document.getElementById('edit-hairCount').value = app.hairCount;
                    document.getElementById('edit-makeupCount').value = app.makeupCount;
                    document.getElementById('edit-notes').value = app.notes || ''; // Added Notes population
                    document.getElementById('edit-contractSigned').checked = app.contractSigned;
                    document.getElementById('edit-depositMade').checked = app.depositMade;
                    
                    if(app.location === 'In-Salon') document.getElementById('edit-loc-salon').checked = true;
                    else document.getElementById('edit-loc-site').checked = true;

                    editModal.style.display = 'flex';
                }
            });
        });

        // PRINT "DAY OF" SHEET
        document.querySelectorAll('.print-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const app = appointments.find(a => a.id === id);
                if(app) {
                    const printArea = document.getElementById('print-area');
                    const dateObj = new Date(app.weddingDate + 'T00:00:00');
                    const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
                    
                    // Conditionally format the notes area based on if she typed anything
                    const notesSection = app.notes 
                        ? `<div class="print-notes-content">${app.notes}</div>` 
                        : `<div class="notes-empty-box"></div>`;

                    printArea.innerHTML = `
                        <div class="print-header">
                            <h1>Posh Salon</h1>
                            <h2>${app.clientName}'s Wedding</h2>
                            <p><strong>${dateStr}</strong></p>
                        </div>
                        <div class="print-row">
                            <span><strong>Location:</strong></span>
                            <span>${app.location}</span>
                        </div>
                        <div class="print-row">
                            <span><strong>Total Hair Services:</strong></span>
                            <span>${app.hairCount}</span>
                        </div>
                        <div class="print-row">
                            <span><strong>Total Makeup Services:</strong></span>
                            <span>${app.makeupCount}</span>
                        </div>
                        <br>
                        <div class="print-row">
                            <span><strong>Contact Number:</strong></span>
                            <span>${app.phone}</span>
                        </div>
                        <div class="print-row">
                            <span><strong>Email Address:</strong></span>
                            <span>${app.email}</span>
                        </div>
                        
                        <div class="notes-section">
                            <p style="color: #666; text-transform: uppercase; font-size: 0.8rem; font-weight: bold;">Stylist Notes & Timeline:</p>
                            ${notesSection}
                        </div>
                    `;
                    window.print();
                }
            });
        });
    }

    // --- Form Submissions ---
    
    // Add New
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const dateValue = document.getElementById('weddingDate').value;
        const newAppointment = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5), 
            clientName: document.getElementById('clientName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            weddingDate: dateValue,
            location: document.querySelector('input[name="location"]:checked').value,
            hairCount: document.getElementById('hairCount').value,
            makeupCount: document.getElementById('makeupCount').value,
            notes: document.getElementById('notes').value.trim(), // Added Notes capture
            contractSigned: document.getElementById('contractSigned').checked,
            depositMade: document.getElementById('depositMade').checked
        };

        const existingWedding = appointments.find(app => app.weddingDate === dateValue);
        const processSave = () => {
            appointments.push(newAppointment);
            saveAppointments();
            currentView = 'upcoming'; 
            viewUpcomingBtn.classList.add('active');
            viewPastBtn.classList.remove('active');
            renderAppointments();
            form.reset();
            document.querySelector('input[value="In-Salon"]').checked = true;
        };

        if (existingWedding) {
            const dateObj = new Date(dateValue + 'T00:00:00');
            const prettyDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            showDialog({
                title: 'Double Booking Warning!',
                message: `You already have a wedding booked for ${prettyDate} (${existingWedding.clientName}). Book anyway?`,
                isConfirm: true,
                confirmText: 'Book Anyway',
                confirmColor: '#E65100', 
                onConfirm: () => processSave()
            });
        } else {
            processSave();
        }
    });

    // Save Edit changes
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const appIndex = appointments.findIndex(a => a.id === id);
        
        if(appIndex > -1) {
            appointments[appIndex].clientName = document.getElementById('edit-clientName').value.trim();
            appointments[appIndex].email = document.getElementById('edit-email').value.trim();
            appointments[appIndex].phone = document.getElementById('edit-phone').value.trim();
            appointments[appIndex].weddingDate = document.getElementById('edit-weddingDate').value;
            appointments[appIndex].location = document.querySelector('input[name="edit-location"]:checked').value;
            appointments[appIndex].hairCount = document.getElementById('edit-hairCount').value;
            appointments[appIndex].makeupCount = document.getElementById('edit-makeupCount').value;
            appointments[appIndex].notes = document.getElementById('edit-notes').value.trim(); // Saving Edited Notes
            appointments[appIndex].contractSigned = document.getElementById('edit-contractSigned').checked;
            appointments[appIndex].depositMade = document.getElementById('edit-depositMade').checked;
            
            saveAppointments();
            renderAppointments();
            editModal.style.display = 'none';
        }
    });

    // --- View Toggles (Archiving) ---
    viewUpcomingBtn.addEventListener('click', () => {
        currentView = 'upcoming';
        viewUpcomingBtn.classList.add('active');
        viewPastBtn.classList.remove('active');
        renderAppointments();
    });

    viewPastBtn.addEventListener('click', () => {
        currentView = 'past';
        viewPastBtn.classList.add('active');
        viewUpcomingBtn.classList.remove('active');
        renderAppointments();
    });

    // --- Modals General Logic ---
    settingsOpenBtn.addEventListener('click', () => settingsModal.style.display = 'flex');
    settingsCloseBtn.addEventListener('click', () => settingsModal.style.display = 'none');
    editCloseBtn.addEventListener('click', () => editModal.style.display = 'none');

    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.style.display = 'none';
        if (e.target === dialogModal) dialogModal.style.display = 'none';
        if (e.target === editModal) editModal.style.display = 'none';
    });

    // --- Dummy Data ---
    loadDummyBtn.addEventListener('click', () => {
        const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 5);

        const dummyData = [
            {
                id: generateId(), clientName: 'Olivia Sterling', email: 'olivia.sterling@example.com',
                phone: '(757) 555-1029', weddingDate: '2026-09-12', location: 'On-Site',
                hairCount: '5', makeupCount: '5', notes: 'Bride wants a classic updo. 2 Bridesmaids need extensions blended.', contractSigned: true, depositMade: true
            },
            {
                id: generateId(), clientName: 'Sophia Lin', email: 'slin_weddings@example.com',
                phone: '(757) 555-8842', weddingDate: '2026-10-03', location: 'In-Salon',
                hairCount: '3', makeupCount: '1', notes: 'Arriving at 8:00 AM. Bring mimosas.', contractSigned: true, depositMade: false
            },
            {
                id: generateId(), clientName: 'Emma Richardson', email: 'emmarich12@example.com',
                phone: '(757) 555-3391', weddingDate: '2026-08-22', location: 'On-Site',
                hairCount: '7', makeupCount: '7', notes: '', contractSigned: false, depositMade: false
            },
            {
                id: generateId(), clientName: 'Jessica Archive', email: 'jess.past@example.com',
                phone: '(757) 555-9999', weddingDate: '2026-01-15', location: 'In-Salon',
                hairCount: '4', makeupCount: '4', notes: 'Was a beautiful winter wedding!', contractSigned: true, depositMade: true
            }
        ];

        appointments = [...appointments, ...dummyData];
        saveAppointments();
        currentView = 'upcoming';
        viewUpcomingBtn.classList.add('active');
        viewPastBtn.classList.remove('active');
        renderAppointments();
        settingsModal.style.display = 'none';
        
        showDialog({
            title: 'Test Data Loaded',
            message: 'Added example weddings! Check the "Past Weddings" tab to see how archiving works.',
            isConfirm: false
        });
    });

    // --- Export / Import ---
    exportBtn.addEventListener('click', () => {
        if (appointments.length === 0) {
            showDialog({ title: 'Nothing to Export', message: 'No appointments saved yet!', isConfirm: false });
            return;
        }
        const dataStr = JSON.stringify(appointments, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const today = new Date().toISOString().split('T')[0];
        const a = document.createElement('a');
        a.href = url;
        a.download = `Posh_Bridal_Backup_${today}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (Array.isArray(importedData)) {
                    showDialog({
                        title: 'Overwrite Data?',
                        message: 'Warning: This overwrites current data. Proceed?',
                        isConfirm: true,
                        confirmText: 'Restore Backup',
                        onConfirm: () => {
                            appointments = importedData;
                            saveAppointments();
                            renderAppointments();
                        }
                    });
                } else {
                    showDialog({ title: 'Import Failed', message: 'Not a valid backup file.', isConfirm: false, confirmColor: '#C62828' });
                }
            } catch (err) {
                showDialog({ title: 'Error Reading File', message: 'Make sure it is a valid .json file.', isConfirm: false, confirmColor: '#C62828' });
            }
        };
        reader.readAsText(file);
        e.target.value = ''; 
    });

    // Initial Load
    renderAppointments();
});
