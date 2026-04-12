PaBa (Paham Baca)

PaBa (Paham Baca) adalah platform asisten baca adaptif yang dirancang khusus untuk membantu penyandang disleksia dan lansia dalam memahami literasi digital. Proyek ini dibangun sebagai bagian dari Capstone Project Coding Camp 2026 powered by DBS Foundation.

Fitur Utama

Tipografi Adaptif: Menggunakan font OpenDyslexic yang membantu mengurangi rotasi huruf di mata pembaca disleksia.

Context Simplifier (Mode Gen-Z): Menyederhanakan teks formal yang kaku menjadi bahasa yang lebih santai dan mudah dicerna.

Meme Mnemonik: Integrasi elemen visual meme untuk membantu memperkuat daya ingat pengguna melalui asosiasi humor.

Kustomisasi Visual: Pengaturan ukuran teks dan spasi baris secara real-time untuk mengurangi kelelahan mata (visual stress).

Cloud-Synced Reading List: Simpan progres bacaan Anda secara aman menggunakan integrasi database Supabase.

 Tech Stack

Frontend: Vite + Tailwind CSS

Backend/Database: Supabase

Programming Language: JavaScript (ES6+)

Deployment: Vercel

 Memulai Proyek (Local Development)

Ikuti langkah-langkah di bawah ini untuk menjalankan proyek ini di mesin lokal Anda.

1. Prasyarat

Pastikan Anda sudah menginstal:

Node.js (versi 16 atau terbaru)

npm atau yarn

2. Kloning Repositori

git clone [https://github.com/USERNAME_ANDA/NAMA_REPO.git](https://github.com/USERNAME_ANDA/NAMA_REPO.git)
cd NAMA_REPO


3. Instalasi Dependensi

npm install


4. Konfigurasi Environment Variables

Buat file bernama .env di direktori utama (root) dan masukkan kunci API Supabase Anda:

VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here


5. Jalankan Aplikasi

npm run dev


Aplikasi akan berjalan di http://localhost:5173.

 Struktur Folder

├── public/             # Aset statis (ikon, gambar)
├── src/
│   ├── assets/         # Gambar dan gaya (CSS)
│   ├── components/     # Komponen UI yang dapat digunakan kembali
│   ├── services/       # Konfigurasi Supabase & API calls
│   └── main.js         # Entry point aplikasi
├── .env.example        # Contoh file environment
├── index.html          # File HTML utama
└── tailwind.config.js  # Konfigurasi Tailwind CSS


Tim Pengembang (TCC26-PS084)

Teguh Sugiantoro - Web Development

Intan Wiyanti - Web Development

Zifara Putri Aurel - Web Development

Adithya Rizky Kara Ardhani - Web Development

Silpi Nurhasanah - Web Development

Lisensi

Proyek ini dibuat untuk tujuan edukasi dalam program Coding Camp 2026.
