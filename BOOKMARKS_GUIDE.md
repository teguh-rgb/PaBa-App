# 🔖 Panduan Bookmarks dengan Supabase Database

## 📋 Daftar Isi

1. [Quick Start](#quick-start)
2. [Database Setup](#database-setup)
3. [Fungsi-Fungsi Tersedia](#fungsi-fungsi-tersedia)
4. [Cara Penggunaan](#cara-penggunaan)
5. [Migrasi dari LocalStorage](#migrasi-dari-localstorage)
6. [Contoh Implementasi](#contoh-implementasi)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### 1. Setup Database

Copy-paste script dari [bookmarks-setup.sql](bookmarks-setup.sql) ke Supabase SQL Editor:

```
Supabase Dashboard → SQL Editor → New Query → Paste & Execute
```

### 2. Import Module

```javascript
import { toggleBookmark, isBookmarked, getUserBookmarks } from './bookmarks.js';
```

### 3. Use Functions

```javascript
// Toggle save/unsave
const result = await toggleBookmark(materialId);
// → Cek login user
// → Cek bookmark status
// → Insert/Delete ke database

// Check if bookmarked
const saved = await isBookmarked(materialId);
// → true jika sudah disave, false jika belum

// Get all user's bookmarks
const bookmarks = await getUserBookmarks();
// → Array bookmark dengan detail materi
```

---

## 🗄️ Database Setup

### Schema

```sql
CREATE TABLE bookmarks (
  id              UUID PRIMARY KEY,
  user_id         UUID NOT NULL (foreign key: auth.users.id),
  material_id     INT NOT NULL (foreign key: materi.id),
  created_at      TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, material_id)  -- Prevent duplicates
);
```

### RLS Policies

Semua policy sudah built-in di `bookmarks-setup.sql`:

- ✅ Users can view **their own** bookmarks
- ✅ Users can insert bookmarks for **themselves**
- ✅ Users can delete **their own** bookmarks
- ✅ Anonymous users cannot access

### Indexes

Untuk performa optimal:
- `idx_bookmarks_user_id` — Fast lookup by user
- `idx_bookmarks_material_id` — Fast lookup by material
- `idx_bookmarks_created_at` — Fast sorting by date

---

## 📚 Fungsi-Fungsi Tersedia

### 1. **toggleBookmark(materialId)** — Save/Unsave

Toggle bookmark status (save jika belum, unsave jika sudah).

```javascript
import { toggleBookmark } from './bookmarks.js';

const result = await toggleBookmark(123);
// {
//   success: true,
//   isSaved: true,  // true = saved, false = unsaved
//   message: "✅ Bookmark disimpan"
// }
```

**Fitur:**
- ✅ Cek user login terlebih dahulu
- ✅ Auto alert jika user belum login
- ✅ Return status apakah bookmarked atau not
- ✅ Proper error handling

**Return value:**
```javascript
{
  success: boolean,      // true jika berhasil
  isSaved: boolean|null, // true=saved, false=unsaved, null=error
  message: string        // Status message
}
```

---

### 2. **isBookmarked(materialId)** — Check Status

Cek apakah material sudah disave user.

```javascript
import { isBookmarked } from './bookmarks.js';

const saved = await isBookmarked(123);
// true jika sudah disave, false jika belum
```

**Gunakan untuk:**
- Update UI (fill/unfill bookmark icon)
- Conditional logic berdasarkan bookmark state
- Check sebelum render button

---

### 3. **getUserBookmarks()** — Get All Bookmarks

Ambil semua bookmark milik user beserta detail materi.

```javascript
import { getUserBookmarks } from './bookmarks.js';

const bookmarks = await getUserBookmarks();
// [
//   {
//     id: 'uuid-xxx',
//     material_id: 123,
//     created_at: '2025-04-04T10:30:00Z',
//     materi: {
//       id: 123,
//       judul: "...",
//       konten_asli: "...",
//       konten_genz: "...",
//       kategori: "...",
//       url_meme: "..."
//     }
//   },
//   ...
// ]
```

**Gunakan untuk:**
- Load "Materi Disimpan" tab
- Display user's bookmark collection
- Sync dengan backend setelah login

---

### 4. **getBookmarkCount()** — Count Bookmarks

Hitung total bookmark user.

```javascript
import { getBookmarkCount } from './bookmarks.js';

const count = await getBookmarkCount();
// 42
```

---

### 5. **removeBookmark(materialId)** — Delete Specific

Hapus bookmark tertentu.

```javascript
import { removeBookmark } from './bookmarks.js';

const success = await removeBookmark(123);
// true jika berhasil, false jika gagal
```

---

### 6. **clearAllBookmarks()** — Delete All

Hapus semua bookmark user (dengan konfirmasi).

```javascript
import { clearAllBookmarks } from './bookmarks.js';

const success = await clearAllBookmarks();
// Jika user confirm → delete all dan return true
// Jika user cancel → return false
```

---

### 7. **subscribeToBookmarkChanges(callback)** — Real-time

Subscribe ke perubahan bookmark real-time.

```javascript
import { subscribeToBookmarkChanges } from './bookmarks.js';

const subscription = subscribeToBookmarkChanges((payload) => {
  console.log('Bookmark changed:', payload.eventType);
  // eventType: 'INSERT', 'UPDATE', 'DELETE'
  
  // Refresh UI
  updateBookmarksDisplay();
});

// Cleanup (optional)
// subscription?.unsubscribe();
```

---

## 💡 Cara Penggunaan

### Setup di script.js

```javascript
import { toggleBookmark, isBookmarked, getUserBookmarks } from './bookmarks.js';

// Initialize app
async function initApp() {
  // ... existing init code ...

  // Check user & load bookmarks
  const { isLoggedIn } = await checkUserStatus();
  
  if (isLoggedIn) {
    await loadUserBookmarks();
  }
}

async function loadUserBookmarks() {
  const bookmarks = await getUserBookmarks();
  console.log('Bookmarks loaded:', bookmarks?.length || 0);
  
  // Update state jika ada
  // state.savedBookmarks = bookmarks || [];
}
```

### Handle Bookmark Button Click

```javascript
// Di event listener untuk bookmark button
DOM.btnBookmark.addEventListener('click', async () => {
  if (!state.activeMaterialId) return;

  const btn = DOM.btnBookmark;
  btn.disabled = true;
  btn.textContent = '⏳...';

  try {
    const result = await toggleBookmark(state.activeMaterialId);

    if (result.success) {
      // Update button state
      updateBookmarkButton(result.isSaved);
      
      // Show toast
      showToast(result.message);
      
      // Re-render material list untuk update icon
      renderMaterialList(state.materials);
    }
  } finally {
    btn.disabled = false;
    updateBookmarkButton();
  }
});
```

### Update Bookmark Button UI

```javascript
async function updateBookmarkButton() {
  if (!DOM.btnBookmark || !state.activeMaterialId) return;

  const isSaved = await isBookmarked(state.activeMaterialId);

  DOM.btnBookmark.classList.toggle('bookmark-btn--active', isSaved);
  DOM.btnBookmark.setAttribute('aria-pressed', String(isSaved));
  DOM.btnBookmark.textContent = isSaved ? '★ Disimpan' : '☆ Simpan';
}
```

### Render Saved Materials

```javascript
import { getUserBookmarks } from './bookmarks.js';

async function renderSavedMaterials() {
  const bookmarks = await getUserBookmarks();

  if (!bookmarks || bookmarks.length === 0) {
    showNoBookmarks();
    return;
  }

  const materials = bookmarks.map(b => b.materi);
  renderMaterialList(materials);
}
```

---

## 🔄 Migrasi dari LocalStorage

### Perubahan dari Lama

**Sebelumnya (LocalStorage):**
```javascript
// Simpan ke localStorage
localStorage.setItem('paba_bookmarks', JSON.stringify(bookmarks));

// Baca dari localStorage
const saved = JSON.parse(localStorage.getItem('paba_bookmarks'));
```

**Sekarang (Supabase):**
```javascript
// Simpan & unsave dengan Supabase
const result = await toggleBookmark(materialId);

// Baca dari Supabase
const bookmarks = await getUserBookmarks();
```

### Keuntungan Migrasi

| Aspek | LocalStorage | Supabase |
|-------|------------|----------|
| **Scope** | Per device | Account-wide |
| **Sync** | No | ✅ Real-time |
| **Capacity** | ~5-10 MB | Unlimited |
| **Multi-device** | ❌ No | ✅ Yes |
| **Backup** | ❌ No | ✅ Auto |
| **Real-time** | ❌ No | ✅ Yes |

### Migration Strategy

```javascript
// 1. Setup Supabase bookmarks table (run SQL)

// 2. Create migration function
async function migrateBookmarksToSupabase() {
  const localBookmarks = JSON.parse(
    localStorage.getItem('paba_bookmarks') || '[]'
  );

  for (const bookmark of localBookmarks) {
    await toggleBookmark(bookmark.id);
  }

  // Clear localStorage
  localStorage.removeItem('paba_bookmarks');
  console.log('✅ Migration complete');
}

// 3. Call on first login
// migrateBookmarksToSupabase();
```

---

## 🎯 Contoh Implementasi

### A. Auto-load Bookmarks After Login

```javascript
import { onAuthStateChange } from './auth.js';
import { getUserBookmarks } from './bookmarks.js';

onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User logged in, loading bookmarks...');
    const bookmarks = await getUserBookmarks();
    console.log('Bookmarks:', bookmarks?.length || 0);
    
    // Render bookmarks tab
    // renderBookmarksTab(bookmarks);
  }
});
```

### B. Bookmark Indicator in Material List

```javascript
// Update material list item dengan bookmark status
async function renderMaterialListItem(material) {
  const isBookmarked = await isBookmarked(material.id);
  
  const icon = isBookmarked ? '★' : '☆';
  return `
    <button data-id="${material.id}">
      ${icon} ${escapeHtml(material.judul)}
    </button>
  `;
}
```

### C. Bookmarks Page

```javascript
// Dedicated bookmarks page
async function showBookmarksPage() {
  const bookmarks = await getUserBookmarks();
  
  if (!bookmarks || bookmarks.length === 0) {
    showMessage('Belum ada bookmark');
    return;
  }

  const html = bookmarks.map(b => `
    <article>
      <h3>${b.materi.judul}</h3>
      <p>${b.materi.konten_asli.substring(0, 200)}...</p>
      <button onclick="openMaterial(${b.material_id})">
        Buka
      </button>
      <button onclick="removeBookmark(${b.material_id})">
        Hapus
      </button>
    </article>
  `).join('');

  document.getElementById('bookmarks-container').innerHTML = html;
}
```

### D. Sync Bookmarks Across Windows

```javascript
// Real-time sync jika user buka PaBa di 2 window
let subscription;

async function setupBookmarkSync() {
  subscription = subscribeToBookmarkChanges((payload) => {
    console.log('Bookmark synced:', payload);
    
    // Refresh bookmarks display
    renderMaterialList();
  });
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  subscription?.unsubscribe();
});
```

---

## ⚠️ Troubleshooting

### ❌ Error: "User tidak login"

**Penyebab:** User coba bookmark tanpa login

**Solusi:**
```javascript
const { isLoggedIn } = await checkUserStatus();
if (!isLoggedIn) {
  window.location.href = 'login.html';
}
```

---

### ❌ Error: "Material ID tidak valid"

**Penyebab:** materialId adalah string atau null

**Solusi:**
```javascript
// ❌ WRONG
toggleBookmark('123');
toggleBookmark(null);

// ✅ CORRECT
toggleBookmark(123);
toggleBookmark(Number(materialId));
```

---

### ❌ Error: "relation 'bookmarks' does not exist"

**Penyebab:** Belum run SQL setup script

**Solusi:**
1. Buka Supabase Dashboard
2. SQL Editor → Copy dari `bookmarks-setup.sql`
3. Execute script
4. Verify table exists di Table Editor

---

### ❌ Error: "permission denied for schema public"

**Penyebab:** RLS policies belum correct

**Solusi:**
1. Check user sudah login (auth.uid() valid)
2. Verify RLS policies di Supabase Dashboard
3. Re-run SQL setup script

---

### ❌ Bookmarks tidak sync ke device lain

**Penyebab:** Real-time subscription belum disetup

**Solusi:**
```javascript
import { subscribeToBookmarkChanges } from './bookmarks.js';

// Setup subscription saat app init
subscribeToBookmarkChanges((payload) => {
  console.log('Reload bookmarks...');
  loadUserBookmarks();
});
```

---

### ❌ Query terlalu lambat

**Penyebab:** Banyak bookmarks dan belum ada index

**Solusi:** Recreate indexes (sudah di setup script)
```sql
-- Verify indexes exist
SELECT * FROM pg_indexes WHERE tablename = 'bookmarks';
```

---

## 📊 Monitoring & Analytics

### Query Total Bookmarks

```sql
SELECT COUNT(*) as total_bookmarks FROM bookmarks;
```

### Query Top Bookmarked Materials

```sql
SELECT 
  material_id,
  m.judul,
  COUNT(*) as bookmark_count
FROM bookmarks
JOIN materi m ON bookmarks.material_id = m.id
GROUP BY material_id, m.judul
ORDER BY bookmark_count DESC
LIMIT 10;
```

### Query Most Active Users (by bookmarks)

```sql
SELECT 
  user_id,
  COUNT(*) as bookmark_count
FROM bookmarks
GROUP BY user_id
ORDER BY bookmark_count DESC
LIMIT 10;
```

---

## ✅ Checklist

- [ ] ✅ Run `bookmarks-setup.sql` di Supabase
- [ ] ✅ Verify table & policies di Supabase Dashboard
- [ ] ✅ Import `bookmarks.js` di script
- [ ] ✅ Update bookmark button handler
- [ ] ✅ Setup `getUserBookmarks()` saat load "Saved" tab
- [ ] ✅ Setup real-time sync dengan `subscribeToBookmarkChanges()`
- [ ] ✅ Test bookmark functionality (login, save, unsave)
- [ ] ✅ Test multi-device sync
- [ ] ✅ Test offline handling (graceful fallback)

---

**Happy bookmarking! 🔖**
