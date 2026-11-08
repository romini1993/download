@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Unduh Video

set "PY=py"
%PY% -c "import sys" >nul 2>nul
if errorlevel 1 (
  set "PY=python"
  %PY% -c "import sys" >nul 2>nul
  if errorlevel 1 (
    echo.
    echo Python tidak ditemukan.
    echo Install Python 3.10 atau lebih baru dari https://www.python.org/downloads/
    echo Saat instalasi, centang "Add python.exe to PATH", lalu jalankan file ini lagi.
    echo.
    pause
    exit /b 1
  )
)

%PY% -c "import flask, yt_dlp, imageio_ffmpeg" >nul 2>nul
if errorlevel 1 (
  echo Memasang dependensi (sekali saja, butuh internet)...
  %PY% -m pip install -r requirements.txt --disable-pip-version-check -q
  if errorlevel 1 (
    echo.
    echo Gagal memasang dependensi. Periksa koneksi internet lalu coba lagi.
    echo.
    pause
    exit /b 1
  )
)

%PY% server.py
pause
