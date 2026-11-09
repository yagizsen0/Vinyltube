// ============================================================================
// Vinyltube - Arka Plan Hizmet İşçisi / Service Worker (background.js)
// Sekmeler arası iletişimi koordine eder, YouTube Music sekmesinin açık olup
// olmadığını kontrol eder ve popup ile content.js arasındaki mesajları yönetir.
// ============================================================================

/**
 * Eklenti yüklendiğinde veya güncellendiğinde çalışan kurulum dinleyicisi.
 * declarativeContent API'sini yapılandırır.
 */
chrome.runtime.onInstalled.addListener(() => {
  // declarativeContent kurallarını sıfırlayıp yeniden tanımla
  if (chrome.declarativeContent) {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
      chrome.declarativeContent.onPageChanged.addRules([
        {
          // music.youtube.com adresinde sayfa durumunu eşleştir
          conditions: [
            new chrome.declarativeContent.PageStateMatcher({
              pageUrl: { hostEquals: "music.youtube.com" }
            })
          ],
          // Eklenti ikonunu etkin göster
          actions: [new chrome.declarativeContent.ShowAction()]
        }
      ]);
    });
  }
});

/**
 * Tarayıcıda açık olan tüm sekmeler arasında YouTube Music (music.youtube.com)
 * sekmesini arar. Birden fazla varsa ses çıkaran (audible) sekmeye öncelik verir.
 * @returns {Promise<chrome.tabs.Tab|null>} Bulunan YouTube Music sekmesi veya null
 */
async function findYouTubeMusicTab() {
  try {
    // music.youtube.com URL şablonuna uyan tüm sekmeleri sorgula
    const tabs = await chrome.tabs.query({
      url: ["*://music.youtube.com/*"]
    });

    // Hiç YouTube Music sekmesi yoksa null döndür
    if (!tabs || tabs.length === 0) {
      return null;
    }

    // Birden fazla sekme varsa o an ses çalan (audible) sekmeyi tercih et
    const audibleTab = tabs.find((tab) => tab.audible);
    return audibleTab || tabs[0];
  } catch (error) {
    console.error("YouTube Music sekmesi aranırken hata oluştu:", error);
    return null;
  }
}

/**
 * Belirtilen YouTube Music sekmesindeki content.js betiğine mesaj gönderir.
 * Eğer sekme eklenti kurulmadan önce açıldığı için content.js henüz yüklenmemişse,
 * betiği otomatik olarak enjekte edip mesajı tekrar gönderir.
 * @param {number} tabId - Hedef sekme kimliği
 * @param {Object} payload - Gönderilecek mesaj nesnesi
 * @returns {Promise<Object|null>} content.js'den dönen yanıt
 */
async function sendMessageToYtmTab(tabId, payload) {
  try {
    // Önce doğrudan sekmeye mesaj göndermeyi dene
    return await chrome.tabs.sendMessage(tabId, payload);
  } catch (_) {
    // Eğer content.js henüz o sekmede çalışmıyorsa, scripting API ile enjekte et
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"]
      });
      // Enjeksiyon sonrası mesajı tekrar gönder
      return await chrome.tabs.sendMessage(tabId, payload);
    } catch (injectError) {
      console.warn("content.js enjekte edilemedi:", injectError);
      return null;
    }
  }
}

// ============================================================================
// MESAJ MERKEZİ: Popup'tan gelen durum ve kontrol isteklerini koordine eder
// ============================================================================
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || !message.type) {
    return false;
  }

  // 1. Popup açıldığında veya periyodik sorguda YouTube Music durumunu kontrol et
  if (message.type === "GET_STATUS") {
    (async () => {
      const ytmTab = await findYouTubeMusicTab();

      // Açık bir YouTube Music sekmesi bulunamadıysa
      if (!ytmTab || !ytmTab.id) {
        sendResponse({
          tabFound: false,
          data: null
        });
        return;
      }

      // Sekme bulunduysa content.js'den anlık şarkı bilgilerini iste
      const trackData = await sendMessageToYtmTab(ytmTab.id, {
        type: "GET_TRACK_INFO"
      });

      sendResponse({
        tabFound: true,
        tabId: ytmTab.id,
        data: trackData
      });
    })();

    return true; // Asenkron sendResponse için true döndürülür
  }

  // 2. Popup'taki kontrol butonlarından (Önceki, Başlat/Durdur, Sonraki) gelen komutları ilet
  if (message.type === "CONTROL_COMMAND") {
    (async () => {
      const ytmTab = await findYouTubeMusicTab();

      // Açık sekme yoksa hata durumu döndür
      if (!ytmTab || !ytmTab.id) {
        sendResponse({
          tabFound: false,
          data: null
        });
        return;
      }

      // Komutu YouTube Music sekmesindeki content.js'ye ilet
      const updatedTrackData = await sendMessageToYtmTab(ytmTab.id, {
        type: "CONTROL_COMMAND",
        command: message.command
      });

      sendResponse({
        tabFound: true,
        tabId: ytmTab.id,
        data: updatedTrackData
      });
    })();

    return true; // Asenkron sendResponse için true döndürülür
  }

  // 3. "YouTube Music'i Aç" butonuna tıklandığında sekmeyi aç veya odakla
  if (message.type === "OPEN_YTM") {
    (async () => {
      const existingTab = await findYouTubeMusicTab();
      if (existingTab && existingTab.id) {
        // Zaten açık bir YouTube Music sekmesi varsa onu aktif hale getir
        await chrome.tabs.update(existingTab.id, { active: true });
        if (existingTab.windowId) {
          await chrome.windows.update(existingTab.windowId, { focused: true });
        }
      } else {
        // Yoksa yeni bir sekmede YouTube Music'i aç
        await chrome.tabs.create({ url: "https://music.youtube.com" });
      }
      sendResponse({ ok: true });
    })();

    return true;
  }

  return false;
});
