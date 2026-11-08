import os

from waitress import serve

from server import app, cleanup_temp_files

if __name__ == "__main__":
    cleanup_temp_files()
    port = int(os.environ.get("PORT", "8080"))
    print(f"Unduh Video berjalan di 0.0.0.0:{port}")
    serve(app, host="0.0.0.0", port=port, threads=8)
