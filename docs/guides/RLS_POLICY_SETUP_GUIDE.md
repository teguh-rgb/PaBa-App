# Row Level Security PaBa

Project Supabase yang saat ini dikonfigurasi memakai `public.materi.id` UUID dan telah mengekspos `public.bookmarks`. Skema migration repo berbeda (`bigint`), jadi jangan jalankan migration itu pada project aktif. Status RLS, policy aktif, serta foreign key ke `auth.users` dan `public.materi` belum dapat dipastikan dengan akses anon; pemilik project harus memverifikasinya sebelum mengandalkan isolasi bookmark antar-akun.

## Perilaku yang harus dipastikan

### Materi

- RLS aktif.
- Role browser `anon` dan `authenticated` hanya dapat membaca materi yang memang publik.
- Operasi tulis materi tidak tersedia bagi browser.

### Bookmark

- RLS aktif.
- Role `authenticated` hanya dapat `SELECT`, `INSERT`, dan `DELETE` baris dengan `user_id = auth.uid()`.
- Role `anon` tidak dapat membaca atau mengubah bookmark.
- `material_id` merujuk ke `public.materi.id` UUID.
- `user_id` merujuk ke `auth.users.id`; jika sesuai kebijakan retensi, foreign key akun dapat menghapus bookmark terkait ketika akun dihapus.

## Pemeriksaan read-only

Jalankan query berikut di SQL Editor project yang benar. Query ini hanya membaca katalog database:

```sql
select n.nspname as schema_name, c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('materi', 'bookmarks');

select schemaname, tablename, policyname, permissive, roles,
       cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('materi', 'bookmarks')
order by tablename, policyname;

select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.bookmarks'::regclass
  and contype = 'f'
order by conname;
```

Pastikan policy bookmark membatasi baca/hapus melalui `user_id = auth.uid()` dan insert memeriksa `user_id = auth.uid()` pada `WITH CHECK`. Pastikan foreign key menunjuk ke kolom UUID yang benar. Uji isolasi dengan dua akun milik sendiri; hasil SELECT anonim yang kosong saja tidak membuktikan seluruh policy benar.

Jangan menonaktifkan RLS, memberi akses tulis publik, atau menaruh service-role key pada frontend. Jika policy atau grant perlu diperbaiki, sesuaikan berdasarkan hasil pemeriksaan skema aktual dan tinjau perubahan sebelum menjalankannya.
