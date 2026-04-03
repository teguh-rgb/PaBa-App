/**
 * ============================================================
 * Supabase Bookmarks Module
 * ============================================================
 * 
 * File ini menangani operasi bookmark dengan Supabase Database.
 * Menggantikan localStorage dengan database Supabase untuk:
 * - Persistent bookmarks di cloud
 * - User dapat akses bookmarks dari device berbeda
 * - Sync real-time dengan user lain
 * 
 * DATABASE SCHEMA:
 * Table: bookmarks
 * ├── id           (uuid)  — Primary key
 * ├── user_id      (uuid)  — Reference ke auth.users(id)
 * ├── material_id  (int)   — Reference ke materi(id)
 * ├── created_at   (timestamp)
 * └── unique constraint: (user_id, material_id)
 * 
 * ============================================================
 */

'use strict';

import { getSupabaseClient, isSupabaseReady } from './supabase.js';
import { checkUserStatus } from './auth.js';

/**
 * ============================================================
 * TOGGLE BOOKMARK — Save/Unsave Material
 * ============================================================
 * 
 * Toggle bookmark status untuk material tertentu.
 * Jika user belum login → alert user untuk login
 * Jika bookmark belum ada → tambahkan (INSERT)
 * Jika bookmark sudah ada → hapus (DELETE)
 * 
 * @param {number} materialId - ID material yang akan disave/unsave
 * @returns {Promise<{success: boolean, isSaved: boolean, message: string}>}
 */
async function toggleBookmark(materialId) {
  // Validasi input
  if (!materialId || !Number.isFinite(Number(materialId))) {
    const errorMsg = 'Material ID tidak valid';
    console.error('[PaBa] ❌ Toggle Bookmark Error:', errorMsg);
    return {
      success: false,
      isSaved: null,
      message: errorMsg,
    };
  }

  // Step 1: Cek Supabase ready
  if (!isSupabaseReady()) {
    const errorMsg = 'Supabase belum siap. Silakan refresh halaman.';
    console.error('[PaBa] ❌ Toggle Bookmark Error:', errorMsg);
    alert(errorMsg);
    return {
      success: false,
      isSaved: null,
      message: errorMsg,
    };
  }

  // Step 2: Check user status (login check)
  console.log('[PaBa] 🔑 Mengecek status user...');
  const { isLoggedIn, user } = await checkUserStatus();

  if (!isLoggedIn || !user?.id) {
    const errorMsg = 'Anda harus login untuk menyimpan bookmark';
    console.error('[PaBa] ❌ Toggle Bookmark Error:', errorMsg);
    alert('❌ ' + errorMsg);
    return {
      success: false,
      isSaved: null,
      message: errorMsg,
    };
  }

  const userId = user.id;
  console.log('[PaBa] ✅ User authenticated:', user.email);

  try {
    const supabase = getSupabaseClient();

    // Step 3: Check if bookmark already exists
    console.log('[PaBa] 🔍 Mengecek bookmark yang sudah ada...');

    const { data: existingBookmark, error: checkError } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('material_id', materialId)
      .maybeSingle(); // Expect 0 or 1 row

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows, yang normal
      throw checkError;
    }

    // Step 4: If exists → DELETE (unsave)
    if (existingBookmark) {
      console.log('[PaBa] 🗑️  Menghapus bookmark...');

      const { error: deleteError } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', existingBookmark.id);

      if (deleteError) throw deleteError;

      const successMsg = '✅ Bookmark dihapus';
      console.log('[PaBa]', successMsg);

      return {
        success: true,
        isSaved: false,
        message: successMsg,
      };
    }

    // Step 5: If not exists → INSERT (save)
    console.log('[PaBa] 💾 Menyimpan bookmark...');

    const { data: newBookmark, error: insertError } = await supabase
      .from('bookmarks')
      .insert([
        {
          user_id: userId,
          material_id: materialId,
        },
      ])
      .select('id')
      .single();

    if (insertError) throw insertError;

    const successMsg = '✅ Bookmark disimpan';
    console.log('[PaBa]', successMsg);
    console.log('     Bookmark ID:', newBookmark.id);

    return {
      success: true,
      isSaved: true,
      message: successMsg,
    };
  } catch (error) {
    const errorMsg = error.message || 'Gagal toggle bookmark';
    console.error('[PaBa] ❌ Toggle Bookmark Exception:', errorMsg);
    console.error('     Details:', error);

    // User-friendly error message
    let userMsg = errorMsg;
    if (errorMsg.includes('duplicate')) {
      userMsg = 'Bookmark sudah ada';
    }

    alert('❌ ' + userMsg);

    return {
      success: false,
      isSaved: null,
      message: errorMsg,
    };
  }
}

