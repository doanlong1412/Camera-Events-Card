# Changelog

All notable changes to **Camera Events Card** will be documented here.

---

## [1.0.0] - 2025-05-10

### Added
- 📷 Live WebRTC/HLS multi-camera stream via `ha-camera-stream`
- 📋 Frigate event list with thumbnail, label, confidence score and timestamp
- 🖼️ Fullscreen event lightbox with keyboard navigation (← → Esc)
- 🤖 AI result overlay — person count badge + description via Blueprint
- 🌗 Dark / Light theme with glassmorphism blur effect
- 🎛️ Full visual editor — entity pickers, source mode toggle, accordion per camera
- ⚙️ Per-camera `source_mode`: `frigate` (default) or `manual` (ONVIF/RTSP)
- 🗂️ Blueprint `camera_ai_result_writer` — motion → snapshot → AI → input_text
- 🔄 Manual refresh button per camera event list
- ⌨️ Keyboard support in lightbox (ArrowLeft, ArrowRight, Escape)
- 🖥️ HUD overlay on stream: camera name, LIVE badge, stream info
