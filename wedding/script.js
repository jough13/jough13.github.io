document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('bridal-form');
    const tableBody = document.getElementById('appointments-body');
    const emptyState = document.getElementById('empty-state');
    const tableContainer = document.querySelector('.table-container');
    
    // Import / Export Buttons
    const exportBtn = document.getElementById('export-btn');
    const importFile = document.getElementById('import-file');
    
    // Modal & Settings Elements
    const settingsModal = document.getElementById('settings-modal');
    const settingsOpenBtn = document.getElementById('settings-open-btn');
    const settingsCloseBtn = document.getElementById('settings-close-btn');
    const loadDummyBtn = document.getElementById('load-dummy-btn');

    // Dialog Modal Elements
    const dialogModal = document.getElementById('dialog-modal');
    const dialogTitle = document.getElementById('dialog-title');
    const dialogMessage = document.getElementById('dialog-message');
    const dialogButtons = document.getElementById('dialog-buttons');

    // Load appointments from LocalStorage
    let appointments = JSON.parse(localStorage.getItem('poshBridalAppointments')) || [];

    // Save array to local storage
    function saveAppointments() {
        localStorage.setItem('poshBridalAppointments', JSON.stringify(appointments));
    }

    // --- CUSTOM DIALOG FUNCTION ---
    // Replaces default browser alerts/confirms with our beautiful branded modals
    function showDialog({ title, message, isConfirm, confirmText = "OK", confirmColor = "var(--primary-color)", onConfirm }) {
        dialogTitle.textContent = title;
        dialogMessage.textContent = message;
        dialogButtons.innerHTML = ''; // Clear out old buttons

        if (isConfirm) {
            // It's a Confirmation (Needs Cancel + Action button)
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
            // It's just an Alert (Needs only an OK button)
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

    // Render the tracking table
    function renderAppointments() {
        tableBody.innerHTML = '';
        
        if (appointments.length === 0) {
            emptyState.style.display = 'block';
            tableContainer.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        tableContainer.style.display = 'block';

        // Sort weddings chronologically by date
        appointments.sort((a, b) => new Date(a.weddingDate) - new Date(b.weddingDate));

        appointments.forEach(app => {
            const row = document.createElement('tr');

            // Format Date beautifully
            const dateObj = new Date(app.weddingDate);
            const dateString = new Date(dateObj.getTime() + Math.abs(dateObj.getTimezoneOffset()*60000)).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
            });

            // Generate HTML badges
            const contractBadge = `<span class="status-badge ${app.contractSigned ? 'status-yes' : 'status-no'}">Contract: ${app.contractSigned ? 'Yes' : 'No'}</span>`;
            const depositBadge = `<span class="status-badge ${app.depositMade ? 'status-yes' : 'status-no'}">Deposit: ${app.depositMade ? 'Yes' : 'No'}</span>`;

            row.innerHTML = `
                <td>
                    <strong>${app.clientName}</strong><br>
                    <a href="mailto:${app.email}" style="font-size: 0.8rem; color: #666; text-decoration: none;">${app.email}</a><br>
                    <span style="font-size: 0.8rem; color: #666;">${app.phone}</span>
                </td>
                <td><strong>${dateString}</strong></td>
                <td>${app.location}</td>
                <td>Hair: ${app.hairCount} <br> Makeup: ${app.makeupCount}</td>
                <td>${contractBadge}<br>${depositBadge}</td>
                <td><button class="delete-btn" data-id="${app.id}">Remove</button></td>
            `;

            tableBody.appendChild(row);
        });

        // Attach event listeners to "Remove" buttons using custom dialog
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                
                showDialog({
                    title: 'Remove Appointment?',
                    message: 'Are you sure you want to delete this wedding appointment? This cannot be undone.',
                    isConfirm: true,
                    confirmText: 'Delete',
                    confirmColor: '#C62828', // Destructive Red
                    onConfirm: () => {
                        appointments = appointments.filter(app => app.id !== id);
                        saveAppointments();
                        renderAppointments();
                    }
                });
            });
        });
    }

    // Form Submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const newAppointment = {
            id: Date.now().toString(),
            clientName: document.getElementById('clientName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            weddingDate: document.getElementById('weddingDate').value,
            location: document.querySelector('input[name="location"]:checked').value,
            hairCount: document.getElementById('hairCount').value,
            makeupCount: document.getElementById('makeupCount').value,
            contractSigned: document.getElementById('contractSigned').checked,
            depositMade: document.getElementById('depositMade').checked
        };

        appointments.push(newAppointment);
        saveAppointments();
        renderAppointments();
        
        form.reset();
        document.querySelector('input[value="In-Salon"]').checked = true; // reset radio default
    });

    // --- SETTINGS MODAL LOGIC ---
    settingsOpenBtn.addEventListener('click', () => settingsModal.style.display = 'flex');
    settingsCloseBtn.addEventListener('click', () => settingsModal.style.display = 'none');

    // Close modals if user clicks outside the content box
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.style.display = 'none';
        if (e.target === dialogModal) dialogModal.style.display = 'none';
    });

    // --- LOAD DUMMY DATA ---
    loadDummyBtn.addEventListener('click', () => {
        const dummyData = [
            {
                id: 'dummy1', clientName: 'Olivia Sterling', email: 'olivia.sterling@example.com',
                phone: '(757) 555-1029', weddingDate: '2026-09-12', location: 'On-Site',
                hairCount: '5', makeupCount: '5', contractSigned: true, depositMade: true
            },
            {
                id: 'dummy2', clientName: 'Sophia Lin', email: 'slin_weddings@example.com',
                phone: '(757) 555-8842', weddingDate: '2026-10-03', location: 'In-Salon',
                hairCount: '3', makeupCount: '1', contractSigned: true, depositMade: false
            },
            {
                id: 'dummy3', clientName: 'Emma Richardson', email: 'emmarich12@example.com',
                phone: '(757) 555-3391', weddingDate: '2026-08-22', location: 'On-Site',
                hairCount: '7', makeupCount: '7', contractSigned: false, depositMade: false
            }
        ];

        appointments = [...appointments, ...dummyData];
        saveAppointments();
        renderAppointments();
        settingsModal.style.display = 'none';
        
        showDialog({
            title: 'Test Data Loaded',
            message: 'Successfully added 3 example weddings to your tracking board!',
            isConfirm: false
        });
    });

    // --- EXPORT (Backup Data) ---
    exportBtn.addEventListener('click', () => {
        if (appointments.length === 0) {
            showDialog({
                title: 'Nothing to Export',
                message: 'You have no appointments saved right now. Add some brides before exporting!',
                isConfirm: false
            });
            return;
        }
        
        const dataStr = JSON.stringify(appointments, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const today = new Date().toISOString().split('T')[0];
        const filename = `Posh_Bridal_Backup_${today}.json`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // --- IMPORT (Restore Data) ---
    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                
                if (Array.isArray(importedData)) {
                    // Trigger Custom Warning Dialog before overwriting
                    showDialog({
                        title: 'Overwrite Data?',
                        message: 'Warning: Importing this backup will overwrite your current appointment board. Do you want to proceed?',
                        isConfirm: true,
                        confirmText: 'Restore Backup',
                        onConfirm: () => {
                            appointments = importedData;
                            saveAppointments();
                            renderAppointments();
                            
                            // Follow up with success message
                            setTimeout(() => {
                                showDialog({
                                    title: 'Restore Complete',
                                    message: 'Your appointments have been successfully restored from the backup file.',
                                    isConfirm: false
                                });
                            }, 300); // Slight delay for smooth animation
                        }
                    });
                } else {
                    showDialog({
                        title: 'Import Failed',
                        message: 'The file you selected is not a valid Posh Salon backup file.',
                        isConfirm: false,
                        confirmColor: '#C62828'
                    });
                }
            } catch (err) {
                showDialog({
                    title: 'Error Reading File',
                    message: 'There was an issue opening this file. Please make sure it is a valid .json backup.',
                    isConfirm: false,
                    confirmColor: '#C62828'
                });
            }
        };
        
        reader.readAsText(file);
        e.target.value = ''; // Reset input to allow selecting the same file twice
    });

    // Run render on initial load
    renderAppointments();
});
