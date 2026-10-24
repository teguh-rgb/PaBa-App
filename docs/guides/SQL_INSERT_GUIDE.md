# Import materi PaBa

Project Supabase lama sudah tidak digunakan. Gunakan project baru dan ikuti [panduan setup aktif](SUPABASE_SETUP.md); jangan memakai URL, tabel, atau policy dari project terdahulu.

## Impor lima materi yang tersedia

1. Jalankan [migration skema](../../supabase/migrations/20261024000100_create_reading_schema.sql) di SQL Editor atau melalui Supabase CLI.
2. Jalankan [seed materi](../../supabase/seed.sql).
3. Seed memakai slug stabil dan `ON CONFLICT DO NOTHING`, sehingga dapat dijalankan ulang tanpa menduplikasi atau menimpa perubahan materi. Validasi di akhir seed menghentikan proses jika lima sumber tidak ada.
4. Jalankan query verifikasi di [quick reference](SQL_QUICK_REFERENCE.md).

Isi materi diturunkan dari lima record yang ditemukan dalam dokumentasi SQL project dan dipertahankan pada `data/materials.js` serta `supabase/seed.sql`. Tidak ada materi dummy yang ditambahkan. `konten_asli` dan varian Gen-Z lama dipertahankan; versi bahasa sederhana baru tersimpan terpisah di `konten_sederhana`.

## Menambahkan materi

Untuk setiap materi baru:

- Buat `slug` unik dan tentukan kategori serta `sort_order`.
- Simpan teks sumber yang telah ditinjau pada `konten_asli`.
- Tambahkan penjelasan sederhana yang setia pada fakta sumber ke `konten_sederhana`.
- Jangan mengisi kolom sederhana dengan teks yang belum diverifikasi.
- Tambahkan record yang sama ke `data/materials.js` agar materi tetap tersedia jika Supabase offline.
- Kelola data remote melalui dashboard atau migration tepercaya. Kebijakan RLS tidak mengizinkan browser anonim mengubah materi.

Gunakan publishable/anon key di frontend hanya untuk operasi baca yang diizinkan. Service-role key, password database, dan secret lain tidak boleh dimasukkan ke repository atau browser.
