# 🔧 TROUBLESHOOTING - Materi Tidak Muncul di Web

Panduan lengkap untuk debug mengapa materi tidak muncul di PaBa.

---

## 🎯 Diagnosis Checklist (Lakukan Satu Per Satu)

### ✅ STEP 1: Check Browser Console (F12)

**Lakukan:**
1. Buka http://localhost:8000/index.html
2. Tekan **F12** untuk buka Developer Tools
3. Klik tab **"Console"**
4. Refresh halaman (Ctrl+R atau F5)

**Apa yang dicari:**
```
[PaBa] 🚀 Initializing application...
[PaBa] ⏳ Sedang memuat materi...
[PaBa] ✅ Materials loaded: X items
```

**Jika lihat pesan ERROR:**
- Screenshot error message
- Copy-paste error message ke sini
- Kita akan debug bersama

---

### ✅ STEP 2: Check Network Tab (See Supabase Requests)

**Lakukan:**
1. F12 → Tab **"Network"**
2. Refresh halaman
3. Filter: Cari request ke `supabase` atau dengan status error (warna merah)

**Yang dilihat:**
- Request ke: `https://xeluoexmhsyuthgnqzuw.supabase.co/rest/v1/materi`
- Status: Harus **200** (success)
- Jika **403** atau error lain → lihat response body

**Response Body (klik request → tab "Response"):**
```json
[
  {
    "id": "uuid-xxx",
    "judul": "Cara Mengenal Huruf b dan d",
    ...
  }
]
```

---

### ✅ STEP 3: Check Supabase Dashboard - Data Sudah Insert?

**Lakukan:**
1. Buka https://app.supabase.com
2. Login → pilih project PaBa
3. Tab **"Table Editor"** di sidebar kiri
4. Cari tabel **"materi"**
5. Klik tabel untuk lihat isi

**Yang dilihat:**
- Harus ada 5 rows data (atau lebih jika ada sebelumnya)
- Setiap row punya: id (UUID), judul, konten_asli, konten_genz, kategori

**Jika tidak ada data:**
- Go to: [SQL Insert Guide](SQL_INSERT_GUIDE.md)
- Copy query dari [INSERT_MATERI_DATA.sql](INSERT_MATERI_DATA.sql)
- Run di SQL Editor

---

### ✅ STEP 4: Check RLS Policy

**Lakukan:**
1. Di Supabase Dashboard
2. Tab **"Authentication"** → **"Policies"** di sidebar
3. Pilih tabel **"materi"**
4. Lihat list policies yang ada

**Yang harus ada:**
```
✅ "Allow public read on materi"
   Action: SELECT
   Target role: anon, authenticated
   USING: (true)
```

**Jika tidak ada:**
Baca: [RLS_POLICY_SETUP_GUIDE.md](RLS_POLICY_SETUP_GUIDE.md) - bagian "TABEL: materi"

---

### ✅ STEP 5: Check Supabase Credentials di script.js

**Lakukan:**
1. Buka file [script.js](script.js) di text editor
2. Cari bagian "CONFIGURATION" di line ~45
3. Lihat:
```javascript
const SUPABASE_URL = 'https://xeluoexmhsyuthgnqzuw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Yang harus benar:**
- ✅ URL tidak kosong & ada `.supabase.co`
- ✅ ANON_KEY tidak kosong & panjang (seharusnya ~150+ karakter)
- ✅ BUKAN `'YOUR_SUPABASE_URL'` atau `'YOUR_SUPABASE_ANON_KEY'`

**Jika salah:**
1. Go to https://app.supabase.com
2. Settings → API
3. Copy "Project URL" → paste ke SUPABASE_URL
4. Copy "anon public" key → paste ke SUPABASE_ANON_KEY
5. Save file script.js
6. Refresh browser

---

### ✅ STEP 6: Check Local Server Running

**Lakukan:**
```bash
# Di terminal, check apakah server running
# Harus see: "Serving HTTP..."

