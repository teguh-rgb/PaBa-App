# Data materi dan setup Supabase PaBa

## Skema project yang sedang dikonfigurasi

Pembacaan langsung pada 24 Oktober 2026 mengonfirmasi `public.materi` tersedia dan memiliki kolom `id` (UUID), `judul`, `konten_asli`, `konten_genz`, `kategori`, `url_meme`, dan `created_at`. Lima materi aktif berhasil dibaca melalui browser.

Frontend hanya meminta kolom tersebut, mengurutkan berdasarkan `id`, dan memakai `konten_genz` sebagai teks mode Gen-Z. ID UUID dipertahankan sebagai identitas materi. Jika query Supabase gagal, aplikasi menampilkan katalog lokal dengan pesan fallback yang jelas; jika query berhasil tetapi tabel kosong, katalog tetap kosong dan status database ditampilkan.

Pembacaan read-only pada `public.bookmarks` berhasil dan relasi PostgREST `materi:material_id` diterima. Tidak ada baris yang terlihat tanpa sesi autentikasi. Kebijakan RLS dan definisi foreign key yang persis belum dapat diperiksa dari akses anon saja; minta pemilik project memverifikasinya melalui katalog database sebelum mengandalkan isolasi akun.

## Inventaris materi

Audit repository menemukan lima materi lengkap di dokumentasi SQL sebelumnya. Judul, kategori, teks asli, dan teks Gen-Z lama dipertahankan pada [katalog fallback lokal](../../data/materials.js) dan [seed SQL](../../supabase/seed.sql). Tidak ditemukan file data materi lain. Materi fallback memungkinkan halaman tetap digunakan ketika database belum dibuat atau tidak dapat dihubungi.

Teks asli menjadi sumber utama. `konten_genz` lama dipertahankan tanpa ditimpa. PaBa juga menyediakan kolom `konten_sederhana` berisi penyajian ulang yang lebih jelas berdasarkan isi asli. Mode Gen-Z memakai `konten_sederhana` terlebih dahulu, kemudian `konten_genz` lama bila versi sederhana belum tersedia. Mode tidak mengirim teks ke AI atau layanan eksternal.

## Skema dan keamanan

Migration [20261024000100_create_reading_schema.sql](../../supabase/migrations/20261024000100_create_reading_schema.sql) adalah skema untuk database terpisah yang baru, bukan skema project aktif. Migration itu mendefinisikan `materi.id` sebagai `bigint` dan membutuhkan kolom `slug`, `konten_sederhana`, serta `sort_order`; struktur tersebut tidak cocok dengan project aktif yang memakai UUID dan tidak memiliki kolom-kolom tersebut. Jangan jalankan migration atau seed tersebut pada project aktif ini.

Untuk database baru yang memang memakai migration tersebut, RLS membatasi baca materi ke `anon`/`authenticated` dan operasi bookmark ke pemilik akun. Tinjau dan sesuaikan skema terlebih dahulu sebelum memakai migration pada project lain.

## Membuat database baru

1. Buat project Supabase baru melalui dashboard. Project ref, URL, dan kunci harus berasal dari project baru.
2. Buka **SQL Editor**, jalankan migration di atas terlebih dahulu.
3. Untuk database baru yang skemanya cocok dengan migration, jalankan [seed.sql](../../supabase/seed.sql). Jangan jalankan seed pada project aktif yang skemanya berbeda.
4. Verifikasi hasil dengan:

   ```sql
   select count(*) as jumlah_materi from public.materi;
   select id, judul, kategori, created_at
   from public.materi
   order by id;
   ```

   Database baru yang hanya memakai seed ini seharusnya berisi **5** materi. Jika ada materi tambahan, jumlah total dapat lebih tinggi.

Migration dan seed juga cocok untuk Supabase CLI. Jalankan `supabase link --project-ref <project-ref-baru>`, lalu `supabase db push`. Seed cloud dapat dijalankan dari SQL Editor atau dengan perintah CLI yang mendukung seed. Jangan menjalankan `db reset` pada database produksi.

## Menghubungkan website

Di [supabase.js](../../supabase.js), konfigurasi aplikasi memakai **Project URL** dan **publishable key/anon key**. Kunci publishable/anon memang digunakan di browser dan bukan kredensial admin. Jangan pernah memasukkan service-role key atau password database ke file frontend. Jangan menyalin atau membagikan nilai kunci dalam laporan.

Jika Supabase tidak dikonfigurasi atau query gagal, aplikasi memakai katalog lokal dan menampilkan pesan status beserta tombol coba lagi. Jika query berhasil tetapi database kosong, aplikasi tidak menyamarkannya dengan materi lokal.

Untuk autentikasi email, atur Site URL dan Redirect URLs pada **Authentication → URL Configuration** sesuai domain deployment dan URL lokal yang digunakan. Operasi bookmark membutuhkan login; membaca materi tidak.

## Font dan pengaturan baca

Mode OpenDyslexic memuat font lokal dari `assets/fonts/`, dilisensikan dengan SIL Open Font License. Lisensinya disertakan bersama font. Browser memeriksa pemuatan font sebelum mengaktifkan mode; jika gagal, mode tidak diaktifkan dan teks standar tetap tersedia.

Ukuran teks, jarak baris, jarak huruf, pilihan font, dan mode bahasa disimpan pada `localStorage` di perangkat. Preferensi tidak disinkronkan ke akun Supabase.

## Menjalankan dan menguji

PaBa tetap berupa aplikasi HTML/CSS/ES modules tanpa build tool atau test runner. Sajikan root repository melalui HTTP, misalnya dengan Live Server, lalu buka `index.html`. Membuka sebagai `file://` dapat menghalangi pemuatan module.

Pengujian browser live mencocokkan katalog dan mode baca terhadap Supabase. Pemeriksaan read-only `public.bookmarks` diterima, tetapi operasi bookmark dan kebijakan RLS per-user belum diverifikasi tanpa akun pengujian.
