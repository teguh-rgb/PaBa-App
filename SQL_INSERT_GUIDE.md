# 🗄️ PaBa Materi - SQL Insert & Implementation Guide

## 📋 Daftar Isi
1. [SQL Insert Commands](#sql-insert-commands)
2. [Cara Menjalankan di Supabase](#cara-menjalankan-di-supabase)
3. [UUID & Auto-Generated ID](#uuid--auto-generated-id)
4. [Verifikasi Data](#verifikasi-data)
5. [Error Handling & Messages](#error-handling--messages)
6. [Testing & Validation](#testing--validation)

---

## 🗂️ SQL Insert Commands

### Ringkas: 5 Data Materi

Semua data sudah di siapkan dalam file [INSERT_MATERI_DATA.sql](INSERT_MATERI_DATA.sql).

Berikut adalah 5 data yang akan diinsert:

| # | Judul | Kategori | Tujuan |
|---|-------|----------|--------|
| 1 | Cara Mengenal Huruf b dan d | Dasar | Membedakan huruf yang sering tertukar |
| 2 | Teknik Membaca Suku Kata | Membaca | Belajar membaca per suku |
| 3 | Tips Fokus Saat Membaca | Tips | Meningkatkan konsentrasi |
| 4 | Mengenal Huruf Vokal | Dasar | Fondasi membaca |
| 5 | Berlatih Kata Pendek | Latihan | Practice dengan kata sederhana |

### SQL Query Format

```sql
INSERT INTO materi (judul, konten_asli, konten_genz, kategori)
VALUES (
  'Judul Materi',
  'Konten formal / standar Indonesia',
  'Konten Gen-Z / colloquial version',
  'Kategori'
);
```

**Penjelasan Kolom:**
- `id` - Auto-generated UUID (jangan diisi!)
- `judul` - Judul materi (required)
- `konten_asli` - Konten formal/standar (required)
- `konten_genz` - Konten simplified/Gen-Z (optional tapi recommended)
- `kategori` - Kategori materi (required)
- `url_meme` - URL ke meme/gambar (optional, bisa NULL)
- `created_at` - Timestamp (auto-generated)

---

## 🚀 Cara Menjalankan di Supabase

### Step 1: Buka Supabase Dashboard

1. Buka https://app.supabase.com
2. Login dengan akun Anda
3. Pilih project "PaBa" (atau sesuai nama)

### Step 2: Akses SQL Editor

1. Di sidebar kiri, cari **"SQL Editor"** atau **"Database"**
2. Klik **"SQL Editor"** atau teks "+ New Query"
3. Akan membuka editor SQL kosong

### Step 3: Copy & Paste SQL

1. Buka file [INSERT_MATERI_DATA.sql](INSERT_MATERI_DATA.sql)
2. Copy seluruh query (atau copy per query)
3. Paste ke SQL Editor di Supabase

### Step 4: Run Query

1. Klik tombol **"RUN"** atau tekan **Ctrl+Enter**
2. Tunggu hingga selesai (biasanya 1-2 detik)
3. Lihat hasil di panel "Results" (akan show "Success" atau error)

### Step 5: Verify Results

Di panel results, Anda akan melihat:
```
Query executed successfully
Rows affected: 1
```

Dan setiap query akan show 1 row affected (untuk 5 INSERT, total 5 rows).

---

## 🆔 UUID & Auto-Generated ID

### Cara Kerja UUID di Supabase

**Tabel materi schema:**
```sql
CREATE TABLE materi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- Auto UUID!
  judul TEXT NOT NULL,
  konten_asli TEXT,
  konten_genz TEXT,
  kategori TEXT,
  url_meme TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  ...
);
```

### Hal Penting:

✅ **UUID Auto-Generated:**
- Jangan include kolom `id` di INSERT
- Supabase otomatis generate UUID untuk setiap row
- UUID unik & tidak akan duplikat

✅ **Format UUID:**
```
a1b2c3d4-e5f6-47hh-i9jj-k1l2m3n4o5p6
```
(Contoh format 36 character dengan dashes)

✅ **SQL Kami:**
```sql
-- ✅ CORRECT (tidak ada id!)
INSERT INTO materi (judul, konten_asli, konten_genz, kategori)
VALUES ('Judul', 'Isi', 'Isi Gen-Z', 'Kategori');

-- ❌ WRONG (jangan include id!)
INSERT INTO materi (id, judul, konten_asli, konten_genz, kategori)
VALUES ('uuid-manual', 'Judul', 'Isi', 'Isi Gen-Z', 'Kategori');
```

---

## ✅ Verifikasi Data

### Query untuk Cek Data Sudah Masuk

Setelah run INSERT, jalankan query ini untuk verifikasi:

```sql
-- Lihat 5 materi terbaru
SELECT id, judul, kategori, created_at 
FROM materi 
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected Output:**
```
id                                    | judul                          | kategori    | created_at
--------------------------------------+--------------------------------+-------------+---------------------------
a1b2c3d4-e5f6-47hh-i9jj-k1l2m3n4o5p6 | Berlatih Kata Pendek          | Latihan     | 2026-04-05 10:30:00.000
e5f6g7h8-i9j0-41kk-l2m3-n4o5p6q7r8s9 | Mengenal Huruf Vokal          | Dasar       | 2026-04-05 10:29:45.000
i9j0k1l2-m3n4-45oo-p6q7-r8s9t0u1v2w3 | Tips Fokus Saat Membaca       | Tips        | 2026-04-05 10:29:30.000
...
```

### Query untuk Lihat Konten Lengkap

```sql
-- Lihat 1 materi dengan full content
SELECT 
  id, 
  judul, 
  konten_asli, 
  konten_genz, 
  kategori 
FROM materi 
WHERE kategori = 'Dasar' 
LIMIT 1;
```

### Query untuk Count Total

```sql
-- Total berapa materi?
SELECT COUNT(*) as total_materi FROM materi;

-- Expected: 5 (atau lebih jika ada data sebelumnya)
```

---

## 🔴 Error Handling & Messages

### Error yang Mungkin Terjadi

#### Error 1: "UNIQUE violation"
**Message:** `duplicate key value violates unique constraint`

**Penyebab:** Judul sudah ada atau ada constraint unique yang violation

**Solusi:** 
- Cek apakah judul sudah ada di database
- Ubah judul atau cek constraint di table schema
- Jalankan: `SELECT COUNT(*) FROM materi WHERE judul = 'Cara Mengenal Huruf b dan d';`

#### Error 2: "RLS Permission Denied"
**Message:** `ERROR: new row violates row-level security policy`

**Penyebab:** RLS policy tidak allow INSERT untuk role yang Anda gunakan

**Solusi:**
- Gunakan `run as admin` atau gunakan admin token
- Di Supabase → click "Run as admin" checkbox (jika tersedia)
- Atau update RLS policy untuk allow INSERT

#### Error 3: "Column does not exist"
**Message:** `ERROR: column "kolom_nama" of relation "materi" does not exist`

**Penyebab:** Nama kolom salah atau tidak ada di table

**Solusi:**
- Verifikasi nama kolom di table schema
- Cek apakah kolom adalah `konten_asli` bukan `konten`, `isi`, dll
- Run query: `SELECT * FROM materi LIMIT 1;` untuk lihat struktur

---

## 🧪 Testing & Validation

### Test 1: Verify Insert Berhasil

```sql
SELECT COUNT(*) FROM materi WHERE kategori IN ('Dasar', 'Membaca', 'Tips', 'Latihan');
-- Expected: >= 5
```

### Test 2: Verify Semua Field Terisi

```sql
SELECT 
  id, 
  judul, 
  LENGTH(konten_asli) as konten_asli_length,
  LENGTH(konten_genz) as konten_genz_length,
  kategori
FROM materi 
WHERE kategori IN ('Dasar', 'Membaca', 'Tips', 'Latihan')
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected:** Semua kolom terisi (tidak ada NULL)

### Test 3: Verify UUID Format

```sql
SELECT id FROM materi LIMIT 1;
-- Expected: a1b2c3d4-e5f6-47hh-i9jj-k1l2m3n4o5p6 (36 char with dashes)
```

### Test 4: Frontend Test - Cek Apakah Data Tampil

1. Jalankan local server: `python -m http.server 8000`
2. Buka http://localhost:8000/index.html
3. Buka console (F12)
4. Check log: `[PaBa] ✅ Materials loaded: X items`
5. Cek sidebar: data harus loading

---

## 📊 Frontend Integration

### Fungsi yang Sudah Diupdate

#### `fetchMaterials()`
- ✅ Better error detection
- ✅ Show loading state: "⏳ Sedang memuat materi..."
- ✅ Show empty state: "📚 Belum ada materi tersedia"
- ✅ Show error state dengan helpful message
- ✅ Show success state dengan count: "✅ Materials loaded: 5 items"

#### `showSidebarState()`
- ✅ 'loading' - show spinner with message
- ✅ 'empty' - show empty state dengan icon & help text
- ✅ 'error' - show error dengan custom message
- ✅ 'list' - show material list

### Console Output Examples

**Success:**
```
[PaBa] ⏳ Sedang memuat materi...
[PaBa] 🔄 Fetching materials from Supabase...
[PaBa] ✅ Materials loaded: 5 items
[PaBa] 📋 Sample: Cara Mengenal Huruf b dan d
[PaBa] ✅ Showing material list
```

**Empty State:**
```
[PaBa] ⏳ Sedang memuat materi...
[PaBa] 🔄 Fetching materials from Supabase...
[PaBa] ℹ️  No materials found - showing empty state
[PaBa] ✅ Showing empty state
```

**Error - RLS Permission:**
```
[PaBa] ⏳ Sedang memalu materi...
[PaBa] 🔄 Fetching materials from Supabase...
[PaBa] ❌ Supabase error: permission denied
[PaBa] Error code: PGRST109
[PaBa] Debug Info: RLS Policy Error: Check table "materi" RLS policies...
[PaBa] ⚠️  Showing error state: ❌ Akses ditolak. Periksa RLS policy...
```

---

## 📝 Checklist - Step by Step

- [ ] 1. Buka https://app.supabase.com
- [ ] 2. Login & pilih project PaBa
- [ ] 3. Buka SQL Editor
- [ ] 4. Copy query dari [INSERT_MATERI_DATA.sql](INSERT_MATERI_DATA.sql)
- [ ] 5. Paste ke SQL Editor
- [ ] 6. Click "RUN" atau Ctrl+Enter
- [ ] 7. Tunggu "Query executed successfully"
- [ ] 8. Jalankan verify query: `SELECT COUNT(*) FROM materi;`
- [ ] 9. Check apakah count sudah bertambah 5
- [ ] 10. Buka http://localhost:8000/index.html
- [ ] 11. Check console - harus show "Materials loaded: 5 items"
- [ ] 12. Check sidebar - materi harus visible
- [ ] 13. Click materi - harus show content di main panel
- [ ] 14. Done! ✅

---

## 🆘 Troubleshooting

### Q: SQL error "unexpected token"
**A:** Copy-paste dengan lengkap, jangan ada tanda kurung/tanda kutip yang terpotong

### Q: Data masuk tapi tidak tampil di frontend
**A:** 
1. Check RLS policy - harus allow SELECT untuk public/anon
2. Run verify query di SQL Editor
3. Refresh browser & clear cache (Ctrl+Shift+Del)
4. Check console untuk error messages

### Q: Kolom konten tidak ada
**A:** Create tabel dengan: `CREATE TABLE ... (konten_asli TEXT, ...)`

### Q: UUID tidak generate otomatis
**A:** Pastikan column definition punya: `DEFAULT gen_random_uuid()`

---

## 📚 Reference

- File SQL: [INSERT_MATERI_DATA.sql](INSERT_MATERI_DATA.sql)
- Code Implementation: [script.js](script.js) - fungsi `fetchMaterials()` & `showSidebarState()`
- Error Handling Guide: [COMPLETE_IMPLEMENTATION_GUIDE.md](COMPLETE_IMPLEMENTATION_GUIDE.md)

---

**Selamat! Data materi Anda siap untuk diinsert ke Supabase! 🚀**
