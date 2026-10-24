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
  const normalizedEmail = String(email || '').trim();

  // Validasi input
  if (!normalizedEmail || !password) {
    const errorMsg = 'Email dan password harus diisi';
    return {
      success: false,
      user: null,
      session: null,
      message: errorMsg,
    };
  }

  // Validasi format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    const errorMsg = 'Format email tidak valid';
    return {
      success: false,
      user: null,
      session: null,
      message: errorMsg,
    };
  }

  // Validasi panjang password
  if (password.length < 6) {
    const errorMsg = 'Password harus minimal 6 karakter';
    return {
      success: false,
      user: null,
      session: null,
      message: errorMsg,
    };
  }

  try {
    console.log('[PaBa] Memulai pendaftaran Supabase Auth.');

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: new URL('verify-email.html', window.location.href).toString(),
      },
    });

    if (error) {
      console.error('[PaBa] Sign Up Error:', error.message);

      return {
        success: false,
        user: null,
        session: null,
        message: getSignUpErrorMessage(error),
      };
    }

    if (!data?.user) {
      const errorMsg = 'User tidak ditemukan setelah registrasi';
      console.error('[PaBa] Sign Up Error:', errorMsg);
      return {
        success: false,
        user: null,
        session: null,
        message: errorMsg,
      };
    }

    if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return {
        success: false,
        user: null,
        session: null,
        message: 'Email tidak dapat didaftarkan. Jika sudah memiliki akun, silakan login atau pulihkan akses akun.',
      };
    }

    const hasSession = Boolean(data.session);
    const successMsg = hasSession
      ? 'Pendaftaran berhasil. Akun Anda sudah aktif.'
      : 'Pendaftaran diterima. Jika konfirmasi email diaktifkan, cek inbox untuk verifikasi sebelum login.';
    console.log('[PaBa] Pendaftaran Supabase selesai. Session tersedia:', hasSession);

    return {
      success: true,
      user: data.user,
      session: data.session,
      message: successMsg,
    };
  } catch (error) {
    console.error('[PaBa] Sign Up Exception:', error?.message || 'Network or provider error.');

    return {
      success: false,
      user: null,
      session: null,
      message: getNetworkErrorMessage(error),
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
  const normalizedEmail = String(email || '').trim();

  // Validasi input
  if (!normalizedEmail || !password) {
    const errorMsg = 'Email dan password harus diisi';
    return {
      success: false,
      session: null,
      message: errorMsg,
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return {
      success: false,
      session: null,
      message: 'Format email tidak valid.',
    };
  }

  try {
    console.log('[PaBa] Memulai login Supabase Auth.');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      const errorMsg = getSignInErrorMessage(error);
      console.error('[PaBa] Sign In Error:', error.message);

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
      return {
        success: false,
        session: null,
        message: errorMsg,
      };
    }

    const successMsg = 'Login berhasil. Mengalihkan ke perpustakaan...';
    console.log('[PaBa] Login berhasil; session Supabase tersedia.');
    setTimeout(() => {
      window.location.href = new URL('index.html', window.location.href).toString();
    }, 500);

    return {
      success: true,
      session: data.session,
      message: successMsg,
    };
  } catch (error) {
    console.error('[PaBa] Sign In Exception:', error?.message || 'Network or provider error.');

    return {
      success: false,
      session: null,
      message: getNetworkErrorMessage(error),
    };
  }
}

function getSignUpErrorMessage(error) {
  const message = String(error?.message || '').toLowerCase();
  if (message.includes('already registered') || message.includes('already exists')) {
    return 'Email tidak dapat didaftarkan. Jika sudah memiliki akun, silakan login atau pulihkan akses akun.';
  }
  if (message.includes('password') || message.includes('weak')) {
    return 'Password belum memenuhi ketentuan. Gunakan password yang lebih kuat dan minimal 6 karakter.';
  }
  return getNetworkErrorMessage(error);
}

function getSignInErrorMessage(error) {
  const message = String(error?.message || '').toLowerCase();
  if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) {
    return 'Email belum dikonfirmasi. Buka tautan verifikasi yang dikirim ke email Anda sebelum login.';
  }
  if (message.includes('invalid login credentials')) {
    return 'Email atau password salah.';
  }
  if (message.includes('password') && (message.includes('weak') || message.includes('short'))) {
    return 'Password tidak memenuhi ketentuan Supabase.';
  }
  return getNetworkErrorMessage(error);
}

