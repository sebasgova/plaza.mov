/* ============================================
   ACCESIBILIDAD AAA — accessibility.js
   Panel interactivo + filtros daltónicos
   ============================================ */

(function () {
  'use strict';

  // ---- Preferencias guardadas en localStorage ----
  const PREF_KEY = 'plaza_a11y';

  function loadPrefs() {
    try {
      return JSON.parse(localStorage.getItem(PREF_KEY)) || {};
    } catch { return {}; }
  }

  function savePrefs(prefs) {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch {}
  }

  // ---- Clases disponibles y su etiqueta ----
  const MODES = [
    { key: 'high-contrast',  cls: 'a11y-high-contrast'   },
    { key: 'large-text',     cls: 'a11y-large-text'       },
    { key: 'dyslexia',       cls: 'a11y-dyslexia'         },
    { key: 'reduce-motion',  cls: 'a11y-reduce-motion'    },
    { key: 'focus-visible',  cls: 'a11y-focus-visible'    },
    { key: 'monochrome',     cls: 'a11y-monochrome'       },
    { key: 'deuteranopia',   cls: 'a11y-deuteranopia'     },
    { key: 'protanopia',     cls: 'a11y-protanopia'       },
    { key: 'tritanopia',     cls: 'a11y-tritanopia'       },
  ];

  // Solo un modo daltónico a la vez
  const DALTONISM_MODES = ['monochrome', 'deuteranopia', 'protanopia', 'tritanopia'];

  // ---- Aplicar preferencias guardadas ----
  function applyPrefs() {
    const prefs = loadPrefs();
    MODES.forEach(({ key, cls }) => {
      if (prefs[key]) {
        document.documentElement.classList.add(cls);
      }
    });
    if (prefs.fontSize) {
      document.documentElement.style.fontSize = prefs.fontSize + 'px';
    }
  }

  // ---- Toggle de modo ----
  function toggleMode(key) {
    const mode   = MODES.find(m => m.key === key);
    if (!mode) return;
    const html   = document.documentElement;
    const prefs  = loadPrefs();

    // Si es modo daltónico, desactivar los demás primero
    if (DALTONISM_MODES.includes(key)) {
      DALTONISM_MODES.forEach(dk => {
        const dm = MODES.find(m => m.key === dk);
        if (dm && dk !== key) {
          html.classList.remove(dm.cls);
          delete prefs[dk];
        }
      });
    }

    const active = html.classList.toggle(mode.cls);
    prefs[key]   = active;
    savePrefs(prefs);
    return active;
  }

  // ---- Inyectar filtros SVG daltónicos en el DOM ----
  function injectSVGFilters() {
    if (document.getElementById('a11y-svg-filters')) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'a11y-svg-filters');
    svg.setAttribute('class', 'a11y-svg-filters');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `
      <!-- Deuteranopia: déficit de cono verde -->
      <filter id="deuteranopia-filter">
        <feColorMatrix type="matrix" values="
          0.367 0.861 -0.228 0 0
          0.280 0.673  0.047 0 0
         -0.012 0.043  0.969 0 0
          0     0      0     1 0"/>
      </filter>

      <!-- Protanopia: sin cono rojo -->
      <filter id="protanopia-filter">
        <feColorMatrix type="matrix" values="
          0.152 1.053 -0.205 0 0
          0.115 0.786  0.099 0 0
         -0.004 -0.048 1.052 0 0
          0      0     0     1 0"/>
      </filter>

      <!-- Tritanopia: sin cono azul -->
      <filter id="tritanopia-filter">
        <feColorMatrix type="matrix" values="
          1.256 -0.077 -0.179 0 0
         -0.078  0.931  0.148 0 0
          0.005  0.691  0.304 0 0
          0      0      0     1 0"/>
      </filter>
    `;
    document.body.appendChild(svg);
  }

  // ---- Construir el panel HTML ----
  function buildPanel() {
    const prefs = loadPrefs();

    const html = `
      <!-- Skip to content (AAA 2.4.1) -->
      <a href="#main-content" class="skip-to-content">Saltar al contenido principal</a>

      <!-- Badge nivel -->
      <div class="a11y-badge" aria-label="Nivel de accesibilidad WCAG AAA">WCAG AAA</div>

      <!-- Botón flotante para abrir el panel -->
      <button
        class="a11y-panel-toggle"
        id="a11yToggle"
        aria-label="Abrir panel de accesibilidad"
        aria-expanded="false"
        aria-controls="a11yPanel"
      >
        <span class="material-symbols-outlined" style="font-size:22px;" aria-hidden="true">accessibility_new</span>
      </button>

      <!-- Panel de accesibilidad -->
      <div
        id="a11yPanel"
        class="a11y-panel"
        role="dialog"
        aria-label="Panel de accesibilidad"
        aria-modal="false"
      >
        <div class="a11y-panel-header">
          <span class="a11y-panel-title">Accesibilidad</span>
          <button class="a11y-panel-close" id="a11yClose" aria-label="Cerrar panel">
            <span class="material-symbols-outlined" style="font-size:18px;" aria-hidden="true">close</span>
          </button>
        </div>

        <!-- SECCIÓN: TEXTO -->
        <div class="a11y-section">
          <span class="a11y-section-label" id="text-opts-label">Tamaño de texto</span>
          <div class="a11y-slider-wrap" role="group" aria-labelledby="text-opts-label">
            <div class="a11y-slider-label">
              <span>A</span>
              <span id="fontSizeDisplay">${prefs.fontSize || 16}px</span>
              <span style="font-size:1.3em;">A</span>
            </div>
            <input
              type="range"
              class="a11y-slider"
              id="fontSizeSlider"
              min="14" max="24" step="1"
              value="${prefs.fontSize || 16}"
              aria-label="Tamaño de fuente en píxeles"
            />
          </div>
        </div>

        <!-- SECCIÓN: LEGIBILIDAD -->
        <div class="a11y-section">
          <span class="a11y-section-label" id="read-opts-label">Legibilidad</span>
          <div class="a11y-options" role="group" aria-labelledby="read-opts-label">
            <button class="a11y-btn ${prefs['dyslexia'] ? 'active' : ''}"
              data-mode="dyslexia"
              aria-pressed="${!!prefs['dyslexia']}"
            >
              <span class="a11y-btn-icon" aria-hidden="true">Aa</span>
              Fuente para dislexia
            </button>
            <button class="a11y-btn ${prefs['large-text'] ? 'active' : ''}"
              data-mode="large-text"
              aria-pressed="${!!prefs['large-text']}"
            >
              <span class="a11y-btn-icon" aria-hidden="true">
                <span class="material-symbols-outlined" style="font-size:16px;">text_increase</span>
              </span>
              Texto grande
            </button>
          </div>
        </div>

        <!-- SECCIÓN: CONTRASTE -->
        <div class="a11y-section">
          <span class="a11y-section-label" id="contrast-opts-label">Contraste y color</span>
          <div class="a11y-options" role="group" aria-labelledby="contrast-opts-label">
            <button class="a11y-btn ${prefs['high-contrast'] ? 'active' : ''}"
              data-mode="high-contrast"
              aria-pressed="${!!prefs['high-contrast']}"
            >
              <span class="a11y-btn-icon" aria-hidden="true">
                <span class="material-symbols-outlined" style="font-size:16px;">contrast</span>
              </span>
              Alto contraste
            </button>
          </div>
        </div>

        <!-- SECCIÓN: VISIÓN DALTÓNICA -->
        <div class="a11y-section">
          <span class="a11y-section-label" id="color-opts-label">Modo daltónico</span>
          <div class="a11y-color-grid" role="group" aria-labelledby="color-opts-label">

            <button class="a11y-color-btn ${prefs['deuteranopia'] ? 'active' : ''}"
              data-mode="deuteranopia"
              aria-pressed="${!!prefs['deuteranopia']}"
              aria-label="Modo Deuteranopía: daltonismo rojo-verde"
            >
              <div class="a11y-swatch" aria-hidden="true">
                <span style="background:#0066cc;"></span>
                <span style="background:#cc6600;"></span>
                <span style="background:#aaaaaa;"></span>
              </div>
              Deuteranopía<br/><small style="opacity:0.6;">Rojo-verde</small>
            </button>

            <button class="a11y-color-btn ${prefs['protanopia'] ? 'active' : ''}"
              data-mode="protanopia"
              aria-pressed="${!!prefs['protanopia']}"
              aria-label="Modo Protanopía: sin percepción del rojo"
            >
              <div class="a11y-swatch" aria-hidden="true">
                <span style="background:#0055aa;"></span>
                <span style="background:#884400;"></span>
                <span style="background:#bbbbbb;"></span>
              </div>
              Protanopía<br/><small style="opacity:0.6;">Sin rojo</small>
            </button>

            <button class="a11y-color-btn ${prefs['tritanopia'] ? 'active' : ''}"
              data-mode="tritanopia"
              aria-pressed="${!!prefs['tritanopia']}"
              aria-label="Modo Tritanopía: daltonismo azul-amarillo"
            >
              <div class="a11y-swatch" aria-hidden="true">
                <span style="background:#008060;"></span>
                <span style="background:#cc0044;"></span>
                <span style="background:#999966;"></span>
              </div>
              Tritanopía<br/><small style="opacity:0.6;">Azul-amarillo</small>
            </button>

            <button class="a11y-color-btn ${prefs['monochrome'] ? 'active' : ''}"
              data-mode="monochrome"
              aria-pressed="${!!prefs['monochrome']}"
              aria-label="Modo monocromático: escala de grises"
            >
              <div class="a11y-swatch" aria-hidden="true">
                <span style="background:#333;"></span>
                <span style="background:#888;"></span>
                <span style="background:#ccc;"></span>
              </div>
              Monocromo<br/><small style="opacity:0.6;">Grises</small>
            </button>

          </div>
        </div>

        <!-- SECCIÓN: MOVIMIENTO Y FOCO -->
        <div class="a11y-section">
          <span class="a11y-section-label" id="motion-opts-label">Movimiento y navegación</span>
          <div class="a11y-options" role="group" aria-labelledby="motion-opts-label">
            <button class="a11y-btn ${prefs['reduce-motion'] ? 'active' : ''}"
              data-mode="reduce-motion"
              aria-pressed="${!!prefs['reduce-motion']}"
            >
              <span class="a11y-btn-icon" aria-hidden="true">
                <span class="material-symbols-outlined" style="font-size:16px;">motion_photos_off</span>
              </span>
              Reducir animaciones
            </button>
            <button class="a11y-btn ${prefs['focus-visible'] ? 'active' : ''}"
              data-mode="focus-visible"
              aria-pressed="${!!prefs['focus-visible']}"
            >
              <span class="a11y-btn-icon" aria-hidden="true">
                <span class="material-symbols-outlined" style="font-size:16px;">highlight_mouse_cursor</span>
              </span>
              Foco de teclado visible
            </button>
          </div>
        </div>

        <!-- RESET -->
        <div class="a11y-section" style="border-bottom:none;">
          <button class="a11y-reset" id="a11yReset" aria-label="Restablecer todas las preferencias de accesibilidad">
            Restablecer todo
          </button>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
  }

  // ---- Vincular eventos ----
  function bindEvents() {
    const toggle = document.getElementById('a11yToggle');
    const panel  = document.getElementById('a11yPanel');
    const close  = document.getElementById('a11yClose');
    const reset  = document.getElementById('a11yReset');
    const slider = document.getElementById('fontSizeSlider');
    const sizeDisplay = document.getElementById('fontSizeDisplay');

    // Abrir/cerrar panel
    toggle?.addEventListener('click', () => {
      const isOpen = panel.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
      if (isOpen) {
        close?.focus();
      }
    });

    close?.addEventListener('click', () => {
      panel.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle?.focus();
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel?.classList.contains('open')) {
        panel.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle?.focus();
      }
    });

    // Botones de modo
    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode   = btn.dataset.mode;
        const active = toggleMode(mode);

        // Actualizar estado visual
        if (DALTONISM_MODES.includes(mode)) {
          // Desactivar todos los daltonismo btns
          DALTONISM_MODES.forEach(dm => {
            const b = document.querySelector(`[data-mode="${dm}"]`);
            if (b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); }
          });
        }

        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active);

        // Anunciar cambio a lectores de pantalla
        announceChange(active
          ? `Modo ${btn.textContent.trim()} activado`
          : `Modo ${btn.textContent.trim()} desactivado`
        );
      });
    });

    // Slider de tamaño de fuente
    slider?.addEventListener('input', () => {
      const size = parseInt(slider.value);
      document.documentElement.style.fontSize = size + 'px';
      if (sizeDisplay) sizeDisplay.textContent = size + 'px';
      const prefs = loadPrefs();
      prefs.fontSize = size;
      savePrefs(prefs);
    });

    // Reset completo
    reset?.addEventListener('click', () => {
      MODES.forEach(({ cls }) => document.documentElement.classList.remove(cls));
      document.documentElement.style.fontSize = '';
      localStorage.removeItem(PREF_KEY);

      // Actualizar UI
      document.querySelectorAll('[data-mode]').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      if (slider) slider.value = 16;
      if (sizeDisplay) sizeDisplay.textContent = '16px';

      announceChange('Preferencias de accesibilidad restablecidas');
    });
  }

  // ---- ARIA live region para anuncios ----
  let liveRegion;

  function announceChange(msg) {
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;';
      document.body.appendChild(liveRegion);
    }
    liveRegion.textContent = '';
    requestAnimationFrame(() => { liveRegion.textContent = msg; });
  }

  // ---- Detectar preferencias del sistema operativo ----
  function detectSystemPrefs() {
    const prefs = loadPrefs();

    // Si ya tiene preferencias guardadas, no sobrescribir
    if (Object.keys(prefs).length > 0) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('a11y-reduce-motion');
    }

    if (window.matchMedia('(prefers-contrast: more)').matches) {
      document.documentElement.classList.add('a11y-high-contrast');
    }
  }

  // ---- INIT ----
  function init() {
    injectSVGFilters();
    applyPrefs();
    detectSystemPrefs();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        buildPanel();
        bindEvents();
      });
    } else {
      buildPanel();
      bindEvents();
    }
  }

  init();
})();
