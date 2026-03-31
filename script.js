/* ============================================================
   PaBa — Pahami Bacaan | script.js
   Supabase data fetching, DOM manipulation & event listeners.

   HOW TO GET STARTED:
   1. Open this file.
   2. Replace 'YOUR_SUPABASE_URL'     → your project URL
      (e.g.  https://xyzabc.supabase.co)
   3. Replace 'YOUR_SUPABASE_ANON_KEY' → your project's anon/public key
      (e.g.  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)
   4. Save the file and open index.html in your browser.
   
   DATABASE SCHEMA EXPECTED:
   Table: materi
   ├── id           (int8)   — Primary key
   ├── judul        (text)   — Article title shown in sidebar
   ├── konten_asli  (text)   — Formal / standard Indonesian text
   └── konten_genz  (text)   — Simplified / colloquial Gen-Z text

   TABLE OF CONTENTS:
   01. Configuration (Supabase credentials)
   02. Application State
   03. DOM References
   04. Supabase Client Initialization
   05. Data Fetching
   06. Render Functions
   07. Event Handlers
   08. UI Helper Functions
   09. Event Listener Registration
   10. App Initialization (Entry Point)
   ============================================================ */

'use strict';


/* ============================================================
   01. CONFIGURATION
   ▶ FILL IN YOUR CREDENTIALS HERE ◀
   ============================================================ */
const SUPABASE_URL      = ' https://xeluoexmhsyuthgnqzuw.supabase.co'

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlbHVvZXhtaHN5dXRoZ25xenV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTcxNjYsImV4cCI6MjA5MDI5MzE2Nn0.vtO9bZopwgEDA5-hfe3sGKHb3g30XLX9LY_uLBMdFFY'; 

const BOOKMARK_STORAGE_KEY = 'paba_bookmarks';

/* ============================================================
   02. APPLICATION STATE
   A single centralized object holds all dynamic state.
   This pattern makes it easy to reason about the app's condition
   at any point in time and avoids scattered global variables.
   ============================================================ */
const state = {
  /** @type {Array<{id: number, judul: string, konten_asli: string, konten_genz: string, kategori?: string, url_meme?: string}>} */
  materials: [],

  /** @type {number|null} ID of the currently displayed material */
  activeMaterialId: null,

  /** @type {'normal'|'genz'} Active language mode */
  mode: 'normal',

  /** @type {'all'|'saved'} Current sidebar tab */
  activeTab: 'all',

  /** @type {'all'|string} Currently selected category filter */
  activeCategory: 'all',

  /** @type {string[]} Available category names from Supabase */
  categories: [],

  /** @type {Set<number>} IDs of bookmarked materi stored locally */
  savedMaterialIds: new Set(),

  /** @type {boolean} Whether the OpenDyslexic font is currently active */
  isDyslexicFont: false,
};


/* ============================================================
   03. DOM REFERENCES
   Cache all element references once at startup.
   Avoids repeated document.getElementById() calls in hot paths.
   ============================================================ */
const DOM = {
  // ── Sidebar ────────────────────────────────────────────────
  sidebarLoading:   document.getElementById('sidebar-loading'),
  sidebarError:     document.getElementById('sidebar-error'),
  sidebarErrorMsg:  document.getElementById('sidebar-error-msg'),
  materialNav:      document.getElementById('material-nav'),
  materiList:       document.getElementById('materi-list'),
  btnRetry:         document.getElementById('btn-retry'),
  searchInput:      document.getElementById('materi-search'),
  categoryFilters:  document.getElementById('category-filters'),

  // ── Main Content ───────────────────────────────────────────
  welcomeState:     document.getElementById('welcome-state'),
  contentView:      document.getElementById('content-view'),
  contentTitle:     document.getElementById('content-title'),
  contentBody:      document.getElementById('content-body'),
  contentMeme:      document.getElementById('content-meme'),
  contentBadge:     document.getElementById('content-mode-badge'),

  // ── Controls ───────────────────────────────────────────────
  btnFontToggle:    document.getElementById('btn-font-toggle'),
  btnModeNormal:    document.getElementById('btn-mode-normal'),
  btnModeGenz:      document.getElementById('btn-mode-genz'),
  btnBookmark:      document.getElementById('btn-bookmark'),
  mainContent:      document.getElementById('main-content'),

  // ── Toast ──────────────────────────────────────────────────
  toast:            document.getElementById('toast'),
};


