# Panduan: Pasang di GitHub, Deploy, lalu Pakai di HP (PWA)

Panduan ini menjelaskan cara membuat aplikasi **Unduh Video** bisa dibuka dari HP seperti aplikasi biasa (PWA), dengan kode disimpan di GitHub.

---

## 0. Hal penting yang harus dipahami dulu

GitHub **hanya menyimpan kode**. GitHub Pages tidak bisa menjalankan Python, `yt-dlp`, atau `ffmpeg`, jadi backend aplikasi ini tidak bisa hidup di GitHub Pages.

Karena itu alurnya:

```
Kode di GitHub  →  Deploy ke Render (server Python gratis)  →  Buka URL HTTPS di HP  →  Install sebagai PWA
```

Yang kamu butuhkan:

- Akun **GitHub** (gratis) — <https://github.com>
- Akun **Render** (gratis) — <https://render.com> (bisa daftar pakai akun GitHub)
- Folder `unduh-video` di komputer ini

---

## 1. Upload kode ke GitHub

### Cara A — lewat website GitHub (tanpa install apa pun)

1. Buka <https://github.com/new>.
2. Isi **Repository name**, misalnya `unduh-video`.
3. Pilih **Public** (atau Private, dua-duanya bisa).
4. **Jangan** centang "Add a README file" (biar tidak bentrok).
5. Klik **Create repository**.
6. Di halaman repo baru, klik **uploading an existing file**.
7. Buka folder `unduh-video` di komputer, lalu **seret semua isi folder** ke halaman GitHub:
   - `server.py`, `run_server.py`, `requirements.txt`, `render.yaml`, `Procfile`, `.python-version`, `jalankan.bat`, `README.md`, `PANDUAN-HP.md`, `.gitignore`
   - folder `static/` (berisi `index.html`, `style.css`, `app.js`, `sw.js`, `manifest.webmanifest`, folder `icons/`)
   - **Jangan** upload folder `unduhan/` (isinya file hasil unduhan).
8. Klik **Commit changes**.

> Pastikan `server.py` dan `render.yaml` ada di **halaman paling atas repo**, bukan di dalam subfolder. Render membaca `render.yaml` dari root repo.

### Cara B — lewat GitHub Desktop (lebih rapi, disarankan kalau sering update)

1. Install **GitHub Desktop** dari <https://desktop.github.com/>.
2. Buka GitHub Desktop → **File → Add local repository** → pilih folder `unduh-video`.
3. Kalau diminta membuat repository, klik **create a repository** di folder itu.
4. Klik **Publish repository** → pilih nama → **Publish**.

> Git belum terpasang di komputermu, jadi cara A atau GitHub Desktop adalah pilihan termudah.

---

## 2. Deploy ke Render (gratis)

Repo sudah dilengkapi `render.yaml`, jadi prosesnya otomatis.

1. Buka <https://dashboard.render.com/select-repo?type=blueprint>.
2. Hubungkan akun GitHub-mu, lalu pilih repo `unduh-video`.
3. Render akan membaca `render.yaml` dan menampilkan layanan **unduh-video**.
4. Saat diminta **ACCESS_TOKEN**, isi **PIN rahasia** buatanmu sendiri, misalnya `123456` atau `pin-rahasia-ku`.
   - PIN ini yang nanti dipakai di HP supaya orang lain tidak bisa memakai server-mu.
   - Jangan pakai PIN yang mudah ditebak.
5. Klik **Apply** / **Create Web Service**.
6. Tunggu build selesai (sekitar 3–10 menit, karena memasang `yt-dlp` dan `ffmpeg`).
7. Setelah status **Live**, salin URL-nya, bentuknya seperti:
   `https://unduh-video-xxxx.onrender.com`

> Kalau `render.yaml` tidak terbaca, buat **Web Service** manual dengan pengaturan:
> - **Runtime**: Python
> - **Build Command**: `pip install -r requirements.txt`
> - **Start Command**: `python run_server.py`
> - **Environment Variable**: `ACCESS_TOKEN` = PIN pilihanmu

---

## 3. Buka di HP dan install sebagai PWA

### Android (Chrome)

1. Buka URL Render di **Chrome**.
2. Kalau muncul tombol **Install app** di halaman, ketuk tombol itu.
3. Kalau tidak muncul: ketuk menu **⋮** (kanan atas) → **Install app** / **Add to Home screen** → **Install**.
4. Ikon **Unduh Video** akan muncul di layar utama HP.

### iPhone (Safari)

1. Buka URL Render di **Safari** (bukan Chrome — iOS hanya mengizinkan install dari Safari).
2. Ketuk tombol **Share** (kotak dengan panah ke atas).
3. Pilih **Add to Home Screen** → **Add**.
4. Ikon **Unduh Video** muncul di layar utama.

> PWA hanya bisa di-install kalau alamatnya **HTTPS**. URL Render sudah HTTPS, jadi aman. Kalau dibuka lewat `http://192.168...` di Wi-Fi rumah, install tidak tersedia (tapi tetap bisa dipakai di browser).

---

## 4. Cara pakai di HP

1. Buka ikon **Unduh Video**.
2. Buka aplikasi TikTok/Instagram/Facebook → **Share** video → **Copy link**.
3. Kembali ke aplikasi Unduh Video → tempel link di kolom **Link video**.
4. Ketuk **Cek link**.
5. Ketuk **Unduh sekarang** (atau pilih MP3 di **Opsi lanjutan**).
6. Setelah selesai, ketuk **Simpan file** → file masuk ke folder Download HP.
   - Android: biasanya masuk ke `Download/`
   - iPhone: masuk ke aplikasi **Files** → **Downloads**

