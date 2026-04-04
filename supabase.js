/**
 * ============================================================
 * Supabase Client Initialization (ESM)
 * ============================================================
 * 
 * File ini menangani inisialisasi Supabase client dengan
 * ESM imports dari CDN, tanpa memerlukan build tool.
 * 
 * Dokumentasi: https://supabase.com/docs/reference/javascript
 * 
 * ============================================================
 */

// Import createClient dari Supabase JS SDK (ESM via CDN)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

/**
 * Konfigurasi Supabase
 * Ambil dari Supabase Dashboard: https://app.supabase.com → Settings → API
 */
const SUPABASE_URL = 'https://xeluoexmhsyuthgnqzuw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlbHVvZXhtaHN5dXRoZ25xenV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTcxNjYsImV4cCI6MjA5MDI5MzE2Nn0.vtO9bZopwgEDA5-hfe3sGKHb3g30XLX9LY_uLBMdFFY';

/**
 * Validasi konfigurasi Supabase
 * @throws {Error} jika konfigurasi tidak valid
 */
function validateConfig() {
  // Cek apakah URL sudah diisi
  if (!SUPABASE_URL || SUPABASE_URL.includes('YOUR_SUPABASE_URL')) {
    throw new Error('[PaBa] ❌ SUPABASE_URL belum dikonfigurasi. Masukkan URL di supabase.js');
  }

  // Cek apakah URL format valid
  if (!SUPABASE_URL.includes('supabase.co')) {
    throw new Error('[PaBa] ❌ SUPABASE_URL tidak valid. Format: https://xxxxx.supabase.co');
  }

  // Cek apakah Anon Key sudah diisi
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')) {
    throw new Error('[PaBa] ❌ SUPABASE_ANON_KEY belum dikonfigurasi. Masukkan Anon Key di supabase.js');
  }

  // Cek apakah Anon Key format valid (JWT)
  if (!SUPABASE_ANON_KEY.startsWith('eyJ')) {
    throw new Error('[PaBa] ❌ SUPABASE_ANON_KEY tidak valid. Harusnya format JWT.');
  }

  console.log('[PaBa] ✅ Konfigurasi Supabase valid');
  console.log('[PaBa] 📍 Project URL:', SUPABASE_URL);
}

/**
 * Inisialisasi dan validasi konfigurasi
 */
try {
  validateConfig();
} catch (error) {
  console.error(error.message);
  throw error;
}

/**
 * Export Supabase client yang sudah siap digunakan
 * 
 * Penggunaan di file lain:
 * ```
 * import { supabase } from './supabase.js';
 * 
 * // Query contoh
 * const { data, error } = await supabase.from('materi').select('*');
 * ```
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('[PaBa] ✅ Supabase client berhasil diinisialisasi');
