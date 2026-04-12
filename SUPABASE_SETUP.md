# 📚 Panduan Setup Supabase Client untuk PaBa

## 📋 Daftar Isi

1. [Quick Start](#quick-start)
2. [Integrasi ke Project](#integrasi-ke-project)
3. [Struktur File](#struktur-file)
4. [Cara Penggunaan](#cara-penggunaan)
5. [Contoh Implementasi](#contoh-implementasi)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Step 1: Ambil Credentials dari Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Pilih project PaBa Anda
3. Buka **Settings → API** (di sidebar kiri)
4. Copy:
   - **Project URL** → ke `supabaseUrl` di `supabase.js`
   - **Anon Key** → ke `supabaseAnonKey` di `supabase.js`

**Format yang benar:**

```
URL: https://xxxxx.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 2: Update `supabase.js`

```javascript
const SUPABASE_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_ANON_KEY_HERE',
};
```

### Step 3: Done! 🎉

File `supabase.js` sudah siap digunakan di project Anda.

---

## 🔗 Integrasi ke Project

### index.html

Pastikan Supabase SDK sudah ter-load dari CDN **SEBELUM** file JavaScript lainnya:

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <!-- ... head lainnya ... -->
  
  <link rel="stylesheet" href="style.css" />
  
  <!-- ✅ PENTING: Load Supabase SDK terlebih dahulu -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  defer></script>
  
  <!-- ✅ Kemudian load file supabase.js (inisialisasi client) -->
  <script src="supabase.js" type="module" defer></script>
  
  <!-- ✅ Terakhir load script.js (main app logic) -->
  <script src="script.js" type="module" defer></script>
</head>
<body>
  <!-- ... content ... -->
</body>
</html>
```

**⚠️ Penting:**

- `<script type="module">` memungkinkan ES6 imports/exports
- Urutan: SDK → supabase.js → script.js
- Gunakan `defer` agar DOM siap saat script berjalan

---

## 📁 Struktur File

```
supabase-PaBa/
├── index.html               ← Main HTML
├── script.js               ← Logic aplikasi utama
├── style.css               ← Styling
│
├── supabase.js             ← ✨ Inisialisasi client (FILE BARU)
├── supabase-examples.js    ← ✨ Contoh penggunaan (FILE BARU)
│
└── supabase/
    └── config.toml         ← Existing Supabase config
```

---

## 💡 Cara Penggunaan

### Inisialisasi di startup

Di dalam `script.js`, tambahkan:

```javascript
import { initializeSupabase, getSupabaseClient } from './supabase.js';

// Inisialisasi saat app startup
async function initApp() {
  // ✅ Inisialisasi Supabase terlebih dahulu
  const success = await initializeSupabase();
  
  if (!success) {
    console.error('Gagal inisialisasi Supabase');
    return;
  }

  // ✅ Sekarang Anda bisa gunakan getSupabaseClient()
  const supabase = getSupabaseClient();
  console.log('Supabase ready!', supabase);

  // Lanjutkan inisialisasi app
  // ...
}

document.addEventListener('DOMContentLoaded', initApp);
```

### Fetch data dari database

```javascript
import { getSupabaseClient } from './supabase.js';

async function fetchMaterials() {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('materi')
    .select('id, judul, konten_asli, konten_genz')
    .order('id', { ascending: true });

  if (error) {
    console.error('Fetch error:', error.message);
    return;
  }

  console.log('Materi:', data);
  return data;
}
```

### Gunakan Supabase Auth

```javascript
import { signInUser, getCurrentUser } from './supabase-examples.js';

// Sign in user
const session = await signInUser('user@example.com', 'password123');

// Get current user
const user = await getCurrentUser();
console.log('User:', user.email);
```

---

## 🎯 Contoh Implementasi

### A. Fetch materi dan render ke sidebar

```javascript
import { getSupabaseClient } from './supabase.js';

async function loadMaterials() {
  const supabase = getSupabaseClient();

  // Show loading state
  showSidebarState('loading');

  try {
    const { data, error } = await supabase
      .from('materi')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    state.materials = data;
    renderMaterialList(data);
    showSidebarState('list');

  } catch (error) {
    console.error('Error:', error.message);
    showSidebarState('error', error.message);
  }
}
```

### B. Real-time bookmark sync

```javascript
import { subscribeToMaterialChanges } from './supabase-examples.js';

// Subscribe to changes
const unsubscribe = subscribeToMaterialChanges((payload) => {
  if (payload.eventType === 'UPDATE') {
    // Materi diupdate → refresh UI
    console.log('Material updated:', payload.new);
    loadMaterials();
  }
});

// Cleanup when needed
// unsubscribe();
```

### C. User profile dengan Supabase Auth

```javascript
import { 
  signUpUser, 
  signInUser, 
  getCurrentUser,
  onAuthStateChange 
} from './supabase-examples.js';

// Listen to auth changes
const unsubscribe = onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User logged in:', session.user.email);
    showUserProfile(session.user);
  } else if (event === 'SIGNED_OUT') {
    console.log('User logged out');
    hideUserProfile();
  }
});
```

---

## 🔍 Troubleshooting

### ❌ Error: "Supabase SDK not found"

**Penyebab:** Script tag CDN belum di-load

**Solusi:**

```html
<!-- ✅ Tambahkan ke index.html -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

---

### ❌ Error: "SUPABASE_URL belum dikonfigurasi"

**Penyebab:** Belum mengisi credentials di `supabase.js`

**Solusi:**

1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Ambil URL dan Anon Key dari Settings → API
3. Update di `supabase.js`:

```javascript
const SUPABASE_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',  // ← Ganti
  supabaseAnonKey: 'YOUR_ANON_KEY',                  // ← Ganti
};
```

---

### ❌ Error: "getSupabaseClient() returns null"

**Penyebab:** `initializeSupabase()` belum dipanggil atau gagal

**Solusi:**

```javascript
// Pastikan initializeSupabase() sudah dipanggil
const success = await initializeSupabase();
console.log('Init success:', success); // Harus true

// Baru gunakan getSupabaseClient()
if (success) {
  const supabase = getSupabaseClient();
  // ...
}
```

---

### ❌ Error: "Permission denied" saat INSERT/UPDATE

**Penyebab:** Row Level Security (RLS) policy tidak diatur

**Solusi:**

1. Buka Supabase Dashboard → Authentication → Policies
2. Setup RLS policy untuk table `materi`:

```sql
-- Allow public SELECT (read)
CREATE POLICY "Enable read for all" ON materi
  FOR SELECT USING (true);

-- Allow authenticated INSERT/UPDATE
CREATE POLICY "Enable insert for authenticated" ON materi
  FOR INSERT WITH CHECK (auth.role() = 'authenticated_user');
```

---

### ❌ Error: 401 Unauthorized

**Penyebab:** Anon Key tidak valid atau expired

**Solusi:**

1. Ambil Anon Key yang **baru** dari Supabase Dashboard
2. Update di `supabase.js`
3. Refresh browser (clear cache)

---

### ❌ CORS Error saat fetch data

**Penyebab:** Browser security policy

**Solusi (biasanya tidak perlu, SDKnya handle):**

Jika tetap error, pastikan:

1. Url format benar: `https://xxxxx.supabase.co` (tanpa trailing slash)
2. Cek Network tab di DevTools untuk melihat actual request

---

## 📚 Dokumentasi Resmi

- [Supabase JavaScript SDK](https://supabase.com/docs/reference/javascript)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Database](https://supabase.com/docs/guides/database)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)

---

## ✅ Checklist

Sebelum launch, pastikan:

- [ ] ✅ Supabase SDK ter-load di index.html
- [ ] ✅ Credentials sudah diisi di `supabase.js`
- [ ] ✅ `initializeSupabase()` dipanggil saat startup
- [ ] ✅ Database table `materi` sudah dibuat
- [ ] ✅ RLS policies sudah dikonfigurasi
- [ ] ✅ Testing di browser (buka DevTools Console)

---

**Happy coding! 🚀**
