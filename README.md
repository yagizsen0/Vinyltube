<p align="center">
  <img src="logo.png" alt="Vinyltube Logo" width="120" />
</p>

<h1 align="center">Vinyltube</h1>

<p align="center">
  <b>A sleek YouTube Music "Now Playing" spinning vinyl player & controller built as a Chrome / Chromium Extension (Manifest V3).</b><br>
  Spins your active YouTube Music track on a realistic grooved vinyl record with dynamic dominant-color gradients, blurred album artwork, and instant playback controls.
</p>

<p align="center">
  <a href="https://github.com/yagizsen0/Vinyltube/raw/main/Release/Vinyltube_v1.0.0.zip">
    <img src="https://img.shields.io/badge/Download_Extension-Vinyltube__v1.0.0.zip-FF0033?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Download Vinyltube (.zip)" />
  </a>
</p>

---

## About

**Vinyltube** brings the living turntable aesthetic to **YouTube Music (`music.youtube.com`)** right inside a compact browser popup. It continuously syncs with your active YouTube Music tab in real time, masks high-resolution album covers onto an animated vinyl disc, extracts each album's dominant color palette via HTML5 `<canvas>`, and blends a Gaussian-blurred backdrop as tracks change.

No API keys or external servers are required—everything runs locally in your browser via Manifest V3.

---

## Direct Download

Want to install **Vinyltube** right away without using Git?

- **Chrome / Brave / Edge / Opera Extension Package (`.zip`):** [**Direct Download `Vinyltube_v1.0.0.zip`**](https://github.com/yagizsen0/Vinyltube/raw/main/Release/Vinyltube_v1.0.0.zip) *(repository path: [`Release/Vinyltube_v1.0.0.zip`](Release/Vinyltube_v1.0.0.zip))*
- **Alternative Source Archive:** [**Download Source Code (`.zip`)**](https://github.com/yagizsen0/Vinyltube/archive/refs/heads/main.zip)

---

## Features

- **Realistic Spinning Vinyl UI:** Concentric vinyl grooves, stationary specular light reflections, center spindle hole, and smooth `@keyframes spin` rotation that pauses seamlessly at its exact angle when playback is paused.
- **Dynamic Ambient Backgrounds:** Extracts dominant colors from the active album artwork using an offscreen `<canvas>` and combines them with a blurred cover art backdrop (`filter: blur(36px) saturate(1.6)`).
- **Minimalist Playback Controls:** Control your music directly from the popup with **Skip Back (Previous)**, **Play / Pause**, and **Skip Forward (Next)** buttons that dispatch commands straight to your background YouTube Music tab.
- **Smart Tab & State Detection:** Automatically detects open `music.youtube.com` tabs (prioritizing audible tabs), injects the content script on the fly without requiring a page refresh, and provides a one-click **"Open YouTube Music"** shortcut when no tab is active.

---

## Installation (Load Unpacked)

1. Download [**`Vinyltube_v1.0.0.zip`**](https://github.com/yagizsen0/Vinyltube/raw/main/Release/Vinyltube_v1.0.0.zip) and extract it to a folder on your computer, or clone the repository:
   ```bash
   git clone https://github.com/yagizsen0/Vinyltube.git
   ```
2. Open your Chromium-based browser (Chrome, Brave, Edge, Opera) and navigate to:
   ```text
   chrome://extensions
   ```
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked** in the top-left corner and select the extracted `Vinyltube` folder.
5. Pin **Vinyltube** from the Extensions puzzle menu in your toolbar, open [YouTube Music](https://music.youtube.com), and play any song!

---

## Project Structure

```text
Vinyltube/
├── Release/
│   └── Vinyltube_v1.0.0.zip  # Ready-to-install extension package
├── manifest.json             # Chrome Extension Manifest V3 configuration
├── popup.html                # Compact (320x450px) vinyl player popup layout
├── popup.css                 # Spinning vinyl animations, grooves, and dynamic gradients
├── popup.js                  # Real-time UI state management & Canvas color extraction
├── content.js                # YouTube Music DOM & MediaSession observer + playback controller
├── background.js             # Service Worker coordinating tab detection & messaging
├── icon.png                  # 128x128 YouTube Red Vinyltube extension icon
└── logo.png                  # 512x512 high-resolution Vinyltube logo
```
