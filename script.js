/* ============================================================
   PaBa — Pahami Bacaan | script.js
   Supabase data fetching, DOM manipulation & event listeners.

   SUPABASE CONFIGURATION:
   Set credentials for a new project in supabase.js; see docs/guides/SUPABASE_SETUP.md.

   DATABASE SCHEMA EXPECTED:
   Table: materi
   ├── id           (uuid)   — Primary key
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
   IMPORTS — Module Functions
   ============================================================ */
import { supabase } from './supabase.js';
import { checkUserStatus, onAuthStateChange, signOut } from './auth.js';
import {
  toggleBookmark as toggleBookmarkDb,
  isBookmarked,
  getUserBookmarks,
} from './bookmarks.js';
import { fallbackMaterials } from './data/materials.js';


/* ============================================================
   01. CONFIGURATION
   Supabase credentials are configured in supabase.js.
   ============================================================ */

// Note: localStorage bookmarks deprecated - now using Supabase database

/* ============================================================
   02. APPLICATION STATE
   A single centralized object holds all dynamic state.
   This pattern makes it easy to reason about the app's condition
   at any point in time and avoids scattered global variables.
   ============================================================ */
const state = {
  /** @type {Array<{id: string, judul: string, konten_asli: string, konten_genz?: string, konten_sederhana?: string, kategori?: string, url_meme?: string}>} */
  materials: [],

  /** @type {string|null} ID of the currently displayed material */
  activeMaterialId: null,

  /** @type {'normal'|'genz'} Active language mode */
  mode: 'normal',

  /** @type {'all'|'saved'} Current sidebar tab */
  activeTab: 'all',

  /** @type {'all'|string} Currently selected category filter */
  activeCategory: 'all',

  /** @type {string[]} Available category names from Supabase */
  categories: [],

  /** @type {Set<string>} IDs of the current user's database bookmarks */
  savedMaterialIds: new Set(),

  /** @type {Array<Record<string, any>>} Bookmarked materi loaded from Supabase */
  savedBookmarks: [],

  /** @type {boolean} Whether the OpenDyslexic font is currently active */
  isDyslexicFont: false,

  /** @type {{fontSize: number, lineHeight: string, letterSpacing: number}} */
  readingSettings: {
    fontSize: 18,
    lineHeight: '1.9',
    letterSpacing: 0.01,
  },

  /** @type {boolean} Whether reading focus mode is currently active */
  isFocusMode: false,

  /** @type {boolean} Whether user is authenticated */
  isLoggedIn: false,

  /** @type {string|null} Current user's Supabase ID */
  userId: null,

  /** @type {string|null} Current user's email */
  userEmail: null,
};

const READING_PREFERENCES_KEY = 'paba_reading_preferences_v1';
const ALLOWED_LINE_HEIGHTS = new Set(['1.6', '1.9', '2.2']);


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
  contentModeStatus: document.getElementById('content-mode-status'),

  // ── Controls ───────────────────────────────────────────────
  btnFontToggle:    document.getElementById('btn-font-toggle'),
  btnFocusToggle:   document.getElementById('btn-focus-toggle'),
  readingFontSize:  document.getElementById('reading-font-size'),
  readingFontSizeValue: document.getElementById('reading-font-size-value'),
  readingLineHeight: document.getElementById('reading-line-height'),
  readingLetterSpacing: document.getElementById('reading-letter-spacing'),
  readingLetterSpacingValue: document.getElementById('reading-letter-spacing-value'),
  btnReadingSettingsReset: document.getElementById('btn-reading-settings-reset'),
  btnModeNormal:    document.getElementById('btn-mode-normal'),
  btnModeGenz:      document.getElementById('btn-mode-genz'),
  btnBookmark:      document.getElementById('btn-bookmark'),
  mainContent:      document.getElementById('main-content'),

  // ── User Auth ─────────────────────────────────────────────
  btnLogin:         document.getElementById('btn-login'),
  btnLogout:        document.getElementById('btn-logout'),
  userEmailDisplay: document.getElementById('user-email-display'),

  // ── Tabs ────────────────────────────────────────────────────
  tabAll:           document.getElementById('tab-all'),
  tabSaved:         document.getElementById('tab-saved'),
  navLibrary:       document.getElementById('nav-library'),
  navReader:        document.getElementById('nav-reader'),
  navSaved:         document.getElementById('nav-saved'),

  // ── Toast ──────────────────────────────────────────────────
  toast:            document.getElementById('toast'),
};


/* ============================================================
   04. SUPABASE CLIENT INITIALIZATION
   The supabase.js module already creates and exports the client.
   We just need to set our local reference to it.
   ============================================================ */

/** @type {import('@supabase/supabase-js').SupabaseClient|null} */
let supabaseClient = null;
let authStateSubscription = null;

/**
 * Initializes the Supabase client reference.
 * Uses the pre-initialized client from supabase.js module.
 *
 * @returns {boolean} true if initialization succeeded, false otherwise.
 */