/* ============================================================
   04. SUPABASE CLIENT INITIALIZATION
   The CDN script (loaded in index.html) exposes the library
   as window.supabase. We call createClient() to get our
   project-specific client instance.
   ============================================================ */

/** @type {import('@supabase/supabase-js').SupabaseClient|null} */
let supabaseClient = null;

/**
 * Initializes the Supabase client.
 * Validates that credentials have been filled in and that the
 * Supabase SDK is available on the page.
 *
 * @returns {boolean} true if initialization succeeded, false otherwise.
 */
function initSupabase() {
  // Guard: SDK must be loaded from CDN
  if (typeof window.supabase === 'undefined') {
    console.error('[PaBa] Supabase SDK not found on window. Check the CDN <script> tag in index.html.');
    showSidebarState('error', 'Library Supabase gagal dimuat. Periksa koneksi internet Anda.');
    return false;
  }

  // Guard: developer must fill in credentials
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
    console.warn('[PaBa] Supabase credentials not set. Please edit the CONFIG section in script.js.');
    showSidebarState('error', 'Konfigurasi Supabase belum diisi. Masukkan URL dan Anon Key di script.js.');
    return false;
  }

  // Create the client — exposes .from(), .auth, etc.
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return true;
}


/* ============================================================
   05. DATA FETCHING
   ============================================================ */

/**
 * Fetches all rows from the `materi` table ordered by id.
 * Updates state.materials and renders the sidebar list.
 * Handles loading, success, empty, and error states.
 *
 * @returns {Promise<void>}
 */
async function fetchMaterials() {
  // Show spinner while request is in flight
  showSidebarState('loading');

  try {
    const { data, error } = await supabaseClient
      .from('materi')
      .select('id, judul, konten_asli, konten_genz, kategori, url_meme')
      .order('id', { ascending: true });

    // Supabase returns errors as JS objects, not thrown exceptions
    if (error) throw new Error(error.message);

    if (!data || data.length === 0) {
      showSidebarState('empty');
      return;
    }

    // Persist to state
    state.materials = data;

    // Render the initial sidebar list according to the current tab and search query.
    filterMaterials(DOM.searchInput?.value || '');

    await fetchCategories();

  } catch (err) {
    console.error('[PaBa] Failed to fetch materials:', err.message);
    showSidebarState('error', `Gagal memuat materi: ${err.message}`);
  }
}


/* ============================================================
   06. RENDER FUNCTIONS
   ============================================================ */

/**
 * Creates and appends a <button> for each material into the
 * sidebar <ul>. Each button stores its material id in a data
 * attribute so the click handler can look it up in state.
 *
 * @param {Array<{id: number, judul: string}>} materials
 */
function renderMaterialList(materials) {
  // Clear any previous items (e.g., on retry)
  DOM.materiList.innerHTML = '';

  const fragment = document.createDocumentFragment(); // Batch DOM writes

  materials.forEach((item) => {
    const li = document.createElement('li');

    const btn = document.createElement('button');
    const isBookmarked = isMaterialBookmarked(item.id);

    btn.className = 'materi-item';
    btn.type = 'button';
    btn.dataset.id = String(item.id);

    if (isBookmarked) {
      const icon = document.createElement('span');
      icon.className = 'materi-item__bookmark-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = '★';
      btn.appendChild(icon);
    }

    btn.appendChild(document.createTextNode(item.judul));

    const isActive = item.id === state.activeMaterialId;
    btn.classList.toggle('materi-item--active', isActive);
    btn.setAttribute('aria-current', isActive ? 'page' : 'false');

    // Descriptive label for screen readers
    btn.setAttribute('aria-label', `Baca materi: ${item.judul}`);

    btn.addEventListener('click', () => handleMaterialSelect(item.id));

    li.appendChild(btn);
    fragment.appendChild(li);
  });

  DOM.materiList.appendChild(fragment);
}

function loadSavedMaterialsFromStorage() {
  try {
    const stored = localStorage.getItem(BOOKMARK_STORAGE_KEY);
    if (!stored) return;

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return;

    state.savedMaterialIds = new Set(parsed
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id)));
  } catch (err) {
    console.warn('[PaBa] Gagal memuat bookmark dari localStorage:', err);
  }
}

function persistSavedMaterialsToStorage() {
  localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify([...state.savedMaterialIds]));
}

function isMaterialBookmarked(materialId) {
  return state.savedMaterialIds.has(materialId);
}

