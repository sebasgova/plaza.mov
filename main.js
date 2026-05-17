/* ============================================
   LA PLAZA EN MOVIMIENTO — Shared JS Utilities
   ============================================ */

// ============================================
// MOTOR DE AUDIO REAL (HTML5 Audio API)
// Reemplaza la simulación anterior.
// Funciona con archivos MP3 o WAV locales.
// ============================================

// Instancia global de audio — solo una a la vez
let _globalAudio = null;

class VendorAudioPlayer {
  /**
   * @param {Object} ids - IDs de los elementos del DOM
   * @param {string} ids.playBtnId   - Botón play/pause
   * @param {string} ids.playIconId  - Ícono dentro del botón
   * @param {string} ids.trackFillId - Barra de progreso (div relleno)
   * @param {string} ids.trackBarId  - Barra clickeable
   * @param {string} ids.currentTimeId
   * @param {string} ids.totalTimeId
   * @param {Function} [onEnd]       - Callback al terminar el audio
   */
  constructor({ playBtnId, playIconId, trackFillId, trackBarId, currentTimeId, totalTimeId }, onEnd) {
    this.playBtn     = document.getElementById(playBtnId);
    this.playIcon    = document.getElementById(playIconId);
    this.trackFill   = document.getElementById(trackFillId);
    this.trackBar    = document.getElementById(trackBarId);
    this.currentTime = document.getElementById(currentTimeId);
    this.totalTime   = document.getElementById(totalTimeId);
    this.onEnd       = onEnd || null;

    // El objeto Audio real del navegador
    this.audio       = null;
    this._rafId      = null;

    this._bindEvents();
  }

  // ---- Carga un archivo de audio ----
  load(src) {
    // Detener cualquier audio global anterior
    if (_globalAudio && _globalAudio !== this.audio) {
      _globalAudio.pause();
    }

    // Limpiar audio previo de esta instancia
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      cancelAnimationFrame(this._rafId);
    }

    // Crear nuevo objeto Audio
    this.audio = new Audio(src);
    _globalAudio = this.audio;

    // Cuando el audio esté listo, mostrar duración
    this.audio.addEventListener('loadedmetadata', () => {
      if (this.totalTime) {
        this.totalTime.textContent = formatTime(this.audio.duration);
      }
    });

    // Actualizar barra en tiempo real con requestAnimationFrame
    this.audio.addEventListener('play', () => {
      if (this.playIcon) this.playIcon.textContent = 'pause';
      this._tick();
    });

    this.audio.addEventListener('pause', () => {
      if (this.playIcon) this.playIcon.textContent = 'play_arrow';
      cancelAnimationFrame(this._rafId);
    });

    // Al terminar
    this.audio.addEventListener('ended', () => {
      if (this.playIcon)    this.playIcon.textContent    = 'play_arrow';
      if (this.trackFill)   this.trackFill.style.width   = '0%';
      if (this.currentTime) this.currentTime.textContent = '0:00';
      cancelAnimationFrame(this._rafId);
      if (this.onEnd) this.onEnd();
    });

    // Error: archivo no encontrado
    this.audio.addEventListener('error', () => {
      console.warn('[Plaza] No se pudo cargar el audio:', src);
      showToast('⚠ Archivo de audio no encontrado');
      if (this.playIcon) this.playIcon.textContent = 'play_arrow';
    });

