# 🔐 Panduan Autentikasi Supabase Auth untuk PaBa

## 📋 Daftar Isi

1. [Quick Start](#quick-start)
2. [Fungsi-Fungsi Tersedia](#fungsi-fungsi-tersedia)
3. [Cara Penggunaan](#cara-penggunaan)
4. [Contoh Implementasi](#contoh-implementasi)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)

---

## 🚀 Quick Start

### File yang Dibutuhkan

- **supabase.js** — Inisialisasi Supabase client
- **auth.js** — Fungsi-fungsi autentikasi (BARU)
- **login.html** — Halaman login & registrasi (BARU)
- **index.html** — Halaman utama app

### Setup Minimal

```javascript
// 1. Import fungsi autentikasi
import { 
  signInWithPassword, 
  signUp, 
  checkUserStatus 
} from './auth.js';

// 2. Inisialisasi Supabase (hanya sekali)
import { initializeSupabase } from './supabase.js';
await initializeSupabase();

// 3. Gunakan fungsi autentikasi
const result = await signInWithPassword('user@example.com', 'password123');
```

---

## 📚 Fungsi-Fungsi Tersedia

### 1. **signUp(email, password)** — Registrasi User Baru

Membuat akun user baru dengan email dan password.

```javascript
import { signUp } from './auth.js';

const result = await signUp('user@example.com', 'password123');
// {
//   success: true/false,
//   user: { id, email, ... },
//   message: "..."
// }
```

**Validasi otomatis:**
- ✅ Email harus diisi dan format valid
- ✅ Password minimal 6 karakter
- ✅ Email konfirmasi akan dikirim

**Return value:**
```javascript
{
  success: boolean,      // true jika berhasil
  user: Object|null,     // User object atau null
  message: string        // Pesan status
}
```

---

### 2. **signInWithPassword(email, password)** — Login

Login dengan email dan password. **Otomatis redirect ke index.html jika berhasil**.

```javascript
import { signInWithPassword } from './auth.js';

const result = await signInWithPassword('user@example.com', 'password123');
// Jika berhasil → redirect ke index.html
// Jika gagal → alert error message
```

**Return value:**
```javascript
{
  success: boolean,      // true jika berhasil
  session: Object|null,  // Session object atau null
  message: string        // Pesan status
}
```

**Error yang mungkin:**
- ❌ Email atau password salah
- ❌ Email belum diverifikasi
- ❌ User tidak ditemukan

---

### 3. **checkUserStatus()** — Get Current User

Cek user yang sedang login pada saat ini.

```javascript
import { checkUserStatus } from './auth.js';

const { isLoggedIn, user, message } = await checkUserStatus();

if (isLoggedIn) {
  console.log('User:', user.email);
  console.log('ID:', user.id);
} else {
  console.log('User not logged in');
}
```

**Return value:**
```javascript
{
  isLoggedIn: boolean,   // true jika ada user login
  user: Object|null,     // User object atau null
  message: string        // Pesan status
}
```

**Gunakan untuk:**
- Cek apakah user sudah login saat app startup
- Redirect ke login page jika user belum authenticated
- Load user profile

---

### 4. **getCurrentSession()** — Get Active Session

Mendapatkan session yang sedang aktif (lebih detail dari user).

```javascript
import { getCurrentSession } from './auth.js';

const session = await getCurrentSession();

if (session) {
  console.log('User:', session.user.email);
  console.log('Expires at:', session.expires_at);
  console.log('Access token:', session.access_token);
} else {
  console.log('No active session');
}
```

---

### 5. **signOut()** — Logout

Logout user saat ini. Redirect ke login.html setelah berhasil.

```javascript
import { signOut } from './auth.js';

const success = await signOut();
// Jika berhasil → redirect ke login.html
```

---

### 6. **onAuthStateChange(callback)** — Listen to Auth Changes

Subscribe ke perubahan autentikasi (login, logout, dll).

```javascript
import { onAuthStateChange } from './auth.js';

const subscription = onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User logged in:', session.user.email);
  } else if (event === 'SIGNED_OUT') {
    console.log('User logged out');
  }
});

// Cleanup (optional)
// subscription?.unsubscribe();
```

---

## 💡 Cara Penggunaan

### Setup di index.html

```html
<!DOCTYPE html>
<html>
<head>
  <title>PaBa</title>
</head>
<body>
  <!-- Content -->
  
  <!-- Load scripts in order -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="supabase.js" type="module"></script>
  <script src="auth.js" type="module"></script>
  <script src="script.js" type="module"></script>
</body>
</html>
```

### Check User Saat Startup

```javascript
// script.js
import { initializeSupabase } from './supabase.js';
import { checkUserStatus } from './auth.js';

async function initApp() {
  // 1. Init Supabase
  await initializeSupabase();

  // 2. Check if user is logged in
  const { isLoggedIn, user } = await checkUserStatus();

  if (!isLoggedIn) {
    // Redirect ke login
    console.warn('User not authenticated');
    window.location.href = 'login.html';
    return;
  }

  // 3. User authenticated, proceed
  console.log('Welcome,', user.email);
  
  // Load materials, setup UI, etc.
  // ...
}

document.addEventListener('DOMContentLoaded', initApp);
```

### Login Flow

```javascript
// login.html - form handler
import { signInWithPassword } from './auth.js';

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  // Button loading state
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Logging in...';

  // Call login function
  await signInWithPassword(email, password);
  // ✅ Jika berhasil: auto redirect ke index.html
  // ❌ Jika gagal: alert + button re-enable

  btn.disabled = false;
  btn.textContent = 'Login';
});
```

### Logout Flow

```javascript
// Add logout button anywhere
import { signOut } from './auth.js';

document.getElementById('logout-btn').addEventListener('click', async () => {
  if (confirm('Yakin ingin logout?')) {
    await signOut();
    // ✅ Auto redirect ke login.html
  }
});
```

---

## 🎯 Contoh Implementasi

### A. Simple Login Page

Lihat file **login.html** untuk implementasi lengkap.

Features:
- ✅ Tab login/signup
- ✅ Real-time validation
- ✅ Loading states
- ✅ Error messaging
- ✅ Responsive design

### B. Protected Route

```javascript
// Middleware untuk cek authentication
async function protectRoute() {
  import { checkUserStatus } from './auth.js';
  
  const { isLoggedIn } = await checkUserStatus();
  
  if (!isLoggedIn) {
    window.location.href = 'login.html';
  }
}

// Call di setiap halaman protected
document.addEventListener('DOMContentLoaded', protectRoute);
```

### C. User Profile Card

```javascript
import { checkUserStatus } from './auth.js';

async function loadUserProfile() {
  const { isLoggedIn, user } = await checkUserStatus();

  if (!isLoggedIn) return;

  document.getElementById('profile-card').innerHTML = `
    <div>
      <strong>Email:</strong> ${user.email}
      <strong>ID:</strong> ${user.id}
      <strong>Created:</strong> ${new Date(user.created_at).toLocaleDateString('id-ID')}
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', loadUserProfile);
```

### D. Auto-login on Session Valid

```javascript
import { onAuthStateChange } from './auth.js';

onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('✅ User signed in:', session.user.email);
    // Update UI
    showUserPanel();
  } else if (event === 'SIGNED_OUT') {
    console.log('❌ User signed out');
    // Update UI
    hideUserPanel();
  }
});
```

---

## ⚠️ Error Handling

Semua fungsi sudah include error handling dengan:

### 1. **Console.error** — Untuk Development

```javascript
console.error('[PaBa] ❌ Sign In Error:', errorMsg);
console.error('     Error Details:', error);
```

Output di DevTools Console:
```
[PaBa] ❌ Sign In Error: Email atau password salah
     Error Details: {message: "...", status: 401, ...}
```

### 2. **Alert** — Untuk User Notification

```javascript
alert('❌ Login gagal: Email atau password salah');
```

### 3. **Try-Catch** — Untuk Exception Handling

Semua async function sudah dibungkus dengan try-catch, jadi tidak akan crash app.

---

## 📋 Validasi Input

### Validasi di Client-Side (auth.js)

✅ Email format
```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

✅ Password minimal 6 karakter
```javascript
if (password.length < 6) {
  alert('Password harus minimal 6 karakter');
}
```

✅ Field tidak boleh kosong
```javascript
if (!email || !password) {
  alert('Email dan password harus diisi');
}
```

### Validasi di Server (Supabase)

Supabase akan juga validasi:
- Email uniqueness
- Password strength (bisa dikonfigurasi)
- Email verification
- Session validity

---

## 🔒 Best Practices

### 1. **Selalu Init Supabase Dulu**

```javascript
// ❌ WRONG
const user = await checkUserStatus(); // Error!

// ✅ CORRECT
import { initializeSupabase } from './supabase.js';
await initializeSupabase();
const user = await checkUserStatus(); // OK
```

### 2. **Check User Status di Startup**

```javascript
async function initApp() {
  await initializeSupabase();
  
  // Check authentication FIRST
  const { isLoggedIn } = await checkUserStatus();
  if (!isLoggedIn) {
    return; // Stop initialization
  }
  
  // Continue with app
}
```

### 3. **Handle Loading States**

```javascript
// ✅ DO THIS
btn.disabled = true;
btn.textContent = '🔄 Loading...';
await signInWithPassword(email, password);
btn.disabled = false;
btn.textContent = 'Login';

// ❌ DON'T DO THIS
await signInWithPassword(email, password);
// (button masih responsive, UX buruk)
```

### 4. **Listen to Auth Changes**

```javascript
// Setup once at app startup
onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    showLoggedInUI();
  } else if (event === 'SIGNED_OUT') {
    showLoggedOutUI();
    window.location.href = 'login.html';
  }
});
```

### 5. **Never Store Sensitive Data Locally**

```javascript
// ❌ DON'T DO THIS
localStorage.setItem('password', password);

// ✅ DO THIS
// Supabase handles session securely with HTTPOnly cookies
```

### 6. **Always Use HTTPS in Production**

Supabase Auth mengharuskan HTTPS untuk production. HTTP hanya untuk development.

---

## 🧪 Testing

### Test Sign Up

```javascript
// Buka DevTools Console di login.html
// Di signup tab:
// Email: testuser@example.com
// Password: Password123
// Klik Daftar → lihat console untuk debug info
```

### Test Sign In

```javascript
// Support testing tanpa email verification (jika diatur di Supabase)
// Login dengan email/password yang baru didaftar
```

### Test Check User

```javascript
// Browser console (saat di index.html):
import { checkUserStatus } from './auth.js';
const status = await checkUserStatus();
console.log(status);
```

---

## 🐛 Troubleshooting

### ❌ Error: "Supabase belum diinisialisasi"

**Solusi:** Panggil `initializeSupabase()` lebih dulu

```javascript
import { initializeSupabase } from './supabase.js';
await initializeSupabase();
```

### ❌ Error: "Invalid login credentials"

**Solusi:** Email atau password salah. Cek di database atau reset password.

### ❌ Error: "Email not confirmed"

**Solusi:** User harus klik link di email untuk verifikasi. Cek dev mode di Supabase Dashboard.

### ❌ Error: "CORS error"

**Solusi:** Biasanya tidak terjadi. Jika terjadi, check:
- Supabase SDK sudah di-load di index.html
- URL format benar (tanpa trailing slash)

### ❌ Redirect tidak jalan setelah login

**Penyebab:** Script belum di-load atau error sebelumnya

**Solusi:** Check browser console untuk error message

---

## 📚 Dokumentasi Resmi

- [Supabase Auth — Sign Up](https://supabase.com/docs/reference/javascript/auth-signup)
- [Supabase Auth — Sign In](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)
- [Supabase Auth — Get User](https://supabase.com/docs/reference/javascript/auth-getuser)
- [Supabase Auth — Sign Out](https://supabase.com/docs/reference/javascript/auth-signout)

---

## ✅ Checklist

Setup checklist sebelum production:

- [ ] ✅ `supabase.js` sudah dikonfigurasi dengan credentials
- [ ] ✅ `auth.js` sudah dimuat di halaman
- [ ] ✅ `index.html` ada check user status di startup
- [ ] ✅ `login.html` sudah ditest untuk signup & signin
- [ ] ✅ Email verification sudah diatur di Supabase Dashboard
- [ ] ✅ Production menggunakan HTTPS
- [ ] ✅ Semua API policies (RLS) sudah configured
- [ ] ✅ Password requirements sudah diatur (min 8 char recommended)

---

**Happy authenticating! 🔐**
