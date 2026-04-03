/**
 * ============================================================
 * Contoh Penggunaan Supabase Client
 * ============================================================
 * 
 * File ini menunjukkan cara menggunakan supabase.js untuk:
 * 1. Database operations (SELECT, INSERT, UPDATE, DELETE)
 * 2. Autentikasi (Sign up, Sign in, Sign out)
 * 3. Real-time subscriptions
 * 
 * ============================================================
 */

'use strict';

import { 
  initializeSupabase, 
  getSupabaseClient, 
  isSupabaseReady 
} from './supabase.js';

/**
 * DATABASE OPERATIONS
 * ============================================================
 */

/**
 * Fetch semua materi dari tabel 'materi'
 * 
 * @returns {Promise<Array|null>} Array materi atau null jika error
 */
async function fetchAllMaterials() {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    console.error('Supabase client belum siap');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('materi')
      .select('id, judul, konten_asli, konten_genz, kategori, url_meme')
      .order('id', { ascending: true });

    if (error) throw error;

    console.log('✅ Berhasil fetch materi:', data?.length);
    return data;
  } catch (error) {
    console.error('❌ Gagal fetch materi:', error.message);
    return null;
  }
}

/**
 * Fetch materi berdasarkan kategori
 * 
 * @param {string} kategori - Kategori materi
 * @returns {Promise<Array|null>}
 */
async function fetchMateriasByCategory(kategori) {
  const supabase = getSupabaseClient();
  
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('materi')
      .select('*')
      .eq('kategori', kategori);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('❌ Gagal fetch materi by kategori:', error.message);
    return null;
  }
}

/**
 * Insert materi baru (hanya admin yang bisa)
 * 
 * @param {Object} materi - Objek materi baru
 * @returns {Promise<Object|null>} Data materi yang baru dibuat atau null
 */
async function insertMaterial(materi) {
  const supabase = getSupabaseClient();
  
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('materi')
      .insert([materi])
      .select();

    if (error) throw error;

    console.log('✅ Materi berhasil ditambahkan:', data);
    return data?.[0] || null;
  } catch (error) {
    console.error('❌ Gagal insert materi:', error.message);
    return null;
  }
}

/**
 * Update materi yang sudah ada
 * 
 * @param {number} id - ID materi
 * @param {Object} updates - Object dengan field yang ingin diupdate
 * @returns {Promise<Object|null>}
 */
async function updateMaterial(id, updates) {
  const supabase = getSupabaseClient();
  
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('materi')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;

    console.log('✅ Materi berhasil diupdate:', data);
    return data?.[0] || null;
  } catch (error) {
    console.error('❌ Gagal update materi:', error.message);
    return null;
  }
}

/**
 * Delete materi
 * 
 * @param {number} id - ID materi
 * @returns {Promise<boolean>} true jika berhasil
 */
async function deleteMaterial(id) {
  const supabase = getSupabaseClient();
  
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('materi')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log('✅ Materi berhasil dihapus');
    return true;
  } catch (error) {
    console.error('❌ Gagal delete materi:', error.message);
    return false;
  }
}

/**
 * AUTENTIKASI
 * ============================================================
 */

/**
 * Sign up pengguna baru dengan email dan password
 * 
 * @param {string} email - Email pengguna
 * @param {string} password - Password (min 6 karakter)
 * @returns {Promise<Object|null>} User data atau null jika gagal
 */
async function signUpUser(email, password) {
  const supabase = getSupabaseClient();
  
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    console.log('✅ Sign up berhasil. Cek email untuk konfirmasi.');
    return data?.user || null;
  } catch (error) {
    console.error('❌ Gagal sign up:', error.message);
    return null;
  }
}

/**
 * Sign in pengguna dengan email dan password
 * 
 * @param {string} email - Email pengguna
 * @param {string} password - Password
 * @returns {Promise<Object|null>} Session data atau null jika gagal
 */
async function signInUser(email, password) {
  const supabase = getSupabaseClient();
  
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    console.log('✅ Sign in berhasil');
    console.log('👤 User:', data?.user?.email);
    console.log('🔑 Session token:', data?.session?.access_token?.substring(0, 20) + '...');
    
    return data?.session || null;
  } catch (error) {
    console.error('❌ Gagal sign in:', error.message);
    return null;
  }
}

/**
 * Sign out pengguna
 * 
 * @returns {Promise<boolean>} true jika berhasil
 */
async function signOutUser() {
  const supabase = getSupabaseClient();
  
  if (!supabase) return false;

  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    console.log('✅ Sign out berhasil');
    return true;
  } catch (error) {
    console.error('❌ Gagal sign out:', error.message);
    return false;
  }
}

/**
 * Get current user yang sedang logged in
 * 
 * @returns {Promise<Object|null>} User object atau null
 */
async function getCurrentUser() {
  const supabase = getSupabaseClient();
  
  if (!supabase) return null;

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) throw error;

    if (user) {
      console.log('👤 Current user:', user.email);
    } else {
      console.log('❓ No user logged in');
    }

    return user;
  } catch (error) {
    console.error('❌ Gagal get current user:', error.message);
    return null;
  }
}

/**
 * Get current session
 * 
 * @returns {Promise<Object|null>} Session object atau null
 */
async function getCurrentSession() {
  const supabase = getSupabaseClient();
  
  if (!supabase) return null;

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) throw error;

    return session;
  } catch (error) {
    console.error('❌ Gagal get session:', error.message);
    return null;
  }
}

/**
 * Listen to authentication state changes
 * 
 * @param {Function} callback - Callback function(event, session)
 * @returns {Function} Unsubscribe function
 */
function onAuthStateChange(callback) {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    console.error('Supabase client belum siap');
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log(`🔐 Auth event: ${event}`);
      callback(event, session);
    }
  );

  // Return unsubscribe function
  return () => {
    subscription?.unsubscribe();
  };
}

/**
 * REAL-TIME SUBSCRIPTIONS
 * ============================================================
 */

/**
 * Subscribe to real-time changes di tabel materi
 * 
 * @param {Function} callback - Callback function(payload)
 * @returns {Function} Unsubscribe function
 */
function subscribeToMaterialChanges(callback) {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    console.error('Supabase client belum siap');
    return () => {};
  }

  const subscription = supabase
    .channel('materi_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'materi',
      },
      (payload) => {
        console.log('📡 Real-time update:', payload);
        callback(payload);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(subscription);
  };
}

/**
 * EXPORT SEMUA FUNCTIONS
 * ============================================================
 */
export {
  // Database
  fetchAllMaterials,
  fetchMateriasByCategory,
  insertMaterial,
  updateMaterial,
  deleteMaterial,

  // Autentikasi
  signUpUser,
  signInUser,
  signOutUser,
  getCurrentUser,
  getCurrentSession,
  onAuthStateChange,

  // Real-time
  subscribeToMaterialChanges,
};