    // Resetear UI
    if (this.trackFill)   this.trackFill.style.width   = '0%';
    if (this.currentTime) this.currentTime.textContent = '0:00';
    if (this.totalTime)   this.totalTime.textContent   = '—:—';
  }

  toggle() {
    if (!this.audio) return;
    this.audio.paused ? this.play() : this.pause();
  }

  play() {
    if (!this.audio) return;
    // Pausar cualquier otro audio global
    if (_globalAudio && _globalAudio !== this.audio) {
      _globalAudio.pause();
    }
    this.audio.play().catch(err => {
      console.warn('[Plaza] Error al reproducir:', err);
      showToast('Toca el botón para reproducir');
    });
  }

  pause() {
    if (this.audio) this.audio.pause();
  }

  stop() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
    if (this.trackFill)   this.trackFill.style.width   = '0%';
    if (this.currentTime) this.currentTime.textContent = '0:00';
    if (this.playIcon)    this.playIcon.textContent    = 'play_arrow';
  }

  seekTo(ratio) {
    if (!this.audio || !this.audio.duration) return;
    this.audio.currentTime = ratio * this.audio.duration;
  }

  get isPlaying() {
    return this.audio ? !this.audio.paused : false;
  }

  // Loop de animación para la barra de progreso
  _tick() {
    if (!this.audio || this.audio.paused) return;
    const ratio = this.audio.currentTime / (this.audio.duration || 1);
    if (this.trackFill)   this.trackFill.style.width   = (ratio * 100) + '%';
    if (this.currentTime) this.currentTime.textContent = formatTime(this.audio.currentTime);
    this._rafId = requestAnimationFrame(() => this._tick());
  }

  _bindEvents() {
    this.playBtn?.addEventListener('click', () => this.toggle());

    this.trackBar?.addEventListener('click', (e) => {
      const rect  = this.trackBar.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      this.seekTo(Math.max(0, Math.min(1, ratio)));
    });
  }
}

