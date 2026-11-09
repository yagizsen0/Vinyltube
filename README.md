<p align="center">
  <img src="logo.png" alt="Vinyltube Logo" width="120" />
</p>

<h1 align="center">Vinyltube</h1>

<p align="center">
  <b>YouTube Music (music.youtube.com) için dönen plak (vinyl) tasarımlı, dinamik arka planlı Chrome / Chromium Tarayıcı Eklentisi (Manifest V3).</b>
</p>

<p align="center">
  <a href="https://github.com/yagizsen0/Vinyltube/raw/main/Release/Vinyltube_v1.0.0.zip">
    <img src="https://img.shields.io/badge/İndir_(Direct_Download)-Vinyltube__v1.0.0.zip-FF0033?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Download Vinyltube (.zip)" />
  </a>
</p>

---

## Hızlı İndirme (Direct Download)

Git kullanmadan eklentiyi doğrudan `.zip` paketi olarak indirmek için:

- **Doğrudan İndirme Linki:** [**`Vinyltube_v1.0.0.zip` İndir**](https://github.com/yagizsen0/Vinyltube/raw/main/Release/Vinyltube_v1.0.0.zip) *(Alternatif: [GitHub Kaynak Kodu `.zip`](https://github.com/yagizsen0/Vinyltube/archive/refs/heads/main.zip))*

---

## Özellikler

- **Dönen Plak (Spinning Vinyl UI):** YouTube Music'te çalan şarkının yüksek çözünürlüklü albüm kapağını gerçekçi oluklara ve ışık yansımasına sahip dairesel bir plak üzerinde döndürür (`@keyframes spin`). Şarkı duraklatıldığında plak olduğu açıda pürüzsüzce durur.
- **Dinamik Renk ve Blur Arka Plan:** HTML5 `<canvas>` ile albüm kapağının baskın renklerini gerçek zamanlı çıkarır ve bulanıklaştırılmış (blur) kapak görseliyle yumuşak bir degrade (gradient) oluşturur.
- **Minimalist Oynatma Kontrolleri:** Eklenti penceresinden doğrudan **Önceki Şarkı**, **Başlat / Durdur** ve **Sonraki Şarkı** komutlarını arka plandaki YouTube Music sekmesine gönderir.
- **Akıllı Sekme ve Durum Yönetimi:** Açık bir YouTube Music sekmesi yoksa veya şarkı çalmıyorsa bekleme ekranı gösterir ve tek tıkla YouTube Music'i açma / odaklama imkânı sunar.

---

## Kurulum (Chrome / Brave / Edge / Opera)

1. Yukarıdaki [**`Vinyltube_v1.0.0.zip` İndir**](https://github.com/yagizsen0/Vinyltube/raw/main/Release/Vinyltube_v1.0.0.zip) bağlantısından dosyayı indirin ve bir klasöre çıkartın (veya `git clone https://github.com/yagizsen0/Vinyltube.git` komutunu kullanın).
2. Tarayıcınızın adres çubuğuna `chrome://extensions` yazıp **Enter**'a basın.
3. Sağ üst köşedeki **Geliştirici modu (Developer mode)** anahtarını açın.
4. Sol üstteki **Paketlenmemiş öğe yükle (Load unpacked)** butonuna tıklayın ve çıkarttığınız `Vinyltube` klasörünü seçin.
5. Uzantılar menüsünden **Vinyltube** ikonunu araç çubuğuna sabitleyin ve [YouTube Music](https://music.youtube.com) üzerinde bir şarkı başlatın.

---

## Dosya Yapısı

```text
Vinyltube/
├── Release/
│   └── Vinyltube_v1.0.0.zip  # Tek tıkla indirilebilir hazır eklenti paketi
├── manifest.json             # Manifest V3 yapılandırma ve izin dosyası
├── popup.html                # Kompakt (320x450px) eklenti arayüz iskeleti
├── popup.css                 # Dönen plak (@keyframes spin), oluklar ve dinamik arka plan stilleri
├── popup.js                  # Renk analizi (Canvas), anlık UI güncellemesi ve buton kontrolleri
├── content.js                # YouTube Music DOM & MediaSession izleyicisi ve tıklama tetikleyicisi
├── background.js             # Sekme yönetimi ve mesajlaşma koordinatörü (Service Worker)
├── icon.png                  # 128x128 YouTube Kırmızısı Vinyltube eklenti ikonu
└── logo.png                  # 512x512 yüksek çözünürlüklü Vinyltube logosu
```
