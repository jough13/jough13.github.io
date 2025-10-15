document.addEventListener("DOMContentLoaded", function() {
  fetch('/right-sidebar.html')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .then(data => {
      const container = document.getElementById('sidebar-container');
      if (container) {
        container.innerHTML = data; // Inject the entire sidebar
      }
    })
    .catch(error => {
      console.error('Failed to load the sidebar:', error);
      const container = document.getElementById('sidebar-container');
      if (container) {
        container.innerHTML = "<p>Error loading sidebar content.</p>";
      }
    });
});
