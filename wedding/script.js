document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('bridal-form');
    const tableBody = document.getElementById('appointments-body');
    const emptyState = document.getElementById('empty-state');
    const tableContainer = document.querySelector('.table-container');
    
    // Import / Export Buttons
    const exportBtn = document.getElementById('export-btn');
    const importFile = document.getElementById('import-file');
    
    // Modal & Settings Buttons
    const settingsModal = document.getElementById('settings-modal');
    const settingsOpenBtn = document.getElementById('settings-open-btn');
    const settingsCloseBtn = document.getElementById('settings-close-btn');
    const loadDummyBtn = document.getElementById('load-dummy-btn');

    // Load appointments from LocalStorage
    let appointments = JSON.parse(localStorage.getItem('poshBridalAppointments')) || [];

    // Save array to local storage
    function saveAppointments() {
        localStorage.setItem('poshBridalAppointments', JSON.stringify(appointments));
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

            // Generate HTML badges based on contract and deposit status
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

        // Attach event listeners to all dynamically created "Remove" buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                deleteAppointment(id);
            });
        });
    }

    // Delete functionality
    function deleteAppointment(id) {
        if(confirm('Are you sure you want to remove this wedding appointment?')) {
            appointments = appointments.filter(app => app.id !== id);
            saveAppointments();
            renderAppointments();
        }
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

    // --- MODAL LOGIC ---
    settingsOpenBtn.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
    });

    settingsCloseBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    // Close modal if user clicks outside of the box
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
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
            },
            {
                id: 'dummy4', clientName: 'Isabella Cruz', email: 'icruz.designs@example.com',
                phone: '(757) 555-4747', weddingDate: '2026-11-15', location: 'In-Salon',
                hairCount: '4', makeupCount: '4', contractSigned: true, depositMade: true
            }
        ];

        // Add dummy data to existing appointments
        appointments = [...appointments, ...dummyData];
        saveAppointments();
        renderAppointments();
        
        settingsModal.style.display = 'none'; // Close modal
    });

    // --- EXPORT (Backup Data) ---
    exportBtn.addEventListener('click', () => {
        if (appointments.length === 0) {
            alert('There are no appointments to backup yet!');
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
                    if (confirm('Warning: This will overwrite your current appointments. Do you want to proceed?')) {
                        appointments = importedData;
                        saveAppointments();
                        renderAppointments();
                        alert('Data successfully restored!');
                    }
                } else {
                    alert('Invalid backup file. The format is not recognized.');
                }
            } catch (err) {
                alert('Error reading the backup file. Please ensure it is the correct .json file.');
            }
        };
        
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    });

    // Run render on initial load
    renderAppointments();
});