### Soal kode akses (PIN)

Kalau server memakai `ACCESS_TOKEN`, saat pertama kali memakai aplikasi:

1. Buka **Opsi lanjutan**.
2. Isi **Kode akses** dengan PIN yang kamu buat di Render.
3. PIN disimpan di HP, jadi tidak perlu diisi ulang.

Kalau PIN salah, aplikasi otomatis membuka kolom kode akses dan menampilkan pesan.

---

## 5. Update aplikasi (penting untuk TikTok/IG/FB)

Platform sering mengubah sistemnya, jadi `yt-dlp` perlu diperbarui. Cara paling mudah:

1. Buka repo di GitHub.
2. Buka `requirements.txt` → klik ikon pensil (Edit).
3. Tidak perlu diubah apa-apa; cukup **Commit changes**. Ini memicu Render build ulang dengan versi `yt-dlp` terbaru.
4. Atau di dashboard Render: **Manual Deploy → Deploy latest commit** / **Clear build cache & deploy**.

Kalau di komputer lokal, jalankan:

```bat
py -m pip install -U yt-dlp
```

---

## 6. Kalau ada masalah

| Gejala | Penyebab & solusi |
| --- | --- |
| Halaman lama sekali terbuka pertama kali | Render gratis "tidur" setelah ±15 menit tidak dipakai. Tunggu 30–60 detik, lalu muat ulang. |
| `Kode akses salah` | Isi PIN yang sama dengan `ACCESS_TOKEN` di Render, di **Opsi lanjutan**. |
| `Your IP address is blocked` (TikTok) | IP server cloud diblokir TikTok. Coba lagi nanti, ganti link, atau pakai mode lokal di PC. |
| Instagram/Facebook gagal di server cloud | IG/FB sering memblokir IP data center. Coba lagi, atau jalankan aplikasi di PC (lihat bagian 7). |
| Video privat / minta login | Di HP tidak bisa memakai cookies browser PC. Untuk konten privat, jalankan aplikasi di PC dan pilih **Cookies browser**. |
| `Postingan ini tidak berisi video` | Link mengarah ke foto/carousel tanpa video. |
| File hilang setelah beberapa saat | Render gratis memakai disk sementara. File di server bisa hilang saat restart. **Selalu ketuk "Simpan file"** agar tersimpan di HP. |
| Build gagal di Render | Buka log build. Biasanya karena `render.yaml` tidak ada di root repo, atau `requirements.txt` tidak ikut ter-upload. |
| Tombol **Buka folder** tidak muncul | Normal di cloud: folder server tidak ada di HP. Tombol itu hanya untuk mode lokal di PC. |
| Ingin ganti PIN | Ubah nilai `ACCESS_TOKEN` di Render → **Environment** → simpan. Render akan restart otomatis. |

---

## 7. Alternatif: pakai dari HP lewat Wi-Fi rumah (tanpa cloud)

Kalau server cloud diblokir platform, kamu bisa menjalankan aplikasi di PC dan membukanya dari HP di Wi-Fi yang sama.

1. Di PC, buka PowerShell di folder `unduh-video`, lalu jalankan:

   ```bat
   set HOST=0.0.0.0
   py server.py --no-browser
   ```

2. Cari IP lokal PC, misalnya dengan `ipconfig` → `IPv4 Address` (contoh `192.168.1.10`).
3. Di HP, buka `http://192.168.1.10:8765`.
4. Kalau tidak bisa dibuka, izinkan Python di **Windows Firewall** (Private network).

Catatan: cara ini **tidak bisa di-install sebagai PWA** karena bukan HTTPS, dan PC harus tetap menyala. Tapi bagus untuk video privat yang butuh cookies browser PC.

---

## 8. Biaya dan batasan Render gratis

- **Gratis** untuk pemakaian pribadi, dengan batas jam bulanan.
- Server **tidur** setelah tidak dipakai; permintaan pertama jadi lambat.
- **RAM 512 MB** dan disk terbatas — cocok untuk video pendek. Video sangat panjang/besar bisa gagal.
- **Disk sementara**: file di server hilang saat restart/redeploy. Simpan ke HP setelah selesai.
- Aplikasi ini otomatis menghapus file lama di server (di atas 1 jam) supaya disk tidak penuh.

---

## 9. Keamanan dan etika

- Jangan bagikan URL Render + PIN ke publik. Siapa pun yang punya keduanya bisa memakai server-mu.
- Gunakan hanya untuk **konten milikmu sendiri** atau yang kamu punya izinnya.
- Hormati hak cipta dan Ketentuan Layanan TikTok, Instagram, dan Facebook.
- Aplikasi tidak mengunggah video ke pihak lain; file hanya lewat server milikmu lalu diunduh ke HP.

---

## Ringkasan cepat

1. Upload isi folder `unduh-video` ke repo GitHub.
2. Render → **New Blueprint** → pilih repo → isi `ACCESS_TOKEN` (PIN) → **Apply**.
3. Buka URL HTTPS di HP.
4. Android: Chrome → **Install app**. iPhone: Safari → **Share → Add to Home Screen**.
5. Tempel link → **Cek link** → **Unduh sekarang** → **Simpan file**.
