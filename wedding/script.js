document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('bridal-form');
    const tableBody = document.getElementById('appointments-body');
    const emptyState = document.getElementById('empty-state');
    const tableContainer = document.querySelector('.table-container');

    // Load appointments from LocalStorage so data persists across refreshes
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

        // Create new appointment object
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

        // Push, save, and refresh UI
        appointments.push(newAppointment);
        saveAppointments();
        renderAppointments();
        
        // Reset form for next client
        form.reset();
        document.querySelector('input[value="In-Salon"]').checked = true; // reset radio default
    });

    // Run render on initial load
    renderAppointments();
});
