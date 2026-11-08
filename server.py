# -*- coding: utf-8 -*-
"""
Unduh Video - server lokal.

Menjalankan web app kecil di 127.0.0.1 yang memakai yt-dlp untuk
mengunduh video TikTok, Instagram, dan Facebook tanpa watermark.
Semua proses berjalan di komputer ini; tidak ada pengalihan ke situs lain.
"""

import os
import re
import sys
import time
import uuid
import hmac
import mimetypes
import threading
import traceback
import webbrowser
from pathlib import Path
from urllib.parse import quote

from flask import Flask, jsonify, request, send_from_directory

try:
    import yt_dlp
except ImportError:
    print("yt-dlp belum terpasang.")
    print("Jalankan: py -m pip install -r requirements.txt")
    sys.exit(1)

try:
    from yt_dlp.networking.impersonate import ImpersonateTarget
except ImportError:
    ImpersonateTarget = None

IMPERSONATE_TARGET = None
if ImpersonateTarget is not None:
    try:
        IMPERSONATE_TARGET = ImpersonateTarget("chrome")
    except Exception:  # noqa: BLE001
        IMPERSONATE_TARGET = None

BASE_DIR = Path(__file__).resolve().parent
DOWNLOAD_DIR = BASE_DIR / "unduhan"
DOWNLOAD_DIR.mkdir(exist_ok=True)

mimetypes.add_type("application/manifest+json", ".webmanifest")
mimetypes.add_type("text/javascript", ".js")

# Cegah crash saat menulis log berisi karakter non-ASCII di konsol Windows.
for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(errors="replace")
    except Exception:  # noqa: BLE001
        pass

app = Flask(__name__, static_folder=str(BASE_DIR / "static"), static_url_path="")
app.json.ensure_ascii = False

ACCESS_TOKEN = os.environ.get("ACCESS_TOKEN", "").strip()

# Render menandai prosesnya dengan env RENDER=true. Di cloud tidak ada
# desktop, jadi tombol "Buka folder" disembunyikan.
IS_CLOUD = os.environ.get("RENDER", "").strip().lower() in {"1", "true", "yes"}

JOBS = {}
JOBS_LOCK = threading.Lock()


@app.before_request
def require_access_token():
    """Kalau ACCESS_TOKEN diisi, semua endpoint /api wajib memakai kode itu."""
    if not ACCESS_TOKEN or not request.path.startswith("/api/"):
        return None
    if request.path == "/api/config":
        return None
    if request.method == "OPTIONS":
        return None
    supplied = request.headers.get("X-Access-Token") or request.args.get("token", "")
    if not hmac.compare_digest(supplied, ACCESS_TOKEN):
        return (
            jsonify(
                {
                    "error": "Kode akses salah. Isi kode akses di Opsi lanjutan.",
                    "auth": True,
                }
            ),
            401,
        )
    return None

COOKIE_BROWSERS = {"chrome", "edge", "firefox", "brave", "opera", "vivaldi", "chromium"}
VIDEO_EXTS = {".mp4", ".mkv", ".webm", ".mov", ".m4a", ".mp3"}
TEMP_PREFIX = ".unduh-"


def get_ffmpeg():
    """Ambil ffmpeg bawaan paket imageio-ffmpeg kalau ada."""
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None


FFMPEG = get_ffmpeg()


def base_opts(cookies=""):
    opts = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "playlist_items": "1",
        "nocheckcertificate": True,
        "windowsfilenames": True,
        "retries": 3,
        "fragment_retries": 3,
        "socket_timeout": 30,
    }
    if FFMPEG:
        opts["ffmpeg_location"] = FFMPEG
    if cookies in COOKIE_BROWSERS:
        opts["cookiesfrombrowser"] = (cookies,)
    return opts


