/**
 * ============================================================
 * Supabase Authentication Module
 * ============================================================
 * 
 * File ini menangani autentikasi user dengan Supabase:
 * - Sign Up (registrasi user baru)
 * - Sign In (login dengan email & password)
 * - Check User Status (get current user)
 * - Sign Out (logout)
 * 
 * Error handling: console.error untuk debugging, alert untuk user.
 * 
 * ============================================================
 */

'use strict';

import { supabase } from './supabase.js';

/**
 * ============================================================
 * SIGN UP — Registrasi User Baru
 * ============================================================
 * 
 * Membuat user baru dengan email dan password.
 * User akan menerima email konfirmasi untuk verifikasi.
 * 
 * @param {string} email - Email user (format: user@example.com)
 * @param {string} password - Password (minimum 6 karakter)
 * @returns {Promise<{success: boolean, user: Object|null, message: string}>}
 */
async function signUp(email, password) {
  // Validasi input
  if (!email || !password) {
    const errorMsg = 'Email dan password harus diisi';
    console.error('[PaBa] ❌ Sign Up Error:', errorMsg);
    alert(errorMsg);
    return {
      success: false,
      user: null,
      message: errorMsg,
    };
  }

  // Validasi format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const errorMsg = 'Format email tidak valid';
    console.error('[PaBa] ❌ Sign Up Error:', errorMsg);
    alert(errorMsg);
    return {
      success: false,
      user: null,
      message: errorMsg,
    };
  }

  // Validasi panjang password
  if (password.length < 6) {
    const errorMsg = 'Password harus minimal 6 karakter';
    console.error('[PaBa] ❌ Sign Up Error:', errorMsg);
    alert(errorMsg);
    return {
      success: false,
      user: null,
      message: errorMsg,
    };
  }

  try {

    console.log('[PaBa] 🔄 Sedang mendaftarkan user:', email);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/index.html`,
      },
    });

    // Handle error dari Supabase
    if (error) {
      const errorMsg = error.message || 'Gagal mendaftar. Coba lagi.';
      console.error('[PaBa] ❌ Sign Up Error:', errorMsg);
      console.error('     Error Details:', error);

      alert(`❌ Gagal mendaftar: ${errorMsg}`);

      return {
        success: false,
        user: null,
        message: errorMsg,
      };
    }

    // Cek apakah user sudah dibuat
    if (!data?.user) {
      const errorMsg = 'User tidak ditemukan setelah registrasi';
      console.error('[PaBa] ❌ Sign Up Error:', errorMsg);
      alert('Gagal mendaftar. Silakan coba lagi.');
      return {
        success: false,
        user: null,
        message: errorMsg,
      };
    }

    const successMsg = `✅ Pendaftaran berhasil! Cek email Anda untuk verifikasi.`;
    console.log('[PaBa]', successMsg);
    console.log('     Email:', data.user.email);
    console.log('     User ID:', data.user.id);

    alert(successMsg);

    return {
      success: true,
      user: data.user,
      message: successMsg,
    };
  } catch (error) {
    const errorMsg = error.message || 'Terjadi kesalahan saat mendaftar';
    console.error('[PaBa] ❌ Sign Up Exception:', errorMsg);
    console.error('     Stack:', error.stack);

    alert(`❌ Kesalahan: ${errorMsg}`);

    return {
      success: false,
      user: null,
      message: errorMsg,
    };
  }
}

/**
 * ============================================================
 * SIGN IN — Login dengan Email & Password
 * ============================================================
 * 
 * Login user dengan email dan password.
 * Jika berhasil, user akan diarahkan ke index.html.
 * 
 * @param {string} email - Email user
 * @param {string} password - Password
 * @returns {Promise<{success: boolean, session: Object|null, message: string}>}
 */
async function signInWithPassword(email, password) {
  // Validasi input
  if (!email || !password) {
    const errorMsg = 'Email dan password harus diisi';
    console.error('[PaBa] ❌ Sign In Error:', errorMsg);
    alert(errorMsg);
    return {
      success: false,
      session: null,
      message: errorMsg,
    };
  }

  try {

    console.log('[PaBa] 🔄 Sedang login:', email);
    console.log('[PaBa] 🌐 Current URL:', window.location.origin);
    console.log('[PaBa] 🔐 Attempting authentication with Supabase...');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Handle error dari Supabase
    if (error) {
      let errorMsg = error.message || 'Gagal login. Coba lagi.';
      let debugInfo = '';

      // Mapping error message untuk user-friendly
      if (error.message.includes('Invalid login credentials')) {
        errorMsg = 'Email atau password salah';
      } else if (error.message.includes('Email not confirmed')) {
        errorMsg = 'Email belum diverifikasi. Cek email Anda.';
      } else if (error.message.includes('CORS')) {
        errorMsg = 'Masalah koneksi (CORS). Pastikan Site URL di Supabase sesuai dengan URL aplikasi Anda.';
        debugInfo = '\n\nDebug Info:\n' + 
                    '1. Buka https://app.supabase.com\n' +
                    '2. Pilih project → Settings → Auth\n' +
                    '3. Cek "Site URL" dan "Redirect URLs" harus sesuai dengan: ' + window.location.origin;
      }

      console.error('[PaBa] ❌ Sign In Error:', errorMsg);
      console.error('     Error Details:', error);
      console.error('     Error Code:', error.status);
      console.error('     Error Name:', error.__isAuthError);

      alert(`❌ Login gagal: ${errorMsg}${debugInfo}`);

      return {
        success: false,
        session: null,
        message: errorMsg,
      };
    }

    // Cek apakah session berhasil dibuat
    if (!data?.session) {
      const errorMsg = 'Session tidak ditemukan. User mungkin belum diverifikasi.';
      console.error('[PaBa] ❌ Sign In Error:', errorMsg);
      console.error('     Data received:', data);
      alert(
        '⚠️ Email belum diverifikasi.\n\n' +
        'Cek email Anda untuk link verifikasi, kemudian login kembali.'
      );
      return {
        success: false,
        session: null,
        message: errorMsg,
      };
    }

    const successMsg = `✅ Login berhasil!`;
    console.log('[PaBa]', successMsg);
    console.log('     Email:', data.user.email);
    console.log('     User ID:', data.user.id);
    console.log('     Access Token:', data.session.access_token.substring(0, 20) + '...');
    console.log('     Token Expiry:', new Date(data.session.expires_at * 1000));

    // Show success message
    alert(successMsg + `\n\nSelamat datang, ${data.user.email}!`);

    // Redirect ke index.html setelah delay singkat
    console.log('[PaBa] 📍 Redirecting to index.html...');
    console.log('[PaBa] 🕐 Delay: 500ms');
    setTimeout(() => {
      console.log('[PaBa] 🚀 Navigating to index.html');
      window.location.href = 'index.html';
    }, 500);

    return {
      success: true,
      session: data.session,
      message: successMsg,
    };
  } catch (error) {
    const errorMsg = error.message || 'Terjadi kesalahan saat login';
    console.error('[PaBa] ❌ Sign In Exception:', errorMsg);
    console.error('     Stack:', error.stack);
    console.error('     Error Name:', error.name);

    alert(`❌ Kesalahan: ${errorMsg}`);

    return {
      success: false,
      session: null,
      message: errorMsg,
    };
  }
}

/**
 * ============================================================
 * CHECK USER STATUS — Get Current User
 * ============================================================
 * 
 * Mendapatkan data user yang sedang login.
 * Bisa dipanggil kapan saja untuk cek apakah user sudah logged in.
 * 
 * @returns {Promise<{isLoggedIn: boolean, user: Object|null, message: string}>}
 */
async function checkUserStatus() {
  try {

    console.log('[PaBa] 🔍 Mengecek status user...');

    const { data, error } = await supabase.auth.getUser();

    // Handle error dari Supabase
    if (error) {
      // Error 401 Unauthorized = user tidak login
      if (error.status === 401) {
        console.log('[PaBa] ℹ️  Tidak ada user yang login');
        return {
          isLoggedIn: false,
          user: null,
          message: 'User tidak login',
        };
      }

      const errorMsg = error.message || 'Gagal mengecek status user';
      console.error('[PaBa] ❌ Check User Error:', errorMsg);
      return {
        isLoggedIn: false,
        user: null,
        message: errorMsg,
      };
    }

    // Cek apakah ada user data
    if (!data?.user) {
      console.log('[PaBa] ℹ️  Tidak ada user yang login');
      return {
        isLoggedIn: false,
        user: null,
        message: 'No user logged in',
      };
    }

    // User found
    console.log('[PaBa] ✅ User berhasil diambil');
    console.log('     Email:', data.user.email);
    console.log('     User ID:', data.user.id);
    console.log('     Created At:', data.user.created_at);
    console.log('     Last Sign In:', data.user.last_sign_in_at);

    return {
      isLoggedIn: true,
      user: data.user,
      message: 'User logged in',
    };
  } catch (error) {
    const errorMsg = error.message || 'Terjadi kesalahan saat mengecek status user';
    console.error('[PaBa] ❌ Check User Exception:', errorMsg);
    console.error('     Stack:', error.stack);

    return {
      isLoggedIn: false,
      user: null,
      message: errorMsg,
    };
  }
}

/**
 * ============================================================
 * GET CURRENT SESSION
 * ============================================================
 * 
 * Mendapatkan session yang sedang aktif.
 * 
 * @returns {Promise<Object|null>} Session object atau null
 */
async function getCurrentSession() {
  try {

    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[PaBa] ❌ Get Session Error:', error.message);
      return null;
    }

    if (data?.session) {
      console.log('[PaBa] ✅ Session ditemukan');
      console.log('     User:', data.session.user.email);
      console.log('     Expires At:', new Date(data.session.expires_at * 1000));
    } else {
      console.log('[PaBa] ℹ️  Tidak ada session aktif');
    }

    return data?.session || null;
  } catch (error) {
    console.error('[PaBa] ❌ Get Session Exception:', error.message);
    return null;
  }
}

/**
 * ============================================================
 * SIGN OUT — Logout
 * ============================================================
 * 
 * Logout user saat ini.
 * 
 * @returns {Promise<boolean>} true jika berhasil, false jika gagal
 */
async function signOut() {
  try {

    console.log('[PaBa] 🔄 Sedang logout...');

    const { error } = await supabase.auth.signOut();

    if (error) {
      const errorMsg = error.message || 'Gagal logout';
      console.error('[PaBa] ❌ Sign Out Error:', errorMsg);
      alert(`❌ Gagal logout: ${errorMsg}`);
      return false;
    }

    console.log('[PaBa] ✅ Logout berhasil');
    alert('✅ Logout berhasil.');

    // Redirect ke halaman login atau home
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 500);

    return true;
  } catch (error) {
    const errorMsg = error.message || 'Terjadi kesalahan saat logout';
    console.error('[PaBa] ❌ Sign Out Exception:', errorMsg);
    alert(`❌ Kesalahan: ${errorMsg}`);
    return false;
  }
}

/**
 * ============================================================
 * LISTEN TO AUTH STATE CHANGES
 * ============================================================
 * 
 * Mendengarkan perubahan state autentikasi.
 * Callback akan dipanggil ketika ada perubahan (login, logout, dll).
 * 
 * @param {Function} callback - Callback function(event, session)
 * @returns {Object} Subscription object dengan method unsubscribe()
 */
function onAuthStateChange(callback) {
  try {

    console.log('[PaBa] 📡 Setting up auth state listener...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`[PaBa] 🔐 Auth event: ${event}`);

        if (session) {
          console.log('     User:', session.user.email);
        }

        callback(event, session);
      }
    );

    return subscription;
  } catch (error) {
    console.error('[PaBa] ❌ Auth State Listener Error:', error.message);
    return null;
  }
}

/**
 * ============================================================
 * EXPORT SEMUA FUNCTIONS
 * ============================================================
 */
export {
  signUp,
  signInWithPassword,
  checkUserStatus,
  getCurrentSession,
  signOut,
  onAuthStateChange,
};
