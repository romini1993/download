# Unduh Video

Aplikasi untuk mengunduh video **TikTok, Instagram, dan Facebook** tanpa watermark. Tempel link, cek pratinjau, lalu unduh — tanpa dialihkan ke situs lain.

Bisa dijalankan **lokal di PC** (Windows) maupun **online** supaya bisa dipakai dari HP dan di-install sebagai **PWA** (aplikasi di layar utama).

## Fitur

- Unduh video TikTok, Instagram (post/reel), dan Facebook (video/reel).
- TikTok otomatis memakai sumber video **tanpa watermark** (prioritas dari yt-dlp).
- Pratinjau judul, thumbnail, pengunggah, dan durasi sebelum mengunduh.
- Pilihan format: **Video MP4** atau **Audio MP3**.
- Pilihan kualitas: terbaik, 1080p, 720p, 480p.
- Progress bar dengan kecepatan dan perkiraan sisa waktu.
- Riwayat file terunduh: simpan ulang atau hapus dari aplikasi.
- Tombol **Buka folder** (khusus mode lokal di PC).
- Opsi cookies browser untuk video privat / yang meminta login.
- **PWA**: bisa di-install di Android/iPhone, punya ikon dan tampilan layar penuh.
- **Kode akses (PIN)** opsional untuk server yang dibuka ke internet.

## Dua cara pakai

### A. Lokal di PC (paling privat)

1. Pastikan **Python 3.10 atau lebih baru** terpasang. Kalau belum, unduh dari <https://www.python.org/downloads/> dan centang **Add python.exe to PATH** saat instalasi.
2. Klik dua kali **`jalankan.bat`**.
3. Saat pertama kali dijalankan, aplikasi memasang dependensi (butuh internet, sekali saja).
4. Browser terbuka otomatis di <http://127.0.0.1:8765>. Kalau tidak terbuka, buka alamat itu manual.
5. Biarkan jendela hitam tetap terbuka selama aplikasi dipakai. Tutup jendela itu (atau tekan `Ctrl+C`) untuk mematikan aplikasi.

File tersimpan di folder **`unduhan/`** di dalam folder aplikasi.

> Di komputer lokal, PWA juga bisa di-install (Chrome: ikon install di address bar / menu ⋮ → **Install app**).

### B. Online untuk HP (GitHub + Render + PWA)

Ikuti panduan langkah demi langkah di **[PANDUAN-HP.md](PANDUAN-HP.md)**. Ringkasnya:

1. Upload isi folder ini ke repo GitHub.
2. Deploy repo itu ke **Render** (gratis) — `render.yaml` sudah disiapkan.
3. Isi **`ACCESS_TOKEN`** (PIN) saat deploy.
4. Buka URL HTTPS Render di HP → **Install app** (Android) atau **Add to Home Screen** (iPhone).

> GitHub Pages **tidak bisa** dipakai untuk backend aplikasi ini karena butuh Python + `yt-dlp` + `ffmpeg`. GitHub hanya menyimpan kode; server-nya jalan di Render.

## Cara pakai

1. Salin link video:
   - TikTok: `https://www.tiktok.com/@akun/video/...` atau link pendek `https://vt.tiktok.com/...`
   - Instagram: `https://www.instagram.com/reel/...` atau `/p/...`
   - Facebook: `https://www.facebook.com/.../videos/...`, `https://fb.watch/...`, atau reel
2. Tempel di kolom **Link video** (tombol **Tempel** atau `Ctrl+V`).
3. Tekan **Cek link** (atau `Enter`). Pratinjau akan muncul.
4. Pilih format/kualitas bila perlu di **Opsi lanjutan**, lalu tekan **Unduh sekarang**.
5. Setelah selesai, tekan **Simpan file** (di HP file masuk ke folder Download), atau buka folder `unduhan/` lewat tombol **Buka folder** (mode lokal).

## Opsi lanjutan

| Opsi | Keterangan |
| --- | --- |
| **Format** | Video MP4 (gabungan gambar + suara) atau Audio MP3 saja. |
| **Kualitas** | Batas resolusi maksimum. "Terbaik" mengikuti kualitas sumber. |
| **Cookies browser** | Untuk video privat, story, atau konten yang meminta login. Pilih browser yang sudah kamu login ke akun tersebut, lalu **tutup browser itu** sebelum mengunduh. Hanya tersedia di mode lokal (PC). |
| **Kode akses** | PIN untuk server yang memakai `ACCESS_TOKEN`. Disimpan di perangkat setelah diisi sekali. |