def extract(url, opts, download=False):
    """
    Jalankan yt-dlp. Coba dengan impersonate (lebih tahan blokir),
    lalu ulangi tanpa impersonate bila fitur itu tidak tersedia.
    """
    with_impersonate = dict(opts)
    if IMPERSONATE_TARGET is not None:
        with_impersonate["impersonate"] = IMPERSONATE_TARGET
    attempts = [with_impersonate, dict(opts)] if IMPERSONATE_TARGET is not None else [dict(opts)]
    last_error = None

    for attempt in attempts:
        try:
            with yt_dlp.YoutubeDL(attempt) as ydl:
                return ydl.extract_info(url, download=download)
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            message = str(exc).lower()
            if "impersonat" in message or "curl_cffi" in message:
                continue
            raise

    raise last_error


def pick_entry(info):
    """Untuk postingan carousel/playlist, ambil video pertama."""
    if info.get("_type") == "playlist":
        entries = [e for e in (info.get("entries") or []) if e]
        if entries:
            return entries[0], len(entries)
    return info, 1


def platform_name(info):
    key = (info.get("extractor_key") or info.get("extractor") or "").lower()
    if "tiktok" in key:
        return "TikTok"
    if "instagram" in key:
        return "Instagram"
    if "facebook" in key:
        return "Facebook"
    return info.get("extractor_key") or "Video"


def friendly_error(exc):
    message = re.sub(r"^ERROR:\s*", "", str(exc)).split("\n")[0].strip()
    low = message.lower()

    if "unsupported url" in low:
        return "Link tidak dikenali. Pastikan link video TikTok/Instagram/Facebook yang valid."
    if "no video" in low or "there is no video" in low:
        return "Postingan ini tidak berisi video (mungkin hanya foto)."
    if "private" in low:
        return "Video ini privat. Login dulu di browser, lalu pilih browser cookies di Opsi lanjutan."
    if any(k in low for k in ("login", "cookies", "rate-limit", "rate limit", "empty media response")):
        return message + " — coba pilih browser cookies di Opsi lanjutan (pastikan sudah login di browser itu)."
    if "ffmpeg" in low:
        return "Butuh ffmpeg untuk memproses file. Jalankan ulang jalankan.bat agar dependensi terpasang."
    if "unable to download" in low or "failed to download" in low:
        return "Gagal mengunduh video. Coba lagi beberapa saat lagi atau pakai link lain."
    return message[:320] or "Terjadi kesalahan saat memproses link."


def locate_file(info):
    candidates = []
    for item in info.get("requested_downloads") or []:
        for key in ("filepath", "filename"):
            if item.get(key):
                candidates.append(Path(item[key]))
    for key in ("filepath", "_filename"):
        if info.get(key):
            candidates.append(Path(info[key]))

    for path in candidates:
        if path.exists():
            return path

    # File hasil post-processing (mis. mp3) bisa beda ekstensi.
    for path in candidates:
        stem = path.with_suffix("")
        for ext in VIDEO_EXTS:
            alternative = Path(str(stem) + ext)
            if alternative.exists():
                return alternative
    return None


def safe_filename(value, fallback="video"):
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", str(value or ""))
    name = re.sub(r"\s+", " ", name).strip(" .")
    if not name:
        name = fallback
    return name[:120].rstrip(" .")


def final_path_for(info, path):
    """Beri nama file yang rapi dan tidak menimpa file lain."""
    title = safe_filename(info.get("title") or path.stem)
    video_id = safe_filename(info.get("id") or "")
    stem = f"{title} [{video_id}]" if video_id else title
    ext = path.suffix or ".mp4"

    target = DOWNLOAD_DIR / f"{stem}{ext}"
    counter = 2
    while target.exists():
        target = DOWNLOAD_DIR / f"{stem} ({counter}){ext}"
        counter += 1
    return target


def cleanup_temp_files(max_age=6 * 3600):
    """Hapus sisa file sementara dari proses yang terhenti."""
    now = time.time()
    for path in DOWNLOAD_DIR.glob(f"{TEMP_PREFIX}*"):
        try:
            if path.is_file() and now - path.stat().st_mtime > max_age:
                path.unlink()
        except OSError:
            pass


def cleanup_old_downloads(max_age=3600):
    """Di cloud, disk terbatas: buang file lama supaya tidak penuh."""
    if not IS_CLOUD:
        return
    now = time.time()
    for path in DOWNLOAD_DIR.iterdir():
        try:
            if (
                path.is_file()
                and path.suffix.lower() in VIDEO_EXTS
                and not path.name.startswith(TEMP_PREFIX)
                and now - path.stat().st_mtime > max_age
            ):
                path.unlink()
        except OSError:
            pass


