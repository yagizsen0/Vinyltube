// ============================================================================
// Vinyltube - YouTube Music İçerik Betiği (content.js)
// music.youtube.com sekmesinde çalışır; şarkı bilgilerini izler ve
// popup'tan gelen oynat/durdur/atla komutlarını sayfadaki butonlara uygular.
// ============================================================================

(() => {
  // Betiğin aynı sayfaya birden fazla kez enjekte edilmesini önleyen koruma bayrağı
  if (window.__vinyltubeContentScriptLoaded) {
    return;
  }
  window.__vinyltubeContentScriptLoaded = true;

  // Son gönderilen durumu saklayarak gereksiz mesaj trafiğini önleyen değişken
  let lastSerializedState = "";

  /**
   * YouTube Music küçük kapak görseli URL'lerini (örn. w60-h60)
   * yüksek çözünürlüklü (544x544) versiyona yükseltir.
   * @param {string} url - Orijinal albüm kapağı URL'si
   * @returns {string} Yüksek çözünürlüklü URL
   */
  function upgradeArtworkUrl(url) {
    // URL boşsa varsayılan boş metin döndür
    if (!url || typeof url !== "string") {
      return "";
    }
    // Google/YouTube Music görsel boyut parametrelerini (=w60-h60 vb.) 544x544 ile değiştir
    return url.replace(/=w\d+-h\d+[^&?]*/i, "=w544-h544-l90-rj");
  }

  /**
   * YouTube Music sayfasındaki mevcut şarkı bilgilerini ve oynatma durumunu
   * hem navigator.mediaSession hem de DOM seçicileri (querySelector) ile okur.
   * @returns {Object} Şarkı durumu nesnesi
   */
  function getTrackState() {
    // 1. DOM üzerinden YouTube Music alt oynatıcı çubuğundaki (ytmusic-player-bar) elemanları seç
    const titleEl = document.querySelector(
      "ytmusic-player-bar .title.ytmusic-player-bar, ytmusic-player-bar yt-formatted-string.title"
    );
    const bylineEl = document.querySelector(
      "ytmusic-player-bar .byline.ytmusic-player-bar, ytmusic-player-bar yt-formatted-string.byline"
    );
    const imgEl = document.querySelector(
      "ytmusic-player-bar img.image.ytmusic-player-bar, ytmusic-player-bar .thumbnail-image-wrapper img"
    );
    const videoEl = document.querySelector("video");

    // 2. Tarayıcının MediaSession API verilerini kontrol et
    const metadata =
      "mediaSession" in navigator ? navigator.mediaSession.metadata : null;

    // Şarkı adını önce MediaSession'dan, yoksa DOM'dan al
    const rawTitle =
      (metadata && metadata.title) ||
      (titleEl ? titleEl.textContent.trim() : "");

    // Sanatçı adını önce MediaSession'dan, yoksa alt çubuktaki "Sanatçı • Albüm" metninin ilk kısmından al
    let rawArtist = metadata && metadata.artist ? metadata.artist : "";
    if (!rawArtist && bylineEl && bylineEl.textContent) {
      rawArtist = bylineEl.textContent.split("•")[0].trim();
    }

    // Albüm kapağı URL'sini MediaSession'daki en yüksek kaliteli görselden veya DOM'daki <img> etiketinden al
    let rawArtwork = "";
    if (metadata && Array.isArray(metadata.artwork) && metadata.artwork.length > 0) {
      // Artwork dizisinin son elemanı genellikle en yüksek çözünürlüklü görseldir
      rawArtwork = metadata.artwork[metadata.artwork.length - 1].src;
    }
    // Eğer MediaSession'da kapak yoksa veya placeholder ise DOM'daki <img> kaynağını kullan
    if (!rawArtwork && imgEl && imgEl.src && !imgEl.src.startsWith("data:")) {
      rawArtwork = imgEl.src;
    }

    // Kapak görselini yüksek çözünürlüğe (544x544) yükselt
    const artwork = upgradeArtworkUrl(rawArtwork);

    // 3. Şarkının şu an oynatılıp oynatılmadığını (isPlaying) belirle
    let isPlaying = false;
    if (videoEl) {
      // HTML5 <video>/medya elemanı en kesin oynatma durumunu verir
      isPlaying = !videoEl.paused && !videoEl.ended && videoEl.readyState > 1;
    } else if ("mediaSession" in navigator) {
      // Yedek olarak MediaSession playbackState değerini kontrol et
      isPlaying = navigator.mediaSession.playbackState === "playing";
    }

    // Geçerli bir şarkı yüklü mü kontrolü
    const hasTrack = Boolean(rawTitle && rawTitle.length > 0);

    // Sonuç nesnesini döndür
    return {
      hasTrack,
      title: rawTitle || "",
      artist: rawArtist || "Bilinmeyen Sanatçı",
      artwork: artwork || "",
      isPlaying: hasTrack ? isPlaying : false
    };
  }

  /**
   * Şarkı durumunda bir değişiklik olduğunda chrome.runtime.sendMessage ile
   * popup ve background betiklerine anlık bildirim gönderir.
   * @param {boolean} force - Değişiklik olmasa bile zorla gönder
   */
  function broadcastTrackState(force = false) {
    const currentState = getTrackState();
    const serialized = JSON.stringify(currentState);

    // Durum değişmediyse ve zorunlu gönderim değilse işlem yapma
    if (!force && serialized === lastSerializedState) {
      return;
    }
    lastSerializedState = serialized;

    // Eklenti arka planına / açık olan popup'a güncel şarkı verisini gönder
    try {
      chrome.runtime.sendMessage(
        {
          type: "TRACK_UPDATE",
          data: currentState
        },
        () => {
          // Popup kapalıysa oluşabilecek "Receiving end does not exist" uyarısını sessizce yoksay
          void chrome.runtime.lastError;
        }
      );
    } catch (_) {
      // Eklenti yenilendiğinde oluşabilecek bağlantı hatalarını yoksay
    }
  }

  /**
   * Popup'tan gelen oynatma kontrol komutlarını ("TOGGLE_PLAY", "PREV_TRACK", "NEXT_TRACK")
   * YouTube Music sayfasındaki ilgili DOM butonlarına click() yaparak uygular.
   * @param {string} command - Çalıştırılacak komut adı
   */
  function executePlaybackCommand(command) {
    // Komut türüne göre YouTube Music oynatıcı çubuğundaki butonu seç ve tıkla
    if (command === "TOGGLE_PLAY") {
      // Başlat / Durdur butonunu bul
      const playPauseBtn = document.querySelector(
        "ytmusic-player-bar #play-pause-button, #play-pause-button"
      );
      if (playPauseBtn) {
        playPauseBtn.click();
      } else {
        // Buton bulunamazsa doğrudan medya elemanını oynat/durdur
        const videoEl = document.querySelector("video");
        if (videoEl) {
          if (videoEl.paused) {
            videoEl.play();
          } else {
            videoEl.pause();
          }
        }
      }
    } else if (command === "PREV_TRACK") {
      // Önceki Şarkı (Skip Back) butonunu bul ve tıkla
      const prevBtn = document.querySelector(
        "ytmusic-player-bar .previous-button, .previous-button"
      );
      if (prevBtn) {
        prevBtn.click();
      }
    } else if (command === "NEXT_TRACK") {
      // Sonraki Şarkı (Skip Forward) butonunu bul ve tıkla
      const nextBtn = document.querySelector(
        "ytmusic-player-bar .next-button, .next-button"
      );
      if (nextBtn) {
        nextBtn.click();
      }
    }

    // Tıklama sonrası DOM'un güncellenmesi için kısa süre bekleyip yeni durumu yayınla
    setTimeout(() => broadcastTrackState(true), 120);
    setTimeout(() => broadcastTrackState(true), 400);
  }

  // ==========================================================================
  // MESAJ DİNLEYİCİSİ: Popup veya Background'dan gelen istekleri yakalar
  // ==========================================================================
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || !message.type) {
      return false;
    }

    // 1. Anlık şarkı bilgisi isteği
    if (message.type === "GET_TRACK_INFO") {
      sendResponse(getTrackState());
      return true;
    }

    // 2. Oynatma kontrol komutu (Oynat/Durdur, Önceki, Sonraki)
    if (message.type === "CONTROL_COMMAND") {
      executePlaybackCommand(message.command);
      // Komut uygulandıktan hemen sonra güncel durumu yanıt olarak dön
      setTimeout(() => {
        sendResponse(getTrackState());
      }, 120);
      return true; // Asenkron sendResponse kullanımı için true döndürülür
    }

    return false;
  });

  // ==========================================================================
  // GERÇEK ZAMANLI İZLEYİCİLER (DOM MutationObserver & Medya Olayları)
  // ==========================================================================

  /**
   * YouTube Music alt oynatıcı çubuğundaki (ytmusic-player-bar) DOM değişimlerini
   * ve <video> oynatma olaylarını dinleyerek değişiklikleri anında yakalar.
   */
  function setupRealtimeObservers() {
    // Alt oynatıcı çubuğunu izleyen MutationObserver
    const playerBar = document.querySelector("ytmusic-player-bar");
    if (playerBar) {
      const observer = new MutationObserver(() => {
        broadcastTrackState(false);
      });
      observer.observe(playerBar, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });
    }

    // HTML5 <video> elemanındaki oynatma/duraklatma olaylarını dinle
    document.addEventListener(
      "play",
      () => broadcastTrackState(true),
      true
    );
    document.addEventListener(
      "pause",
      () => broadcastTrackState(true),
      true
    );
    document.addEventListener(
      "loadedmetadata",
      () => broadcastTrackState(true),
      true
    );

    // Her 1 saniyede bir durumu kontrol eden güvenlik zamanlayıcısı
    setInterval(() => {
      broadcastTrackState(false);
    }, 1000);
  }

  // İzleyicileri başlat ve ilk durumu yayınla
  setupRealtimeObservers();
  broadcastTrackState(true);
})();