function updateBookmarkButton() {
  if (!DOM.btnBookmark) return;

  const isSaved = state.activeMaterialId !== null && isMaterialBookmarked(state.activeMaterialId);

  DOM.btnBookmark.classList.toggle('bookmark-btn--active', isSaved);
  DOM.btnBookmark.setAttribute('aria-pressed', String(isSaved));
  DOM.btnBookmark.textContent = isSaved ? '★ Disimpan' : '☆ Simpan';
  DOM.btnBookmark.setAttribute('aria-label', isSaved ? 'Hapus materi dari bookmark' : 'Simpan materi ini');
}

function getSidebarMaterials(query) {
  const normalizedQuery = normalizeSearchText(query);

  return state.materials.filter((item) => {
    if (state.activeTab === 'saved' && !isMaterialBookmarked(item.id)) {
      return false;
    }

    if (state.activeCategory !== 'all') {
      const itemCategory = String(item.kategori || '').trim();
      if (itemCategory !== state.activeCategory) return false;
    }

    if (normalizedQuery === '') {
      return true;
    }

    return normalizeSearchText(item.judul).includes(normalizedQuery);
  });
}

function renderCategoryFilters(categories) {
  if (!DOM.categoryFilters) return;

  DOM.categoryFilters.innerHTML = '';
  const fragment = document.createDocumentFragment();

  const createButton = (value, label) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'category-pill';
    button.textContent = label;
    button.dataset.category = value;
    button.setAttribute('aria-pressed', String(state.activeCategory === value));
    button.addEventListener('click', () => handleCategorySelect(value));
    if (state.activeCategory === value) {
      button.classList.add('category-pill--active');
    }
    return button;
  };

  fragment.appendChild(createButton('all', 'Semua'));
  categories.forEach((category) => {
    fragment.appendChild(createButton(category, category));
  });

  DOM.categoryFilters.appendChild(fragment);
}

function handleCategorySelect(category) {
  if (state.activeCategory === category) return;

  state.activeCategory = category;
  renderCategoryFilters(state.categories);
  filterMaterials(DOM.searchInput?.value || '');
}

async function fetchCategories() {
  if (!supabaseClient) return;

  try {
    const { data, error } = await supabaseClient
      .from('materi')
      .select('kategori');

    if (error) throw new Error(error.message);

    const categories = [...new Set(
      (data || [])
        .map((item) => String(item.kategori || '').trim())
        .filter((kategori) => kategori.length > 0)
    )].sort((a, b) => a.localeCompare(b, 'id', { sensitivity: 'base' }));

    state.categories = categories;
    renderCategoryFilters(categories);
  } catch (err) {
    console.error('[PaBa] Failed to fetch categories:', err.message);
  }
}

function renderNoSavedMaterials() {
  DOM.materiList.innerHTML = `
    <li style="padding: var(--sp-lg); text-align: center;">
      <p style="color: var(--c-text-muted); font-size: var(--fs-sm);">
        Belum ada materi disimpan.
      </p>
    </li>`;
}

function handleTabSwitch(newTab) {
  if (state.activeTab === newTab) return;

  state.activeTab = newTab;

  DOM.tabAll?.classList.toggle('sidebar-tab--active', newTab === 'all');
  DOM.tabSaved?.classList.toggle('sidebar-tab--active', newTab === 'saved');
  DOM.tabAll?.setAttribute('aria-selected', String(newTab === 'all'));
  DOM.tabSaved?.setAttribute('aria-selected', String(newTab === 'saved'));

  filterMaterials(DOM.searchInput?.value || '');
}

/**
 * Normalizes incoming search text for consistent filtering.
 * Trims whitespace and converts to lower case.
 *
 * @param {string} value
 * @returns {string}
 */
function normalizeSearchText(value) {
  return String(value || '').trim().toLowerCase();
}

/**
 * Displays the "no results found" message in the sidebar list.
 */
function renderNoResults() {
  DOM.materiList.innerHTML = `
    <li style="padding: var(--sp-lg); text-align: center;">
      <p style="color: var(--c-text-muted); font-size: var(--fs-sm);">
        Materi tidak ditemukan.
      </p>
    </li>`;
}

/**
 * Filters the locally cached material titles based on the current
 * search query and re-renders the sidebar list.
 *
 * @param {string} query
 */
