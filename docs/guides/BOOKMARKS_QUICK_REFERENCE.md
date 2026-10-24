# 🔖 Bookmarks Supabase — Quick Reference

## 📦 Files Created

| File | Purpose |
|------|---------|
| **bookmarks.js** | 7 fungsi bookmark operations |
| **RLS_POLICY_SETUP_GUIDE.md** | Panduan policy akses bookmarks |
| **BOOKMARKS_GUIDE.md** | Dokumentasi lengkap |

---

## ⚡ 5-Minute Setup

### 1️⃣ Setup Database (2 min)

```
Supabase Dashboard
  ↓
Table Editor / SQL Editor
  ↓
Verifikasi skema dan policy melalui [panduan setup Supabase](SUPABASE_SETUP.md) dan [panduan RLS](RLS_POLICY_SETUP_GUIDE.md).
Jangan jalankan migration/seed repo pada project aktif tanpa penyesuaian; project ini memakai ID materi UUID.
```

### 2️⃣ Import & Use (2 min)

```javascript
// 1. Di script.js
import { toggleBookmark, getUserBookmarks } from './bookmarks.js';

// 2. Use functions
const result = await toggleBookmark(materialId);
// → result.success, result.isSaved

const bookmarks = await getUserBookmarks();
// → Array bookmarks dengan detail materi
```

### 3️⃣ Update Event Handler (1 min)

```javascript
// Replace old localStorage bookmark logic

// OLD:
// const stored = localStorage.getItem(BOOKMARK_STORAGE_KEY);

// NEW:
const result = await toggleBookmark(state.activeMaterialId);
if (result.success) {
  updateBookmarkButton(result.isSaved);
}
```

---

## 🎯 7 Fungsi & Usage

```javascript
import {
  toggleBookmark,           // Save/unsave material
  isBookmarked,             // Check if bookmarked
  getUserBookmarks,         // Get all user's bookmarks
  getBookmarkCount,         // Count total bookmarks
  removeBookmark,           // Delete specific bookmark
  clearAllBookmarks,        // Delete all (with confirm)
  subscribeToBookmarkChanges // Real-time sync
} from './bookmarks.js';
```

### toggleBookmark(materialId)
```javascript
// Toggle save/unsave
const { success, isSaved, message } = await toggleBookmark(materialUuid);
if (success) {
  // isSaved = true → just saved
  // isSaved = false → just unsaved
}
```

### isBookmarked(materialId)
```javascript
// Check if bookmarked
const saved = await isBookmarked(materialUuid);
// true or false
```

### getUserBookmarks()
```javascript
// Get all bookmarks dengan materi detail
const bookmarks = await getUserBookmarks();
// [{
//   id: 'uuid',
//   material_id: 'materi-uuid',
//   created_at: '2025-04-04...',
//   materi: { id, judul, konten_asli, ... }
// }]
```

### subscribeToBookmarkChanges(callback)
```javascript
// Real-time sync across devices/windows
subscribeToBookmarkChanges((payload) => {
  console.log('Bookmark changed:', payload.eventType);
  // eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  refreshUI();
});
```

---

## 🔐 Authentication Required

**Semua operasi bookmark memerlukan user login:**

```javascript
// Jika user belum login → alert user
// Function otomatis cek dengan checkUserStatus()
```

---

## 📊 Database Schema

```sql
bookmarks (
  id → UUID (auto)
  user_id → UUID (from auth.users)
  material_id → UUID (from public.materi.id)
  created_at → TIMESTAMP
  UNIQUE(user_id, material_id) ← prevent duplicates
)
```

---

## 🔄 Migrasi dari LocalStorage

```javascript
// 1. Verify active bookmark policies in Supabase; do not assume repository migrations match.

// 2. Old code (localStorage):
// ❌ localStorage.setItem('paba_bookmarks', JSON.stringify(data));

// 3. New code (Supabase):
// ✅ const result = await toggleBookmark(materialId);

// No manual migration needed – user bookmarks save automatically
```

---

## ✅ Implementation Checklist

- [ ] Verifikasi policy bookmarks dari `RLS_POLICY_SETUP_GUIDE.md` di Supabase
- [ ] Import `bookmarks.js` di script.js
- [ ] Replace localStorage bookmark code
- [ ] Update bookmark button event handler
- [ ] Add `getUserBookmarks()` untuk "Saved" tab
- [ ] Setup real-time sync (`subscribeToBookmarkChanges`)
- [ ] Remove old localStorage code
- [ ] Test login → bookmark → unsave → logout → login again

---

## 🔗 Key Differences

| Feature | Old (LocalStorage) | New (Supabase) |
|---------|-------------------|----------------|
| Login Check | No | ✅ Yes |
| Async | No | ✅ Yes |
| Multi-Device | ❌ No | ✅ Yes |
| Real-time Sync | ❌ No | ✅ Yes |
| Cloud Backup | ❌ No | ✅ Yes |
| Code Changes | Minimal | Medium |

---

## 🚨 Common Issues

**Error: "User tidak login"**
- User belum login saat bookmark
- Show login prompt atau redirect ke login.html

**Error: "relation 'bookmarks' does not exist"**
- Pastikan project Supabase yang dikonfigurasi benar dan tabel tersedia
- Verifikasi skema sebelum menjalankan migration; migration repo memakai ID materi `bigint`, bukan UUID

**Bookmarks tidak muncul di tab**
- Gunakan `getUserBookmarks()` untuk load
- Check authentication status

**UI button tidak update**
- Panggil `updateBookmarkButton()` setelah toggle
- Refresh material list untuk update icons

---

## 📚 Full Documentation

👉 See [BOOKMARKS_GUIDE.md](BOOKMARKS_GUIDE.md) for:
- Complete API reference
- Detailed examples
- Migration strategy
- Real-time sync setup
- Troubleshooting guide

---

## 💡 Most Common Use Case

```javascript
// Save/Unsave dan update button
const result = await toggleBookmark(materialId);

if (result.success) {
  // Update button UI
  updateBookmarkButton(result.isSaved);
  
  // Show feedback
  showToast(result.message);
  
  // Refresh list
  renderMaterialList();
}
```

---

**Questions? See BOOKMARKS_GUIDE.md or check `bookmarks.js` comments!**
