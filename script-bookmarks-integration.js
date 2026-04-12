/**
 * ============================================================
 * Script Contoh: Integrasi Bookmarks ke script.js
 * ============================================================
 * 
 * File ini menunjukkan cara mengintegrasikan bookmarks.js
 * ke dalam existing script.js untuk mengganti fitur localStorage.
 * 
 * PERUBAHAN UTAMA:
 * 1. Import bookmarks.js modules
 * 2. Replace localStorage bookmark logic dengan Supabase
 * 3. Update event handlers untuk use async functions
 * 4. Add real-time sync
 * 
 * ============================================================
 */

'use strict';

// ============================================================
// IMPORTS — Tambahan untuk Bookmarks
// ============================================================

import { initializeSupabase } from './supabase.js';
import { checkUserStatus } from './auth.js';
import {
  toggleBookmark,
  isBookmarked,
  getUserBookmarks,
  getBookmarkCount,
} from './bookmarks.js';

// ... existing imports ...

// ============================================================
// APPLICATION STATE — Update
// ============================================================

const state = {
  materials: [],
  activeMaterialId: null,
  mode: 'normal',
  activeTab: 'all',
  activeCategory: 'all',
  categories: [],

  // REMOVED: savedMaterialIds, savedBookmarks (no longer needed for localStorage)
  // Bookmarks sekarang disimpan di Supabase

  isDyslexicFont: false,
  
  // NEW: Track authentication state
  currentUser: null,
  isAuthenticated: false,
};

// ============================================================
// 1. CHECK USER STATUS AT STARTUP
// ============================================================

async function checkAuthenticationStatus() {
  console.log('[PaBa] 🔑 Mengecek status autentikasi...');

  const { isLoggedIn, user } = await checkUserStatus();

  if (!isLoggedIn) {
    console.log('[PaBa] ⚠️  User belum login');
    // Redirect ke login page
    // window.location.href = 'login.html';
    return false;
  }

  console.log('[PaBa] ✅ User authenticated:', user.email);
  state.currentUser = user;
  state.isAuthenticated = true;

  return true;
}

// ============================================================
// 2. LOAD USER BOOKMARKS (replace loadSavedMaterialsFromStorage)
// ============================================================

async function loadUserBookmarks() {
  if (!state.isAuthenticated) {
    console.log('[PaBa] ℹ️  User tidak login, skip load bookmarks');
    return;
  }

  console.log('[PaBa] 🔄 Memuat bookmarks dari Supabase...');

  try {
    const bookmarks = await getUserBookmarks();

    if (!bookmarks || bookmarks.length === 0) {
      console.log('[PaBa] ℹ️  Tidak ada bookmarks');
      return;
    }

    console.log('[PaBa] ✅ Bookmarks loaded:', bookmarks.length);

    // Simpan bookmark IDs ke state untuk quick lookup
    // (optional, untuk UI update)
  } catch (error) {
    console.error('[PaBa] ❌ Error loading bookmarks:', error);
  }
}

// ============================================================
// 3. CHECK IF MATERIAL IS BOOKMARKED (async version)
// ============================================================

async function checkMaterialBookmarkStatus(materialId) {
  if (!state.isAuthenticated) {
    return false;
  }

  return await isBookmarked(materialId);
}

// ============================================================
// 4. TOGGLE BOOKMARK — Replace toggleBookmark localStorage
// ============================================================

