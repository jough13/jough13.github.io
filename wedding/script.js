document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('bridal-form');
    const tableBody = document.getElementById('appointments-body');
    const emptyState = document.getElementById('empty-state');
    const tableContainer = document.querySelector('.table-container');
    
    const exportBtn = document.getElementById('export-btn');
    const importFile = document.getElementById('import-file');
    
    const settingsModal = document.getElementById('settings-modal');
    const settingsOpenBtn = document.getElementById('settings-open-btn');
    const settingsCloseBtn = document.getElementById('settings-close-btn');
    const loadDummyBtn = document.getElementById('load-dummy-btn');

    const dialogModal = document.getElementById('dialog-modal');
    const dialogTitle = document.getElementById('dialog-title');
    const dialogMessage = document.getElementById('dialog-message');
    const dialogButtons = document.getElementById('dialog-buttons');

    let appointments = JSON.parse(localStorage.getItem('poshBridalAppointments')) || [];

    function saveAppointments() {
        localStorage.setItem('poshBridalAppointments', JSON.stringify(appointments));
    }

    // Custom Branded Dialog System
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

    function renderAppointments() {
        tableBody.innerHTML = '';
        
        if (appointments.length === 0) {
            emptyState.style.display = 'block';
            tableContainer.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        tableContainer.style.display = 'block';

        appointments.sort((a, b) => new Date(a.weddingDate) - new Date(b.weddingDate));

        appointments.forEach(app => {
            const row = document.createElement('tr');

            const dateObj = new Date(app.weddingDate);
            const dateString = new Date(dateObj.getTime() + Math.abs(dateObj.getTimezoneOffset()*60000)).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
            });

            // Condensed labels for the spreadsheet view
            const contractBadge = `<span class="status-badge ${app.contractSigned ? 'status-yes' : 'status-no'}">${app.contractSigned ? 'Signed' : 'Pending'}</span>`;
            const depositBadge = `<span class="status-badge ${app.depositMade ? 'status-yes' : 'status-no'}">${app.depositMade ? 'Paid' : 'Unpaid'}</span>`;

            // Spreadsheet row structure (10 distinct columns)
            row.innerHTML = `
                <td class="sticky-col"><strong>${app.clientName}</strong></td>
                <td><strong>${dateString}</strong></td>
                <td>${app.phone}</td>
                <td><a href="mailto:${app.email}" class="text-link">${app.email}</a></td>
                <td>${app.location}</td>
                <td>${app.hairCount}</td>
                <td>${app.makeupCount}</td>
                <td>${contractBadge}</td>
                <td>${depositBadge}</td>
                <td><button class="delete-btn" data-id="${app.id}">Remove</button></td>
            `;

            tableBody.appendChild(row);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                
                showDialog({
                    title: 'Remove Appointment?',
                    message: 'Are you sure you want to delete this wedding appointment? This cannot be undone.',
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
    }

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
            contractSigned: document.getElementById('contractSigned').checked,
            depositMade: document.getElementById('depositMade').checked
        };

        const existingWedding = appointments.find(app => app.weddingDate === dateValue);

        const processSave = () => {
            appointments.push(newAppointment);
            saveAppointments();
            renderAppointments();
            form.reset();
            document.querySelector('input[value="In-Salon"]').checked = true;
        };

        if (existingWedding) {
            const dateObj = new Date(dateValue);
            const prettyDate = new Date(dateObj.getTime() + Math.abs(dateObj.getTimezoneOffset()*60000)).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
            });

            showDialog({
                title: 'Double Booking Warning!',
                message: `You already have a wedding booked for ${prettyDate} (${existingWedding.clientName}). Are you sure you want to double-book this date?`,
                isConfirm: true,
                confirmText: 'Book Anyway',
                confirmColor: '#E65100', 
                onConfirm: () => {
                    processSave();
                }
            });
        } else {
            processSave();
        }
    });

    settingsOpenBtn.addEventListener('click', () => settingsModal.style.display = 'flex');
    settingsCloseBtn.addEventListener('click', () => settingsModal.style.display = 'none');

    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.style.display = 'none';
        if (e.target === dialogModal) dialogModal.style.display = 'none';
    });

    loadDummyBtn.addEventListener('click', () => {
        const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 5);

        const dummyData = [
            {
                id: generateId(), clientName: 'Olivia Sterling', email: 'olivia.sterling@example.com',
                phone: '(757) 555-1029', weddingDate: '2026-09-12', location: 'On-Site',
                hairCount: '5', makeupCount: '5', contractSigned: true, depositMade: true
            },
            {
                id: generateId(), clientName: 'Sophia Lin', email: 'slin_weddings@example.com',
                phone: '(757) 555-8842', weddingDate: '2026-10-03', location: 'In-Salon',
                hairCount: '3', makeupCount: '1', contractSigned: true, depositMade: false
            },
            {
                id: generateId(), clientName: 'Emma Richardson', email: 'emmarich12@example.com',
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
            message: 'Successfully added example weddings to your tracking board!',
            isConfirm: false
        });
    });

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
                        message: 'Warning: Importing this backup will overwrite your current appointment board. Do you want to proceed?',
                        isConfirm: true,
                        confirmText: 'Restore Backup',
                        onConfirm: () => {
                            appointments = importedData;
                            saveAppointments();
                            renderAppointments();
                            
                            setTimeout(() => {
                                showDialog({
                                    title: 'Restore Complete',
                                    message: 'Your appointments have been successfully restored from the backup file.',
                                    isConfirm: false
                                });
                            }, 300); 
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
        e.target.value = ''; 
    });

    renderAppointments();
});