function filterMaterials(query) {
  const materials = getSidebarMaterials(query);

  if (materials.length === 0) {
    if (state.activeTab === 'saved' && state.savedMaterialIds.size === 0) {
      renderNoSavedMaterials();
      showSidebarState('list');
      return;
    }

    renderNoResults();
    showSidebarState('list');
    return;
  }

  renderMaterialList(materials);
  showSidebarState('list');
}

/**
 * Renders a material's content in the main reading area.
 * Respects the current language mode (state.mode).
 * Called both when selecting a new material AND when the mode changes.
 *
 * @param {{id: number, judul: string, konten_asli: string, konten_genz: string, url_meme?: string}} material
 */
function renderContent(material) {
  // Pick the correct content variant based on active mode
  const isGenzMode = state.mode === 'genz';
  const rawContent = isGenzMode
    ? (material.konten_genz || material.konten_asli) // Graceful fallback if genz is null/empty
    : material.konten_asli;

  // Set the article title
  DOM.contentTitle.textContent = material.judul;

  // Render the body text as accessible <p> elements
  DOM.contentBody.innerHTML = formatContentAsParagraphs(rawContent);

  // Sync the mode badge label
  syncModeBadge();

  // Transition: hide welcome, show content
  DOM.welcomeState.setAttribute('hidden', '');
  DOM.contentView.removeAttribute('hidden');

  // Force a CSS animation replay by briefly removing & re-adding the element.
  // This provides visual feedback that content has changed on mode switch.
  DOM.contentView.style.animation = 'none';
  // Use requestAnimationFrame to ensure the browser sees the reset before re-applying
  requestAnimationFrame(() => {
    DOM.contentView.style.animation = '';
  });

  updateBookmarkButton();

  // Move focus to the main landmark so keyboard users know content changed
  // Without this, focus stays on the sidebar button — confusing for screen reader users
  document.getElementById('main-content').focus();
}

/**
 * Converts a plain-text string into an HTML string of <p> elements.
 * Splits on double newlines (paragraph breaks) or single newlines.
 * Escapes all HTML to prevent XSS.
 *
 * @param {string|null} text - Raw text from the database
 * @returns {string} Safe HTML string
 */
function formatContentAsParagraphs(text) {
  if (!text || text.trim() === '') {
    return '<p><em>Konten belum tersedia untuk materi ini.</em></p>';
  }

  return text
    .split(/\n\n|\n/)          // Split on paragraph or line breaks
    .map(line => line.trim())  // Remove surrounding whitespace
    .filter(line => line.length > 0) // Drop blank lines
    .map(line => `<p>${escapeHtml(line)}</p>`) // Wrap each in a paragraph
    .join('');
}

/**
 * Displays a selected material including its content and meme.
 * Preserves the existing render flow while adding support for
 * optional `url_meme` or `gambar` fields on the material object.
 *
 * @param {{id: number, judul: string, konten_asli: string, konten_genz: string, url_meme?: string, gambar?: string}} material
 */
function displayMateri(material) {
  renderContent(material);
  renderMeme(material);
}

/**
 * Renders a supporting meme image below the main article content.
 * If the material does not include an image URL, it shows a small
 * placeholder card instead.
 *
 * @param {{judul: string, url_meme?: string, gambar?: string}} material
 */
function renderMeme(material) {
  if (!DOM.contentMeme) return;

  const memeUrl = String(material.url_meme || material.gambar || '').trim();
  DOM.contentMeme.innerHTML = '';

  if (!memeUrl) {
    DOM.contentMeme.innerHTML = '';
    return;
  }

  const img = document.createElement('img');
  img.src = memeUrl;
  img.alt = material.judul
    ? `Meme pendukung untuk materi “${material.judul}”`
    : 'Meme pendukung';
  img.className = 'meme-img';
  img.addEventListener('error', () => {
    DOM.contentMeme.innerHTML = '';
  });

  DOM.contentMeme.appendChild(img);
}

/**
 * Safely escapes a string for insertion as HTML text content.
 * Prevents XSS by converting &, <, >, " and ' to HTML entities.
 *
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  const el = document.createElement('div');
  el.textContent = text;
  return el.innerHTML;
}

/**
 * Updates the mode badge text, CSS class, and ARIA label to
 * accurately reflect state.mode.
 */
