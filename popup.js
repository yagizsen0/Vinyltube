// ============================================================================
// Vinyltube - Popup Arayüz Yönetimi (popup.js)
// content.js ve background.js'den gelen şarkı verilerini anlık olarak
// plak animasyonuna, dinamik arka plan renklerine ve kontrol butonlarına yansıtır.
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // 1. HTML DOM Elemanlarının Seçimi
  const vinylDisc = document.getElementById("vinyl-disc");
  const albumArt = document.getElementById("album-art");
  const bgBlurLayer = document.getElementById("bg-blur-layer");
  const colorCanvas = document.getElementById("color-canvas");
  const statusBadge = document.getElementById("status-badge");
  const statusText = document.getElementById("status-text");
  const trackTitle = document.getElementById("track-title");
  const trackArtist = document.getElementById("track-artist");
  const warningBox = document.getElementById("warning-box");
  const warningText = document.getElementById("warning-text");
  const btnOpenYtm = document.getElementById("btn-open-ytm");
  const btnPrev = document.getElementById("btn-prev");
  const btnPlayPause = document.getElementById("btn-play-pause");
  const btnNext = document.getElementById("btn-next");
  const iconPlay = document.getElementById("icon-play");
  const iconPause = document.getElementById("icon-pause");

  // Son yüklenen albüm kapağı URL'sini takip ederek gereksiz yeniden yüklemeleri önler
  let currentArtworkUrl = "";

  /**
   * Albüm kapağı görselini 32x32 boyutundaki gizli Canvas üzerine çizerek
   * görselin baskın renklerini çıkarır ve CSS değişkenlerine (--color-primary vb.) uygular.
   * @param {HTMLImageElement} imgEl - Yüklenmiş albüm kapağı <img> elemanı
   */
  function updateDynamicBackgroundColors(imgEl) {
    try {
      const ctx = colorCanvas.getContext("2d", { willReadFrequently: true });
      const size = 32;

      // Görseli küçük canvas'a çiz
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(imgEl, 0, 0, size, size);

      // Piksel verilerini (RGBA dizisi) oku
      const imageData = ctx.getImageData(0, 0, size, size).data;

      // Üst-sol ve alt-sağ bölgelerden renk ortalaması hesaplamak için sayaçlar
      let r1 = 0, g1 = 0, b1 = 0, count1 = 0;
      let r2 = 0, g2 = 0, b2 = 0, count2 = 0;

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const r = imageData[idx];
          const g = imageData[idx + 1];
          const b = imageData[idx + 2];
          const a = imageData[idx + 3];

          // Şeffaf pikselleri atla
          if (a < 128) continue;

          // Çok siyah veya çok beyaz pikselleri filtrele ki degrade canlı dursun
          const brightness = (r + g + b) / 3;
          if (brightness < 18 || brightness > 240) continue;

          // Görselin üst yarısını birincil renge, alt yarısını ikincil renge dahil et
          if (y < size / 2) {
            r1 += r;
            g1 += g;
            b1 += b;
            count1++;
          } else {
            r2 += r;
            g2 += g;
            b2 += b;
            count2++;
          }
        }
      }

      // Yeterli canlı piksel bulunamadıysa varsayılan koyu bordo/lacivert temayı koru
      if (count1 === 0 || count2 === 0) {
        return;
      }

      // Ortalama RGB değerlerini hesapla ve arka plan için hafif koyulaştır
      const pR = Math.round((r1 / count1) * 0.65);
      const pG = Math.round((g1 / count1) * 0.65);
      const pB = Math.round((b1 / count1) * 0.65);

      const sR = Math.round((r2 / count2) * 0.45);
      const sG = Math.round((g2 / count2) * 0.45);
      const sB = Math.round((b2 / count2) * 0.45);

      // Plak arkasındaki parlama (glow) için daha canlı RGB değerleri
      const glowR = Math.min(255, Math.round((r1 / count1) * 1.1));
      const glowG = Math.min(255, Math.round((g1 / count1) * 1.1));
      const glowB = Math.min(255, Math.round((b1 / count1) * 1.1));

      // CSS değişkenlerini (:root) güncelle
      const rootStyle = document.documentElement.style;
      rootStyle.setProperty("--color-primary", `rgb(${pR}, ${pG}, ${pB})`);
      rootStyle.setProperty("--color-secondary", `rgb(${sR}, ${sG}, ${sB})`);
      rootStyle.setProperty(
        "--color-glow",
        `rgba(${glowR}, ${glowG}, ${glowB}, 0.38)`
      );
    } catch (_) {
      // CORS veya okuma kısıtlaması olursa blur arka plan katmanı zaten aktif kalır
    }
  }

  /**
   * Açık bir YouTube Music sekmesi olmadığında veya herhangi bir şarkı oynatılmadığında
   * uyarı/bekleme ekranını gösterir ve plak dönüşünü durdurur.
   */
  function showWaitingState() {
    // 1. Plak dönme animasyonunu durdur
    vinylDisc.classList.remove("playing");
    vinylDisc.classList.add("paused");

    // 2. Durum rozetini "BEKLEMEDE" olarak ayarla
    statusBadge.classList.remove("playing", "paused");
    statusText.textContent = "BEKLEMEDE";

    // 3. Şarkı/sanatçı başlıklarını gizleyip şık uyarı kutusunu göster
    trackTitle.classList.add("hidden");
    trackArtist.classList.add("hidden");
    warningBox.classList.add("active");
    warningText.textContent =
      "Lütfen YouTube Music'i açın ve bir şarkı oynatın";

    // 4. Oynatma/duraklatma ikonunu Play durumuna getir ve butonları devre dışı bırak
    iconPlay.classList.remove("hidden");
    iconPause.classList.add("hidden");
    btnPrev.disabled = true;
    btnPlayPause.disabled = true;
    btnNext.disabled = true;

    // 5. Plak kapağını varsayılan Vinylfy ikonuna döndür
    if (currentArtworkUrl !== "icon.png") {
      currentArtworkUrl = "icon.png";
      albumArt.src = "icon.png";
      bgBlurLayer.style.backgroundImage = `url("icon.png")`;
    }
  }

  /**
   * content.js'den gelen şarkı bilgilerine göre popup arayüzünü günceller.
   * @param {Object|null} trackData - Şarkı bilgileri nesnesi
   */
  function renderTrackState(trackData) {
    // Geçerli bir şarkı verisi yoksa bekleme/uyarı ekranını göster
    if (!trackData || !trackData.hasTrack) {
      showWaitingState();
      return;
    }

    // Uyarı kutusunu gizle, şarkı ve sanatçı metinlerini görünür yap
    warningBox.classList.remove("active");
    trackTitle.classList.remove("hidden");
    trackArtist.classList.remove("hidden");

    // Kontrol butonlarını etkinleştir
    btnPrev.disabled = false;
    btnPlayPause.disabled = false;
    btnNext.disabled = false;

    // Şarkı adı ve sanatçı bilgilerini yazdır
    trackTitle.textContent = trackData.title;
    trackTitle.title = trackData.title;
    trackArtist.textContent = trackData.artist;
    trackArtist.title = trackData.artist;

    // Oynatma / Duraklatma durumuna göre plak dönüşünü ve ikonları güncelle
    if (trackData.isPlaying) {
      // Şarkı çalıyor: Plak döner, rozet NOW PLAYING olur, Pause ikonu görünür
      vinylDisc.classList.remove("paused");
      vinylDisc.classList.add("playing");

      statusBadge.classList.remove("paused");
      statusBadge.classList.add("playing");
      statusText.textContent = "NOW PLAYING";

      iconPlay.classList.add("hidden");
      iconPause.classList.remove("hidden");
    } else {
      // Şarkı duraklatıldı: Plak olduğu yerde durur, rozet PAUSED olur, Play ikonu görünür
      vinylDisc.classList.remove("playing");
      vinylDisc.classList.add("paused");

      statusBadge.classList.remove("playing");
      statusBadge.classList.add("paused");
      statusText.textContent = "PAUSED";

      iconPlay.classList.remove("hidden");
      iconPause.classList.add("hidden");
    }

    // Albüm kapağı değiştiyse hem plak kapağını hem de arka plan blur/renk katmanını güncelle
    const newArtwork = trackData.artwork || "icon.png";
    if (newArtwork !== currentArtworkUrl) {
      currentArtworkUrl = newArtwork;
      albumArt.src = newArtwork;
      bgBlurLayer.style.backgroundImage = `url("${newArtwork}")`;
    }
  }

  // Albüm kapağı görseli yüklendiğinde baskın renkleri çıkarıp arka plan degradesine uygula
  albumArt.addEventListener("load", () => {
    updateDynamicBackgroundColors(albumArt);
  });

  // Görsel yüklenemezse varsayılan ikona geri dön
  albumArt.addEventListener("error", () => {
    if (albumArt.src !== "icon.png") {
      albumArt.src = "icon.png";
      bgBlurLayer.style.backgroundImage = `url("icon.png")`;
    }
  });

  /**
   * Background betiğinden güncel YouTube Music durumunu sorgular.
   */
  function requestCurrentStatus() {
    chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
      if (chrome.runtime.lastError || !response || !response.tabFound) {
        showWaitingState();
        return;
      }
      renderTrackState(response.data);
    });
  }

  /**
   * Kullanıcının tıkladığı kontrol butonuna göre YouTube Music sekmesine komut gönderir.
   * @param {string} command - "PREV_TRACK" | "TOGGLE_PLAY" | "NEXT_TRACK"
   */
  function sendControlCommand(command) {
    chrome.runtime.sendMessage(
      {
        type: "CONTROL_COMMAND",
        command
      },
      (response) => {
        if (chrome.runtime.lastError || !response || !response.tabFound) {
          showWaitingState();
          return;
        }
        renderTrackState(response.data);
      }
    );
  }

  // ==========================================================================
  // BUTON TIKLAMA OLAYLARI
  // ==========================================================================

  // Önceki Şarkı (Skip Back)
  btnPrev.addEventListener("click", () => {
    sendControlCommand("PREV_TRACK");
  });

  // Başlat / Durdur (Play / Pause)
  btnPlayPause.addEventListener("click", () => {
    sendControlCommand("TOGGLE_PLAY");
  });

  // Sonraki Şarkı (Skip Forward)
  btnNext.addEventListener("click", () => {
    sendControlCommand("NEXT_TRACK");
  });

  // Uyarı ekranındaki "YouTube Music'i Aç" butonu
  btnOpenYtm.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "OPEN_YTM" });
  });

  // ==========================================================================
  // GERÇEK ZAMANLI GÜNCELLEME DİNLEYİCİSİ
  // ==========================================================================

  // content.js şarkı değiştiğinde veya durduğunda anlık TRACK_UPDATE mesajı gönderir
  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.type === "TRACK_UPDATE") {
      renderTrackState(message.data);
    }
  });

  // Popup açılır açılmaz ilk durumu çek ve açık kaldığı sürece her 1.5 saniyede bir senkronize et
  requestCurrentStatus();
  setInterval(requestCurrentStatus, 1500);
});
