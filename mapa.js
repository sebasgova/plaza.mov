/* ============================================
   MAPA — mapa.js
   ============================================ */

const GALERIA_COORD = [4.814198406313445, -75.71292029030167];

document.addEventListener('DOMContentLoaded', () => {
  if (typeof initSoundToggle === 'function') initSoundToggle('soundToggle', 'radioStatus');
  initMap();
  initPanel();
});

let map;

function initMap() {
  map = L.map('map', {
    center: [4.8110, -75.7020],
    zoom: 14,
    zoomControl: true,
    attributionControl: false,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map);

  // Coordenadas en vivo
  map.on('mousemove', (e) => {
    const el = document.getElementById('liveCoords');
    if (el) el.textContent = `${e.latlng.lat.toFixed(4)}° N, ${Math.abs(e.latlng.lng).toFixed(4)}° W`;
  });

  addGoldMarker();

  VENDORS.forEach((vendor, index) => {
    addVendorMarker(vendor);
    setTimeout(() => drawStreetRoute(vendor), index * 500);
  });
}

// ---- MARCADOR DORADO — Galería la 40 ----
function addGoldMarker() {
  const goldIcon = L.divIcon({
    className: 'gold-marker-container',
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;width:30px;height:30px;">
        <div class="pulse-gold"></div>
        <div class="gold-marker"></div>
      </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    tooltipAnchor: [20, -10]
  });

  const tooltipContent = `
    <div style="
      background:rgba(14,15,11,0.95);
      outline:1px solid rgba(212,175,55,0.5);
      padding:10px 14px;
      font-family:'Space Grotesk',sans-serif;
      pointer-events:none;
    ">
      <div style="font-size:8px;letter-spacing:0.16em;text-transform:uppercase;color:#d4af37;font-weight:700;margin-bottom:3px;">Nodo Central</div>
      <div style="font-size:13px;font-weight:900;color:#f8f6ef;letter-spacing:-0.02em;text-transform:uppercase;">Galería la 40</div>
      <div style="font-size:8px;color:rgba(248,246,239,0.45);margin-top:3px;letter-spacing:0.06em;">Clic para conocer su historia →</div>
    </div>`;

  const marker = L.marker(GALERIA_COORD, { icon: goldIcon }).addTo(map);

  marker.bindTooltip(tooltipContent, {
    permanent: false,
    direction: 'right',
    className: 'galeria-tooltip',
    offset: [18, 0]
  });

  // Click → navegar a la página de la Galería
  marker.on('click', () => {
    window.location.href = 'galeria.html';
  });
}

// ---- RUTAS POR CALLE ----
async function drawStreetRoute(vendor) {
  if (!vendor.lat || !vendor.lng) return;

  const start = `${vendor.lng},${vendor.lat}`;
  const end   = `${GALERIA_COORD[1]},${GALERIA_COORD[0]}`;
  const url   = `https://router.project-osrm.org/route/v1/walking/${start};${end}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    const data     = await response.json();
    if (data.routes && data.routes.length > 0) {
      const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      L.polyline(coords, {
        color: vendor.color || '#bb0008',
        weight: 3,
        opacity: 0.5,
        dashArray: '8, 12',
        className: 'animated-path'
      }).addTo(map);
    }
  } catch (e) {
    // Fallback: línea recta
    L.polyline([[vendor.lat, vendor.lng], GALERIA_COORD], {
      color: vendor.color,
      weight: 2,
      dashArray: '5, 5',
      opacity: 0.25
    }).addTo(map);
  }
}

// ---- MARCADORES VENDEDORES ----
function addVendorMarker(vendor) {
  const color   = vendor.color || '#bb0008';
  const iconHtml = `
    <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
      <div style="
        position:absolute;top:50%;left:50%;
        width:40px;height:40px;border-radius:50%;
        border:2px solid ${color};
        animation:mapPulse 2.5s ${vendor.animDelay||0}s infinite;
        transform:translate(-50%,-50%);pointer-events:none;
      "></div>
      <div style="
        width:14px;height:14px;
        background:${color};border:2px solid white;border-radius:50%;
        box-shadow:0 0 8px rgba(0,0,0,0.3);cursor:pointer;
      "></div>
    </div>`;

  const icon   = L.divIcon({ html: iconHtml, className: '', iconSize: [40,40], iconAnchor: [20,20] });
  const marker = L.marker([vendor.lat, vendor.lng], { icon }).addTo(map);
  marker.on('click', () => openVendor(vendor));
}

// ---- PANEL DE DETALLE ----
const mapPlayer = new VendorAudioPlayer({
  playBtnId:     'playBtn',
  playIconId:    'playIcon',
  trackFillId:   'trackFill',
  trackBarId:    'trackBar',
  currentTimeId: 'currentTime',
  totalTimeId:   'totalTime',
});

let activeVendor = null;

function initPanel() {
  document.getElementById('panelClose')?.addEventListener('click', () => {
    document.getElementById('detailPanel').classList.remove('open');
    mapPlayer.stop();
    activeVendor = null;
  });
}

function openVendor(vendor) {
  if (activeVendor && activeVendor.id !== vendor.id) mapPlayer.stop();
  activeVendor = vendor;

  const panelTag = document.getElementById('panelTag');
  if (panelTag) panelTag.textContent = vendor.tag;

  document.getElementById('panelTitle').textContent   = vendor.name;
  document.getElementById('panelDesc').textContent    = vendor.desc;
  document.getElementById('panelQuote').textContent   = vendor.quote;

  const horario = document.getElementById('panelHorario');
  const zona    = document.getElementById('panelZona');
  if (horario) horario.textContent = vendor.horario || '—';
  if (zona)    zona.textContent    = vendor.zona    || '—';

  mapPlayer.load(vendor.audioSrc);
  document.getElementById('detailPanel').classList.add('open');
  map.panTo([vendor.lat, vendor.lng], { animate: true });
}