function syncModeBadge() {
  const isGenz = state.mode === 'genz';

  DOM.contentBadge.textContent  = isGenz ? 'Mode Gen-Z ✨' : 'Mode Normal';
  DOM.contentBadge.className    = `mode-badge mode-badge--${isGenz ? 'genz' : 'normal'}`;
  DOM.contentBadge.setAttribute('aria-label', `Mode saat ini: ${isGenz ? 'Gen-Z' : 'Normal'}`);
}


/* ============================================================
   07. EVENT HANDLERS
   ============================================================ */

/**
 * Handles clicking a material title in the sidebar.
 * Updates active styling, state, and re-renders content.
 *
 * @param {number} id - The material's database id
 */
function handleMaterialSelect(id) {
  const material = state.materials.find(m => m.id === id);
  if (!material) {
    console.warn(`[PaBa] Material with id ${id} not found in state.`);
    return;
  }

  // Update state
  state.activeMaterialId = id;

  // Update sidebar button states
  DOM.materiList.querySelectorAll('.materi-item').forEach((btn) => {
    const isActive = Number(btn.dataset.id) === id;
    btn.classList.toggle('materi-item--active', isActive);
    // aria-current="page" is the correct value for "currently selected item"
    btn.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  // Render the content in the main area
  displayMateri(material);
}

/**
 * Toggles OpenDyslexic font mode on/off.
 * Reflects the state in the button's aria-pressed attribute,
 * its label, and a CSS class on <body>.
 */
function handleFontToggle() {
  state.isDyslexicFont = !state.isDyslexicFont;

  // body.dyslexic-mode triggers the CSS font overrides in style.css
  document.body.classList.toggle('dyslexic-mode', state.isDyslexicFont);

  // Sync the button's ARIA pressed state
  DOM.btnFontToggle.setAttribute('aria-pressed', String(state.isDyslexicFont));

  // Update the accessible label to describe the CURRENT state (what will happen on next click)
  DOM.btnFontToggle.setAttribute(
    'aria-label',
    state.isDyslexicFont
      ? 'Font OpenDyslexic aktif. Klik untuk kembali ke font normal.'
      : 'Aktifkan font OpenDyslexic untuk kemudahan membaca'
  );

  // Non-intrusive feedback via toast
  showToast(
    state.isDyslexicFont
      ? '🔤 Font Disleksia Diaktifkan'
      : '🔤 Font Normal Diaktifkan'
  );
}

/**
 * Switches between language modes ('normal' or 'genz').
 * Updates button states and re-renders content if a material is open.
 *
 * @param {'normal'|'genz'} newMode
 */
function handleModeSwitch(newMode) {
  // No-op if already in this mode
  if (state.mode === newMode) return;

  state.mode = newMode;

  // ── Update language toggle button states ──────────────────
  const isGenz = newMode === 'genz';

  DOM.btnModeNormal.classList.toggle('lang-btn--active', !isGenz);
  DOM.btnModeGenz.classList.toggle('lang-btn--active',   isGenz);

  // aria-pressed reflects the currently active / "pressed" button
  DOM.btnModeNormal.setAttribute('aria-pressed', String(!isGenz));
  DOM.btnModeGenz.setAttribute('aria-pressed',   String(isGenz));

  // ── Re-render content in new mode (if something is open) ──
  if (state.activeMaterialId !== null) {
    const material = state.materials.find(m => m.id === state.activeMaterialId);
    if (material) renderContent(material);
  }

  // Feedback
  showToast(
    isGenz
      ? '✨ Mode Gen-Z Aktif — Bahasa lebih santai!'
      : '📖 Mode Normal Aktif'
  );
}


/* ============================================================
   08. UI HELPER FUNCTIONS
   ============================================================ */

/**
 * Controls which sidebar state panel is visible.
 * Only one panel (loading / error / list) is shown at a time.
 *
 * @param {'loading'|'error'|'list'|'empty'} stateName
 * @param {string} [errorMessage] - Custom error message (only used for 'error' state)
 */
function showSidebarState(stateName, errorMessage) {
  // Hide all states first, then show the requested one
  DOM.sidebarLoading.hidden = stateName !== 'loading';
  DOM.sidebarError.hidden   = stateName !== 'error';
  DOM.materialNav.hidden    = stateName !== 'list' && stateName !== 'empty';

  // Update ARIA busy on the loading indicator
  DOM.sidebarLoading.setAttribute('aria-busy', String(stateName === 'loading'));

  // Update error message text if provided
  if (stateName === 'error' && errorMessage) {
    DOM.sidebarErrorMsg.textContent = errorMessage;
  }

  // 'empty' reuses the list container but shows an informational message
  if (stateName === 'empty') {
    DOM.materialNav.hidden = false;
    DOM.materiList.innerHTML = `
      <li style="padding: var(--sp-lg); text-align: center;">
        <p style="color: var(--c-text-muted); font-size: var(--fs-sm);">
          Belum ada materi tersedia.
        </p>
      </li>
    `;
  }
}

/**
 * Shows a brief, accessible toast notification.
 * Uses a CSS class to trigger the slide-up animation defined in style.css.
 * Auto-dismisses after `duration` ms.
 *
 * @param {string}  message  - Text to display
 * @param {number}  [duration=2800] - Duration in milliseconds before auto-hide
 */
let _toastTimeout; // Module-scoped to allow clearing on rapid successive calls

function showToast(message, duration = 2800) {
  // Clear any currently scheduled dismissal
  clearTimeout(_toastTimeout);

  DOM.toast.textContent = message;
  DOM.toast.classList.add('toast--visible');

  _toastTimeout = setTimeout(() => {
    DOM.toast.classList.remove('toast--visible');
  }, duration);
}


/* ============================================================
   09. EVENT LISTENER REGISTRATION
   All listeners attached in one place for clarity.
   ============================================================ */
function registerEventListeners() {
  // ── Accessibility Controls ─────────────────────────────────
  DOM.btnFontToggle.addEventListener('click', handleFontToggle);

  // Language mode buttons
  DOM.btnModeNormal.addEventListener('click', () => handleModeSwitch('normal'));
  DOM.btnModeGenz.addEventListener('click',   () => handleModeSwitch('genz'));

  // Retry button in the error state
  DOM.btnRetry.addEventListener('click', fetchMaterials);

  // Search filter input
  DOM.searchInput?.addEventListener('input', (event) => {
    filterMaterials(event.target.value);
  });

  // Bookmark button inside detail view via event delegation on #main-content
  DOM.mainContent?.addEventListener('click', (event) => {
    const clickedBookmark = event.target instanceof HTMLElement
      ? event.target.closest('.bookmark-btn')
      : null;

    if (!clickedBookmark) return;
    if (state.activeMaterialId === null) return;

    if (isMaterialBookmarked(state.activeMaterialId)) {
      state.savedMaterialIds.delete(state.activeMaterialId);
      showToast('Bookmark dihapus.');
    } else {
      state.savedMaterialIds.add(state.activeMaterialId);
      showToast('★ Materi disimpan.');
    }

    persistSavedMaterialsToStorage();
    updateBookmarkButton();
    filterMaterials(DOM.searchInput?.value || '');
  });

  DOM.tabAll?.addEventListener('click', () => handleTabSwitch('all'));
  DOM.tabSaved?.addEventListener('click', () => handleTabSwitch('saved'));

  // ── Keyboard: support arrow keys inside the language toggle ─
  // This makes the segmented control behave like a proper radiogroup
  // for keyboard users (Left/Right arrows to switch options).
  const langSwitch = document.querySelector('.lang-toggle-switch');
  if (langSwitch) {
    langSwitch.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleModeSwitch('genz');
        DOM.btnModeGenz.focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleModeSwitch('normal');
        DOM.btnModeNormal.focus();
      }
    });
  }
}


/* ============================================================
   10. APP INITIALIZATION — ENTRY POINT
   Called once when the DOM is fully parsed.
   Sequence: init Supabase → register listeners → fetch data
   ============================================================ */
async function initApp() {
  console.log('[PaBa] Initializing application...');

  // Step 0: Load saved bookmark state from localStorage.
  loadSavedMaterialsFromStorage();

  // Step 1: Initialize the Supabase client.
  //         If this fails (missing credentials, CDN error), it shows
  //         an error in the sidebar and we stop here.
  const supabaseReady = initSupabase();
  if (!supabaseReady) {
    console.warn('[PaBa] Initialization stopped due to Supabase config error.');
    return;
  }

  // Step 2: Attach all event listeners.
  registerEventListeners();

  // Step 3: Fetch materials from Supabase and render the sidebar.
  await fetchMaterials();

  console.log('[PaBa] Initialization complete.');
}

// DOMContentLoaded fires after HTML is fully parsed but before
// images/stylesheets are loaded — the right time to run our app.
document.addEventListener('DOMContentLoaded', initApp);
