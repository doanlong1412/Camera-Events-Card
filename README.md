# 📷 Camera Events Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
![version](https://img.shields.io/badge/version-1.0-blue)
![HA](https://img.shields.io/badge/Home%20Assistant-2024.6+-green)
![license](https://img.shields.io/badge/license-MIT-lightgrey)

> 🇻🇳 **Phiên bản tiếng Việt:** [README_vi.md](README_vi.md)

A custom Home Assistant Lovelace card for multi-camera monitoring — live WebRTC/HLS streams, Frigate event history with AI result overlay, per-camera snapshot viewer, animated motion alerts, and a full visual editor supporting up to 5 cameras.

**No extra plugins required. Works standalone, fully configurable through the built-in UI editor.**

---

## 📸 Preview

![Camera Events Card Preview](assets/preview.png)

---

## 🎛️ Visual Config Editor

![Camera Events Card Editor](assets/editor-preview.png)

---

## ✨ Features (v1.0)

### 🎨 Display & Interface
- 📷 **Live camera stream** — real-time WebRTC/HLS stream via `ha-camera-stream` for each camera
- 🖼️ **Camera tabs** — icon, label and camera name per tab with active indicator
- 🌗 **Dark / Light theme** — glassmorphism background with blur and opacity control
- 🖥️ **HUD overlay** — camera name, LIVE badge and stream info directly on the video

### 📋 Frigate Event History
- **Per-camera event list** — fetches latest Frigate events with thumbnail, label, score and timestamp
- **Event thumbnail lightbox** — click any event to open a fullscreen snapshot overlay with keyboard navigation
- **Clip playback** — direct link to Frigate clip viewer for each event
- **Manual refresh** — refresh event list per camera on demand
- **Event badge** — shows total event count for the active camera

### 🤖 AI Result Overlay *(requires blueprint)*
- **Person count badge** — reads `input_text.cam_<id>_ai_result` and displays person count directly on camera stream thumbnail
- **AI description** — one-sentence description from AI displayed under the camera name
- **Snapshot preview** — latest AI snapshot shown in the event list with timestamp
- **Seamless integration** — works automatically once the Blueprint automation is configured

### ⚙️ Per-Camera Settings
- `source_mode: frigate` — uses go2rtc/Frigate WebRTC stream (default)
- `source_mode: manual` — use any ONVIF/generic RTSP stream URL
- Configurable `go2rtc_url`, `stream_url`, Frigate camera name, occupancy sensor, count sensor, AI result entity

### 🎛️ Visual Editor
- Entity pickers for camera, occupancy, count and AI result entities
- Source mode toggle (Frigate / Manual) per camera
- Accordion sections for each camera
- Theme, opacity and blur sliders
- Add / remove / reorder cameras

---

## 📦 Installation

### Option 1 — HACS (recommended)

**Step 1:** Add Custom Repository to HACS:

[![Open HACS Repository](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=doanlong1412&repository=camera-events-card&category=plugin)

> If the button doesn't work, add manually:
> **HACS → Frontend → ⋮ → Custom repositories**
> → URL: `https://github.com/doanlong1412/camera-events-card` → Type: **Dashboard** → Add

**Step 2:** Search for **Camera Events Card** → **Install**

**Step 3:** Hard-reload your browser (`Ctrl+Shift+R`)

---

### Option 2 — Manual

1. Download [`camera-events-card.js`](https://github.com/doanlong1412/camera-events-card/releases/latest)
2. Copy to `/config/www/camera-events-card.js`
3. Go to **Settings → Dashboards → Resources** → **Add resource**:
   ```
   URL:  /local/camera-events-card.js?v=1.0
   Type: JavaScript module
   ```
4. Hard-reload your browser (`Ctrl+Shift+R`)

---

## 🤖 AI Blueprint Setup *(Optional but recommended)*

The included blueprint `camera_ai_result_writer.yaml` connects a motion sensor to a camera snapshot → AI analysis → result written to `input_text`, which the card reads automatically.

### Step 1 — Create snapshot folder

In your Home Assistant file system, create the directory:

```
/config/www/snapshots/
```

> This folder is served publicly at `/local/snapshots/` — the card and AI blueprint use this path.

You can create it via the **File editor** add-on, **SSH**, or **Samba**:

```bash
mkdir -p /config/www/snapshots
```

---

### Step 2 — Create `input_text` entities

For each camera you want AI results on, create one `input_text` entity. Add the following to your `configuration.yaml` (or a separate `input_text.yaml` if you use packages):

```yaml
input_text:
  cam_congchinh_ai_result:
    name: "AI Result - Cổng Chính"
    max: 255

  cam_san1_ai_result:
    name: "AI Result - Sân Trước"
    max: 255

  cam_phongkhach_ai_result:
    name: "AI Result - Phòng Khách"
    max: 255

  cam_nhaxe_ai_result:
    name: "AI Result - Nhà Xe"
    max: 255

  cam_nhabep_ai_result:
    name: "AI Result - Nhà Bếp"
    max: 255
```

> **Naming convention:** `input_text.cam_<camera_id>_ai_result`
> The `camera_id` must match the `id` field in your card config (e.g. `camera_congchinh` → id is `congchinh` → entity is `input_text.cam_congchinh_ai_result`).

After editing, restart Home Assistant or reload `input_text` entities:
**Developer Tools → YAML → input_text**

---

### Step 3 — Import the Blueprint

[![Import Blueprint](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?url=https://raw.githubusercontent.com/doanlong1412/camera-events-card/main/blueprints/automation/doanlong1412/camera_ai_result_writer.yaml)

Or manually:
1. Copy `camera_ai_result_writer.yaml` to `/config/blueprints/automation/doanlong1412/`
2. Reload blueprints: **Developer Tools → YAML → Automations**

---

### Step 4 — Create one automation per camera

Go to **Settings → Automations → Blueprints** → find **Camera AI Result Writer** → **Create Automation**.

Fill in the fields:

| Field | Description |
|---|---|
| 🚶 Motion sensor | Binary sensor that triggers the snapshot (motion, occupancy, door…) |
| 📸 Camera | The camera entity to snapshot |
| 📝 input_text entity | The `input_text.cam_<id>_ai_result` entity for this camera |
| 🗂️ Snapshot filename | File name without `.jpg` — e.g. `cam_congchinh` |
| 🌐 Output language | Language for AI description and fallback messages |
| 🤖 Use AI? | Toggle AI image analysis on or off |
| 🤖 AI Provider | `ai_task` entity for image analysis (if AI enabled) |
| 🔢 Person count sensor | Fallback sensor when AI is off or fails |
| ⏱️ Cooldown | Minimum seconds between two triggers (default: 30s) |

Repeat for each camera.

---

### How it works

```
Motion detected
    ↓
camera.snapshot → /config/www/snapshots/cam_<id>.jpg
    ↓
ai_task.generate_data (analyze image)
    ↓
input_text.cam_<id>_ai_result = {"count":2,"desc":"Two people walking","snap":"...","time":"14:32 10/05"}
    ↓
Camera Events Card reads input_text → displays count badge + description
```

---

## ⚙️ Card Configuration

### Step 1 — Add the card to your dashboard

```yaml
type: custom:camera-events-card
```

After adding, click **✏️ Edit** to open the Config Editor.

### Step 2 — Config Editor sections

| # | Section | Contents |
|---|---------|----------|
| 1 | 🎨 **Appearance** | Theme (dark/light), tile opacity, blur, card title |
| 2 | 🌐 **Frigate URL** | Base URL for your Frigate instance |
| 3 | 📷 **Cameras** | Add/remove/reorder cameras, set entity, label, stream mode |

---

## 🔌 Entity Reference

### Per-camera configuration

| Config key | Type | Description |
|---|---|---|
| `id` | string | Camera ID — used to match `input_text.cam_<id>_ai_result` ✅ |
| `entity` | `camera` | HA camera entity for live stream |
| `label` | string | Short tab label (e.g. `CAM 1`) |
| `name` | string | Full camera name shown in HUD |
| `source_mode` | string | `frigate` (default) or `manual` |
| `frigate_camera_name` | string | Frigate camera name for event API |
| `go2rtc_url` | string | go2rtc base URL for WebRTC stream |
| `stream_url` | string | Manual RTSP/HLS stream URL (when `source_mode: manual`) |
| `occupancy_entity` | `binary_sensor` | Occupancy sensor — shows badge on tab |
| `count_entity` | `sensor` | Person count sensor |
| `ai_result_entity` | `input_text` | AI result entity — `input_text.cam_<id>_ai_result` |

### Card-level configuration

| Config key | Type | Default | Description |
|---|---|---|---|
| `title` | string | `Camera & Events` | Card title |
| `theme` | string | `dark` | `dark` or `light` |
| `tile_opacity` | number | `0.18` | Background tile opacity (0–0.6) |
| `tile_blur` | number | `12` | Background blur in px |
| `frigate_url` | string | — | Frigate base URL e.g. `http://192.168.1.10:5000` |
| `cameras` | array | — | List of camera objects (see above) |

---

## 📝 Full YAML Example

```yaml
type: custom:camera-events-card
title: Camera & Events
theme: dark
tile_opacity: 0.18
tile_blur: 12
frigate_url: http://192.168.10.10:5000

cameras:
  - id: camera_congchinh
    entity: camera.camera_congchinh
    label: CAM 1
    name: Cổng Chính
    source_mode: frigate
    frigate_camera_name: congchinh
    go2rtc_url: http://192.168.10.10:1984
    occupancy_entity: binary_sensor.congchinh_person_occupancy
    count_entity: sensor.congchinh_person_count
    ai_result_entity: input_text.cam_congchinh_ai_result

  - id: camera_san1
    entity: camera.camera_san1
    label: CAM 2
    name: Sân Trước
    source_mode: frigate
    frigate_camera_name: san1
    go2rtc_url: http://192.168.10.10:1984
    occupancy_entity: binary_sensor.san1_person_occupancy
    count_entity: sensor.san1_person_count
    ai_result_entity: input_text.cam_san1_ai_result

  - id: camera_phongkhach
    entity: camera.camera_phongkhach
    label: CAM 3
    name: Phòng Khách
    source_mode: frigate
    frigate_camera_name: phongkhach
    go2rtc_url: http://192.168.10.10:1984
    ai_result_entity: input_text.cam_phongkhach_ai_result
```

### Minimal example (Frigate, no AI)

```yaml
type: custom:camera-events-card
title: My Cameras
theme: dark
frigate_url: http://192.168.1.10:5000

cameras:
  - id: camera_front
    entity: camera.front_door
    label: CAM 1
    name: Front Door
    source_mode: frigate
    frigate_camera_name: front_door

  - id: camera_back
    entity: camera.back_yard
    label: CAM 2
    name: Back Yard
    source_mode: frigate
    frigate_camera_name: back_yard
```

### Manual stream (no Frigate)

```yaml
type: custom:camera-events-card
title: CCTV
theme: dark

cameras:
  - id: camera_gate
    entity: camera.gate_rtsp
    label: CAM 1
    name: Gate
    source_mode: manual
    stream_url: rtsp://admin:pass@192.168.1.100:554/stream1
```

---

## 🖥️ Compatibility

| | |
|---|---|
| Home Assistant | 2024.6+ |
| Lovelace | Default & custom dashboards |
| Devices | Mobile & Desktop |
| Dependencies | None — fully standalone |
| Browsers | Chrome, Firefox, Safari, Edge |
| Frigate | Optional — required for event history |
| go2rtc | Optional — required for WebRTC streams |

---

## 📋 Changelog

### v1.0
- 🚀 Initial release
- 📷 Live WebRTC/HLS multi-camera stream via `ha-camera-stream`
- 📋 Frigate event list with thumbnail, label, score and timestamp
- 🖼️ Fullscreen event lightbox with keyboard navigation
- 🤖 AI result overlay — person count + description via Blueprint
- 🌗 Dark / Light theme with glassmorphism effect
- 🎛️ Full visual editor — entity pickers, source mode toggle, accordion
- ⚙️ Per-camera `source_mode`: Frigate or Manual (ONVIF/RTSP)
- 🗂️ Blueprint `camera_ai_result_writer` included

---

## 📄 License

MIT License — free to use, modify, and distribute.
If you find this useful, please ⭐ **star the repo**!

---

## 🙏 Credits

Designed and developed by **[@doanlong1412](https://github.com/doanlong1412)** from 🇻🇳 Vietnam.

☕ [Buy me a coffee](https://www.paypal.com/paypalme/doanlong1412)
