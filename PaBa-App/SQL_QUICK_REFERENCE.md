# 📌 Quick SQL Reference - Copy & Paste Ready

Gunakan query di bawah langsung di Supabase SQL Editor.

---

## ✅ INSERT 5 Data Materi

### Option 1: Copy Sekaligus (Recommended)

Buka file [INSERT_MATERI_DATA.sql](INSERT_MATERI_DATA.sql) dan copy seluruh isinya.

### Option 2: Copy Per Query

Salin query di bawah satu per satu ke SQL Editor:

```sql
-- 1. Cara Mengenal Huruf b dan d
INSERT INTO materi (judul, konten_asli, konten_genz, kategori)
VALUES (
  'Cara Mengenal Huruf b dan d',
  'Huruf ''b'' dan ''d'' sering tertukar pada pembaca disleksia. Cara membedakannya: huruf ''b'' memiliki bola di sebelah kanan garis vertikal, sedangkan huruf ''d'' memiliki bola di sebelah kiri. Ingat: ''b'' untuk Before (sebelum) bola, ''d'' untuk Different (beda) posisi bola. Latihan: tuliskan huruf-huruf ini berkali-kali hingga otomatis membedakannya.',
  'Nah, gimana cara bedain huruf ''b'' sama ''d''? Gampang kok! Huruf ''b'' bolaanya di kanan garis, ''d'' bolaanya di kiri. Inget aja: ''b'' = bola di kanan, ''d'' = bola di kiri. Practice makes perfect, yaudah keep drilling sampe jadi autopilot!',
  'Dasar'
);

-- 2. Teknik Membaca Suku Kata
INSERT INTO materi (judul, konten_asli, konten_genz, kategori)
VALUES (
  'Teknik Membaca Suku Kata',
  'Membaca suku kata adalah fondasi kemampuan membaca. Strategi: pisahkan kata menjadi suku-suku lebih kecil. Contoh: "ke-ter-an-gan" dipecah menjadi ke-ter, an-gan. Pendekatan Chunking membantu otak memproses informasi lebih mudah. Untuk disleksia, gunakan warna berbeda pada setiap suku. Latihan: mulai dari kata sederhana seperti "bu-ku", "pu-la-ng", lalu tingkatkan kompleksitas.',
  'Yak, kali ini kita bahas cara bacain suku kata yang benar. Intinya simple: potong-potong aja kata jadi bagian-bagian kecil. Misalnya "ke-ter-an-gan" itu kan "ke-ter" sama "an-gan". Pake warna-warni biar lebih gampang diinget. Start dari yang mudah dulu terus naik level, bro!',
  'Membaca'
);

-- 3. Tips Fokus Saat Membaca
INSERT INTO materi (judul, konten_asli, konten_genz, kategori)
VALUES (
  'Tips Fokus Saat Membaca',
  'Fokus adalah kunci kesuksesan membaca. Tips praktis: (1) Pilih lingkungan sunyi tanpa gangguan, (2) Gunakan penanda (pointer) untuk mengikuti baris, (3) Istirahat setiap 15 menit, (4) Minum air putih cukup untuk konsentrasi, (5) Baca pada waktu Anda paling segar. Hindari multitasking seperti menonton TV sambil membaca. Untuk pembaca disleksia, gunakan format teks dengan spasi lebih lebar dan font yang jelas.',
  'Supaya fokus pas membaca tuh gampang aja: cari tempat yang sunyi, pake pointer (penunjuk) buat follow garis, istirahat tiap 15 menit, minum air yang banyak, pilih waktu pas lagi oke. Jangan deh split focus sambil nonton TV. Yang penting font harusnya besar dan spasi lebar, biar mata nggak capai!',
  'Tips'
);

-- 4. Mengenal Huruf Vokal
INSERT INTO materi (judul, konten_asli, konten_genz, kategori)
VALUES (
  'Mengenal Huruf Vokal',
  'Huruf vokal ada lima: A, E, I, O, U. Setiap vokal memiliki bunyi yang berbeda. Vokal adalah tulang punggung setiap suku kata. Strategi learning: hafal pola bunyi vokal terlebih dahulu sebelum membaca kata utuh. Latihan: dengarkan dan ulangi suara masing-masing vokal sambil melihat bentuk hurufnya. Untuk disleksia, visualisasi warna untuk setiap vokal (misalnya A=merah, E=biru) membantu memori jangka panjang.',
  'Huruf vokal tuh cuma lima: A, E, I, O, U. Masing-masing punya bunyi unik. Ini fondasi semua suku kata. Caranya: hafalin dulu suaranya, terus baru masuk ke kata lengkap. Asyik banget kalo pake warna buat inget: A=merah, E=biru, misalnya. Visual memory itu powerful bro!',
  'Dasar'
);

-- 5. Berlatih Kata Pendek
INSERT INTO materi (judul, konten_asli, konten_genz, kategori)
VALUES (
  'Berlatih Kata Pendek',
  'Latihan dengan kata-kata pendek adalah stepping stone untuk membaca yang kompleks. Mulai dengan kata 2-3 suku seperti: "bu-ku" (buku), "ma-ta" (mata), "ru-mah" (rumah). Kombinasi vokal-konsonan sederhana membangun kepercayaan diri. Progress: (1) Kata 2 suku, (2) Kata 3 suku, (3) Kalimat sederhana. Pengulangan dan panjang latihan: minimal 20 menit per hari. Gunakan flashcard berwarna untuk variasi visual yang menarik.',
  'Yuk kita praktik sama kata-kata pendek yang mudah diingat. Kata 2-3 suku: "bu-ku", "ma-ta", "ru-mah". Ini semua simple kok, jadi build confidence dulu. Terus level up: suku kata → kata panjang → kalimat. Daily practice minimal 20 menit. Pake flashcard warna-warni biar fun dan nggak membosankan!',
  'Latihan'
);
```

---

## 🔍 VERIFIKASI Data

```sql
-- Cek total berapa data yang sudah insert
SELECT COUNT(*) as total_materi FROM materi;

-- Lihat 5 data terbaru
SELECT id, judul, kategori, created_at 
FROM materi 
ORDER BY created_at DESC 
LIMIT 5;

-- Lihat data per kategori
SELECT kategori, COUNT(*) as jumlah 
FROM materi 
GROUP BY kategori 
ORDER BY jumlah DESC;
```

---

## 📋 Struktur Kolom Reference

| Kolom | Type | Wajib | Auto |
|-------|------|-------|------|
| id | UUID | - | ✅ gen_random_uuid() |
| judul | TEXT | ✅ | - |
| konten_asli | TEXT | ✅ | - |
| konten_genz | TEXT | ✅ | - |
| kategori | TEXT | ✅ | - |
| url_meme | TEXT | - | - |
| created_at | TIMESTAMP | - | ✅ NOW() |

---

## ⚡ Tips

- **Jangan delete id** dari INSERT query - Supabase auto-generate!
- **Gunakan 'Run as Admin'** jika RLS error
- **Refresh browser** (Ctrl+Shift+R) setelah insert data
- **Check console** (F12) di frontend untuk debug messages

---

## 📞 Jika Error

1. **"UNIQUE" error** → Judul sudah ada, ubah judul
2. **"RLS" error** → Click "Run as admin" di Supabase
3. **"permission denied"** → Setup RLS policy (baca RLS_POLICY_SETUP_GUIDE.md)
4. **Data tidak tampil** → Check RLS policy allow SELECT

---

**All queries ready to copy-paste! 🚀**