function getNetworkErrorMessage(error) {
  const message = String(error?.message || '').toLowerCase();
  if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
    return 'Tidak dapat terhubung ke layanan autentikasi. Periksa koneksi internet lalu coba lagi.';
  }
  return error?.message || 'Terjadi kesalahan autentikasi. Coba lagi.';
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
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('[PaBa] Get Session Error:', sessionError.message);
      return {
        isLoggedIn: false,
        user: null,
        message: sessionError.message || 'Sesi tidak dapat diperiksa.',
      };
    }

    if (!sessionData?.session) {
      return {
        isLoggedIn: false,
        user: null,
        message: 'User tidak login',
      };
    }

    const { data, error } = await supabase.auth.getUser();

    if (error) {
      if (error.status === 401 || error.status === 403) {
        console.warn('[PaBa] Sesi Supabase tidak valid atau kedaluwarsa.');
        return {
          isLoggedIn: false,
          user: null,
          message: 'Sesi tidak valid',
        };
      }

      const errorMsg = error.message || 'Gagal mengecek status user';
      console.error('[PaBa] Check User Error:', errorMsg);
      return {
        isLoggedIn: false,
        user: null,
        message: errorMsg,
      };
    }

    // Cek apakah ada user data
    if (!data?.user) {
      return {
        isLoggedIn: false,
        user: null,
        message: 'No user logged in',
      };
    }

    // User found
    console.log('[PaBa] Session user tervalidasi oleh Supabase.');
    return {
      isLoggedIn: true,
      user: data.user,
      message: 'User logged in',
    };
  } catch (error) {
    const errorMsg = error.message || 'Terjadi kesalahan saat mengecek status user';
    console.error('[PaBa] Check User Exception:', errorMsg);

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
 * GET CURRENT USER
 * ============================================================
 * 
 * Mendapatkan user yang sedang login.
 * Lebih reliable daripada checkUserStatus() untuk cek user saat init.
 * 
 * @returns {Promise<{user: Object|null, session: Object|null}>}
 */
async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.log('[PaBa] ℹ️  No current user (error: ' + error.message + ')');
      return {
        user: null,
        session: null,
      };
    }

    if (!data?.user) {
      console.log('[PaBa] ℹ️  No current user');
      return {
        user: null,
        session: null,
      };
    }

    console.log('[PaBa] ✅ Current user tersedia.');
    
    // Get session info juga
    const session = await getCurrentSession();

    return {
      user: data.user,
      session: session,
    };
  } catch (error) {
    console.error('[PaBa] ❌ Get Current User Exception:', error.message);
    return {
      user: null,
      session: null,
    };
  }
}

/**
 * ============================================================
 * CHECK IF EMAIL IS VERIFIED
 * ============================================================
 * 
 * Mengecek apakah email user sudah diverifikasi.
 * Diperlukan sebelum user bisa login (tergantung Supabase config).
 * 
 * @returns {Promise<boolean>} true jika verified, false jika belum
 */
async function isEmailVerified() {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      console.log('[PaBa] ℹ️  No user, cannot check email verification');
      return false;
    }

    // Cek user_metadata atau email_confirmed_at
    const isVerified = user.email_confirmed_at !== null;
    
    console.log('[PaBa] Email verification status:', isVerified ? 'verified' : 'not verified');

    return isVerified;
  } catch (error) {
    console.error('[PaBa] ❌ Check Email Verification Exception:', error.message);
    return false;
  }
}

/**
 * ============================================================
 * HANDLE EMAIL VERIFICATION REDIRECT
 * ============================================================
 * 
 * Dipanggil dari verify-email.html setelah user klik link verifikasi.
 * URL akan berisi #token_type=email&type=email&token=XXX
 * 
 * Supabase automatically exchanges token untuk create session.
 * Function ini handle UI feedback dan redirect.
 * 
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function handleEmailVerificationRedirect() {
  try {
    console.log('[PaBa] 🔐 Handling email verification redirect...');
    // Tunggu sebentar untuk Supabase process token
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check apakah session sudah created (Supabase handle otomatis)
    const { user, session } = await getCurrentUser();

    if (!user || !session) {
      const errorMsg = 'Email verification gagal. Token mungkin expired.';
      console.error('[PaBa] ❌', errorMsg);
      
      return {
        success: false,
        message: errorMsg,
      };
    }

    // Check email verified
    const verified = await isEmailVerified();

    if (!verified) {
      const warningMsg = '⚠️ Email belum terverifikasi. Coba lagi atau hubungi support.';
      console.warn('[PaBa]', warningMsg);
      
      return {
        success: false,
        message: warningMsg,
      };
    }

    const successMsg = '✅ Email berhasil diverifikasi! Redirecting...';
    console.log('[PaBa]', successMsg);
    console.log('     Session created');

    // Redirect ke index.html dengan delay
    setTimeout(() => {
      console.log('[PaBa] 📍 Redirecting to index.html...');
      window.location.href = 'index.html';
    }, 1500);

    return {
      success: true,
      message: successMsg,
    };
  } catch (error) {
    const errorMsg = error.message || 'Terjadi kesalahan saat memproses verifikasi email';
    console.error('[PaBa] ❌ Email Verification Exception:', errorMsg);
    console.error('     Stack:', error.stack);

    return {
      success: false,
      message: errorMsg,
    };
  }
}

/**
 * ============================================================
 * SETUP EMAIL VERIFICATION LISTENER
 * ============================================================
 * 
 * Listen untuk email verification auth state changes.
 * Triggered saat user verifikasi email dari link di email.
 * 
 * @param {Function} callback - Callback when verification changes
 * @returns {Object|null} Subscription object
 */
function setupEmailVerificationListener(callback) {
  try {
    console.log('[PaBa] 📡 Setting up email verification listener...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[PaBa] 🔐 Auth event: ${event}`);

        // Email verification events
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          console.log('[PaBa] ✅ Email verified!');
          callback('email_verified', session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('[PaBa] 🚪 User signed out');
          callback('signed_out', null);
        } else if (event === 'USER_UPDATED') {
          console.log('[PaBa] 🔄 User updated');
          callback('user_updated', session?.user);
        }
      }
    );

    return subscription;
  } catch (error) {
    console.error('[PaBa] ❌ Email Verification Listener Error:', error.message);
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
      alert(`Gagal logout: ${errorMsg}`);
      return false;
    }

    console.log('[PaBa] ✅ Logout berhasil');
    alert('Logout berhasil.');

    // Redirect ke halaman login atau home
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 500);

    return true;
  } catch (error) {
    const errorMsg = error.message || 'Terjadi kesalahan saat logout';
    console.error('[PaBa] ❌ Sign Out Exception:', errorMsg);
    alert(`Kesalahan: ${errorMsg}`);
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
  getCurrentUser,
  isEmailVerified,
  handleEmailVerificationRedirect,
  setupEmailVerificationListener,
  signOut,
  onAuthStateChange,
};