// ---- TOAST NOTIFICATION ----
function showToast(msg, duration = 3000) {
  let toast = document.getElementById('plaza-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'plaza-toast';
    toast.style.cssText = `
      position:fixed; bottom:90px; left:50%; transform:translateX(-50%) translateY(20px);
      background:#0e0f0b; color:#f8f6ef;
      font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:11px;
      letter-spacing:0.1em; text-transform:uppercase;
      padding:10px 20px; z-index:9000; opacity:0;
      transition:opacity 0.25s, transform 0.25s; pointer-events:none; white-space:nowrap;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, duration);
}

// ---- SOUND TOGGLE (topbar button) ----
function initSoundToggle(btnId, statusId) {
  const btn    = document.getElementById(btnId);
  const status = document.getElementById(statusId);
  if (!btn) return;

  let on = true;
  btn.addEventListener('click', () => {
    on = !on;
    btn.querySelector('.material-symbols-outlined').textContent = on ? 'volume_up' : 'volume_off';
    if (status) status.textContent = on ? 'Plaza Central · En vivo' : 'Sin audio';
    document.querySelectorAll('.eq-bar').forEach(b =>
      b.style.animationPlayState = on ? 'running' : 'paused'
    );
  });
}

// ---- PAGE ENTRY ANIMATIONS ----
function initPageAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('[data-anim]').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)';
    observer.observe(el);
  });
}

// ---- FORMAT DURATION HELPER ----
function parseDuration(str) {
  if (!str) return 0;
  const [m, s] = str.split(':').map(Number);
  return m * 60 + s;
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---- VENDOR DATA (Shared across map and archive) ----
//
// ► CÓMO AGREGAR TU AUDIO:
//   1. Crea una carpeta llamada "audio" junto a los archivos HTML
//   2. Pon tus MP3 o WAV dentro con el nombre que aparece en "audioSrc"
//   3. Si tu archivo tiene otro nombre, solo cambia el valor de "audioSrc"
//
// Estructura esperada:
//   plaza/
//   ├── audio/
//   │   ├── don_alirio.mp3       ← tu grabación real
//   │   ├── maricela.mp3
//   │   ├── carabali.mp3
//   │   └── ...
//   ├── index.html
//   ├── main.js
//   └── ...
//
const VENDORS = [
  {
    id: 1,
    name: "Don Alirio",
    apellido: "El Tamale",
    tag: "Alimentos · Mañana",
    categoria: "alimentos",
    horario: "5:00 – 9:00 AM",
    zona: "Cuba · Villa del Prado",
    lat: 4.7995, lng: -75.7100,
    years: 22,
    quote: "\"El tamale no es comida, es un mensaje que le manda la mamá de uno al vecindario.\"",
    desc: "Desde hace 22 años, Alirio Londoño recorre el barrio Cuba empujando su carrito de madera con una olla de barro llena de tamales. Su pregón —¡Tamaleeees, tamalitos calientes!— es la alarma de los vecinos. Aprendió el oficio de su madre en Santuario, Risaralda.",
    // ↓ Cambia este nombre si tu archivo se llama diferente
    audioSrc: "audio/don_alirio.mp3",
    imageSrc: "img/don_alirio.png",
    animDelay: 0,
    color: "#0013bb"
  },
  {
    id: 2,
    name: "Maricela",
    apellido: "Las Papayuelas",
    tag: "Frutas · Todo el día",
    categoria: "frutas",
    horario: "7:00 AM – 5:00 PM",
    zona: "Centro · Av. Circunvalar",
    lat: 4.8133, lng: -75.6961,
    years: 14,
    quote: "\"La fruta habla sola si uno la sabe ofrecer. Mi voz no es un adorno, es parte del precio.\"",
    desc: "Maricela lleva su bicicleta cargada de papayuelas y maracuyás desde el mercado de Galería hasta el centro. No usa megáfono: su voz grave y cadenciosa llega más lejos que cualquier aparato.",
    audioSrc: "audio/maricela.mp3",
    animDelay: 0.4,
    color: "#426500"
  },
  {
    id: 3,
    name: "Los Hermanos Carabalí",
    apellido: "El Chontaduro",
    tag: "Alimentos · Tarde",
    categoria: "alimentos",
    horario: "2:00 – 7:00 PM",
    zona: "El Jardín · Álamos",
    lat: 4.8200, lng: -75.7000,
    years: 8,
    quote: "\"Traje el Chocó a Pereira en una olla. El pregón es mi idioma, no mi anuncio.\"",
    desc: "Tres hermanos afrocolombianos del Chocó llevan al barrio El Jardín el ritual del chontaduro con sal y miel. Su pregón cambia según el barrio: en unos es canto, en otros es llamado rítmico. Han convertido la venta en una performance urbana.",
    audioSrc: "audio/hermanos_carabali.mp3",
    animDelay: 0.8,
    color: "#bb0008"
  },
  {
    id: 5,
    name: "Doña Esperanza",
    apellido: "Las Empanadas",
    tag: "Alimentos · Tarde-Noche",
    categoria: "alimentos",
    horario: "4:00 – 10:00 PM",
    zona: "Galería · San Nicolás",
    lat: 4.8175, lng: -75.7080,
    years: 30,
    quote: "\"Me inventé un refrán nuevo cada semana. Eso los tiene esperando a ver qué voy a decir.\"",
    desc: "Con una canasta en la cabeza y un megáfono viejo, Doña Esperanza lleva 30 años anunciando empanadas de pipián. Su pregón incluye el precio, el relleno, y un refrán cambiante que aprendió a componer ella misma.",
    audioSrc: "audio/doña_esperanza.mp3",
    animDelay: 0.6,
    color: "#bb0008"
  },
  {
    id: 6,
    name: "Hernán",
    apellido: "Mangos Biche",
    tag: "Frutas · Mediodía",
    categoria: "frutas",
    horario: "11:00 AM – 3:00 PM",
    zona: "Providencia · La Palma",
    lat: 4.803107546680623, lng: -75.66834954750531,
    years: 10,
    quote: "\"¡Mango biche con sal y limón, el mejor de la región! Los niños me piden que lo repita.\"",
    desc: "Hernán transporta sus mangos en un carrito de supermercado modificado con ruedas grandes. Su pregón es famoso por ser casi un trabalenguas. Los niños lo persiguen para que lo repita.",
    audioSrc: "audio/hernan.mp3",
    animDelay: 1.0,
    color: "#426500"
  },
];

// ---- CATEGORY COLORS ----
const CAT_COLORS = {
  alimentos:  '#bb0008',
  frutas:     '#426500',
  servicios:  '#6f5836',
  artesanias: '#7a4f9c'
};

// Export for use in pages
if (typeof module !== 'undefined') module.exports = { VendorAudioPlayer, VENDORS, CAT_COLORS, showToast, initPageAnimations, initSoundToggle };
