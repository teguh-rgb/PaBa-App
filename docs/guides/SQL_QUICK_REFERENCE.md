# PaBa database quick reference

Use the current schema and data from:

- [Supabase setup guide](SUPABASE_SETUP.md)
- [Migration](../../supabase/migrations/20261024000100_create_reading_schema.sql)
- [Idempotent seed](../../supabase/seed.sql)

Run the migration before the seed. The seed imports the five source materials and validates that all five stable slugs exist. Re-running it does not insert duplicate rows or overwrite edited content.

## Validate material count and order

```sql
select count(*) as total_materi from public.materi;

select id, slug, judul, kategori, sort_order,
       length(konten_asli) as panjang_asli,
       length(coalesce(konten_sederhana, konten_genz, '')) as panjang_sederhana
from public.materi
order by sort_order, id;
```

The seed validation checks the five source slugs, not the global table count. Additional user-authored materials are allowed.

## Add a new material

Create a stable, unique `slug`, retain the original text in `konten_asli`, and add a reviewed plain-language text in `konten_sederhana`. Keep `konten_genz` only when preserving an existing legacy variant. Do not replace the original with a generated version. For the local/offline catalog, add the same record to `data/materials.js`; keep the `sort_order` unique and sequential where practical.

Reading is public and read-only under RLS. Manage material records through the project dashboard or an authorized migration. Do not add a public insert/update policy and do not use a service-role key in the browser.
