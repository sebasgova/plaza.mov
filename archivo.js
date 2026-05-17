/* ============================================
   ARCHIVO PAGE — archivo.js
   Audio real con HTML5 Audio API
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initPageAnimations();
  initSoundToggle('soundToggle');
  renderVendorGrid();
  initMiniPlayer();
});

// ---- SVG de fondo por vendedor ----
function vendorSVG(vendor) {
  const color      = vendor.color || '#bb0008';
  const colorLight = color + '33';
  const initials   = vendor.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  return `
    <svg viewBox="0 0 300 375" xmlns="http://www.w3.org/2000/svg" class="vendor-card-svg">
      <rect width="300" height="375" fill="#deddd4"/>
      <rect x="0" y="0" width="300" height="375" fill="${colorLight}"/>
      <rect x="40" y="80" width="80" height="120" fill="${color}" opacity="0.15"/>
      <rect x="160" y="60" width="100" height="150" fill="${color}" opacity="0.1"/>
      <rect x="20" y="240" width="260" height="2" fill="${color}" opacity="0.2"/>
      <ellipse cx="150" cy="160" rx="70" ry="85" fill="${color}" opacity="0.12"/>
      <rect x="105" y="245" width="90" height="80" fill="${color}" opacity="0.1"/>
      <text x="150" y="195" font-family="Space Grotesk,sans-serif" font-weight="900"
        font-size="80" fill="${color}" opacity="0.18" text-anchor="middle">${initials}</text>
      <text x="20" y="355" font-family="Space Grotesk,sans-serif" font-weight="700"
        font-size="9" fill="#2e2f2b" opacity="0.35" letter-spacing="2">${vendor.categoria.toUpperCase()}</text>
    </svg>`;
}

function randomWaveformBars() {
  return [35,60,80,45,90,55,70,30,65,85,40]
    .map(h => `<div class="waveform-bar" style="height:${h}%;"></div>`)
    .join('');
}

// ---- RENDERIZAR GRID DE TARJETAS ----
function renderVendorGrid() {
  const grid = document.getElementById('vendorGrid');
  if (!grid) return;

  grid.innerHTML = VENDORS.map(vendor => `
    <div class="vendor-card" data-id="${vendor.id}">
      <div class="vendor-card-media">
        ${vendorSVG(vendor)}
        <div class="vendor-card-hover-overlay">
          <span class="material-symbols-outlined icon-fill" style="font-size:64px;color:white;">graphic_eq</span>
        </div>
        <div class="vendor-card-waveform">
          <div class="waveform-static">${randomWaveformBars()}</div>
        </div>
      </div>
      <div class="vendor-card-body">
        <h4 class="vendor-card-name">${vendor.name}</h4>
        <p class="vendor-card-role">${vendor.apellido} · ${vendor.years} años en la calle</p>
        <p class="vendor-card-quote">${vendor.quote}</p>
        <div class="vendor-card-footer">
          <button class="vendor-card-listen" data-id="${vendor.id}">
            Escuchar Historia
            <span class="material-symbols-outlined" style="font-size:18px;color:var(--secondary);">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Eventos de click en botón "Escuchar"
  grid.querySelectorAll('.vendor-card-listen').forEach(btn => {
    btn.addEventListener('click', () => {
      const id     = parseInt(btn.dataset.id);
      const vendor = VENDORS.find(v => v.id === id);
      if (vendor) activateVendor(vendor);
    });
  });

  // Click en toda la tarjeta también abre el reproductor
  grid.querySelectorAll('.vendor-card').forEach(card => {
    card.querySelector('.vendor-card-media').addEventListener('click', () => {
      const id     = parseInt(card.dataset.id);
      const vendor = VENDORS.find(v => v.id === id);
      if (vendor) activateVendor(vendor);
    });
  });
}

// ---- MINI PLAYER ----
// Una instancia de VendorAudioPlayer para el mini-player flotante
const miniAudioPlayer = new VendorAudioPlayer(
  {
    playBtnId:     'miniPlayBtn',
    playIconId:    'miniPlayIcon',
    trackFillId:   'miniBarFill',
    trackBarId:    'miniPlayerBar',
    currentTimeId: 'miniCurrentTime',
    totalTimeId:   'miniTotalTime',
  },
  // Callback al terminar: avanza al siguiente vendedor
  () => advanceToNext()
);

let activeVendorIndex = 0;

function activateVendor(vendor) {
  activeVendorIndex = VENDORS.findIndex(v => v.id === vendor.id);

  // Actualizar UI del mini player
  const title = document.getElementById('miniPlayerTitle');
  if (title) title.textContent = `${vendor.name} — ${vendor.apellido}`;

  // Cargar el audio real
  miniAudioPlayer.load(vendor.audioSrc);

  // Mostrar el player y empezar a reproducir
  showMiniPlayer();
  miniAudioPlayer.play();

  showToast(`▶ ${vendor.name}`);
}

function advanceToNext() {
  const next = VENDORS[(activeVendorIndex + 1) % VENDORS.length];
  activateVendor(next);
}

function advanceToPrev() {
  const prev = VENDORS[(activeVendorIndex - 1 + VENDORS.length) % VENDORS.length];
  activateVendor(prev);
}

function showMiniPlayer() {
  const player = document.getElementById('miniPlayer');
  if (!player) return;
  player.style.opacity      = '1';
  player.style.pointerEvents = 'all';
  player.classList.add('visible');
}

function hideMiniPlayer() {
  const player = document.getElementById('miniPlayer');
  if (!player) return;
  player.style.opacity      = '0';
  player.style.pointerEvents = 'none';
  player.classList.remove('visible');
}

function initMiniPlayer() {
  // Botón cerrar
  document.getElementById('miniClose')?.addEventListener('click', () => {
    miniAudioPlayer.stop();
    hideMiniPlayer();
  });

  // Anterior
  document.getElementById('miniPrev')?.addEventListener('click', advanceToPrev);

  // Siguiente
  document.getElementById('miniNext')?.addEventListener('click', advanceToNext);

  // El botón play/pause ya está manejado por VendorAudioPlayer vía miniPlayBtn
}