function initSupabase() {
  // supabase is already imported and initialized from supabase.js
  // Just set our local reference
  supabaseClient = supabase;
  
  if (!supabaseClient) {
    console.warn('[PaBa] Supabase belum dikonfigurasi.');
    return false;
  }

  console.log('[PaBa] ✅ Supabase client siap digunakan');
  return true;
}

function createIcon(name) {
  const paths = {
    bookmark: '<path d="M6 3h12v18l-6-3.5L6 21V3Z"/>',
    bookmarkFilled: '<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z"/>',
  };
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');
  icon.classList.add('ui-icon');
  if (name === 'bookmark') icon.classList.add('ui-icon--outline');
  icon.innerHTML = paths[name];
  return icon;
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
  showSidebarState('loading');

  try {
    if (!supabaseClient) {
      renderMaterialCatalog(
        fallbackMaterials,
        'Supabase belum dikonfigurasi. Menampilkan materi lokal.'
      );
      return;
    }

    const { data, error } = await supabaseClient
      .from('materi')
      .select('id, judul, konten_asli, konten_genz, kategori, url_meme, created_at')
      .order('id', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      renderMaterialCatalog([], 'Supabase terhubung, tetapi tabel public.materi belum berisi materi.');
      return;
    }

    const materials = data.map((material) => ({
      ...material,
      id: normalizeMaterialId(material.id),
      konten_sederhana: material.konten_genz || '',
    }));

    renderMaterialCatalog(materials);
  } catch (err) {
    console.error('[PaBa] Gagal mengambil materi Supabase:', err);
    renderMaterialCatalog(
      fallbackMaterials,
      `Gagal memuat materi Supabase (${err.message || 'kesalahan koneksi'}). Menampilkan ${fallbackMaterials.length} materi lokal sebagai fallback.`
    );
  }
}

function normalizeMaterialId(id) {
  return id === null || id === undefined ? '' : String(id);
}

