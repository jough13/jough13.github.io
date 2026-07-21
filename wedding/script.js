document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('bridal-form');
    const tableBody = document.getElementById('appointments-body');
    const emptyState = document.getElementById('empty-state');
    const tableContainer = document.querySelector('.table-container');
    const exportBtn = document.getElementById('export-btn');
    const importFile = document.getElementById('import-file');

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

    // --- NEW FEATURE: EXPORT (Backup Data) ---
    exportBtn.addEventListener('click', () => {
        if (appointments.length === 0) {
            alert('There are no appointments to backup yet!');
            return;
        }
        
        // Turn our data array into a JSON string
        const dataStr = JSON.stringify(appointments, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        // Generate a file name with today's date
        const today = new Date().toISOString().split('T')[0];
        const filename = `Posh_Bridal_Backup_${today}.json`;

        // Create a temporary link to force the download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // --- NEW FEATURE: IMPORT (Restore Data) ---
    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                // Parse the imported JSON file
                const importedData = JSON.parse(event.target.result);
                
                // Ensure it's a valid array before overwriting
                if (Array.isArray(importedData)) {
                    // Ask for confirmation since this overwrites current data
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
        // Reset the file input so they can import the same file again later if needed
        e.target.value = '';
    });

    // Run render on initial load
    renderAppointments();
});