def run_job(job_id, url, media_type, quality, cookies):
    def progress_hook(data):
        with JOBS_LOCK:
            job = JOBS.get(job_id)
            if not job:
                return
            if data.get("status") == "downloading":
                total = data.get("total_bytes") or data.get("total_bytes_estimate")
                done = data.get("downloaded_bytes") or 0
                job["progress"] = round(done * 100 / total, 1) if total else None
                job["speed"] = data.get("speed")
                job["eta"] = data.get("eta")
                job["stage"] = "Mengunduh..."
            elif data.get("status") == "finished":
                job["progress"] = 100
                job["stage"] = "Memproses file..."

    opts = base_opts(cookies)
    opts["progress_hooks"] = [progress_hook]
    opts["outtmpl"] = str(DOWNLOAD_DIR / f"{TEMP_PREFIX}{job_id}.%(ext)s")

    if media_type == "audio":
        if not FFMPEG:
            with JOBS_LOCK:
                JOBS[job_id].update(
                    status="error",
                    stage="Gagal",
                    error="Konversi MP3 butuh ffmpeg. Jalankan ulang jalankan.bat.",
                )
            return
        opts["format"] = "ba/b"
        opts["postprocessors"] = [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }
        ]
    else:
        height = int(quality) if str(quality).isdigit() else None
        if FFMPEG:
            opts["format"] = (
                f"bv*[height<={height}]+ba/b[height<={height}]/b"
                if height
                else "bv*+ba/b"
            )
            opts["merge_output_format"] = "mp4"
            opts["format_sort"] = ["res", "vcodec:h264", "ext:mp4:m4a"]
        else:
            opts["format"] = f"b[height<={height}]/b" if height else "b"

    with JOBS_LOCK:
        job = JOBS.get(job_id)
        if not job:
            return
        job["status"] = "running"
        job["stage"] = "Menyiapkan..."

    try:
        info = extract(url, opts, download=True)
        entry, _ = pick_entry(info)
        path = locate_file(entry)
        if not path:
            raise RuntimeError("File hasil unduhan tidak ditemukan.")

        target = final_path_for(entry, path)
        path.replace(target)
        path = target
        size = path.stat().st_size
        with JOBS_LOCK:
            job = JOBS.get(job_id)
            if not job:
                return
            job.update(
                status="done",
                progress=100,
                stage="Selesai",
                file=path.name,
                size=size,
                title=entry.get("title") or path.stem,
                file_url="/api/file/" + quote(path.name),
                finished_at=time.time(),
            )
    except Exception as exc:  # noqa: BLE001
        print(f"[unduh-video] gagal: {exc!r}", file=sys.stderr, flush=True)
        traceback.print_exc()
        for leftover in DOWNLOAD_DIR.glob(f"{TEMP_PREFIX}{job_id}*"):
            try:
                leftover.unlink()
            except OSError:
                pass
        with JOBS_LOCK:
            job = JOBS.get(job_id)
            if not job:
                return
            job.update(status="error", stage="Gagal", error=friendly_error(exc))