Cookies hanya dibaca secara lokal oleh yt-dlp dan tidak dikirim ke mana pun selain ke platform asal.

## Kalau ada masalah

| Gejala | Solusi |
| --- | --- |
| `Python tidak ditemukan` | Install Python dari python.org, centang **Add python.exe to PATH**, lalu jalankan lagi. |
| `Gagal memasang dependensi` | Periksa koneksi internet, lalu jalankan `jalankan.bat` lagi. |
| `Your IP address is blocked` (TikTok) | Coba jaringan lain, atau pilih **Cookies browser** setelah login di browser. |
| `login required` / `empty media response` | Video privat atau dibatasi. Login di browser, pilih **Cookies browser** yang sesuai, tutup browser, lalu coba lagi. |
| `Cannot parse data` (Facebook) | Link mungkin butuh login atau formatnya berubah. Coba link video lain, atau pakai cookies browser. |
| `Postingan ini tidak berisi video` | Link mengarah ke foto/carousel tanpa video. |
| Unduhan lambat / putus | Coba lagi; server platform kadang membatasi kecepatan. |
| Port 8765 sudah dipakai | Tutup aplikasi lain yang memakai port itu, atau jalankan `set PORT=8766 && py server.py` dari folder ini. |
| Browser tidak terbuka otomatis | Buka <http://127.0.0.1:8765> manual. |
| Di HP muncul `Kode akses salah` | Isi PIN yang sama dengan `ACCESS_TOKEN` di Render, di **Opsi lanjutan**. |
| Render lambat saat pertama dibuka | Paket gratis "tidur" setelah tidak dipakai. Tunggu 30–60 detik lalu muat ulang. |
| Instagram/Facebook gagal di server online | IG/FB sering memblokir IP data center. Coba lagi, atau pakai mode lokal di PC. |

## Struktur file

```
unduh-video/
├─ jalankan.bat            # klik dua kali untuk menjalankan di Windows
├─ server.py               # server + logika unduh (yt-dlp) + keamanan PIN
├─ run_server.py           # entrypoint produksi (Waitress) untuk Render
├─ requirements.txt        # dependensi Python
├─ render.yaml             # konfigurasi deploy Render (Blueprint)
├─ Procfile                # alternatif start command untuk hosting lain
├─ .python-version         # versi Python untuk hosting
├─ README.md               # dokumentasi ini
├─ PANDUAN-HP.md           # panduan GitHub + Render + PWA di HP
├─ static/
│  ├─ index.html           # halaman aplikasi
│  ├─ style.css            # tampilan
│  ├─ app.js               # logika antarmuka + PWA
│  ├─ sw.js                # service worker (cache kerangka aplikasi)
│  ├─ manifest.webmanifest # manifest PWA
│  └─ icons/               # ikon PWA (192/512/maskable/apple)
└─ unduhan/                # hasil unduhan (dibuat otomatis, tidak di-commit)
```

## Catatan penting

- Gunakan aplikasi ini untuk **konten milikmu sendiri** atau konten yang kamu punya izinnya.
- Menghormati hak cipta dan Ketentuan Layanan masing-masing platform adalah tanggung jawab pengguna.
- Aplikasi tidak menyimpan, mengunggah, atau membagikan video ke pihak lain. Di mode lokal semua file tetap di komputermu; di mode online file singgah sementara di server milikmu lalu diunduh ke HP.
- Nama aplikasi, platform, dan merek dagang disebut hanya untuk menjelaskan kompatibilitas.

## Teknis

- Backend: Python + Flask.
- Produksi: Waitress (`run_server.py`), membaca `PORT` dan `ACCESS_TOKEN` dari environment.
- Pengunduh: [yt-dlp](https://github.com/yt-dlp/yt-dlp) (mendukung TikTok, Instagram, Facebook, dan banyak situs lain).
- ffmpeg disediakan otomatis lewat paket `imageio-ffmpeg`, dipakai untuk menggabungkan video + audio dan konversi MP3.
- Impersonasi browser (curl_cffi) dipakai bila tersedia untuk mengurangi pemblokiran.
- PWA: manifest + service worker yang hanya meng-cache kerangka aplikasi; API dan file unduhan selalu diambil online.
- Keamanan: kalau `ACCESS_TOKEN` diisi, semua endpoint `/api/*` (kecuali `/api/config`) wajib menyertakan header `X-Access-Token` atau query `?token=`.
