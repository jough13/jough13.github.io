document.addEventListener("DOMContentLoaded", function() {
  fetch('/right-panel.html')
    .then(response => response.text())
    .then(data => {
      document.getElementById('right-panel-container').innerHTML = data;
    });
});