@app.get("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.post("/api/info")
def api_info():
    data = request.get_json(silent=True) or {}
    url = (data.get("url") or "").strip()
    cookies = data.get("cookies") or ""

    if not url:
        return jsonify({"error": "Tempel link video dulu ya."}), 400

    opts = base_opts(cookies)
    opts["skip_download"] = True

    try:
        info = extract(url, opts, download=False)
    except Exception as exc:  # noqa: BLE001
        print(f"[unduh-video] info gagal: {exc!r}", file=sys.stderr, flush=True)
        traceback.print_exc()
        return jsonify({"error": friendly_error(exc)}), 400

    entry, count = pick_entry(info)
    return jsonify(
        {
            "title": entry.get("title") or "Tanpa judul",
            "thumbnail": entry.get("thumbnail"),
            "duration": entry.get("duration"),
            "uploader": entry.get("uploader")
            or entry.get("channel")
            or entry.get("creator")
            or "",
            "platform": platform_name(entry),
            "count": count,
            "webpage_url": entry.get("webpage_url") or url,
        }
    )


@app.post("/api/download")
def api_download():
    data = request.get_json(silent=True) or {}
    url = (data.get("url") or "").strip()
    media_type = data.get("type") or "video"
    quality = data.get("quality") or "best"
    cookies = data.get("cookies") or ""

    if not url:
        return jsonify({"error": "Link video masih kosong."}), 400
    if media_type not in {"video", "audio"}:
        media_type = "video"

    job_id = uuid.uuid4().hex[:12]
    with JOBS_LOCK:
        JOBS[job_id] = {
            "id": job_id,
            "status": "queued",
            "progress": 0,
            "stage": "Menunggu...",
            "created_at": time.time(),
        }

    thread = threading.Thread(
        target=run_job,
        args=(job_id, url, media_type, quality, cookies),
        daemon=True,
    )
    thread.start()
    return jsonify({"job_id": job_id})


@app.get("/api/job/<job_id>")
def api_job(job_id):
    with JOBS_LOCK:
        job = dict(JOBS.get(job_id) or {})
    if not job:
        return jsonify({"error": "Proses tidak ditemukan."}), 404
    return jsonify(job)


@app.get("/api/config")
def api_config():
    return jsonify(
        {
            "local": not IS_CLOUD,
            "token_required": bool(ACCESS_TOKEN),
            "version": "1.0",
        }
    )


@app.get("/api/files")
def api_files():
    cleanup_old_downloads()
    files = []
    for path in DOWNLOAD_DIR.iterdir():
        if path.is_file() and path.suffix.lower() in VIDEO_EXTS and not path.name.startswith(TEMP_PREFIX):
            stat = path.stat()
            files.append(
                {
                    "name": path.name,
                    "size": stat.st_size,
                    "mtime": stat.st_mtime,
                    "url": "/api/file/" + quote(path.name),
                }
            )
    files.sort(key=lambda item: item["mtime"], reverse=True)
    return jsonify({"files": files[:60]})


@app.get("/api/file/<path:name>")
def api_file(name):
    return send_from_directory(DOWNLOAD_DIR, name, as_attachment=True)


@app.delete("/api/file/<path:name>")
def api_delete_file(name):
    target = (DOWNLOAD_DIR / name).resolve()
    if target.parent != DOWNLOAD_DIR.resolve() or not target.is_file():
        return jsonify({"error": "File tidak ditemukan."}), 404
    try:
        target.unlink()
    except OSError as exc:
        return jsonify({"error": f"Gagal menghapus file: {exc}"}), 500
    return jsonify({"ok": True})


@app.post("/api/open-folder")
def api_open_folder():
    try:
        if sys.platform == "win32":
            os.startfile(str(DOWNLOAD_DIR))  # type: ignore[attr-defined]
        elif sys.platform == "darwin":
            import subprocess

            subprocess.Popen(["open", str(DOWNLOAD_DIR)])
        else:
            import subprocess

            subprocess.Popen(["xdg-open", str(DOWNLOAD_DIR)])
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"Tidak bisa membuka folder: {exc}"}), 500
    return jsonify({"ok": True})


def main():
    port = int(os.environ.get("PORT", "8765"))
    host = os.environ.get("HOST", "127.0.0.1").strip() or "127.0.0.1"
    cleanup_temp_files()

    if "--no-browser" not in sys.argv:
        threading.Timer(
            1.2, lambda: webbrowser.open(f"http://127.0.0.1:{port}")
        ).start()

    print()
    print("  Unduh Video siap dipakai.")
    print(f"  Buka di browser: http://{'127.0.0.1' if host == '0.0.0.0' else host}:{port}")
    print(f"  Folder hasil unduhan: {DOWNLOAD_DIR}")
    print("  Tekan Ctrl+C untuk berhenti.")
    print()

    app.run(host=host, port=port, debug=False, threaded=True)


if __name__ == "__main__":
    main()
