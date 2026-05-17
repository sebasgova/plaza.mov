document.addEventListener('DOMContentLoaded', () => {
  const map = L.map('map').setView([4.8110, -75.7020], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);
  L.marker([4.8110, -75.7020]).addTo(map).bindPopup('Pereira en sonido');
});