/**
 * ============================================================
 * CHECK BOOKMARK STATUS — Is Material Bookmarked?
 * ============================================================
 * 
 * Cek apakah material tertentu sudah disave user.
 * 
 * @param {number} materialId - ID material
 * @returns {Promise<boolean>} true jika bookmarked, false jika tidak
 */
async function isBookmarked(materialId) {
  if (!materialId || !Number.isFinite(Number(materialId))) {
    console.warn('[PaBa] ⚠️  Material ID tidak valid');
    return false;
  }

  if (!isSupabaseReady()) {
    console.warn('[PaBa] ⚠️  Supabase belum siap');
    return false;
  }

  try {
    const { isLoggedIn, user } = await checkUserStatus();

    if (!isLoggedIn || !user?.id) {
      return false; // User not logged in
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('material_id', materialId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data; // true jika data ada, false jika tidak
  } catch (error) {
    console.error('[PaBa] ❌ Check Bookmark Error:', error.message);
    return false;
  }
}

/**
 * ============================================================
 * GET USER BOOKMARKS — Fetch All User's Bookmarks
 * ============================================================
 * 
 * Ambil semua bookmark milik user saat ini.
 * 
 * @returns {Promise<Array|null>} Array bookmark objects atau null jika error
 */
async function getUserBookmarks() {
  if (!isSupabaseReady()) {
    console.error('[PaBa] ❌ Supabase belum siap');
    return null;
  }

  try {
    const { isLoggedIn, user } = await checkUserStatus();

    if (!isLoggedIn || !user?.id) {
      console.log('[PaBa] ℹ️  User tidak login');
      return [];
    }

    const supabase = getSupabaseClient();

    console.log('[PaBa] 🔄 Mengambil bookmark user...');

    // Join dengan tabel materi untuk get detail
    const { data, error } = await supabase
      .from('bookmarks')
      .select(
        `
        id,
        material_id,
        created_at,
        materi:material_id (
          id,
          judul,
          konten_asli,
          konten_genz,
          kategori,
          url_meme
        )
        `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('[PaBa] ✅ Bookmark berhasil diambil:', data?.length || 0);

    return data || [];
  } catch (error) {
    const errorMsg = error.message || 'Gagal mengambil bookmark';
    console.error('[PaBa] ❌ Get Bookmarks Error:', errorMsg);
    return null;
  }
}

/**
 * ============================================================
 * GET BOOKMARK COUNT — Count User's Bookmarks
 * ============================================================
 * 
 * Hitung jumlah total bookmark milik user.
 * 
 * @returns {Promise<number|null>} Jumlah bookmark atau null jika error
 */
async function getBookmarkCount() {
  if (!isSupabaseReady()) {
    return null;
  }

  try {
    const { isLoggedIn, user } = await checkUserStatus();

    if (!isLoggedIn || !user?.id) {
      return 0;
    }

    const supabase = getSupabaseClient();

    const { count, error } = await supabase
      .from('bookmarks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) throw error;

    console.log('[PaBa] 📊 Bookmark count:', count);
    return count || 0;
  } catch (error) {
    console.error('[PaBa] ❌ Get Bookmark Count Error:', error.message);
    return null;
  }
}

/**
 * ============================================================
 * DELETE BOOKMARK — Remove Specific Bookmark
 * ============================================================
 * 
 * Hapus bookmark tertentu berdasarkan material_id.
 * 
 * @param {number} materialId - ID material
 * @returns {Promise<boolean>} true jika berhasil, false jika gagal
 */
async function removeBookmark(materialId) {
  if (!materialId || !Number.isFinite(Number(materialId))) {
    console.error('[PaBa] ❌ Material ID tidak valid');
    return false;
  }

  if (!isSupabaseReady()) {
    console.error('[PaBa] ❌ Supabase belum siap');
    return false;
  }

  try {
    const { isLoggedIn, user } = await checkUserStatus();

    if (!isLoggedIn || !user?.id) {
      console.error('[PaBa] ❌ User tidak login');
      return false;
    }

    const supabase = getSupabaseClient();

    console.log('[PaBa] 🗑️  Menghapus bookmark material:', materialId);

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('material_id', materialId);

    if (error) throw error;

    console.log('[PaBa] ✅ Bookmark berhasil dihapus');
    return true;
  } catch (error) {
    console.error('[PaBa] ❌ Remove Bookmark Error:', error.message);
    return false;
  }
}

/**
 * ============================================================
 * CLEAR ALL BOOKMARKS — Delete All User's Bookmarks
 * ============================================================
 * 
 * Hapus semua bookmark milik user (dengan konfirmasi).
 * 
 * @returns {Promise<boolean>} true jika berhasil
 */
async function clearAllBookmarks() {
  if (!isSupabaseReady()) {
    console.error('[PaBa] ❌ Supabase belum siap');
    return false;
  }

  try {
    const { isLoggedIn, user } = await checkUserStatus();

    if (!isLoggedIn || !user?.id) {
      console.error('[PaBa] ❌ User tidak login');
      return false;
    }

    // Confirm with user
    if (!confirm('Yakin ingin menghapus semua bookmark?')) {
      console.log('[PaBa] ℹ️  Clear bookmarks dibatalkan user');
      return false;
    }

    const supabase = getSupabaseClient();

    console.log('[PaBa] 🔄 Menghapus semua bookmark...');

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;

    console.log('[PaBa] ✅ Semua bookmark berhasil dihapus');
    alert('✅ Semua bookmark berhasil dihapus');
    return true;
  } catch (error) {
    const errorMsg = error.message || 'Gagal menghapus bookmark';
    console.error('[PaBa] ❌ Clear Bookmarks Error:', errorMsg);
    alert('❌ ' + errorMsg);
    return false;
  }
}

/**
 * ============================================================
 * SUBSCRIBE TO BOOKMARK CHANGES — Real-time Updates
 * ============================================================
 * 
 * Subscribe ke perubahan bookmark real-time.
 * Callback akan dipanggil ketika ada insert/update/delete.
 * 
 * @param {Function} callback - Callback function(payload)
 * @returns {Object|null} Subscription object
 */
function subscribeToBookmarkChanges(callback) {
  if (!isSupabaseReady()) {
    console.error('[PaBa] ❌ Supabase belum siap');
    return null;
  }

  try {
    const supabase = getSupabaseClient();

    console.log('[PaBa] 📡 Setting up bookmark changes listener...');

    const subscription = supabase
      .channel('bookmarks-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'bookmarks',
        },
        (payload) => {
          console.log('[PaBa] 📡 Bookmark change:', payload.eventType);
          callback(payload);
        }
      )
      .subscribe();

    return subscription;
  } catch (error) {
    console.error('[PaBa] ❌ Subscribe Bookmark Error:', error.message);
    return null;
  }
}

/**
 * ============================================================
 * EXPORT SEMUA FUNCTIONS
 * ============================================================
 */
export {
  toggleBookmark,
  isBookmarked,
  getUserBookmarks,
  getBookmarkCount,
  removeBookmark,
  clearAllBookmarks,
  subscribeToBookmarkChanges,
};
