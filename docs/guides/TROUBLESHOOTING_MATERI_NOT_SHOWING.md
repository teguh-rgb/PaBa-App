# Troubleshooting materi tidak tampil

PaBa mengutamakan data Supabase ketika project baru sudah dikonfigurasi. Jika konfigurasi kosong, database belum di-seed, atau koneksi/query gagal, aplikasi menampilkan katalog lokal lima materi dan pesan status beserta tombol **Coba Lagi**.

## Materi lokal juga tidak tampil

1. Sajikan repository melalui HTTP (Live Server atau web server lokal), bukan membuka `index.html` sebagai `file://`.
2. Periksa tab Console browser untuk kesalahan module atau JavaScript.
3. Pastikan [katalog lokal](../../data/materials.js) diekspor dan diimpor oleh `script.js`.
4. Gunakan field `id`, `judul`, `konten_asli`, `konten_sederhana`/`konten_genz`, `kategori`, dan `sort_order`.

## Katalog lokal tampil, tetapi data Supabase tidak

1. Pastikan [supabase.js](../../supabase.js) berisi URL project baru dan publishable/anon key yang benar. Jangan gunakan service-role key.
2. Jalankan [migration](../../supabase/migrations/20261024000100_create_reading_schema.sql), lalu [seed](../../supabase/seed.sql) sesuai [panduan setup](SUPABASE_SETUP.md).
3. Di SQL Editor, jalankan:

   ```sql
   select count(*) from public.materi;
   select slug, judul, sort_order from public.materi order by sort_order, id;
   ```

4. Periksa konfigurasi project **Authentication → URL Configuration** hanya jika login atau bookmark yang bermasalah.

## Makna error umum

- **Supabase belum dikonfigurasi** — konstanta URL/key kosong. Materi lokal tetap tersedia; isi konfigurasi setelah project baru dibuat.
- **`PGRST205` / relation tidak ditemukan** — migration belum diterapkan atau skema API belum diperbarui.
- **`permission denied` / HTTP 401** — periksa grant/RLS pada migration serta key publishable/anon. Jangan menonaktifkan RLS untuk menghilangkan error.
- **Data kosong** — seed belum dijalankan; fallback lokal tetap ditampilkan sampai materi remote tersedia.
- **Login gagal** — autentikasi membutuhkan project Supabase baru dan Site URL/Redirect URLs yang cocok.

Jika database gagal dibaca, jangan menghapus katalog fallback. Kirimkan kode error Supabase (tanpa token/kunci) untuk diagnosis lebih lanjut.
