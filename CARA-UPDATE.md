# Cara update VidDown — tampilan baru + HD/Standar + Bagikan

Yang berubah cuma **`index.html`**. File lain (`manifest.json`, `sw.js`, ikon)
tidak perlu disentuh karena sudah ada di repo.

## 1. Ganti index.html di GitHub

### Dari komputer (paling gampang)
1. Buka https://github.com/romini1993/nowatermark
2. Klik **Add file → Upload files**
3. Seret `index.html` dari folder ini, lalu **Commit changes**

### Dari HP
1. Buka repo di browser HP → ketuk file `index.html`
2. Ketuk ikon **pensil (Edit)**
3. Pilih semua isi kotak kode → hapus
4. Tempel isi `index.html` yang baru → **Commit changes**

## 2. Setelah update

- Buka aplikasinya, tarik ke bawah buat refresh 1–2 kali.
- Kalau masih kelihatan versi lama: tutup aplikasi lalu buka lagi.
  (Service worker-nya network-first, jadi update biasanya langsung kepakai.)

## 3. Tampilan baru

Tampilan sekarang mengikuti aplikasi Flask awal:

- Kartu **pratinjau video** (thumbnail, judul, akun, durasi).
- **Progress bar** dengan persentase, kecepatan, dan sisa waktu.
- Kartu **hasil** dengan tombol **Simpan file** dan **Bagikan**.
- Daftar **File terunduh** (riwayat) tersimpan di browser, dengan tombol
  simpan ulang, **bagikan**, dan hapus.
- Pilihan **HD / Standar** di **Opsi lanjutan**, default **HD**.
- Format **Video (MP4)** atau **Audio MP3** (MP3 hanya untuk TikTok).

## 3b. Fitur Bagikan (baru)

- Setelah video terunduh, tekan **Bagikan** di kartu hasil.
- Muncul menu share HP: pilih **WhatsApp** (bisa langsung ke chat atau
  **Status/My Status**), Telegram, Instagram, email, atau aplikasi lain.
- File yang dibagikan adalah video/audio aslinya, bukan link.
- Tombol **bagikan** (ikon panah) juga ada di setiap baris riwayat file.
- Kalau HP/browser belum mendukung bagikan file langsung (misalnya Chrome
  di komputer), tombol Bagikan otomatis menyimpan file dan memberi tahu
  supaya dibagikan dari Galeri/File.
- Fitur ini butuh HTTPS — GitHub Pages sudah HTTPS, jadi aman.
- Di iPhone: menu share muncul lewat Safari/Chrome iOS 15 ke atas; pilih
  WhatsApp untuk kirim ke chat atau status.

## 4. Cara kerjanya (singkat)

- **TikTok** → lewat tikwm, sama seperti sebelumnya.
- **Instagram / Facebook** → halaman dibaca lewat `r.jina.ai`
  (proxy baca halaman, gratis, tanpa API key, CORS-nya aktif), lalu
  link MP4 aslinya diambil dan **langsung disimpan dari browser**.
  Tidak ada redirect ke SnapInsta / FDown lagi.
- File diunduh langsung dari CDN Instagram/Facebook, jadi progress bar
  benar-benar mengikuti ukuran file.

Batas gratis `r.jina.ai`: **20 permintaan per menit per IP**.
Kalau kena limit, aplikasi bakal bilang "tunggu 1 menit".

## 5. Catatan

- Video harus **publik**. Post private / grup tertutup / yang minta login
  memang tidak bisa diambil tanpa akun.
- Riwayat file disimpan di browser (localStorage), bukan di server.
  Tombol simpan ulang di riwayat butuh internet; kalau link CDN-nya sudah
  kedaluwarsa, unduh ulang videonya dari link aslinya.
- Kalau di iPhone file tidak otomatis masuk ke Files, tekan tombol
  **Simpan file** di kartu hasil.

## 6. Link buat ngetes

- Instagram: https://www.instagram.com/reel/Chunk8-jurw/
- Facebook: https://www.facebook.com/cnn/videos/10155529876156509/
- TikTok: https://www.tiktok.com/@tiktok/video/7106594312292453675

## 7. Kalau nanti mau ganti sumber

Di dalam `index.html` ada:

```js
const BACKEND = '';                       // kosong = pakai cara bawaan
const READER  = 'https://r.jina.ai/';     // proxy baca halaman
```

- Ganti `READER` kalau mau pakai proxy baca lain.
- Isi `BACKEND` kalau nanti punya server sendiri (yt-dlp / Worker).
  Format balasannya: `{ "url": "https://...mp4", "title": "...", "author": "..." }`
  dan menerima `?url=LINK_VIDEO`. Kalau `BACKEND` diisi, semua platform lewat situ.