function renderMaterialCatalog(materials, notice = '') {
  state.materials = materials.map((material) => ({
    ...material,
    id: normalizeMaterialId(material.id),
  }));
  state.categories = [...new Set(
    state.materials
      .map((material) => String(material.kategori || '').trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'id', { sensitivity: 'base' }));

  renderCategoryFilters(state.categories);
  filterMaterials(DOM.searchInput?.value || '');
  showSidebarState('list');

  if (notice) {
    DOM.sidebarErrorMsg.textContent = notice;
    DOM.sidebarError.hidden = false;
  }
}


/* ============================================================
   05.5 AUTHENTICATION MANAGEMENT
   Handle user login status, display auth UI, logout.
   ============================================================ */

/**
 * Initialize authentication UI on page load.
 * This is the entry point for auth-related setup.
 * Calls checkUserLoginStatus() and sets up event listeners.
 *
 * @returns {Promise<void>}
 */
async function initializeAuthUI() {
  console.log('[PaBa] 🔐 Initializing authentication UI...');

  try {
    // Check current user session
    await checkUserLoginStatus();

    // Setup logout button handler
    if (DOM.btnLogout && !DOM.btnLogout.hasListener) {
      DOM.btnLogout.addEventListener('click', handleLogout);
      DOM.btnLogout.hasListener = true;
      console.log('[PaBa] ✅ Logout button listener attached');
    }

    // Setup login button handler - redirect to login.html
    if (DOM.btnLogin && !DOM.btnLogin.hasListener) {
      DOM.btnLogin.addEventListener('click', () => {
        console.log('[PaBa] 🔑 Redirecting to login...');
        window.location.href = 'login.html';
      });
      DOM.btnLogin.hasListener = true;
      console.log('[PaBa] ✅ Login button listener attached');
    }

    console.log('[PaBa] ✅ Auth UI initialization complete');
  } catch (error) {
    console.error('[PaBa] ❌ Error initializing auth UI:', error);
  }
}

/**
 * Check user login status and update UI accordingly.
 * Calls checkUserStatus() from auth.js.
 * Updates state.isLoggedIn and state.userEmail.
 * Shows/hides login/logout buttons based on auth status.
 *
 * @returns {Promise<void>}
 */
async function checkUserLoginStatus() {
  try {
    const { isLoggedIn, user } = await checkUserStatus();

    const nextUserId = isLoggedIn ? user?.id || null : null;
    if (state.userId !== nextUserId) {
      state.savedMaterialIds.clear();
      state.savedBookmarks = [];
    }
    state.isLoggedIn = isLoggedIn;
    state.userId = nextUserId;
    state.userEmail = user?.email || null;

    updateUIForAuthStatus();
  } catch (error) {
    console.error('[PaBa] ❌ Error checking user status:', error);
    state.isLoggedIn = false;
    state.userId = null;
    state.userEmail = null;
    state.savedMaterialIds.clear();
    state.savedBookmarks = [];
    updateUIForAuthStatus();
  }
}

function setupAuthStateListener() {
  if (!supabaseClient || authStateSubscription) return;

  authStateSubscription = onAuthStateChange((event, session) => {
    if (!['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
      return;
    }

    const nextUserId = session?.user?.id || null;
    const userChanged = state.userId !== nextUserId;
    const showingSavedMaterials = Boolean(
      DOM.mainContent.querySelector('#saved-materials-section')
    );
    state.isLoggedIn = Boolean(session?.user);
    state.userId = nextUserId;
    state.userEmail = session?.user?.email || null;

    if (!state.isLoggedIn || userChanged) {
      state.savedMaterialIds.clear();
      state.savedBookmarks = [];
      DOM.mainContent.querySelector('#saved-materials-section')?.remove();
    }

    if (!state.isLoggedIn && state.activeTab === 'saved') {
      handleTabSwitch('all');
      showAllMaterials();
    }

    updateUIForAuthStatus();
    updateBookmarkButton();
    filterMaterials(DOM.searchInput?.value || '');

    if (state.isLoggedIn && (event === 'SIGNED_IN' || userChanged)) {
      const userId = nextUserId;
      window.setTimeout(async () => {
        await loadSavedMaterialsFromDatabase();
        if (state.userId === userId) {
          updateBookmarkButton();
          filterMaterials(DOM.searchInput?.value || '');
          if (showingSavedMaterials && state.activeTab === 'saved') {
            await renderBookmarks();
          }
        }
      }, 0);
    }
  });
}

/**
 * Update UI to reflect current authentication status.
 * Show Login button if not authenticated.
 * Show Logout button + email if authenticated.
 *
 * @returns {void}
 */
function updateUIForAuthStatus() {
  if (!DOM.btnLogin || !DOM.btnLogout || !DOM.userEmailDisplay) {
    console.warn('[PaBa] ⚠️  Auth UI elements not found in DOM');
    console.warn('     btnLogin:', !!DOM.btnLogin);
    console.warn('     btnLogout:', !!DOM.btnLogout);
    console.warn('     userEmailDisplay:', !!DOM.userEmailDisplay);
    return;
  }

  if (state.isLoggedIn) {
    // User is logged in: show logout + email, hide login
    DOM.btnLogin.hidden = true;
    DOM.btnLogout.hidden = false;
    DOM.userEmailDisplay.hidden = false;
    DOM.userEmailDisplay.textContent = state.userEmail || 'User';

    console.log('[PaBa] Auth UI updated: authenticated.');
  } else {
    // User is not logged in: show login, hide logout + email
    DOM.btnLogin.hidden = false;
    DOM.btnLogout.hidden = true;
    DOM.userEmailDisplay.hidden = true;
    DOM.userEmailDisplay.textContent = '';

    console.log('[PaBa] 🔑 Updated UI: Showing login button');
  }
}

/**
 * Handle logout action.
 * Calls signOut() from auth.js which redirects to login.html.
 *
 * @returns {Promise<void>}
 */
async function handleLogout() {
  console.log('[PaBa] 👋 Logout action triggered...');

  if (!confirm('Yakin ingin keluar dari akun?')) {
    console.log('[PaBa] ℹ️  Logout dibatalkan user');
    return;
  }

  try {
    console.log('[PaBa] 🔄 Calling signOut()...');
    const signedOut = await signOut();
    if (!signedOut) return;
    console.log('[PaBa] ✅ Logout successful');
  } catch (error) {
    console.error('[PaBa] ❌ Logout error:', error);
    alert('Gagal logout. Coba lagi.');
  }
}

/**
 * Ensure user is logged in before performing action.
 * If not logged in, show alert and redirect to login.html.
 * Used before bookmark operations.
 *
 * @returns {Promise<boolean>} true if logged in, false otherwise
 */
async function ensureUserLoggedIn() {
  if (state.isLoggedIn) {
    return true;
  }

  // User not logged in - show friendly alert
  alert(
    'Untuk menyimpan bookmark, silakan login terlebih dahulu.\n\nAnda akan diarahkan ke halaman login.'
  );

  // Redirect to login.html
  console.log('[PaBa] 🔑 Redirecting to login...');
  window.location.href = 'login.html';

  return false;
}


/* ============================================================
   06. RENDER FUNCTIONS
   ============================================================ */

/**
 * Creates and appends a <button> for each material into the
 * sidebar <ul>. Each button stores its material id in a data
 * attribute so the click handler can look it up in state.
 *
 * @param {Array<{id: string, judul: string}>} materials
 */
function renderMaterialList(materials) {
  // Clear any previous items (e.g., on retry)
  DOM.materiList.innerHTML = '';

  const fragment = document.createDocumentFragment(); // Batch DOM writes

  materials.forEach((item) => {
    const li = document.createElement('li');
    const card = document.createElement('article');
    const isBookmarked = isMaterialBookmarked(item.id);
    const category = String(item.kategori || 'Bahan bacaan').trim();
    const content = String(item.konten_asli || item.konten_genz || '')
      .replace(/\s+/g, ' ')
      .trim();
    const excerpt = content.slice(0, 150);

    card.className = 'material-card';
    const categoryLabel = document.createElement('p');
    categoryLabel.className = 'material-card__category';
    categoryLabel.textContent = category;

    const titleButton = document.createElement('button');
    titleButton.className = 'materi-item';
    titleButton.type = 'button';
    titleButton.dataset.id = String(item.id);
    titleButton.textContent = item.judul;
    titleButton.setAttribute('aria-current', item.id === state.activeMaterialId ? 'page' : 'false');
    titleButton.setAttribute('aria-label', `Baca materi: ${item.judul}`);
    titleButton.addEventListener('click', () => handleMaterialSelect(item.id));

    const excerptText = document.createElement('p');
    excerptText.className = 'material-card__excerpt';
    excerptText.textContent = excerpt ? `${excerpt}${content.length > 150 ? '…' : ''}` : 'Buka materi ini untuk mulai membaca.';

    const actions = document.createElement('div');
    actions.className = 'material-card__actions';
    const openButton = document.createElement('button');
    openButton.className = 'material-card__open';
    openButton.type = 'button';
    openButton.textContent = 'Buka bacaan →';
    openButton.setAttribute('aria-label', `Buka bacaan: ${item.judul}`);
    openButton.addEventListener('click', () => handleMaterialSelect(item.id));

    const bookmarkButton = document.createElement('button');
    bookmarkButton.className = 'bookmark-btn material-card__bookmark';
    bookmarkButton.type = 'button';
    bookmarkButton.dataset.materi = JSON.stringify(item);
    bookmarkButton.setAttribute('aria-pressed', String(isBookmarked));
    bookmarkButton.setAttribute('aria-label', isBookmarked ? `Hapus ${item.judul} dari koleksi tersimpan` : `Simpan ${item.judul}`);
    bookmarkButton.appendChild(createIcon(isBookmarked ? 'bookmarkFilled' : 'bookmark'));

    actions.append(openButton, bookmarkButton);
    card.append(categoryLabel, titleButton, excerptText, actions);
    li.appendChild(card);
    fragment.appendChild(li);
  });

  DOM.materiList.appendChild(fragment);
}

/**
 * Load initial bookmark state from database (called on app startup).
 * Note: Due to async nature, actual bookmarks loaded dynamically as needed.
 */
function loadSavedMaterialsFromStorage() {
  // Bookmarks now loaded from database via isBookmarked() and getUserBookmarks()
  // This function kept for backward compatibility / startup logic
  console.log('[PaBa] 📦 Bookmark system ready (using Supabase database)');
}

async function loadSavedMaterialsFromDatabase() {
  if (!state.isLoggedIn) return;

  const requestedUserId = state.userId;
  const bookmarks = await getUserBookmarks();
  if (bookmarks === null) {
    console.error('[PaBa] Bookmark tidak dapat dimuat dari Supabase.');
    return;
  }
  if (requestedUserId !== state.userId) return;

  state.savedBookmarks = bookmarks;
  state.savedMaterialIds = new Set(
    state.savedBookmarks
      .map((bookmark) => normalizeMaterialId(bookmark.material_id))
      .filter(Boolean)
  );
}

/**
 * Persist bookmarks to database.
 * (No longer needed - database handles persistence)
 */
function persistSavedMaterialsToStorage() {
  // Deprecated: all bookmarks now persisted to Supabase database
}

/**
 * Toggle bookmark status: save or unsave material.
 * Now uses Supabase database instead of localStorage.
 * Checks user login status before allowing bookmark operation.
 *
 * @param {Object} material - Material object with id property
 * @returns {Promise<boolean>} true if saved, false if removed, or null if error
 */
async function toggleBookmark(material) {
  const materialId = normalizeMaterialId(material?.id);
  if (!materialId) {
    console.warn('[PaBa] Invalid material object for toggleBookmark');
    return null;
  }

  console.log('[PaBa] 🔄 Toggling bookmark untuk material:', materialId);

  try {
    const result = await toggleBookmarkDb(materialId);

    if (!result.success) {
      console.error('[PaBa] ❌ Bookmark toggle failed:', result.message);
      return null;
    }

    // Update UI state based on result
    if (result.isSaved) {
      state.savedMaterialIds.add(materialId);
      console.log('[PaBa] ✅ Bookmark saved to database');
    } else {
      state.savedMaterialIds.delete(materialId);
      console.log('[PaBa] ✅ Bookmark removed from database');
    }

    return result.isSaved;
  } catch (error) {
    console.error('[PaBa] ❌ Toggle bookmark exception:', error);
    return null;
  }
}

function createSavedMaterialCard(material) {
  const excerpt = String(material.konten_asli || material.konten_genz || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);

  return `
    <article class="saved-card">
      <div class="saved-card__content">
        <h3>${escapeHtml(material.judul)}</h3>
        <p>${escapeHtml(excerpt)}${excerpt.length >= 160 ? '...' : ''}</p>
      </div>
      <button
        type="button"
        class="saved-card__open-btn"
        data-material-id="${escapeHtml(String(material.id))}"
      >
        Buka Materi
      </button>
    </article>
  `;
}

/**
 * Render bookmarks from Supabase database.
 * Fetches user's bookmarks async and displays them with join data from materi table.
 * Async function to fetch from database.
 */
async function renderBookmarks() {
  console.log('[PaBa] 🔄 Loading bookmarks dari database...');

  const savedSectionId = 'saved-materials-section';
  let savedSection = DOM.mainContent.querySelector(`#${savedSectionId}`);
  if (!savedSection) {
    savedSection = document.createElement('section');
    savedSection.id = savedSectionId;
    savedSection.className = 'saved-materials-section';
    DOM.mainContent.appendChild(savedSection);
  }

  DOM.welcomeState?.setAttribute('hidden', '');
  DOM.contentView?.setAttribute('hidden', '');
  DOM.materialNav.hidden = true;
  document.body.classList.remove('reading-view');
  setActiveNavigation(DOM.navSaved);

  if (!supabaseClient) {
    savedSection.innerHTML = `
      <div class="saved-materials-header">
        <button type="button" class="back-to-all-btn">Kembali ke Beranda</button>
      </div>
      <div class="saved-materials-empty">
        <p>Koleksi tersimpan memerlukan konfigurasi Supabase.</p>
      </div>
    `;
    return;
  }

  if (!state.isLoggedIn) {
    savedSection.innerHTML = `
      <div class="saved-materials-header">
        <button type="button" class="back-to-all-btn">Kembali ke Beranda</button>
      </div>
      <div class="saved-materials-empty">
        <p>Login untuk melihat materi yang kamu simpan.</p>
        <a href="login.html">Login</a>
      </div>
    `;
    return;
  }

  try {
    // Fetch bookmarks from database
    const requestedUserId = state.userId;
    const bookmarks = await getUserBookmarks();
    if (requestedUserId !== state.userId || !state.isLoggedIn || !savedSection.isConnected) {
      return;
    }

    if (bookmarks === null) {
      savedSection.innerHTML = `
        <div class="saved-materials-header">
          <button type="button" class="back-to-all-btn">Kembali ke Beranda</button>
        </div>
        <div class="saved-materials-empty">
          <p>Gagal memuat bookmark dari Supabase. Periksa tabel dan relasi bookmark.</p>
        </div>
      `;
      return;
    }

    state.savedBookmarks = bookmarks;
    state.savedMaterialIds = new Set(
      state.savedBookmarks
        .map((item) => normalizeMaterialId(item.material_id))
        .filter(Boolean)
    );

    if (bookmarks.length === 0) {
      console.log('[PaBa] ℹ️  No bookmarks found');
      savedSection.innerHTML = `
        <div class="saved-materials-header">
          <button type="button" class="back-to-all-btn">Kembali ke Beranda</button>
        </div>
        <div class="saved-materials-empty">
          <p>Belum ada materi yang kamu simpan</p>
        </div>
      `;
      return;
    }

    // Update state with bookmark IDs for quick lookup
    console.log('[PaBa] ✅ Loaded', bookmarks.length, 'bookmarks');

    // Transform bookmark objects to material format for card rendering
    const materials = bookmarks.map((bookmark) => ({
      id: bookmark.materi?.id || bookmark.material_id,
      judul: bookmark.materi?.judul || 'Untitled',
      konten_asli: bookmark.materi?.konten_asli || '',
      konten_genz: bookmark.materi?.konten_genz || '',
      konten_sederhana: bookmark.materi?.konten_genz || '',
    }));

    const cards = materials.map(createSavedMaterialCard).join('');

    savedSection.innerHTML = `
      <div class="saved-materials-header">
        <button type="button" class="back-to-all-btn">Kembali ke Beranda</button>
        <h2>Materi yang Disimpan (${bookmarks.length})</h2>
      </div>
      <div class="saved-materials-list">
        ${cards}
      </div>
    `;
  } catch (error) {
    console.error('[PaBa] ❌ Error loading bookmarks:', error);
    savedSection.innerHTML = `
      <div class="saved-materials-header">
        <button type="button" class="back-to-all-btn">Kembali ke Beranda</button>
      </div>
      <div class="saved-materials-empty">
        <p>Gagal memuat bookmark. Coba lagi nanti.</p>
      </div>
    `;
  }
}

function showAllMaterials() {
  const savedSection = DOM.mainContent.querySelector('#saved-materials-section');
  if (savedSection) {
    savedSection.remove();
  }

  DOM.welcomeState?.toggleAttribute('hidden', state.activeMaterialId !== null);
  DOM.contentView?.toggleAttribute('hidden', state.activeMaterialId === null);

  state.activeMaterialId = null;
  DOM.materialNav.hidden = false;
  document.body.classList.remove('reading-view');
  setActiveNavigation(DOM.navLibrary);
  updateBookmarkButton();
  if (DOM.welcomeState) DOM.welcomeState.removeAttribute('hidden');
  if (DOM.contentView) DOM.contentView.setAttribute('hidden', '');
}

/**
 * Check if material is bookmarked.
 * First checks local state cache, then queries database if needed.
 * For real-time accuracy, consider using isBookmarked() from bookmarks.js
 *
 * @param {string|number} materialId - Material ID to check
 * @returns {boolean} true if bookmarked
 */
function isMaterialBookmarked(materialId) {
  // Quick local check first (populated from database)
  return state.savedMaterialIds.has(normalizeMaterialId(materialId));
}

/**
 * Async check bookmark status from database.
 * Use this when you need real-time verification.
 *
 * @param {number} materialId - Material ID to check
 * @returns {Promise<boolean>} true if bookmarked
 */
async function isMaterialBookmarkedAsync(materialId) {
  return await isBookmarked(materialId);
}

function updateBookmarkButton() {
  if (!DOM.btnBookmark) return;

  const isSaved = state.activeMaterialId !== null && isMaterialBookmarked(state.activeMaterialId);

  DOM.btnBookmark.classList.toggle('bookmark-btn--active', isSaved);
  DOM.btnBookmark.setAttribute('aria-pressed', String(isSaved));
  DOM.btnBookmark.replaceChildren(
    createIcon(isSaved ? 'bookmarkFilled' : 'bookmark'),
    document.createTextNode(isSaved ? ' Disimpan' : ' Simpan')
  );
  DOM.btnBookmark.setAttribute('aria-label', isSaved ? 'Hapus bookmark materi ini' : 'Simpan materi ini');
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
  const isGenzMode = state.mode === 'genz';
  const simplifiedContent = String(
    material.konten_sederhana || material.konten_genz || ''
  ).trim();
  const hasGenzContent = simplifiedContent.length > 0;
  const rawContent = isGenzMode && hasGenzContent
    ? simplifiedContent
    : material.konten_asli;

  // Set the article title
  DOM.contentTitle.textContent = material.judul;

  // Attach the current material object to the bookmark button
  if (DOM.btnBookmark) {
    DOM.btnBookmark.dataset.materi = JSON.stringify(material);
  }

  // Render the body text as accessible <p> elements
  DOM.contentBody.innerHTML = formatContentAsParagraphs(rawContent);

  // Sync the mode badge label
  syncModeBadge(hasGenzContent);

  // Transition: hide welcome, show content
  DOM.welcomeState.setAttribute('hidden', '');
  DOM.contentView.removeAttribute('hidden');
  DOM.materialNav.hidden = true;
  document.body.classList.add('reading-view');
  setActiveNavigation(DOM.navReader);

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
function syncModeBadge(hasGenzContent = true) {
  const isGenz = state.mode === 'genz';

  DOM.contentBadge.textContent  = isGenz ? 'Mode Gen-Z' : 'Mode Normal';
  DOM.contentBadge.className    = `mode-badge mode-badge--${isGenz ? 'genz' : 'normal'}`;
  DOM.contentBadge.setAttribute('aria-label', `Mode saat ini: ${isGenz ? 'Gen-Z' : 'Normal'}`);
  DOM.contentModeStatus.hidden = !isGenz || hasGenzContent;
  DOM.contentModeStatus.textContent = isGenz && !hasGenzContent
    ? 'Versi penjelasan Gen-Z belum tersedia. Teks asli tetap ditampilkan.'
    : '';
}

function setActiveNavigation(activeLink) {
  [DOM.navLibrary, DOM.navReader, DOM.navSaved].forEach((link) => {
    if (!link) return;
    const isActive = link === activeLink;
    link.classList.toggle('primary-nav__link--active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}


/* ============================================================
   07. EVENT HANDLERS
   ============================================================ */

/**
 * Handles clicking a material title in the sidebar.
 * Updates active styling, state, and re-renders content.
 *
 * @param {string|number} id - The material's database id
 */
function handleMaterialSelect(id) {
  const materialId = normalizeMaterialId(id);
  const material = state.materials.find((item) => item.id === materialId);
  if (!material) {
    console.warn(`[PaBa] Material with id ${materialId} not found in state.`);
    return;
  }

  // Remove bookmark page if it is currently visible
  const savedSection = DOM.mainContent.querySelector('#saved-materials-section');
  if (savedSection) savedSection.remove();

  // Update state
  state.activeMaterialId = materialId;

  // Update sidebar button states
  DOM.materiList.querySelectorAll('.materi-item').forEach((btn) => {
    const isActive = normalizeMaterialId(btn.dataset.id) === materialId;
    btn.classList.toggle('materi-item--active', isActive);
    // aria-current="page" is the correct value for "currently selected item"
    btn.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  // Render the content in the main area
  displayMateri(material);
}

function handleFocusToggle() {
  state.isFocusMode = !state.isFocusMode;
  document.body.classList.toggle('focus-mode', state.isFocusMode);
  DOM.btnFocusToggle.setAttribute('aria-pressed', String(state.isFocusMode));
  DOM.btnFocusToggle.setAttribute(
    'aria-label',
    state.isFocusMode ? 'Nonaktifkan mode fokus membaca' : 'Aktifkan mode fokus membaca'
  );
  showToast(state.isFocusMode ? 'Mode fokus diaktifkan' : 'Mode fokus dinonaktifkan');
}

/**
 * Toggles OpenDyslexic font mode on/off.
 * Reflects the state in the button's aria-pressed attribute,
 * its label, and a CSS class on <body>.
 */
async function handleFontToggle() {
  if (state.isDyslexicFont) {
    setDyslexicFontEnabled(false);
    showToast('Font standar diaktifkan');
    return;
  }

  try {
    const loadedFonts = await document.fonts.load('18px OpenDyslexic');
    if (!loadedFonts.length || !document.fonts.check('18px OpenDyslexic')) {
      throw new Error('Font OpenDyslexic tidak berhasil dimuat.');
    }
  } catch (error) {
    console.error('[PaBa] Font OpenDyslexic gagal dimuat:', error);
    showToast('Font OpenDyslexic gagal dimuat. Font standar tetap digunakan.');
    return;
  }

  setDyslexicFontEnabled(true);
  showToast('Font OpenDyslexic diaktifkan');
}

function setDyslexicFontEnabled(enabled) {
  state.isDyslexicFont = enabled;
  document.body.classList.toggle('dyslexic-mode', enabled);
  DOM.btnFontToggle.setAttribute('aria-pressed', String(enabled));
  DOM.btnFontToggle.setAttribute(
    'aria-label',
    enabled
      ? 'Font OpenDyslexic aktif. Klik untuk kembali ke font normal.'
      : 'Aktifkan font OpenDyslexic untuk kemudahan membaca'
  );
  persistReadingPreferences();
}

function loadReadingPreferences() {
  let saved;
  try {
    const raw = localStorage.getItem(READING_PREFERENCES_KEY);
    if (!raw) return;
    saved = JSON.parse(raw);
  } catch (error) {
    console.warn('[PaBa] Preferensi bacaan tersimpan tidak dapat dibaca:', error);
    return;
  }

  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
    console.warn('[PaBa] Format preferensi bacaan tidak valid; memakai nilai awal.');
    return;
  }

  const fontSize = Number(saved.fontSize);
  const letterSpacing = Number(saved.letterSpacing);
  state.readingSettings = {
    fontSize: Number.isFinite(fontSize) && fontSize >= 16 && fontSize <= 28
      ? fontSize
      : 18,
    lineHeight: ALLOWED_LINE_HEIGHTS.has(String(saved.lineHeight))
      ? String(saved.lineHeight)
      : '1.9',
    letterSpacing: Number.isFinite(letterSpacing) && letterSpacing >= 0 && letterSpacing <= 0.08
      ? letterSpacing
      : 0.01,
  };
  state.mode = saved.mode === 'genz' ? 'genz' : 'normal';
  DOM.btnModeNormal.classList.toggle('lang-btn--active', state.mode === 'normal');
  DOM.btnModeGenz.classList.toggle('lang-btn--active', state.mode === 'genz');
  DOM.btnModeNormal.setAttribute('aria-pressed', String(state.mode === 'normal'));
  DOM.btnModeGenz.setAttribute('aria-pressed', String(state.mode === 'genz'));
  syncReadingSettings();

  if (saved.isDyslexicFont === true) {
    handleFontToggle();
  }
}

function persistReadingPreferences() {
  try {
    localStorage.setItem(READING_PREFERENCES_KEY, JSON.stringify({
      ...state.readingSettings,
      isDyslexicFont: state.isDyslexicFont,
      mode: state.mode,
    }));
  } catch (error) {
    console.warn('[PaBa] Preferensi bacaan tidak dapat disimpan:', error);
  }
}

function syncReadingSettings() {
  const { fontSize, lineHeight, letterSpacing } = state.readingSettings;

  DOM.contentView.style.setProperty('--reader-font-size', `${fontSize}px`);
  DOM.contentView.style.setProperty('--reader-line-height', lineHeight);
  DOM.contentView.style.setProperty('--reader-letter-spacing', `${letterSpacing}em`);
  DOM.readingFontSize.value = String(fontSize);
  DOM.readingLineHeight.value = lineHeight;
  DOM.readingLetterSpacing.value = String(letterSpacing);
  DOM.readingFontSizeValue.value = `${fontSize} px`;
  DOM.readingLetterSpacingValue.value = `${letterSpacing.toFixed(2)} em`;
}

function handleReadingSettingsReset() {
  state.readingSettings = {
    fontSize: 18,
    lineHeight: '1.9',
    letterSpacing: 0.01,
  };
  DOM.readingFontSize.value = String(state.readingSettings.fontSize);
  DOM.readingLineHeight.value = state.readingSettings.lineHeight;
  DOM.readingLetterSpacing.value = String(state.readingSettings.letterSpacing);
  syncReadingSettings();

  if (state.isDyslexicFont) {
    setDyslexicFontEnabled(false);
  }

  persistReadingPreferences();
  showToast('Pengaturan tampilan bacaan dikembalikan ke awal');
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
  persistReadingPreferences();

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
      ? 'Mode Gen-Z aktif — penjelasan lebih sederhana.'
      : 'Mode normal aktif'
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
    console.log('[PaBa] ⚠️  Showing error state:', errorMessage);
  }

  // 'empty' reuses the list container but shows an informational message
  if (stateName === 'empty') {
    DOM.materialNav.hidden = false;
    DOM.materiList.innerHTML = `
      <li style="padding: var(--sp-lg); text-align: center;">
        <p style="color: var(--c-text-muted); font-size: var(--fs-sm); margin-bottom: 0.75rem;">
          Belum ada materi tersedia.
        </p>
        <p style="color: var(--c-text-muted); font-size: 0.75rem; margin: 0;">
          Materi akan ditampilkan di sini setelah tersedia.
        </p>
      </li>
    `;
    console.log('[PaBa] ℹ️  Showing empty state');
  }

  // 'loading' state message
  if (stateName === 'loading') {
    console.log('[PaBa] 🔄 Showing loading state');
  }

  // 'list' state - just show the material list
  if (stateName === 'list') {
    console.log('[PaBa] ✅ Showing material list');
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
  DOM.btnFocusToggle?.addEventListener('click', handleFocusToggle);
  syncReadingSettings();

  DOM.readingFontSize.addEventListener('input', () => {
    state.readingSettings.fontSize = Number(DOM.readingFontSize.value);
    syncReadingSettings();
    persistReadingPreferences();
  });
  DOM.readingLineHeight.addEventListener('change', () => {
    state.readingSettings.lineHeight = DOM.readingLineHeight.value;
    syncReadingSettings();
    persistReadingPreferences();
  });
  DOM.readingLetterSpacing.addEventListener('input', () => {
    state.readingSettings.letterSpacing = Number(DOM.readingLetterSpacing.value);
    syncReadingSettings();
    persistReadingPreferences();
  });
  DOM.btnReadingSettingsReset.addEventListener('click', handleReadingSettingsReset);

  // Language mode buttons
  DOM.btnModeNormal.addEventListener('click', () => handleModeSwitch('normal'));
  DOM.btnModeGenz.addEventListener('click',   () => handleModeSwitch('genz'));

  // Retry button in the error state
  DOM.btnRetry.addEventListener('click', fetchMaterials);

  // Search filter input
  DOM.searchInput?.addEventListener('input', (event) => {
    filterMaterials(event.target.value);
  });

  // Event delegation on #main-content for bookmark button, saved list buttons, and back button
  DOM.mainContent?.addEventListener('click', (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target) return;

    const clickedBack = target.closest('.back-to-all-btn');
    if (clickedBack) {
      handleTabSwitch('all');
      showAllMaterials();
      return;
    }

    const clickedOpen = target.closest('.saved-card__open-btn');
    if (clickedOpen) {
      const materialId = normalizeMaterialId(clickedOpen.dataset.materialId);
      if (materialId) {
        handleTabSwitch('all');
        showAllMaterials();
        handleMaterialSelect(materialId);
      }
      return;
    }

      const clickedBookmark = target.closest('.bookmark-btn');
    if (!clickedBookmark) return;

    const materiJson = clickedBookmark.dataset.materi;
    if (!materiJson) return;

    let material;
    try {
      material = JSON.parse(materiJson);
    } catch (err) {
      console.warn('[PaBa] Gagal membaca data materi dari tombol bookmark:', err);
      return;
    }

    if (!material || !normalizeMaterialId(material.id)) return;

    // Handle async toggle bookmark with login check
    (async () => {
      // Ensure user is logged in first
      if (!(await ensureUserLoggedIn())) {
        return; // User redirected to login page
      }

      clickedBookmark.disabled = true;
      clickedBookmark.textContent = 'Menyimpan...';

      const added = await toggleBookmark(material);

      clickedBookmark.disabled = false;

      if (added === true) {
        showToast('Materi disimpan.');
      } else if (added === false) {
        showToast('Bookmark dibatalkan.');
      } else {
        showToast('Gagal mengubah bookmark.');
      }

      updateBookmarkButton();
      filterMaterials(DOM.searchInput?.value || '');
    })();
  });

  DOM.tabAll?.addEventListener('click', () => {
    handleTabSwitch('all');
    showAllMaterials();
  });
  DOM.tabSaved?.addEventListener('click', async () => {
    handleTabSwitch('saved');
    await renderBookmarks();
  });

  DOM.navLibrary?.addEventListener('click', (event) => {
    event.preventDefault();
    handleTabSwitch('all');
    showAllMaterials();
    DOM.welcomeState?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  DOM.navReader?.addEventListener('click', (event) => {
    event.preventDefault();
    if (state.activeMaterialId === null) {
      showToast('Pilih bacaan dari perpustakaan untuk mulai membaca.');
      DOM.materialNav?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setActiveNavigation(DOM.navReader);
    DOM.contentView?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  DOM.navSaved?.addEventListener('click', async (event) => {
    event.preventDefault();
    handleTabSwitch('saved');
    await renderBookmarks();
    DOM.mainContent.querySelector('#saved-materials-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // ── User Auth Controls ─────────────────────────────────────
  DOM.btnLogout?.addEventListener('click', handleLogout);

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
  console.log('[PaBa] 🚀 Initializing application...');

  loadSavedMaterialsFromStorage();
  loadReadingPreferences();
  initSupabase();
  setupAuthStateListener();
  registerEventListeners();

  if (supabaseClient) {
    await initializeAuthUI();
    await loadSavedMaterialsFromDatabase();
  } else {
    updateUIForAuthStatus();
  }

  await fetchMaterials();
  console.log('[PaBa] ✅ Initialization complete.');
}

// DOMContentLoaded fires after HTML is fully parsed but before
// images/stylesheets are loaded — the right time to run our app.
document.addEventListener('DOMContentLoaded', initApp);
