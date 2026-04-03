/**
 * ============================================================
 * Supabase Client Initialization
 * ============================================================
 * 
 * File ini menangani inisialisasi Supabase client dengan
 * proper error handling dan export untuk digunakan di file lain.
 * 
 * Dokumentasi: https://supabase.com/docs/reference/javascript
 * 
 * ============================================================
 */

'use strict';

/**
 * Konfigurasi Supabase
 * Ganti dengan URL dan Anon Key project Anda dari Supabase Dashboard
 * https://app.supabase.com → Settings → API
 */
const SUPABASE_CONFIG = {
  // Format: https://xxxxx.supabase.co
  supabaseUrl: 'https://xeluoexmhsyuthgnqzuw.supabase.co',
  
  // Format: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlbHVvZXhtaHN5dXRoZ25xenV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTcxNjYsImV4cCI6MjA5MDI5MzE2Nn0.vtO9bZopwgEDA5-hfe3sGKHb3g30XLX9LY_uLBMdFFY',
};

/** @type {import('@supabase/supabase-js').SupabaseClient|null} */
let supabaseClient = null;

/**
 * Memvalidasi konfigurasi Supabase
 * 
 * @returns {boolean} true jika konfigurasi valid
 */
function validateConfig() {
  const { supabaseUrl, supabaseAnonKey } = SUPABASE_CONFIG;

  // Cek apakah URL sudah diisi
  if (!supabaseUrl || supabaseUrl.includes('YOUR_SUPABASE_URL')) {
    console.error('[PaBa] ❌ SUPABASE_URL belum dikonfigurasi. Masukkan URL di supabase.js');
    return false;
  }

  // Cek apakah URL format valid
  if (!supabaseUrl.includes('supabase.co')) {
    console.error('[PaBa] ❌ SUPABASE_URL tidak valid. Format: https://xxxxx.supabase.co');
    return false;
  }

  // Cek apakah Anon Key sudah diisi
  if (!supabaseAnonKey || supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY')) {
    console.error('[PaBa] ❌ SUPABASE_ANON_KEY belum dikonfigurasi. Masukkan Anon Key di supabase.js');
    return false;
  }

  // Cek apakah Anon Key format valid (JWT)
  if (!supabaseAnonKey.startsWith('eyJ')) {
    console.error('[PaBa] ❌ SUPABASE_ANON_KEY tidak valid. Harusnya format JWT.');
    return false;
  }

  return true;
}

/**
 * Inisialisasi Supabase Client
 * Dipanggil sekali saat aplikasi startup
 * 
 * @returns {Promise<boolean>} true jika berhasil, false jika gagal
 */
async function initializeSupabase() {
  // Guard: SDK harus ter-load dari CDN
  if (typeof window.supabase === 'undefined') {
    console.error('[PaBa] ❌ Supabase SDK tidak ditemukan. Pastikan <script> tag di index.html.');
    console.info('      Tambahkan: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"><\/script>');
    return false;
  }

  // Guard: Validasi konfigurasi
  if (!validateConfig()) {
    console.error('[PaBa] ❌ Konfigurasi Supabase tidak valid.');
    return false;
  }

  try {
    const { supabaseUrl, supabaseAnonKey } = SUPABASE_CONFIG;

    // Inisialisasi client
    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

    console.log('[PaBa] ✅ Supabase client berhasil diinisialisasi');
    console.log('[PaBa] 📍 Project URL:', supabaseUrl);

    return true;
  } catch (error) {
    console.error('[PaBa] ❌ Gagal menginisialisasi Supabase client:', error.message);
    return false;
  }
}

/**
 * Mendapatkan instance Supabase client yang sudah diinisialisasi
 * 
 * Contoh penggunaan:
 * ```
 * const supabase = getSupabaseClient();
 * const { data, error } = await supabase.from('materi').select('*');
 * ```
 * 
 * @returns {import('@supabase/supabase-js').SupabaseClient|null}
 */
function getSupabaseClient() {
  if (!supabaseClient) {
    console.warn('[PaBa] ⚠️  Supabase client belum diinisialisasi. Panggil initializeSupabase() terlebih dahulu.');
    return null;
  }
  return supabaseClient;
}

/**
 * Mengecek apakah Supabase client sudah siap digunakan
 * 
 * @returns {boolean} true jika ready, false jika belum
 */
function isSupabaseReady() {
  return supabaseClient !== null;
}

/**
 * Export functions untuk digunakan di file lain
 * 
 * Contoh:
 * import { initializeSupabase, getSupabaseClient } from './supabase.js';
 * 
 * atau dalam Vanilla JS:
 * const { initializeSupabase, getSupabaseClient } = supabaseModule;
 */
export {
  SUPABASE_CONFIG,
  initializeSupabase,
  getSupabaseClient,
  isSupabaseReady,
};
