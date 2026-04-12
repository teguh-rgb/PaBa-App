# 🔐 PaBa - Row Level Security (RLS) Policy Setup Guide

## Pendahuluan

RLS (Row Level Security) adalah fitur keamanan di Supabase yang mengontrol akses ke baris data berdasarkan authenticated user. Panduan ini menjelaskan RLS policies yang diperlukan untuk PaBa project.

---

## 📋 Tabel yang Memerlukan RLS

### 1. Tabel `materi` (Public Reading)
**Tujuan:** Semua user (authenticated & anonymous) bisa membaca materi, tapi hanya admin bisa write.

**Status RLS:** ✅ ENABLED

### 2. Tabel `bookmarks` (User-Specific)
**Tujuan:** Setiap user hanya bisa akses bookmark mereka sendiri.

**Status RLS:** ✅ ENABLED

### 3. Tabel `categories` (Public Reading)
**Tujuan:** Semua user bisa membaca kategori.

**Status RLS:** ✅ ENABLED

---

## 🔧 Setup RLS Policies - Langkah Demi Langkah

### Step 1: Buka Supabase Dashboard

1. Buka https://app.supabase.com
2. Login dengan akun Anda
3. Pilih project "PaBa" (atau sesuai nama project)
4. Di menu kiri, klik **"SQL Editor"** atau **"Tables"**

### Step 2: Enable RLS pada Setiap Tabel

---

## 📑 Policy Details

### TABEL: `materi`

#### Status RLS
```sql
-- Enable RLS untuk tabel materi
ALTER TABLE materi ENABLE ROW LEVEL SECURITY;
```

#### Policy 1: Public Read
**Nama:** `Allow public read`

**Deskripsi:** Siapa saja (authenticated & anonymous) bisa membaca semua baris.

**SQL:**
```sql
CREATE POLICY "Allow public read on materi" ON materi
FOR SELECT
TO anon, authenticated
USING (true);
```

**Testing:**
```sql
-- Cek policy sudah aktif
SELECT * FROM materi;  -- Harus return data, tidak error
```

#### Policy 2: Authenticated Users Update (Optional)
**Nama:** `Allow authenticated users to update`

**Deskripsi:** User authenticated bisa update materi mereka sendiri (kalau ada user_id column).

**SQL:**
```sql
-- Jika ada user_id column untuk track author:
CREATE POLICY "Allow users to update own materi" ON materi
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());
```

#### Policy 3: Admin Only Delete (Optional)
**Nama:** `Allow admin to delete`

**Deskripsi:** Hanya admin yang bisa delete materi.

**SQL:**
```sql
-- Requires admin role or is_admin flag
CREATE POLICY "Allow admin to delete materi" ON materi
FOR DELETE
TO authenticated
USING (auth.role() = 'supabase_admin' OR is_admin = true);
```

---

### TABEL: `bookmarks`

**Tujuan:** Private user bookmarks - setiap user hanya bisa akses data mereka sendiri.

#### Status RLS
```sql
-- Enable RLS untuk tabel bookmarks
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
```

#### Policy 1: User Can Read Own Bookmarks
**Nama:** `Allow users to read own bookmarks`

**Deskripsi:** User hanya bisa baca bookmark mereka sendiri.

**SQL:**
```sql
CREATE POLICY "Allow users to read own bookmarks" ON bookmarks
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

#### Policy 2: User Can Create Bookmarks
**Nama:** `Allow users to insert own bookmarks`

**Deskripsi:** User bisa create bookmark hanya dengan user_id mereka sendiri.

**SQL:**
```sql
CREATE POLICY "Allow users to insert own bookmarks" ON bookmarks
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
```

#### Policy 3: User Can Update Own Bookmarks
**Nama:** `Allow users to update own bookmarks`

**Deskripsi:** User bisa update bookmark mereka sendiri.

**SQL:**
```sql
CREATE POLICY "Allow users to update own bookmarks" ON bookmarks
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

#### Policy 4: User Can Delete Own Bookmarks
**Nama:** `Allow users to delete own bookmarks`

**Deskripsi:** User bisa delete bookmark mereka sendiri.