# Jika sudah running, lihat URL di address bar
# Harus: http://localhost:8000/index.html

# Jika tidak ada server running:
cd /home/teguh/supabase-PaBa
python -m http.server 8000

# Harus muncul:
# Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

---

### ✅ STEP 7: Check Materi Table Schema

**Di Supabase Dashboard:**
1. Table Editor → materi
2. Klik icon ⚙️ (Settings) di atas table
3. Lihat columns yang ada

**Harus ada columns:**
- id (UUID)
- judul (text)
- konten_asli (text)
- konten_genz (text)
- kategori (text)
- url_meme (optional)
- created_at (timestamp)

---

## 🔴 Common Error Messages & Solutions

### Error 1: "Tabel materi tidak ditemukan"

**Cause:** Tabel materi belum di-create di Supabase

**Solution:**
1. Di Supabase → SQL Editor
2. Run query:
```sql
CREATE TABLE materi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul TEXT NOT NULL,
  konten_asli TEXT,
  konten_genz TEXT,
  kategori TEXT,
  url_meme TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```
3. Then insert 5 data dari [INSERT_MATERI_DATA.sql](INSERT_MATERI_DATA.sql)

---

### Error 2: "Akses ditolak. Periksa RLS policy"

**Cause:** RLS policy tidak allow SELECT untuk public

**Solution:**
1. Di Supabase → Table Editor → materi
2. Klik ⚙️ → "RLS Policies" atau "Auth" tab
3. Enable RLS jika belum
4. Add policy:
```sql
CREATE POLICY "Allow public read" ON materi
FOR SELECT
TO anon, authenticated
USING (true);
```

---

### Error 3: "Gagal terhubung ke server"

**Cause:** Network error atau CORS issue

**Solution:**
1. Check koneksi internet
2. Verify SUPABASE_URL di script.js
3. Check Site URL di Supabase Settings → Auth
4. Pastikan: `http://localhost:8000` ada di "Redirect URLs"

---

### Error 4: Data tidak muncul tapi tidak ada error

**Cause:** JavaScript error atau DOM element tidak ada

**Solution:**
1. F12 → Console → lihat error
2. Cek apakah ada error messages (red text)
3. Cek Network tab → Supabase request status
4. Verify tabel punya data (Step 3)

---

## 🎯 Quick Debug Checklist

```
STEP 1: F12 Console - Ada error? ▢
STEP 2: Network tab - Status 200 atau error? ▢
STEP 3: Supabase Dashboard - Data ada? ▢
STEP 4: RLS Policy - Policy exists? ▢
STEP 5: script.js - Credentials correct? ▢
STEP 6: Local server - Running? ▢
STEP 7: Table schema - Columns correct? ▢
```

---

## 📞 What to Tell Me

Untuk debug lebih cepat, share:

1. **Console error message** (screenshot atau copy-paste dari F12)
2. **Network request status** (200, 403, 500, dll)
3. **Data exist?** (Sudah insert data ke tabel materi? Y/N)
4. **RLS Policy?** (Sudah setup policy? Y/N)

---

## ⏱️ Most Common Issues (90% of cases)

| # | Issue | Solution |
|---|-------|----------|
| 1 | Data tidak di-insert | Run INSERT_MATERI_DATA.sql |
| 2 | RLS deny access | Enable public read policy |
| 3 | Wrong credentials | Copy from Supabase Settings → API |
| 4 | No local server | Run `python -m http.server 8000` |
| 5 | Table not exists | Create table di SQL Editor |

---

## 🚀 Next: Report Back What You Found

After doing all steps above, tell me:

1. **Console shows error?** (Yes/No) → Copy error message
2. **Materi data exists in Supabase?** (Yes/No)
3. **RLS policy set up?** (Yes/No)
4. **Credentials in script.js correct?** (Yes/No)

Then I can give you precise solution! 💡
