# 📷 Camera Events Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
![version](https://img.shields.io/badge/version-1.0-blue)
![HA](https://img.shields.io/badge/Home%20Assistant-2024.6+-green)
![license](https://img.shields.io/badge/license-MIT-lightgrey)

> 🇬🇧 **English version:** [README.md](README.md)

Card tùy chỉnh cho Home Assistant Lovelace — giám sát nhiều camera với stream WebRTC/HLS trực tiếp, lịch sử sự kiện Frigate kèm overlay AI, xem ảnh snapshot từng camera, cảnh báo chuyển động có hiệu ứng, và trình chỉnh sửa giao diện trực quan hỗ trợ tối đa 5 camera.

**Không cần plugin bổ sung. Hoạt động độc lập, cấu hình hoàn toàn qua giao diện chỉnh sửa tích hợp.**

---

## 📸 Xem trước

![Camera Events Card Preview](assets/preview.png)

---

## 🎛️ Visual Config Editor

![Camera Events Card Editor](assets/editor-preview.png)

---

## ✨ Tính năng (v1.0)

### 🎨 Hiển thị & Giao diện
- 📷 **Stream trực tiếp** — luồng WebRTC/HLS qua `ha-camera-stream` cho từng camera
- 🖼️ **Tab camera** — icon, nhãn và tên camera từng tab với chỉ báo đang chọn
- 🌗 **Giao diện Tối / Sáng** — nền glassmorphism với điều chỉnh độ mờ và blur
- 🖥️ **HUD overlay** — tên camera, badge LIVE và thông tin stream hiển thị ngay trên video

### 📋 Lịch sử sự kiện Frigate
- **Danh sách sự kiện theo camera** — lấy các sự kiện Frigate mới nhất với thumbnail, nhãn, điểm tin cậy và thời gian
- **Lightbox xem ảnh toàn màn hình** — nhấn vào sự kiện để phóng to snapshot, điều hướng bằng bàn phím
- **Phát lại clip** — liên kết trực tiếp đến trình xem clip Frigate cho mỗi sự kiện
- **Làm mới thủ công** — làm mới danh sách sự kiện theo camera theo yêu cầu
- **Badge số sự kiện** — hiển thị tổng số sự kiện của camera đang chọn

### 🤖 Overlay kết quả AI *(cần blueprint)*
- **Badge đếm người** — đọc `input_text.cam_<id>_ai_result` và hiển thị số người trực tiếp trên thumbnail camera
- **Mô tả AI** — câu mô tả ngắn gọn từ AI hiển thị bên dưới tên camera
- **Xem trước snapshot** — ảnh chụp mới nhất từ AI hiển thị trong danh sách sự kiện kèm thời gian
- **Tích hợp tự động** — hoạt động ngay khi đã cấu hình Blueprint automation

### ⚙️ Cài đặt theo từng camera
- `source_mode: frigate` — dùng luồng WebRTC go2rtc/Frigate (mặc định)
- `source_mode: manual` — dùng bất kỳ URL RTSP/ONVIF nào
- Cấu hình `go2rtc_url`, `stream_url`, tên camera Frigate, sensor occupancy, sensor đếm người, entity kết quả AI

### 🎛️ Trình chỉnh sửa trực quan
- Entity picker cho camera, occupancy, đếm người và kết quả AI
- Chuyển đổi source mode (Frigate / Manual) từng camera
- Phần accordion mở/đóng theo từng camera
- Thanh trượt theme, opacity và blur
- Thêm / xoá / đổi thứ tự camera

---

## 📦 Cài đặt

### Cách 1 — HACS (khuyến nghị)

**Bước 1:** Thêm Custom Repository vào HACS:

[![Open HACS Repository](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=doanlong1412&repository=camera-events-card&category=plugin)

> Nếu nút không hoạt động, thêm thủ công:
> **HACS → Frontend → ⋮ → Custom repositories**
> → URL: `https://github.com/doanlong1412/camera-events-card` → Type: **Dashboard** → Add

**Bước 2:** Tìm **Camera Events Card** → **Install**

**Bước 3:** Hard-reload trình duyệt (`Ctrl+Shift+R`)

---

### Cách 2 — Thủ công

1. Tải [`camera-events-card.js`](https://github.com/doanlong1412/camera-events-card/releases/latest)
2. Sao chép vào `/config/www/camera-events-card.js`
3. Vào **Settings → Dashboards → Resources** → **Add resource**:
   ```
   URL:  /local/camera-events-card.js?v=1.0
   Type: JavaScript module
   ```
4. Hard-reload trình duyệt (`Ctrl+Shift+R`)

---

## 🤖 Cài đặt Blueprint AI *(Tuỳ chọn nhưng khuyến nghị)*

Blueprint đính kèm `camera_ai_result_writer.yaml` kết nối cảm biến chuyển động → chụp ảnh camera → AI phân tích → ghi kết quả vào `input_text` để card hiển thị tự động.

### Bước 1 — Tạo thư mục snapshot

Trong hệ thống file Home Assistant, tạo thư mục:

```
/config/www/snapshots/
```

> Thư mục này được phục vụ công khai tại `/local/snapshots/` — card và Blueprint đều dùng đường dẫn này.

Tạo qua add-on **File editor**, **SSH** hoặc **Samba**:

```bash
mkdir -p /config/www/snapshots
```

---

### Bước 2 — Tạo entity `input_text`

Mỗi camera muốn hiển thị kết quả AI cần một entity `input_text`. Thêm vào `configuration.yaml` (hoặc file `input_text.yaml` riêng nếu bạn dùng packages):

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

> **Quy tắc đặt tên:** `input_text.cam_<camera_id>_ai_result`
> `camera_id` phải khớp với trường `id` trong cấu hình card (ví dụ: `camera_congchinh` → id là `congchinh` → entity là `input_text.cam_congchinh_ai_result`).

Sau khi chỉnh sửa, khởi động lại Home Assistant hoặc reload entities:
**Developer Tools → YAML → input_text**

---

### Bước 3 — Import Blueprint

[![Import Blueprint](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fdoanlong1412%2Fcamera-events-card%2Fmain%2Fblueprints%2Fautomation%2Fdoanlong1412%2Fcamera_ai_result_writer.yaml)

Hoặc thủ công:
1. Sao chép `camera_ai_result_writer.yaml` vào `/config/blueprints/automation/doanlong1412/`
2. Reload blueprints: **Developer Tools → YAML → Automations**

---

### Bước 4 — Tạo automation cho từng camera

Vào **Settings → Automations → Blueprints** → tìm **Camera AI Result Writer** → **Create Automation**.

Điền các trường:

| Trường | Mô tả |
|---|---|
| 🚶 Cảm biến chuyển động | Binary sensor kích hoạt chụp ảnh (motion, occupancy, door…) |
| 📸 Camera | Entity camera để chụp ảnh |
| 📝 input_text | Entity `input_text.cam_<id>_ai_result` tương ứng với camera này |
| 🗂️ Tên file snapshot | Tên file không có `.jpg` — ví dụ: `cam_congchinh` |
| 🌐 Ngôn ngữ đầu ra | Ngôn ngữ cho mô tả AI và thông báo fallback |
| 🤖 Dùng AI? | Bật/tắt phân tích ảnh bằng AI |
| 🤖 AI Provider | Entity `ai_task` dùng để phân tích ảnh (nếu bật AI) |
| 🔢 Sensor đếm người | Sensor fallback khi AI tắt hoặc AI báo lỗi |
| ⏱️ Cooldown | Thời gian chờ tối thiểu giữa 2 lần trigger (mặc định: 30 giây) |

Lặp lại cho từng camera.

---

### Luồng hoạt động

```
Phát hiện chuyển động
    ↓
camera.snapshot → /config/www/snapshots/cam_<id>.jpg
    ↓
ai_task.generate_data (phân tích ảnh)
    ↓
input_text.cam_<id>_ai_result = {"count":2,"desc":"Hai người đang đi bộ","snap":"...","time":"14:32 10/05"}
    ↓
Camera Events Card đọc input_text → hiển thị badge số người + mô tả
```

---

## ⚙️ Cấu hình Card

### Bước 1 — Thêm card vào dashboard

```yaml
type: custom:camera-events-card
```

Sau khi thêm, nhấn **✏️ Edit** để mở Config Editor.

### Bước 2 — Các phần trong Config Editor

| # | Phần | Nội dung |
|---|------|----------|
| 1 | 🎨 **Giao diện** | Theme (tối/sáng), độ mờ tile, blur, tiêu đề card |
| 2 | 🌐 **Frigate URL** | URL gốc của Frigate instance |
| 3 | 📷 **Camera** | Thêm/xoá/sắp xếp camera, entity, nhãn, chế độ stream |

---

## 🔌 Tham chiếu thực thể

### Cấu hình từng camera

| Config key | Kiểu | Mô tả |
|---|---|---|
| `id` | string | ID camera — dùng để khớp `input_text.cam_<id>_ai_result` ✅ |
| `entity` | `camera` | Entity camera HA cho stream trực tiếp |
| `label` | string | Nhãn ngắn trên tab (ví dụ: `CAM 1`) |
| `name` | string | Tên đầy đủ hiển thị trên HUD |
| `source_mode` | string | `frigate` (mặc định) hoặc `manual` |
| `frigate_camera_name` | string | Tên camera trong Frigate để lấy sự kiện |
| `go2rtc_url` | string | URL gốc go2rtc cho stream WebRTC |
| `stream_url` | string | URL RTSP/HLS thủ công (khi `source_mode: manual`) |
| `occupancy_entity` | `binary_sensor` | Sensor occupancy — hiển thị badge trên tab |
| `count_entity` | `sensor` | Sensor đếm số người |
| `ai_result_entity` | `input_text` | Entity kết quả AI — `input_text.cam_<id>_ai_result` |

### Cấu hình cấp card

| Config key | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `title` | string | `Camera & Events` | Tiêu đề card |
| `theme` | string | `dark` | `dark` hoặc `light` |
| `tile_opacity` | number | `0.18` | Độ mờ nền tile (0–0.6) |
| `tile_blur` | number | `12` | Độ blur nền (px) |
| `frigate_url` | string | — | URL Frigate, ví dụ: `http://192.168.1.10:5000` |
| `cameras` | array | — | Danh sách đối tượng camera (xem trên) |

---

## 📝 Ví dụ YAML đầy đủ

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

### Ví dụ tối giản (Frigate, không AI)

```yaml
type: custom:camera-events-card
title: Camera Nhà Tôi
theme: dark
frigate_url: http://192.168.1.10:5000

cameras:
  - id: camera_cong
    entity: camera.front_door
    label: CAM 1
    name: Cổng Trước
    source_mode: frigate
    frigate_camera_name: front_door

  - id: camera_san
    entity: camera.back_yard
    label: CAM 2
    name: Sân Sau
    source_mode: frigate
    frigate_camera_name: back_yard
```

### Stream thủ công (không dùng Frigate)

```yaml
type: custom:camera-events-card
title: Camera CCTV
theme: dark

cameras:
  - id: camera_cong
    entity: camera.gate_rtsp
    label: CAM 1
    name: Cổng
    source_mode: manual
    stream_url: rtsp://admin:pass@192.168.1.100:554/stream1
```

---

## 🖥️ Tương thích

| | |
|---|---|
| Home Assistant | 2024.6+ |
| Lovelace | Dashboard mặc định & tùy chỉnh |
| Thiết bị | Mobile & Desktop |
| Phụ thuộc | Không — hoàn toàn độc lập |
| Trình duyệt | Chrome, Firefox, Safari, Edge |
| Frigate | Tuỳ chọn — cần để xem lịch sử sự kiện |
| go2rtc | Tuỳ chọn — cần để stream WebRTC |

---

## 📋 Lịch sử thay đổi

### v1.0
- 🚀 Phát hành lần đầu
- 📷 Stream WebRTC/HLS nhiều camera qua `ha-camera-stream`
- 📋 Danh sách sự kiện Frigate với thumbnail, nhãn, điểm tin cậy và thời gian
- 🖼️ Lightbox toàn màn hình với điều hướng bàn phím
- 🤖 Overlay kết quả AI — badge số người + mô tả qua Blueprint
- 🌗 Giao diện Tối / Sáng với hiệu ứng glassmorphism
- 🎛️ Trình chỉnh sửa trực quan — entity picker, chuyển đổi source mode, accordion
- ⚙️ `source_mode` từng camera: Frigate hoặc Manual (ONVIF/RTSP)
- 🗂️ Blueprint `camera_ai_result_writer` đính kèm trong repo

---

## 📄 Giấy phép

MIT License — miễn phí sử dụng, chỉnh sửa và phân phối.
Nếu bạn thấy hữu ích, hãy ⭐ **star repo** nhé!

---

## 🙏 Credits

Thiết kế và phát triển bởi **[@doanlong1412](https://github.com/doanlong1412)** từ 🇻🇳 Việt Nam.

☕ [Ủng hộ tôi một ly cà phê](https://www.paypal.com/paypalme/doanlong1412)