async function handleBookmarkToggle() {
  if (!state.activeMaterialId) {
    console.warn('[PaBa] ❌ No active material');
    return;
  }

  // Disable button during operation
  const btn = DOM.btnBookmark;
  btn.disabled = true;
  const originalText = btn.textContent;

  try {
    console.log('[PaBa] 🔄 Toggle bookmark...');

    // Call toggleBookmark dari bookmarks.js
    const result = await toggleBookmark(state.activeMaterialId);

    if (!result.success) {
      console.error('[PaBa] Bookmark toggle failed:', result.message);
      return;
    }

    console.log('[PaBa] ✅', result.message);

    // Update button UI
    updateBookmarkButtonUI(result.isSaved);

    // Show toast notification
    showToast(result.message);

    // Re-render material list untuk update bookmark icons
    const filtered = getSidebarMaterials(DOM.searchInput?.value || '');
    renderMaterialList(filtered);
  } catch (error) {
    console.error('[PaBa] ❌ Bookmark error:', error);
    showToast('❌ Gagal update bookmark');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// ============================================================
// 5. UPDATE BOOKMARK BUTTON UI
// ============================================================

async function updateBookmarkButtonUI(isSaved) {
  if (!DOM.btnBookmark) return;

  DOM.btnBookmark.classList.toggle('bookmark-btn--active', isSaved);
  DOM.btnBookmark.setAttribute('aria-pressed', String(isSaved));
  DOM.btnBookmark.textContent = isSaved ? '★ Disimpan' : '☆ Simpan';
  DOM.btnBookmark.setAttribute(
    'aria-label',
    isSaved ? 'Hapus bookmark materi ini' : 'Simpan materi ini'
  );
}

// ============================================================
// 6. RENDER MATERIAL LIST — Add bookmark icon
// ============================================================

async function renderMaterialList(materials) {
  DOM.materiList.innerHTML = '';
  const fragment = document.createDocumentFragment();

  for (const item of materials) {
    const li = document.createElement('li');
    const btn = document.createElement('button');

    // Check if bookmarked
    const bookmarked = await checkMaterialBookmarkStatus(item.id);

    btn.className = 'materi-item';
    btn.type = 'button';
    btn.dataset.id = String(item.id);

    // Add bookmark icon if bookmarked
    if (bookmarked) {
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
    btn.setAttribute('aria-label', `Baca materi: ${item.judul}`);

    btn.addEventListener('click', () => handleMaterialSelect(item.id));

    li.appendChild(btn);
    fragment.appendChild(li);
  }

  DOM.materiList.appendChild(fragment);
}

// ============================================================
// 7. RENDER BOOKMARKS TAB — Replace renderBookmarks
// ============================================================

async function renderBookmarksTab() {
  if (!state.isAuthenticated) {
    showBookmarksNotAuthenticated();
    return;
  }

  const bookmarks = await getUserBookmarks();

  if (!bookmarks || bookmarks.length === 0) {
    showNoBookmarks();
    return;
  }

  // Extract materials dari bookmarks
  const savedMaterials = bookmarks.map((b) => b.materi);

  // Use existing renderMaterialList
  renderMaterialList(savedMaterials);

  // Hide other panels
  DOM.welcomeState?.setAttribute('hidden', '');
  DOM.contentView?.setAttribute('hidden', '');
}

// ============================================================
// 8. SHOW ALL MATERIALS TAB
// ============================================================

async function showAllMaterialsTab() {
  state.activeMaterialId = null;
  await updateBookmarkButtonUI(false);

  DOM.welcomeState?.removeAttribute('hidden');
  DOM.contentView?.setAttribute('hidden', '');
}

// ============================================================
// 9. SHOW UI WHEN NOT AUTHENTICATED
// ============================================================

function showBookmarksNotAuthenticated() {
  DOM.materiList.innerHTML = `
    <li style="padding: var(--sp-lg); text-align: center;">
      <p style="color: var(--c-text-muted); font-size: var(--fs-sm);">
        Silakan login untuk melihat bookmarks Anda.
      </p>
      <button type="button" onclick="window.location.href='login.html'" style="margin-top: 1rem;">
        Login Sekarang
      </button>
    </li>
  `;
}

// ============================================================
// 10. SHOW NO BOOKMARKS
// ============================================================

function showNoBookmarks() {
  DOM.materiList.innerHTML = `
    <li style="padding: var(--sp-lg); text-align: center;">
      <p style="color: var(--c-text-muted); font-size: var(--fs-sm);">
        Belum ada materi disimpan.
      </p>
    </li>
  `;
}

// ============================================================
// 11. HANDLE MATERIAL SELECT
// ============================================================

async function handleMaterialSelect(id) {
  if (id === state.activeMaterialId) return;

  state.activeMaterialId = id;

  // Find material data
  const material = state.materials.find((m) => m.id === id);
  if (!material) return;

  // Render content
  renderContent(material);

  // Update sidebar highlighting
  renderMaterialList(getSidebarMaterials(DOM.searchInput?.value || ''));

  // Update bookmark button
  if (state.isAuthenticated) {
    const bookmarked = await checkMaterialBookmarkStatus(id);
    await updateBookmarkButtonUI(bookmarked);
  }
}

// ============================================================
// 12. HANDLE TAB SWITCH
// ============================================================

async function handleTabSwitch(newTab) {
  if (state.activeTab === newTab) return;

  state.activeTab = newTab;

  // Update tab UI
  DOM.tabAll?.classList.toggle('sidebar-tab--active', newTab === 'all');
  DOM.tabSaved?.classList.toggle('sidebar-tab--active', newTab === 'saved');

  if (newTab === 'all') {
    await showAllMaterialsTab();
    const filtered = getSidebarMaterials(DOM.searchInput?.value || '');
    renderMaterialList(filtered);
  } else if (newTab === 'saved') {
    await renderBookmarksTab();
  }
}

// ============================================================
// 13. REGISTER EVENT LISTENERS — Update
// ============================================================

function registerEventListeners() {
  // Bookmark button
  DOM.btnBookmark?.addEventListener('click', handleBookmarkToggle);

  // Tab switches
  DOM.tabAll?.addEventListener('click', () => handleTabSwitch('all'));
  DOM.tabSaved?.addEventListener('click', () => handleTabSwitch('saved'));

  // ... existing listeners ...
}

// ============================================================
// 14. APP INITIALIZATION — Update
// ============================================================

async function initApp() {
  try {
    // 1. Initialize Supabase
    const supabaseReady = await initializeSupabase();
    if (!supabaseReady) {
      console.error('[PaBa] Supabase init failed');
      return;
    }

    // 2. Check auth status
    const authenticated = await checkAuthenticationStatus();

    // 3. Register event listeners
    registerEventListeners();

    // 4. Load materials
    await fetchMaterials();

    // 5. Load bookmarks if authenticated
    if (authenticated) {
      await loadUserBookmarks();
    }

    console.log('[PaBa] ✅ App initialized');
  } catch (error) {
    console.error('[PaBa] ❌ Init error:', error);
  }
}

// ============================================================
// 15. OPTIONAL: REAL-TIME SYNC
// ============================================================

import { subscribeToBookmarkChanges } from './bookmarks.js';

function setupRealtimeBookmarkSync() {
  if (!state.isAuthenticated) return;

  console.log('[PaBa] 📡 Setting up bookmark real-time sync...');

  subscribeToBookmarkChanges((payload) => {
    console.log('[PaBa] 📡 Bookmark change detected:', payload.eventType);

    // Refresh current display
    if (state.activeTab === 'saved') {
      renderBookmarksTab();
    } else if (state.activeTab === 'all') {
      const filtered = getSidebarMaterials(DOM.searchInput?.value || '');
      renderMaterialList(filtered);
    }

    // Update bookmark button jika material sedang dilihat
    if (state.activeMaterialId) {
      updateBookmarkButtonUI();
    }
  });
}

// ============================================================
// 16. EXPORTS — jika file ini adalah module
// ============================================================

// Uncomment jika ingin export functions
// export {
//   handleBookmarkToggle,
//   renderBookmarksTab,
//   handleTabSwitch,
//   initApp,
// };

// ============================================================
// 17. ON DOCUMENT READY
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initApp();
  // Setup real-time sync after init
  setTimeout(setupRealtimeBookmarkSync, 1000);
});
