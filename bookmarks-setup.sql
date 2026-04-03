-- ============================================================
-- PaBa Bookmarks Database Schema Setup
-- ============================================================
-- 
-- File SQL ini membuat tabel 'bookmarks' di Supabase.
-- 
-- HOW TO USE:
-- 1. Buka Supabase Dashboard → SQL Editor
-- 2. Buat query baru
-- 3. Copy & paste script ini
-- 4. Jalankan (klik ▶ Execute atau Ctrl+Enter)
-- 
-- ============================================================

-- ============================================================
-- 1. CREATE TABLE: bookmarks
-- ============================================================

CREATE TABLE bookmarks (
  -- Primary key: UUID auto-generated
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key: user_id from auth.users
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Foreign key: material_id from materi table
  material_id INT NOT NULL REFERENCES materi(id) ON DELETE CASCADE,

  -- Timestamp when bookmark was created
  created_at TIMESTAMP DEFAULT now(),

  -- Constraint: Prevent duplicate bookmarks (one user can't bookmark same material twice)
  UNIQUE(user_id, material_id)
);

-- ============================================================
-- 2. CREATE INDEXES — Optimize performance
-- ============================================================

-- Index untuk fast lookup by user_id
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);

-- Index untuk fast lookup by material_id
CREATE INDEX idx_bookmarks_material_id ON bookmarks(material_id);

-- Index untuk ordering by created_at
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- ============================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS) — Protect user's data
-- ============================================================

-- Enable RLS on bookmarks table
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. CREATE RLS POLICIES
-- ============================================================

-- POLICY 1: Users can only see/insert their own bookmarks
CREATE POLICY "Users can view their own bookmarks" 
  ON bookmarks 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- POLICY 2: Users can insert bookmarks for themselves
CREATE POLICY "Users can insert bookmarks for themselves" 
  ON bookmarks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- POLICY 3: Users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks" 
  ON bookmarks 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- POLICY 4: Users cannot update bookmarks directly
-- (If needed, can create UPDATE policy similar to others)

-- ============================================================
-- 5. VERIFY Setup
-- ============================================================

-- This query shows the bookmarks table structure
-- SELECT * FROM information_schema.columns WHERE table_name='bookmarks';

-- This query counts total bookmarks
-- SELECT COUNT(*) as total_bookmarks FROM bookmarks;

-- ============================================================
-- NOTES
-- ============================================================
-- 
-- ✅ auth.uid() — Built-in function dari Supabase
--    Returns UUID dari user yang sedang login
--    Returns NULL jika user tidak login
-- 
-- ✅ ON DELETE CASCADE — Otomatis hapus bookmark jika:
--    - User dihapus dari auth.users
--    - Material dihapus dari materi
-- 
-- ✅ RLS Policies — Memastikan:
--    - User hanya bisa lihat bookmark mereka sendiri
--    - User tidak bisa modifikasi bookmark user lain
--    - Anonymous user tidak bisa akses
-- 
-- ✅ UNIQUE constraint — Mencegah duplicate:
--    - Satu user tidak bisa bookmark material yang sama 2x
-- 
-- ============================================================
