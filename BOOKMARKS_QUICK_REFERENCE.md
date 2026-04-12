# 🔖 Bookmarks Supabase — Quick Reference

## 📦 Files Created

| File | Purpose |
|------|---------|
| **bookmarks.js** | 7 fungsi bookmark operations |
| **bookmarks-setup.sql** | Database schema & RLS policies |
| **BOOKMARKS_GUIDE.md** | Dokumentasi lengkap |
| **script-bookmarks-integration.js** | Contoh integrasi ke script.js |

---

## ⚡ 5-Minute Setup

### 1️⃣ Setup Database (2 min)

```
Supabase Dashboard
  ↓
SQL Editor → New Query
  ↓
Copy-paste dari bookmarks-setup.sql
  ↓
Execute ▶
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
const { success, isSaved, message } = await toggleBookmark(123);
if (success) {
  // isSaved = true → just saved
  // isSaved = false → just unsaved
}
```

### isBookmarked(materialId)
```javascript
// Check if bookmarked
const saved = await isBookmarked(123);
// true or false
```

### getUserBookmarks()
```javascript
// Get all bookmarks dengan materi detail
const bookmarks = await getUserBookmarks();
// [{
//   id: 'uuid',
//   material_id: 123,
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
  material_id → INT (from materi)
  created_at → TIMESTAMP
  UNIQUE(user_id, material_id) ← prevent duplicates
)
```

---

## 🔄 Migrasi dari LocalStorage

```javascript
// 1. Run bookmarks-setup.sql

// 2. Old code (localStorage):
// ❌ localStorage.setItem('paba_bookmarks', JSON.stringify(data));

// 3. New code (Supabase):
// ✅ const result = await toggleBookmark(materialId);

// No manual migration needed – user bookmarks save automatically
```

---

## ✅ Implementation Checklist

- [ ] Run `bookmarks-setup.sql` di Supabase
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
- SQL setup belum dijalankan
- Run `bookmarks-setup.sql` di Supabase dashboard

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
