// public/js/app.js

document.addEventListener('DOMContentLoaded', () => {
    // Show default module
    showSection('dashboard');
    loadAllData();
});

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.module').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
    });

    // Show the selected section
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
    }

    // Hide dashboard if showing another section
    if (sectionId !== 'dashboard') {
        const dashboard = document.getElementById('dashboard');
        if(dashboard) dashboard.style.display = 'none';
    } else {
        const dashboard = document.getElementById('dashboard');
        if(dashboard) dashboard.style.display = 'block';
    }
}

// Fetch placeholder data
function loadAllData() {
    fetchData('/api/equipment', 'equipment-list');
    fetchData('/api/sources', 'sources-list');
    fetchData('/api/work-plans', 'work-plans-list');
    fetchData('/api/dosimetry', 'dosimetry-list');
    fetchData('/api/reports', 'reports-list');
}

function fetchData(endpoint, listId) {
    fetch(endpoint)
        .then(res => res.json())
        .then(data => {
            const ul = document.getElementById(listId);
            if (!ul) return;
            
            ul.innerHTML = '';
            
            if (data.length === 0) {
                ul.innerHTML = '<li>No data found.</li>';
                return;
            }

            data.forEach(item => {
                const li = document.createElement('li');
                // Format basic string based on first few keys of object
                const values = Object.values(item).slice(1, 4).join(' - ');
                li.textContent = `ID ${item.id}: ${values}`;
                ul.appendChild(li);
            });
        })
        .catch(err => {
            console.error(`Error fetching ${endpoint}:`, err);
            const ul = document.getElementById(listId);
            if (ul) ul.innerHTML = `<li style="color:red;">Error loading data.</li>`;
        });
}
