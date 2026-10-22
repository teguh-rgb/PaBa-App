# 🔐 PaBa Login Troubleshooting Guide

## 📋 Daftar Isi
1. [Masalah Utama yang Teridentifikasi](#masalah-utama)
2. [Perbaikan Kode yang Sudah Dilakukan](#perbaikan-yang-sudah-dilakukan)
3. [Langkah-langkah Debugging](#langkah-langkah-debugging)
4. [Konfigurasi Supabase Dashboard](#konfigurasi-supabase-dashboard)
5. [Troubleshooting By Error Message](#troubleshooting-by-error)

---

## 🔴 Masalah Utama yang Teridentifikasi {#masalah-utama}

### Problem #1: CORS / Redirect URL Mismatch (PALING UMUM ⚠️)
**Gejala:**
- Login form tidak merespons atau error CORS
- Network tab menunjukkan request ke Supabase gagal
- Error: "Cross-Origin Request Blocked"

**Penyebab:**
URL aplikasi Anda tidak sesuai dengan "Site URL" di Supabase Dashboard.

**Contoh Skenario:**
```
Aplikasi berjalan di: http://localhost:8000/login.html
Supabase Site URL:    http://localhost:3000
❌ TIDAK COCOK → Login gagal
```

### Problem #2: Email Verification Required
**Gejala:**
- Signup berhasil tapi login gagal
- Pesan: "Email belum diverifikasi"

**Penyebab:**
Supabase memerlukan email verification sebelum user bisa login.

**Solusi:**
- Cek email untuk verification link
- Klik link verification
- Coba login lagi

### Problem #3: File:// Protocol (Wrong)
**Gejala:**
- Double-klik HTML file dan buka di browser
- Authentication tidak bekerja

**Penyebab:**
Supabase hanya bekerja dengan `http://` atau `https://` protocol.

**Solusi:**
Gunakan local server:
```bash
# Dengan Python 3:
python -m http.server 8000

# Dengan Node.js (http-server):
npx http-server -p 8000

# Dengan VS Code Live Server extension
```

---

## ✅ Perbaikan Kode yang Sudah Dilakukan {#perbaikan-yang-sudah-dilakukan}

### 1. Enhanced Logging di `auth.js`
**File:** `auth.js` (fungsi `signInWithPassword`)

**Yang ditambahkan:**
- ✅ Log current URL (untuk debugging URL mismatch)
- ✅ Detailed error logging dengan status code
- ✅ CORS error detection dengan instruksi perbaikan
- ✅ Token expiry logging untuk session debugging
- ✅ Step-by-step navigation logging

**Benefit:**
Ketika login gagal, Anda akan melihat error yang lebih detail di console.

### 2. Console Debugging di `login.html`
**File:** `login.html` (script section)

**Yang ditambahkan:**
- ✅ Page load debug info (origin, protocol, URL)
- ✅ Form submission logging
- ✅ Email & password validation logging
- ✅ Supabase API call tracking

**Benefit:**
Mudah melacak flow dari form submission ke API call.

---

## 🔧 Langkah-langkah Debugging {#langkah-langkah-debugging}

### Step 1: Buka Browser Console (F12)
```
Chrome/Edge: Tekan F12 atau Ctrl+Shift+I
Firefox: Tekan F12 atau Ctrl+Shift+K
Safari: Cmd+Option+I
```

### Step 2: Buka Login Page dan Lihat Console Output
Setelah perbaikan kode, Anda akan melihat:
```
[PaBa] 📍 Login page loaded
[PaBa] 🌐 Current Origin: http://localhost:8000
[PaBa] 🔗 Current URL: http://localhost:8000/login.html
[PaBa] 📄 Protocol: http:
[PaBa] ✅ Login page scripts loaded successfully
```

### Step 3: Coba Login dan Perhatikan Console
Ketika Anda submit form, Anda akan melihat:
```
[PaBa] 🔐 Sign In form submitted
[PaBa] 📧 Email: user@example.com
[PaBa] 🔐 Password length: 8
[PaBa] 🌐 Initiating sign in with Supabase...
[PaBa] 🔄 Sedang login: user@example.com
[PaBa] 🌐 Current URL: http://localhost:8000
[PaBa] 🔐 Attempting authentication with Supabase...
```

### Step 4: Periksa Error Message
Jika ada error, Anda akan lihat:
```
[PaBa] ❌ Sign In Error: [Error message]
[PaBa] Error Details: { ... }
[PaBa] Error Code: [Status code]
```

### Step 5: Buka Network Tab (F12 → Network)
- Filter: XHR atau Fetch
- Cari request ke `auth` atau `supabase`
- Lihat:
  - ✅ Status code (200, 400, 401, 403, 500, dst)
  - ✅ Response body (error detail)
  - ✅ Headers (verifikasi authorization)

---

## ⚙️ Konfigurasi Supabase Dashboard {#konfigurasi-supabase-dashboard}

### A. Cek Site URL & Redirect URLs

**Langkah:**
1. Buka https://app.supabase.com
2. Login dengan akun Anda
3. Pilih project "PaBa" (atau sesuai nama project)
4. Klik **Settings** (ikon gear) di menu kiri
5. Pilih **Auth** → **Configuration**

**Cari Section: "Site URL & Redirect URLs"**

**Apa yang harus diisi:**

```
Site URL: 
  → URL tempat aplikasi Anda running
  → Contoh: http://localhost:8000
  → Untuk production: https://paba-app.com

Redirect URLs (Add new):
  → http://localhost:8000/index.html (untuk development)
  → https://paba-app.com/index.html (untuk production)
  → Bisa tambah lebih dari satu URL
```

⚠️ **PENTING:**
- Site URL dan Redirect URLs harus COCOK dengan URL aplikasi Anda
- Jangan ada `login.html` di Redirect URLs (harus `index.html`)
- Jika localhost, pastikan port-nya sama

### B. Cek Email Confirmation Settings

**Langkah:**
1. Di halaman Authorization Configuration (sama seperti di atas)
2. Cari section **"Email"**
3. Lihat setting **"Confirm email"**

**Opsi:**
```
☑ Confirm email (checked)
  → User harus verifikasi email sebelum bisa login
  → User akan terima email verification link
  → REKOMENDASI untuk production

☐ Confirm email (unchecked)
  → User bisa login langsung tanpa verifikasi
  → HANYA untuk testing/development
```

Untuk testing/development, coba unchecked untuk skip email verification.

### C. Cek CORS Settings

**Langkah:**
1. Di halaman yang sama, cari **"CORS"**
2. Verify allowed origins sudah benar

---

## 🆘 Troubleshooting By Error Message {#troubleshooting-by-error}

### ❌ "Email atau password salah"
**Penyebab:**
- Email tidak terdaftar
- Password salah
- Typo pada email

**Solusi:**
- Cek email yang digunakan
- Coba signup terlebih dahulu jika belum ada akun
- Pastikan tidak ada spasi di awal/akhir email

---

### ❌ "Email belum diverifikasi"
**Penyebab:**
- Email verification diaktifkan di Supabase
- User belum klik verification link

**Solusi:**
- Cek email inbox (atau spam folder)
- Klik link verification
- Coba login lagi
- Atau: Disable "Confirm email" di Supabase untuk testing

---

### ❌ "Masalah koneksi (CORS)"
**Penyebab:**
- Site URL di Supabase tidak sesuai dengan URL aplikasi
- Protocol mismatch (file:// vs http://)

**Solusi:**
1. Buka DevTools (F12)
2. Copy URL yang terlihat di console: `🌐 Current Origin: http://localhost:8000`
3. Buka Supabase Dashboard → Settings → Auth
4. Paste URL ke Site URL
5. Refresh halaman login
6. Coba login lagi

---

### ❌ "Terjadi kesalahan" (sudah di try-catch)
**Penyebab:**
- Network error
- Supabase server down
- Invalid credentials

**Solusi:**
1. Buka console (F12)
2. Lihat error message yang detail di console
3. Coba lagi dalam beberapa saat
4. Jika masih gagal, screenshot error dan lapor

---

## ✨ Best Practices Testing

### Setup Local Server yang Tepat
```bash
# Option 1: Python (built-in)
cd /home/teguh/supabase-PaBa
python -m http.server 8000

# Buka di browser: http://localhost:8000/login.html
```

```bash
# Option 2: Node.js (http-server)
npm install -g http-server
cd /home/teguh/supabase-PaBa
http-server -p 8000

# Buka di browser: http://localhost:8000/login.html
```

```bash
# Option 3: VS Code Live Server Extension
# Install "Live Server" extension
# Right-click index.html → "Open with Live Server"
# Biasanya: http://127.0.0.1:5500
```

### Testing Checklist

- [ ] Buka login.html dengan `http://localhost:XXXX` (bukan file://)
- [ ] Buka Console (F12) dan cek log messages
- [ ] Email sudah tersignup (atau langsung signup)
- [ ] Email sudah verified (atau disable verification di Supabase)
- [ ] Site URL di Supabase sesuai dengan localhost URL
- [ ] Redirect URLs include index.html destination
- [ ] Coba login, perhatikan console output
- [ ] Jika redirect berhasil, cek index.html loading dengan benar

---

## 📞 Debug Checklist

Jika masih gagal, kumpulkan info ini:

```
[ ] 1. URL aplikasi Anda: ______________________
[ ] 2. Site URL di Supabase: ___________________
[ ] 3. Error message dari alert: ________________
[ ] 4. Console error (F12 → Console): ___________
[ ] 5. Network error (F12 → Network tab): _______
[ ] 6. Supabase project URL: ____________________
[ ] 7. Email yang digunakan: ____________________
[ ] 8. Confirm email setting (enabled/disabled): _
```

Jika semua masih tidak bekerja, share screenshot console output dan error message untuk debugging lebih lanjut.

---

## 🎯 Summary

| Problem | Solution |
|---------|----------|
| CORS Error | Sesuaikan Site URL di Supabase |
| Email not verified | Klik verification link atau disable email confirmation |
| file:// protocol | Gunakan local server (http://) |
| Login button tidak respond | Buka console dan lihat error message |
| Session tidak ter-save | Index.html harus accessible & session redirect berfungsi |

Dengan perbaikan kode dan panduan ini, Anda seharusnya bisa:
1. ✅ Melihat error dengan lebih detail di console
2. ✅ Mengidentifikasi masalah lebih cepat
3. ✅ Melakukan konfigurasi Supabase dengan benar
4. ✅ Login berhasil dan redirect ke index.html

Good luck! 🚀