**SQL:**
```sql
CREATE POLICY "Allow users to delete own bookmarks" ON bookmarks
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

---

### TABEL: `categories`

#### Status RLS
```sql
-- Enable RLS untuk tabel categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
```

#### Policy 1: Public Read
**Nama:** `Allow public read on categories`

**Deskripsi:** Semua user bisa membaca kategori.

**SQL:**
```sql
CREATE POLICY "Allow public read on categories" ON categories
FOR SELECT
TO anon, authenticated
USING (true);
```

#### Policy 2: Admin Only Write
**Nama:** `Allow admin to manage categories`

**Deskripsi:** Hanya admin yang bisa create/update/delete kategori.

**SQL:**
```sql
CREATE POLICY "Allow admin to write categories" ON categories
FOR INSERT, UPDATE, DELETE
TO authenticated
USING (auth.role() = 'supabase_admin');
```

---

## 🛠️ Cara Setup di Supabase Dashboard

### Method 1: Via SQL Editor (Recommended)

1. Buka **SQL Editor** di Supabase Dashboard
2. Copy-paste SQL untuk setiap tabel
3. Klik **"Run"** (atau Ctrl+Enter)
4. Check hasil di **"Results"** panel

**Order Setup:**
```
1. Enable RLS on materi
2. Add Policy 1 (public read) on materi
3. Enable RLS on bookmarks
4. Add Policy 1-4 on bookmarks
5. Enable RLS on categories
6. Add Policy 1-2 on categories
```

### Method 2: Via Dashboard UI

1. Buka **Tables** di sidebar
2. Pilih tabel (e.g., `materi`)
3. Klik **tap "RLS"** di atas
4. Toggle **"Enable RLS"**
5. Click **"New Policy"** untuk add policy
6. Isi form dan **"Save"**

---

## ✅ Testing RLS Policies

### Test 1: Public Read Access
```sql
-- Sebagai anonymous user, bisa baca materi?
SELECT * FROM materi LIMIT 1;
-- Expected: ✅ Returns data (jika ada data)
```

### Test 2: Authenticated User Bookmarks
```sql
-- Sebagai authenticated user, bisa insert bookmark?
INSERT INTO bookmarks (user_id, material_id)
VALUES (auth.uid(), 1);
-- Expected: ✅ Success (jika material_id 1 exist)
```

### Test 3: Cannot Read Other User Bookmarks
```sql
-- Sebagai user A, coba read bookmark dari user B
SELECT * FROM bookmarks WHERE user_id = '<user_B_id>';
-- Expected: ❌ 0 rows (tidak boleh akses)
```

---

## 🔍 Troubleshooting RLS Errors

### Error: "Permission denied for schema public"
**Penyebab:** RLS policy tidak ada atau tidak cocok.

**Solusi:**
1. Check apakah RLS sudah enabled untuk tabel
2. Check apakah user sudah login (authenticated)
3. Add appropriate policy sesuai use case

### Error: "No rows returned" (padahal data ada)
**Penyebab:** RLS policy terlalu restrictive atau tidak cocok dengan user role.

**Solusi:**
1. Verify tabel RLS policies di dashboard
2. Check user's role atau auth.uid()
3. Adjust `USING` kondisi jika diperlukan

### Error: "You don't have permission to insert"
**Penyebab:** `WITH CHECK` condition tidak cofok untuk user yang insert.

**Solusi:**
1. Ensure user_id di record match dengan `auth.uid()`
2. Check INSERT policy di tabel
3. Test dengan authenticated user yang sudah login

---

## 📊 Policy Verification Query

Cek semua policies yang sudah ada:

```sql
-- View all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 🔄 Enable/Disable RLS untuk Development

**Development Mode (No RLS):**
```sql
-- Disable RLS untuk testing (HANYA untuk development!)
ALTER TABLE materi DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
```

⚠️ **WARNING:** Jangan disable RLS di production! Data tidak akan ter-protect.

**Production Mode (RLS Enabled):**
```sql
-- Enable RLS sebelum deploy ke production
ALTER TABLE materi ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
```

---

## 🎯 Common Use Cases

### Use Case 1: Public Reading App
**Requirement:** Siapa saja bisa baca data, hanya admin yang bisa write.

**Policies:**
```sql
-- On materi table
CREATE POLICY "Public read" ON materi FOR SELECT USING (true);
CREATE POLICY "Admin write" ON materi FOR INSERT, UPDATE, DELETE 
  USING (auth.role() = 'supabase_admin');
```

### Use Case 2: User-Specific Bookmarks
**Requirement:** Setiap user bisa manage bookmark mereka sendiri.

**Policies:**
```sql
-- On bookmarks table
CREATE POLICY "Users manage own" ON bookmarks FOR ALL
  USING (user_id = auth.uid());
```

### Use Case 3: Mixed Access
**Requirement:** Public read + user-specific inserts.

**Policies:**
```sql
CREATE POLICY "Public read" ON materi FOR SELECT USING (true);
CREATE POLICY "Public read bookmarks" ON bookmarks FOR SELECT USING (true);
CREATE POLICY "User create own bookmarks" ON bookmarks FOR INSERT 
  WITH CHECK (user_id = auth.uid());
```

---

## ✨ Best Practices

1. ✅ **Always enable RLS in production** - Protects user data
2. ✅ **Use `auth.uid()` for user checks** - Safe way to reference current user
3. ✅ **Test policies thoroughly** - Before deploying
4. ✅ **Document policies** - For future maintainers
5. ✅ **Use clear policy names** - E.g., "Allow users to read own posts"
6. ❌ **Don't use USING (true)** on sensitive data - Too permissive
7. ❌ **Don't disable RLS for convenience** - Always use proper policies

---

## 📞 References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [Supabase Auth Functions](https://supabase.com/docs/reference/sql/functions)

---

## 🚀 Next Steps

1. ✅ Buka Supabase Dashboard
2. ✅ Enable RLS pada ketiga tabel
3. ✅ Copy-paste SQL policies dari panduan ini
4. ✅ Test akses dengan authenticated & anonymous users
5. ✅ Monitor console di app untuk error messages
6. ✅ Adjust policies jika diperlukan

Setelah RLS setup selesai, app Anda akan lebih aman dan user data akan ter-protect dengan baik! 🎉
