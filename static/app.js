(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const el = {
    url: $("url"),
    pasteBtn: $("pasteBtn"),
    checkBtn: $("checkBtn"),
    hint: $("hint"),
    errorBox: $("errorBox"),
    errorText: $("errorText"),
    format: $("format"),
    quality: $("quality"),
    qualityField: $("qualityField"),
    cookies: $("cookies"),
    token: $("token"),
    previewCard: $("previewCard"),
    thumb: $("thumb"),
    thumbFallback: $("thumbFallback"),
    platformPill: $("platformPill"),
    durationPill: $("durationPill"),
    videoTitle: $("videoTitle"),
    videoMeta: $("videoMeta"),
    carouselNote: $("carouselNote"),
    downloadBtn: $("downloadBtn"),
    downloadBtnText: $("downloadBtnText"),
    progressCard: $("progressCard"),
    stageText: $("stageText"),
    percentText: $("percentText"),
    bar: $("bar"),
    barFill: $("barFill"),
    progressMeta: $("progressMeta"),
    resultCard: $("resultCard"),
    resultName: $("resultName"),
    saveLink: $("saveLink"),
    openFolderBtn: $("openFolderBtn"),
    newBtn: $("newBtn"),
    fileList: $("fileList"),
    emptyFiles: $("emptyFiles"),
    refreshFiles: $("refreshFiles"),
    installBtn: $("installBtn"),
    installHint: $("installHint"),
    toast: $("toast"),
  };

  const state = {
    url: "",
    info: null,
    jobId: null,
    checking: false,
    config: null,
  };

  const PLATFORM_LABEL = {
    tiktok: "TikTok",
    instagram: "Instagram",
    facebook: "Facebook",
  };

  const ICON_DOWNLOAD =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 20h16"/></svg>';
  const ICON_TRASH =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>';
  const ICON_PLAY =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M10 9l5 3-5 3V9z"/></svg>';
  const ICON_MUSIC =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></svg>';

  /* ---------------- helpers ---------------- */

  function formatBytes(bytes) {
    const value = Number(bytes) || 0;
    if (value <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let index = 0;
    let size = value;
    while (size >= 1024 && index < units.length - 1) {
      size /= 1024;
      index += 1;
    }
    return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
  }

  function formatSpeed(bytesPerSecond) {
    if (!bytesPerSecond) return "";
    return `${formatBytes(bytesPerSecond)}/s`;
  }

  function formatEta(seconds) {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    const minutes = Math.floor(total / 60);
    const rest = total % 60;
    return minutes > 0 ? `${minutes}m ${String(rest).padStart(2, "0")}s` : `${rest}s`;
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const rest = total % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`;
  }

  function formatDate(timestamp) {
    try {
      return new Date(Number(timestamp) * 1000).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return "";
    }
  }

  function detectPlatform(value) {
    const url = (value || "").toLowerCase();
    if (url.includes("tiktok.com") || url.includes("vt.tiktok")) return "tiktok";
    if (url.includes("instagram.com") || url.includes("instagr.am")) return "instagram";
    if (url.includes("facebook.com") || url.includes("fb.watch") || url.includes("fb.com")) {
      return "facebook";
    }
    return "";
  }

  async function readJson(response) {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { error: text.slice(0, 300) };
    }
  }

  function authToken() {
    return el.token.value.trim();
  }

  function withToken(url) {
    const token = authToken();
    if (!token) return url;
    return `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
  }

  function openTokenField() {
    const details = document.querySelector(".advanced");
    if (details) details.open = true;
    el.token.focus();
  }

  async function apiFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const token = authToken();
    if (token) headers.set("X-Access-Token", token);

    const response = await fetch(path, { ...options, headers });
    if (response.status === 401) {
      const data = await response.clone().json().catch(() => ({}));
      openTokenField();
      throw new Error(data.error || "Butuh kode akses. Isi di Opsi lanjutan.");
    }
    return response;
  }

  let toastTimer = null;
  function toast(message) {
    el.toast.textContent = message;
    el.toast.classList.remove("hidden");
    requestAnimationFrame(() => el.toast.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.classList.remove("show");
      setTimeout(() => el.toast.classList.add("hidden"), 240);
    }, 2600);
  }

  function showError(message) {
    el.errorText.textContent = message;
    el.errorBox.classList.remove("hidden");
  }

  function hideError() {
    el.errorBox.classList.add("hidden");
  }

  function hidePreview() {
    el.previewCard.classList.add("hidden");
  }

  function hideProgress() {
    el.progressCard.classList.add("hidden");
  }

  function setCheckLoading(loading) {
    state.checking = loading;
    el.checkBtn.disabled = loading;
    el.checkBtn.textContent = loading ? "Mengecek..." : "Cek link";
  }

  function updateDownloadLabel() {
    el.downloadBtnText.textContent =
      el.format.value === "audio" ? "Unduh MP3" : "Unduh sekarang";
  }

  /* ---------------- preview ---------------- */

  function renderPreview(info) {
    el.videoTitle.textContent = info.title || "Tanpa judul";

    const meta = [];
    const uploader = (info.uploader || "").trim();
    const platform = (info.platform || "").trim();
    if (uploader && uploader.toLowerCase() !== platform.toLowerCase()) meta.push(uploader);
    if (platform) meta.push(platform);
    el.videoMeta.textContent = meta.join(" · ");

    el.platformPill.textContent = info.platform || "Video";
    el.platformPill.dataset.platform = (info.platform || "").toLowerCase();

    if (info.duration) {
      el.durationPill.textContent = formatDuration(info.duration);
      el.durationPill.classList.remove("hidden");
    } else {
      el.durationPill.classList.add("hidden");
    }

    if (info.thumbnail) {
      el.thumb.onerror = () => {
        el.thumb.classList.add("hidden");
        el.thumbFallback.classList.remove("hidden");
      };
      el.thumb.src = info.thumbnail;
      el.thumb.classList.remove("hidden");
      el.thumbFallback.classList.add("hidden");
    } else {
      el.thumb.removeAttribute("src");
      el.thumb.classList.add("hidden");
      el.thumbFallback.classList.remove("hidden");
    }

    if (info.count > 1) {
      el.carouselNote.textContent = `Postingan ini berisi ${info.count} media. Yang diunduh adalah video pertama.`;
      el.carouselNote.classList.remove("hidden");
    } else {
      el.carouselNote.classList.add("hidden");
    }

    updateDownloadLabel();
    hideProgress();
    el.resultCard.classList.add("hidden");
    el.previewCard.classList.remove("hidden");
    el.previewCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /* ---------------- info request ---------------- */

  async function checkLink() {
    const url = el.url.value.trim();
    if (!url) {
      showError("Tempel link video dulu ya.");
      el.url.focus();
      return;
    }
    if (state.checking) return;

    hideError();
    setCheckLoading(true);

    try {
      const response = await apiFetch("/api/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, cookies: el.cookies.value }),
      });
      const data = await readJson(response);
      if (!response.ok) {
        throw new Error(data.error || "Gagal mengambil info video.");
      }
      state.url = url;
      state.info = data;
      renderPreview(data);
    } catch (error) {
      state.info = null;
      hidePreview();
      showError(error.message || "Gagal mengambil info video. Cek koneksi internet.");
    } finally {
      setCheckLoading(false);
    }
  }

  /* ---------------- download ---------------- */

  function showProgress(percent, stage, meta) {
    el.progressCard.classList.remove("hidden");
    el.stageText.textContent = stage || "Mengunduh...";

    if (typeof percent === "number" && Number.isFinite(percent)) {
      const clamped = Math.min(100, Math.max(0, percent));
      el.bar.classList.remove("indeterminate");
      el.barFill.style.width = `${clamped}%`;
      el.percentText.textContent = `${Math.round(clamped)}%`;
    } else {
      el.bar.classList.add("indeterminate");
      el.percentText.textContent = "";
    }

    el.progressMeta.textContent = meta || "";
  }

  async function startDownload() {
    const url = state.url || el.url.value.trim();
    if (!url) {
      showError("Tempel link video dulu ya.");
      return;
    }
    if (!state.info) {
      await checkLink();
      if (!state.info) return;
    }

    hideError();
    el.downloadBtn.disabled = true;
    el.resultCard.classList.add("hidden");
    showProgress(null, "Menyiapkan...", "");

    try {
      const response = await apiFetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          type: el.format.value,
          quality: el.quality.value,
          cookies: el.cookies.value,
        }),
      });
      const data = await readJson(response);
      if (!response.ok) {
        throw new Error(data.error || "Gagal memulai unduhan.");
      }
      state.jobId = data.job_id;
      pollJob();
    } catch (error) {
      hideProgress();
      showError(error.message || "Gagal memulai unduhan.");
      el.downloadBtn.disabled = false;
    }
  }

  async function pollJob() {
    if (!state.jobId) return;

    try {
      const response = await apiFetch(`/api/job/${state.jobId}`);
      const job = await readJson(response);
      if (!response.ok) {
        throw new Error(job.error || "Gagal memantau proses unduhan.");
      }

      if (job.status === "done") {
        showProgress(100, "Selesai", "");
        setTimeout(hideProgress, 500);
        showResult(job);
        loadFiles();
        el.downloadBtn.disabled = false;
        return;
      }

      if (job.status === "error") {
        hideProgress();
        showError(job.error || "Unduhan gagal. Coba lagi.");
        el.downloadBtn.disabled = false;
        return;
      }

      const percent = typeof job.progress === "number" ? job.progress : null;
      const meta = [];
      if (job.speed) meta.push(formatSpeed(job.speed));
      if (job.eta) meta.push(`sisa ${formatEta(job.eta)}`);
      showProgress(percent, job.stage || "Mengunduh...", meta.join(" · "));
      setTimeout(pollJob, 700);
    } catch (error) {
      hideProgress();
      showError(error.message || "Koneksi ke server terputus.");
      el.downloadBtn.disabled = false;
    }
  }

  function showResult(job) {
    const name = job.title || job.file || "Video";
    el.resultName.textContent = `${name} · ${formatBytes(job.size)}`;
    el.saveLink.href = withToken(job.file_url);
    el.saveLink.setAttribute("download", job.file || "");
    el.resultCard.classList.remove("hidden");
    el.resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /* ---------------- file history ---------------- */

  function fileIcon(name) {
    const wrap = document.createElement("div");
    wrap.className = "file-icon";
    wrap.innerHTML = /\.(mp3|m4a)$/i.test(name) ? ICON_MUSIC : ICON_PLAY;
    return wrap;
  }

  function renderFiles(files) {
    el.fileList.replaceChildren();
    el.emptyFiles.classList.toggle("hidden", files.length > 0);

    for (const file of files) {
      const item = document.createElement("li");
      item.className = "file-item";
      item.appendChild(fileIcon(file.name));

      const info = document.createElement("div");
      info.className = "file-info";

      const name = document.createElement("span");
      name.className = "file-name";
      name.textContent = file.name;
      name.title = file.name;

      const sub = document.createElement("span");
      sub.className = "file-sub";
      sub.textContent = `${formatBytes(file.size)} · ${formatDate(file.mtime)}`;

      info.append(name, sub);

      const actions = document.createElement("div");
      actions.className = "file-actions";

      const save = document.createElement("a");
      save.className = "icon-btn";
      save.href = withToken(file.url);
      save.title = "Simpan file";
      save.setAttribute("download", file.name);
      save.innerHTML = ICON_DOWNLOAD;
      save.addEventListener("click", (event) => event.stopPropagation());
      actions.appendChild(save);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "icon-btn danger";
      remove.title = "Hapus file";
      remove.setAttribute("aria-label", `Hapus ${file.name}`);
      remove.innerHTML = ICON_TRASH;
      remove.addEventListener("click", () => deleteFile(file.name));
      actions.appendChild(remove);

      item.append(info, actions);
      el.fileList.appendChild(item);
    }
  }

  async function loadFiles() {
    try {
      const response = await apiFetch("/api/files");
      const data = await readJson(response);
      renderFiles(Array.isArray(data.files) ? data.files : []);
    } catch {
      /* daftar file opsional; diamkan kalau gagal */
    }
  }

  async function deleteFile(name) {
    if (!window.confirm(`Hapus "${name}" dari folder unduhan?`)) return;
    try {
      const response = await apiFetch(`/api/file/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || "Gagal menghapus file.");
      toast("File dihapus.");
      loadFiles();
    } catch (error) {
      toast(error.message || "Gagal menghapus file.");
    }
  }

  /* ---------------- events ---------------- */

  function handleUrlChanged() {
    const value = el.url.value.trim();
    const platform = detectPlatform(value);

    document.querySelectorAll(".badge").forEach((badge) => {
      badge.classList.toggle("active", badge.dataset.platform === platform);
    });

    if (platform) {
      el.hint.innerHTML = `Terdeteksi link <b>${PLATFORM_LABEL[platform]}</b>. Tekan <b>Cek link</b> untuk melihat pratinjau.`;
    } else {
      el.hint.innerHTML = "Tempel link postingan video, lalu tekan <b>Cek link</b>.";
    }

    if (state.url && value !== state.url) {
      state.info = null;
      hidePreview();
      el.resultCard.classList.add("hidden");
    }
    hideError();
  }

  el.url.addEventListener("input", handleUrlChanged);
  el.url.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      checkLink();
    }
  });
  el.url.addEventListener("paste", () => {
    setTimeout(() => {
      handleUrlChanged();
      checkLink();
    }, 120);
  });

  el.pasteBtn.addEventListener("click", async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) {
        toast("Clipboard kosong.");
        return;
      }
      el.url.value = text;
      handleUrlChanged();
      checkLink();
    } catch {
      el.url.focus();
      toast("Tidak bisa membaca clipboard. Tekan Ctrl+V di kolom link.");
    }
  });

  el.checkBtn.addEventListener("click", checkLink);
  el.downloadBtn.addEventListener("click", startDownload);
  el.refreshFiles.addEventListener("click", () => {
    loadFiles();
    toast("Daftar file dimuat ulang.");
  });

  el.openFolderBtn.addEventListener("click", async () => {
    try {
      const response = await apiFetch("/api/open-folder", { method: "POST" });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || "Tidak bisa membuka folder.");
      toast("Folder unduhan dibuka.");
    } catch (error) {
      toast(error.message || "Tidak bisa membuka folder.");
    }
  });

  el.newBtn.addEventListener("click", () => {
    state.url = "";
    state.info = null;
    state.jobId = null;
    el.url.value = "";
    el.downloadBtn.disabled = false;
    hidePreview();
    hideProgress();
    el.resultCard.classList.add("hidden");
    hideError();
    handleUrlChanged();
    window.scrollTo({ top: 0, behavior: "smooth" });
    el.url.focus();
  });

  el.format.addEventListener("change", () => {
    el.qualityField.classList.toggle("hidden", el.format.value === "audio");
    updateDownloadLabel();
  });

  try {
    const savedCookies = localStorage.getItem("unduhvideo.cookies");
    if (savedCookies !== null) el.cookies.value = savedCookies;
  } catch {
    /* localStorage bisa diblokir; abaikan */
  }

  el.cookies.addEventListener("change", () => {
    try {
      localStorage.setItem("unduhvideo.cookies", el.cookies.value);
    } catch {
      /* abaikan */
    }
  });

  try {
    const savedToken = localStorage.getItem("unduhvideo.token");
    if (savedToken) el.token.value = savedToken;
  } catch {
    /* abaikan */
  }

  el.token.addEventListener("change", () => {
    try {
      const token = el.token.value.trim();
      if (token) localStorage.setItem("unduhvideo.token", token);
      else localStorage.removeItem("unduhvideo.token");
    } catch {
      /* abaikan */
    }
    if (!state.config?.token_required || authToken()) loadFiles();
  });

  /* ---------------- PWA ---------------- */

  let deferredInstallPrompt = null;
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  if (isStandalone) {
    el.installBtn.classList.add("hidden");
    el.installHint.classList.add("hidden");
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    el.installBtn.classList.remove("hidden");
  });

  el.installBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    try {
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === "accepted") toast("Aplikasi berhasil dipasang.");
    } catch {
      /* abaikan */
    }
    deferredInstallPrompt = null;
    el.installBtn.classList.add("hidden");
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    el.installBtn.classList.add("hidden");
    el.installHint.classList.add("hidden");
    toast("Aplikasi berhasil dipasang.");
  });

  if ("serviceWorker" in navigator) {
    const isSecure =
      location.protocol === "https:" ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1";
    if (isSecure) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          /* PWA opsional; abaikan kalau gagal */
        });
      });
    }
  }

  /* ---------------- init ---------------- */

  async function loadConfig() {
    try {
      const response = await fetch("/api/config");
      const data = await readJson(response);
      state.config = data;
      if (data.local === false) {
        el.openFolderBtn.classList.add("hidden");
      }
    } catch {
      /* konfigurasi opsional; abaikan kalau gagal */
    }
  }

  async function init() {
    await loadConfig();
    handleUrlChanged();
    updateDownloadLabel();
    const needsToken = state.config?.token_required && !authToken();
    if (needsToken) {
      el.hint.innerHTML =
        "Server ini memakai kode akses. Isi <b>Kode akses</b> di Opsi lanjutan dulu, lalu tempel link.";
    } else {
      loadFiles();
    }
  }

  init();
})();
