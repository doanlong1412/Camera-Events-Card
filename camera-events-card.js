/**
 * camera-events-card — Lovelace Custom Card v1.0
 * Fixes: memory-leak keydown, redundant _build on hass set, go2rtc URL port replace,
 *        _error always-null bug, duplicate lightbox listeners
 *        debounce hass updates, smart-diff render, cache-bust thumbnails
 *        per-camera source_mode: frigate (default) | manual (ONVIF/generic)
 * Visual Editor + Dark/Light theme + Glassmorphism nền trong suốt blur
 *
 * Cài đặt: copy vào /config/www/camera-events-card.js
 *
 * resources:
 *   - url: /local/camera-events-card.js?v=1.0
 *     type: module
 *
 * Cấu hình dashboard:
 *
 * type: custom:camera-events-card
 * title: Camera & Events
 * theme: dark           # hoặc light
 * tile_opacity: 0.18    # 0–0.6
 * tile_blur: 12         # px
 * frigate_url: http://192.168.10.10:5000
 * cameras:
 *   - id: camera_congchinh
 *     entity: camera.camera_congchinh
 *     label: CAM 1
 *     name: Cổng Chính
 */

// ─── Personal data (từ multi-rooms-card) ─────────────────────────────────────
const DEFAULT_FRIGATE_URL = 'http://192.168.10.10:5000';

const DEFAULT_CAMERAS = [
  { id: 'camera_congchinh',  entity: 'camera.camera_congchinh',  label: 'CAM 1', name: 'Cổng Chính'  },
  { id: 'camera_san1',       entity: 'camera.camera_san1',       label: 'CAM 2', name: 'Sân Trước'   },
  { id: 'camera_phongkhach', entity: 'camera.camera_phongkhach', label: 'CAM 3', name: 'Phòng Khách' },
  { id: 'camera_nhaxe',      entity: 'camera.camera_nhaxe',      label: 'CAM 4', name: 'Nhà Xe'      },
  { id: 'camera_nhabep',     entity: 'camera.camera_nhabep',     label: 'CAM 5', name: 'Nhà Bếp'     },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
const IC = {
  cam:   `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m15 10 4.553-2.069A1 1 0 0 1 21 8.87v6.26a1 1 0 0 1-1.447.894L15 14"/><rect x="2" y="6" width="13" height="12" rx="2"/></svg>`,
  bell:  `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  play:  `<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  link:  `<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  ref:   `<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
  noVid: `<svg width="40" height="40" fill="none" stroke="rgba(56,189,248,.2)" stroke-width="1.5" viewBox="0 0 24 24"><path d="m15 10 4.553-2.069A1 1 0 0 1 21 8.87v6.26a1 1 0 0 1-1.447.894L15 14"/><rect x="2" y="6" width="13" height="12" rx="2"/><line x1="2" y1="2" x2="22" y2="22" stroke="rgba(239,68,68,.35)"/></svg>`,
  ghost: `<svg width="36" height="36" fill="none" stroke="rgba(56,189,248,.15)" stroke-width="1.5" viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>`,
};

// ─── CSS (card) ───────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :host{display:block;font-family:'DM Sans',sans-serif}

  /* ── Dark theme (default) ── */
  ha-card{
    background:linear-gradient(160deg,#111111 0%,#1a1a1a 50%,#0d0d0d 100%) !important;
    border:1px solid rgba(255,255,255,0.08) !important;
    border-radius:18px !important;
    overflow:hidden;
    box-shadow:0 24px 64px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.04) !important;
    color:#d1d5db;
  }

  /* ── Light theme ── */
  :host([data-theme="light"]) ha-card{
    background:rgba(245,248,255,0.72) !important;
    border:1px solid rgba(180,195,230,0.35) !important;
    box-shadow:0 12px 40px rgba(100,120,160,.14),inset 0 1px 0 rgba(255,255,255,.9) !important;
    color:#1e293b;
    position:relative;
  }
  :host([data-theme="light"]) ha-card::before{
    content:'';position:absolute;inset:0;border-radius:inherit;z-index:0;
    backdrop-filter:blur(var(--ce-blur,12px));-webkit-backdrop-filter:blur(var(--ce-blur,12px));
  }
  :host([data-theme="light"]) ha-card>*{position:relative;z-index:1;}
  :host([data-theme="light"]) .hdr{
    border-bottom:1px solid rgba(180,195,230,.22);
    background:rgba(255,255,255,.38);
  }
  :host([data-theme="light"]) .hdr-title{
    background:linear-gradient(90deg,#1e40af,#3b82f6);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  }
  :host([data-theme="light"]) .hdr-sub{color:rgba(71,85,105,.5);}
  :host([data-theme="light"]) .live-dot{color:#16a34a;}
  :host([data-theme="light"]) .dot{background:#16a34a;box-shadow:0 0 10px rgba(22,163,74,.6);}
  :host([data-theme="light"]) .tab{color:rgba(71,85,105,.6);}
  :host([data-theme="light"]) .tab:hover{
    background:rgba(59,130,246,.1);border-color:rgba(59,130,246,.25);color:rgba(37,99,235,.9);
    transform:translateY(-2px);
    box-shadow:0 6px 14px rgba(59,130,246,.18),0 1px 0 rgba(255,255,255,.8) inset,0 -1px 0 rgba(59,130,246,.1) inset;
  }
  :host([data-theme="light"]) .tab:active{transform:translateY(1px) scale(.97);box-shadow:0 1px 3px rgba(59,130,246,.2);transition:all .07s}
  :host([data-theme="light"]) .tab.active{
    background:linear-gradient(160deg,rgba(59,130,246,.18),rgba(37,99,235,.08));
    border-color:rgba(59,130,246,.38);color:#2563eb;
    box-shadow:0 5px 16px rgba(59,130,246,.2),0 1px 0 rgba(255,255,255,.9) inset,0 -1px 0 rgba(59,130,246,.12) inset;
    transform:translateY(-1px);
  }
  :host([data-theme="light"]) .stream-wrap{border-color:rgba(59,130,246,.18);}
  :host([data-theme="light"]) .panel-box{
    background:rgba(255,255,255,.45);
    border:1px solid rgba(180,195,230,.18);
    backdrop-filter:blur(var(--ce-blur,12px));-webkit-backdrop-filter:blur(var(--ce-blur,12px));
  }
  :host([data-theme="light"]) .panel-title{color:rgba(59,130,246,.7);}
  :host([data-theme="light"]) .ev-count-badge{
    background:rgba(59,130,246,.1);border-color:rgba(59,130,246,.22);color:#2563eb;
  }
  :host([data-theme="light"]) .ev-cam-name{color:#1e293b;}
  :host([data-theme="light"]) .ev-time{color:rgba(71,85,105,.5);}
  :host([data-theme="light"]) .ev-thumb{background:rgba(230,235,245,.8);border-color:rgba(59,130,246,.15);}
  :host([data-theme="light"]) .ev-row:hover{background:rgba(59,130,246,.04);}
  :host([data-theme="light"]) .ev-row{border-bottom-color:rgba(180,195,230,.12);}
  :host([data-theme="light"]) .hud-name{color:rgba(255,255,255,.95);}
  :host([data-theme="light"]) .act-btn{
    border-color:rgba(59,130,246,.22);
    background:linear-gradient(160deg,rgba(59,130,246,.1),rgba(59,130,246,.04));
    color:rgba(59,130,246,.8);
    box-shadow:0 3px 8px rgba(59,130,246,.12),0 1px 0 rgba(255,255,255,.9) inset,0 -1px 0 rgba(59,130,246,.08) inset;
  }
  :host([data-theme="light"]) .act-btn:hover{
    background:linear-gradient(160deg,rgba(59,130,246,.18),rgba(59,130,246,.08));
    border-color:rgba(59,130,246,.42);color:#2563eb;
    box-shadow:0 7px 18px rgba(59,130,246,.2),0 1px 0 rgba(255,255,255,.95) inset,0 -1px 0 rgba(59,130,246,.12) inset;
  }
  :host([data-theme="light"]) .act-btn:active{transform:translateY(1px) scale(.97);box-shadow:0 1px 3px rgba(59,130,246,.15);transition:all .07s}
  :host([data-theme="light"]) .hdr-stat{color:rgba(71,85,105,.45);}
  :host([data-theme="light"]) .hdr-stat-val{color:#2563eb;}
  :host([data-theme="light"]) .hdr-stat-sep{color:rgba(59,130,246,.25);}
  :host([data-theme="light"]) .refresh-btn{
    border-color:rgba(59,130,246,.22);background:rgba(59,130,246,.05);
  }
  :host([data-theme="light"]) .refresh-btn:hover{background:rgba(59,130,246,.15);border-color:rgba(59,130,246,.4);}
  :host([data-theme="light"]) .ev-empty-text{color:rgba(59,130,246,.35);}
  :host([data-theme="light"]) .spinner{border-color:rgba(59,130,246,.15);border-top-color:#2563eb;}
  :host([data-theme="light"]) .sp-text{color:rgba(59,130,246,.45);}

  /* ── Shared header ── */
  .hdr{
    display:flex;align-items:center;justify-content:space-between;
    padding:12px 18px;
    border-bottom:1px solid rgba(255,255,255,.06);
    background:rgba(255,255,255,.02);
  }
  .hdr-left{display:flex;align-items:center;gap:10px}
  .hdr-right{display:flex;flex-direction:column;align-items:flex-end;gap:4px}
  .hdr-stats{display:flex;align-items:center;gap:5px;flex-wrap:wrap;justify-content:flex-end}
  .hdr-stat{font-size:9.5px;color:rgba(156,163,175,.45);font-family:'Space Mono',monospace;letter-spacing:.3px;white-space:nowrap}
  .hdr-stat-val{color:rgba(255,255,255,.6);font-weight:700}
  .hdr-stat-sep{font-size:9px;color:rgba(255,255,255,.15)}
  .hdr-icon{
    width:32px;height:32px;border-radius:8px;
    background:rgba(255,255,255,.08);
    border:1px solid rgba(255,255,255,.12);
    display:flex;align-items:center;justify-content:center;
  }
  .hdr-title{
    font-family:'Space Mono',monospace;font-size:12px;font-weight:700;
    letter-spacing:2px;text-transform:uppercase;
    color:#e5e7eb;
  }
  .hdr-sub{font-size:10px;color:rgba(156,163,175,.5);letter-spacing:.5px;margin-top:1px}
  .live-dot{
    display:flex;align-items:center;gap:6px;
    font-size:10px;font-weight:600;letter-spacing:1.5px;color:#4ade80;
    font-family:'Space Mono',monospace;
  }
  .dot{
    width:6px;height:6px;border-radius:50%;background:#4ade80;
    box-shadow:0 0 10px #4ade80aa;
    animation:blink 2s ease-in-out infinite;
  }
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}

  /* ── Tabs ── */
  .tabs{
    display:grid;gap:4px;padding:12px 14px 0;
    /* rows/columns set dynamically via inline style */
  }
  .tab{
    display:flex;align-items:center;justify-content:center;gap:5px;
    padding:7px 10px;border-radius:9px;cursor:pointer;
    border:1px solid transparent;min-width:0;width:100%;
    font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;
    color:rgba(148,163,184,.6);transition:all .2s;
    font-family:'Space Mono',monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  }
  .tab{transform:translateY(0);will-change:transform}
  .tab:hover{
    background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.22);color:rgba(255,255,255,.9);
    transform:translateY(-2px);
    box-shadow:0 6px 14px rgba(0,0,0,.45),0 1px 0 rgba(255,255,255,.1) inset,0 -1px 0 rgba(0,0,0,.3) inset;
  }
  .tab:active{
    transform:translateY(1px) scale(.97);
    box-shadow:0 1px 3px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.05) inset;
    transition:all .07s;
  }
  .tab.active{
    background:linear-gradient(160deg,rgba(255,255,255,.16) 0%,rgba(255,255,255,.07) 100%);
    border-color:rgba(255,255,255,.26);color:#f9fafb;
    box-shadow:0 5px 16px rgba(0,0,0,.45),0 1px 0 rgba(255,255,255,.15) inset,0 -1px 0 rgba(0,0,0,.3) inset;
    transform:translateY(-1px);
  }

  .content{margin:10px 14px 14px}

  /* ── Camera view ── */
  .cam-view{display:none}
  .cam-view.active{display:block}

  .stream-wrap{
    position:relative;border-radius:12px;overflow:hidden;
    background:#000;border:1px solid rgba(255,255,255,.1);
    box-shadow:0 8px 32px rgba(0,0,0,.5);
  }
  .stream-wrap ha-camera-stream{
    display:block;width:100%;aspect-ratio:16/9;
    --ha-camera-stream-controls-color:#38bdf8;
  }
  .stream-placeholder{
    aspect-ratio:16/9;
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
    background:rgba(0,10,20,.8);
  }
  .sp-text{
    font-family:'Space Mono',monospace;font-size:11px;letter-spacing:2px;
    color:rgba(255,255,255,.3);text-transform:uppercase;
  }
  .sp-err{
    font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1px;
    color:rgba(239,68,68,.5);text-transform:uppercase;margin-top:4px;
  }

  .stream-hud{
    position:absolute;inset:0;pointer-events:none;z-index:10;
    display:flex;flex-direction:column;justify-content:space-between;
  }
  .hud-top{
    display:flex;align-items:center;justify-content:space-between;
    padding:10px 12px;
    background:linear-gradient(180deg,rgba(0,0,0,.65) 0%,transparent 100%);
  }
  .hud-name{
    font-family:'Space Mono',monospace;font-size:11px;font-weight:700;
    letter-spacing:2px;color:rgba(255,255,255,.9);text-shadow:0 1px 4px rgba(0,0,0,.8);
    text-transform:uppercase;
  }
  .hud-live{
    font-family:'Space Mono',monospace;font-size:9px;font-weight:700;
    letter-spacing:1.5px;padding:3px 8px;border-radius:20px;
    background:rgba(74,222,128,.2);border:1px solid rgba(74,222,128,.4);color:#4ade80;
  }
  .hud-bot{
    padding:8px 12px;
    background:linear-gradient(0deg,rgba(0,0,0,.65) 0%,transparent 100%);
    font-size:9px;color:rgba(148,163,184,.4);
    font-family:'Space Mono',monospace;letter-spacing:.5px;
  }

  .cam-actions{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}
  .act-btn{
    display:flex;align-items:center;gap:5px;padding:6px 11px;border-radius:8px;cursor:pointer;
    border:1px solid rgba(255,255,255,.14);
    background:linear-gradient(160deg,rgba(255,255,255,.09) 0%,rgba(255,255,255,.04) 100%);
    font-family:'Space Mono',monospace;font-size:10px;font-weight:700;
    letter-spacing:.5px;color:rgba(255,255,255,.6);
    transition:all .18s;transform:translateY(0);will-change:transform;
    box-shadow:0 3px 8px rgba(0,0,0,.35),0 1px 0 rgba(255,255,255,.08) inset,0 -1px 0 rgba(0,0,0,.25) inset;
  }
  .act-btn:hover{
    background:linear-gradient(160deg,rgba(255,255,255,.15) 0%,rgba(255,255,255,.07) 100%);
    border-color:rgba(255,255,255,.28);color:#f9fafb;
    transform:translateY(-2px);
    box-shadow:0 7px 18px rgba(0,0,0,.5),0 1px 0 rgba(255,255,255,.14) inset,0 -1px 0 rgba(0,0,0,.3) inset;
  }
  .act-btn:active{
    transform:translateY(1px) scale(.97);
    box-shadow:0 1px 3px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.05) inset;
    transition:all .07s;
  }

  /* ── Events panel ── */
  .ev-panel{display:none}
  .ev-panel.active{display:block}

  .panel-box{
    background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.06);
    border-radius:12px;overflow:hidden;
  }
  .panel-hdr{
    display:flex;align-items:center;gap:8px;padding:10px 14px;
    border-bottom:1px solid rgba(255,255,255,.05);background:rgba(255,255,255,.02);
  }
  .panel-title{
    font-family:'Space Mono',monospace;font-size:10px;font-weight:700;
    letter-spacing:2px;color:rgba(255,255,255,.45);text-transform:uppercase;
  }
  .ev-count-badge{
    margin-left:auto;font-family:'Space Mono',monospace;font-size:9px;font-weight:700;
    padding:2px 8px;border-radius:20px;
    background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);
    color:rgba(255,255,255,.6);letter-spacing:.5px;
  }
  .refresh-btn{
    width:28px;height:28px;border-radius:50%;cursor:pointer;
    border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);
    display:flex;align-items:center;justify-content:center;transition:all .18s;flex-shrink:0;
  }
  .refresh-btn:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.25);transform:rotate(180deg)}

  .ev-list{
    max-height:420px;overflow-y:auto;
    scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.15) transparent;
  }
  .ev-list::-webkit-scrollbar{width:3px}
  .ev-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18);border-radius:4px}

  .ev-empty{
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    padding:44px 20px;gap:12px;
  }
  .ev-empty-text{
    font-family:'Space Mono',monospace;font-size:10px;letter-spacing:2px;
    color:rgba(255,255,255,.2);text-transform:uppercase;
  }
  .spinner{
    width:20px;height:20px;
    border:2px solid rgba(255,255,255,.1);border-top-color:rgba(255,255,255,.6);
    border-radius:50%;animation:spin .7s linear infinite;
  }
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes heartbeat-glow{
    0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0),inset 0 0 0 0 rgba(239,68,68,0);border-color:rgba(255,255,255,.04)}
    14%{box-shadow:0 0 8px 2px rgba(239,68,68,.22),inset 0 0 12px 0 rgba(239,68,68,.06);border-color:rgba(239,68,68,.35)}
    28%{box-shadow:0 0 3px 1px rgba(239,68,68,.1),inset 0 0 4px 0 rgba(239,68,68,.03);border-color:rgba(255,255,255,.04)}
    42%{box-shadow:0 0 10px 3px rgba(239,68,68,.28),inset 0 0 14px 0 rgba(239,68,68,.08);border-color:rgba(239,68,68,.4)}
    70%{box-shadow:0 0 2px 0 rgba(239,68,68,.05),inset 0 0 0 0 rgba(239,68,68,0);border-color:rgba(255,255,255,.04)}
  }

  .ev-row{
    display:flex;align-items:center;gap:10px;padding:9px 14px;
    border-bottom:1px solid rgba(255,255,255,.04);
    border-left:2px solid transparent;
    transition:background .15s,border-color .3s;cursor:pointer;
  }
  .ev-row:last-child{border-bottom:none}
  .ev-row:hover{background:rgba(255,255,255,.04)}
  .ev-row.motion-active{
    background:rgba(239,68,68,.04);
    border-left-color:rgba(239,68,68,.5);
    animation:heartbeat-glow 1.6s ease-in-out infinite;
  }
  .ev-row.motion-active:hover{background:rgba(239,68,68,.07)}
  :host([data-theme="light"]) .ev-row.motion-active{
    background:rgba(239,68,68,.03);border-left-color:rgba(220,38,38,.6);
  }
  :host([data-theme="light"]) .ev-row.motion-active:hover{background:rgba(239,68,68,.06)}

  .ev-thumb{
    width:68px;height:48px;border-radius:7px;flex-shrink:0;overflow:hidden;
    background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.1);
    display:flex;align-items:center;justify-content:center;
  }
  .ev-thumb img{width:100%;height:100%;object-fit:cover}

  .ev-body{flex:1;min-width:0}
  .ev-cam-name{font-size:13px;font-weight:600;color:#e2e8f0;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ev-time{font-size:10px;color:rgba(148,163,184,.45);font-family:'Space Mono',monospace;letter-spacing:.3px}

  .ev-right{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0}
  .ev-chip{
    font-family:'Space Mono',monospace;font-size:9px;font-weight:700;
    letter-spacing:.8px;padding:2px 8px;border-radius:20px;text-transform:uppercase;white-space:nowrap;
  }
  .chip-person{background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.3);color:#60a5fa}

  .err-bar{
    padding:8px 14px;font-size:10px;
    color:rgba(248,113,113,.7);font-family:'Space Mono',monospace;
    background:rgba(239,68,68,.05);border-top:1px solid rgba(239,68,68,.1);letter-spacing:.3px;
  }



  /* ── AI bar (manual/ONVIF mode) ── */
  .ai-bar{
    display:flex;align-items:flex-start;gap:5px;margin-top:5px;
    font-size:10px;line-height:1.45;border-radius:6px;padding:4px 7px;
    font-family:'DM Sans',sans-serif;
  }
  .ai-analyzing{
    background:rgba(56,189,248,.08);color:rgba(56,189,248,.7);
    border:1px solid rgba(56,189,248,.15);
  }
  .ai-done{
    background:rgba(74,222,128,.07);color:rgba(74,222,128,.85);
    border:1px solid rgba(74,222,128,.15);
  }
  :host([data-theme="light"]) .ai-done{
    background:rgba(22,163,74,.07);color:rgba(22,163,74,.85);
    border-color:rgba(22,163,74,.2);
  }
  .ai-error{
    background:rgba(239,68,68,.07);color:rgba(239,68,68,.7);
    border:1px solid rgba(239,68,68,.15);
  }
  .ai-snap{
    background:rgba(251,146,60,.07);color:rgba(251,146,60,.7);
    border:1px solid rgba(251,146,60,.15);
  }
  .ai-icon{flex-shrink:0;font-size:11px}
  .ai-desc-val{flex:1;min-width:0;word-break:break-word}
  .ai-spinner{
    width:10px;height:10px;flex-shrink:0;margin-top:1px;
    border:1.5px solid rgba(56,189,248,.25);border-top-color:rgba(56,189,248,.8);
    border-radius:50%;animation:spin .7s linear infinite;display:inline-block;
  }

  /* ── Lightbox ── */
  .lb-overlay{
    display:none;position:fixed;inset:0;z-index:9999;
    background:rgba(0,0,0,.85);backdrop-filter:blur(8px);
    align-items:center;justify-content:center;flex-direction:column;gap:12px;
    cursor:zoom-out;
  }
  .lb-overlay.open{display:flex}
  .lb-img{
    max-width:90vw;max-height:80vh;border-radius:12px;
    border:1px solid rgba(255,255,255,.15);
    box-shadow:0 0 60px rgba(0,0,0,.8);
    object-fit:contain;
  }
  .lb-info{
    font-family:'Space Mono',monospace;font-size:11px;letter-spacing:1px;
    color:rgba(156,163,175,.7);text-align:center;
  }
  .lb-close{
    position:absolute;top:16px;right:20px;
    width:36px;height:36px;border-radius:50%;
    border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);
    color:rgba(255,255,255,.8);font-size:18px;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    transition:all .2s;
  }
  .lb-close:hover{background:rgba(255,255,255,.18);transform:scale(1.1)}
  .lb-btn{
    display:flex;align-items:center;gap:6px;
    padding:7px 16px;border-radius:8px;cursor:pointer;
    border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);
    font-family:'Space Mono',monospace;font-size:10px;font-weight:700;
    letter-spacing:.5px;color:rgba(255,255,255,.75);transition:all .18s;
  }
  .lb-btn:hover{background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.35)}

  /* ── Lightbox AI desc panel ── */
  .lb-ai{
    display:flex;align-items:flex-start;gap:10px;
    max-width:min(560px,88vw);width:100%;
    background:rgba(74,222,128,.08);
    border:1px solid rgba(74,222,128,.2);
    border-radius:10px;padding:10px 14px;
    font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.5;
    color:rgba(220,252,231,.9);
  }
  .lb-ai-icon{font-size:16px;flex-shrink:0;margin-top:1px}
  .lb-ai-body{flex:1;min-width:0}
  .lb-ai-count{
    font-family:'Space Mono',monospace;font-size:10px;font-weight:700;
    letter-spacing:1px;color:rgba(74,222,128,.7);margin-bottom:3px;
  }
  .lb-ai-desc{word-break:break-word}
`;

// ─── Dynamic CSS (opacity / blur) ────────────────────────────────────────────
function buildDynCSS(opacity, blur, theme) {
  return `
    ha-card{ --ce-blur:${blur}px; }
    :host([data-theme="dark"]) ha-card{
      background:linear-gradient(160deg,
        rgba(17,17,17,${Math.min(opacity+0.75,0.98)}) 0%,
        rgba(26,26,26,${Math.min(opacity+0.75,0.98)}) 50%,
        rgba(13,13,13,${Math.min(opacity+0.75,0.98)}) 100%) !important;
      backdrop-filter:blur(${blur}px);-webkit-backdrop-filter:blur(${blur}px);
    }
  `;
}

// ─── Card class ───────────────────────────────────────────────────────────────
class CameraEventsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config      = {};
    this._hass        = null;
    this._tab         = 'events';
    this._events      = [];
    this._error       = null;
    this._cameras     = [...DEFAULT_CAMERAS];
    this._frigateUrl  = DEFAULT_FRIGATE_URL;
    this._built       = false;
    this._theme       = 'dark';
    this._tileOpacity = 0.18;
    this._tileBlur    = 12;
    // FIX: keydown listener stored once, not inside render loop
    this._onKeyDown   = e => { if (e.key === 'Escape') this._closeLightbox(); };
    // FIX: debounce fetchEvents to prevent re-render storm on every hass update
    this._fetchCooldown = null;
    this._fetchPending  = false;
    // AI snapshot cache: { [camId]: { status, description, count, thumbUrl, time } }
    // Persist qua localStorage để không mất khi reload trang
    this._aiCache       = this._loadCache();
    // Track previous occupancy state để detect off→on transition
    this._prevOccupied  = {};
  }

  // ── Persist aiCache vào localStorage ─────────────────────────────────────
  _cacheKey() { return 'cec_ai_cache_v1'; }

  _loadCache() {
    try {
      const raw = localStorage.getItem(this._cacheKey());
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      const clean  = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (v && (v.status === 'done' || v.status === 'snap_only')) {
          // Giữ nguyên _cb từ rawTime (đã gắn khi ghi cache từ last_changed entity)
          // KHÔNG thay bằng Date.now() để tránh stale bust khi card reload
          clean[k] = { ...v };
        }
      }
      return clean;
    } catch (_) { return {}; }
  }

  _saveCache() {
    try {
      // Chỉ lưu 'done' và 'snap_only', tối đa 20 camera
      const toSave = {};
      let count = 0;
      for (const [k, v] of Object.entries(this._aiCache)) {
        if (v && (v.status === 'done' || v.status === 'snap_only') && count < 20) {
          toSave[k] = v;
          count++;
        }
      }
      localStorage.setItem(this._cacheKey(), JSON.stringify(toSave));
    } catch (_) {}
  }

  setConfig(config) {
    this._config        = config || {};
    this._frigateUrl    = (config.frigate_url || DEFAULT_FRIGATE_URL).replace(/\/$/, '');
    this._clientId      = config.frigate_client_id || 'frigate';
    this._corsProxyUrl  = (config.cors_proxy_url || '').replace(/\/$/, '') || null;
    this._theme         = config.theme || 'dark';
    this._tileOpacity   = config.tile_opacity != null ? config.tile_opacity : 0.18;
    this._tileBlur      = config.tile_blur != null ? config.tile_blur : 12;
    if (config.cameras && config.cameras.length) this._cameras = config.cameras;
    this.setAttribute('data-theme', this._theme);
    this._built = false;
    this._build();
    this._fetchEvents();
  }

  set hass(hass) {
    this._hass = hass;
    // FIX: no redundant _build() — only _syncStreams + _patch
    if (!this._built) { this._build(); return; }
    this._syncStreams();
    // FIX: debounce — HA có thể push hass update 5-10 lần/giây
    // Chỉ fetch sau khi không có update trong 800ms, tránh re-render liên tục
    this._debouncedFetch();
  }

  _debouncedFetch() {
    // Leading + trailing throttle:
    // - Lần đầu: fetch ngay
    // - Trong cooldown: đánh dấu "pending" thay vì discard
    // - Sau cooldown: nếu có pending thì fetch thêm 1 lần nữa
    if (!this._fetchCooldown) {
      this._fetchEvents();
      const startCooldown = () => {
        this._fetchCooldown = setTimeout(() => {
          this._fetchCooldown = null;
          if (this._fetchPending) {
            this._fetchPending = false;
            this._fetchEvents();
            startCooldown(); // bắt đầu cooldown mới cho trailing call
          }
        }, 1500);
      };
      startCooldown();
    } else {
      // Đang trong cooldown — đánh dấu pending, không discard
      this._fetchPending = true;
    }
  }

  getCardSize() { return 5; }

  connectedCallback() {
    if (!this._built) this._build();
    // FIX: attach keydown once here, not in render loop
    document.addEventListener('keydown', this._onKeyDown);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._onKeyDown);
  }

  // ── Sync hass + stateObj to all ha-camera-stream ──────────────────────────
  // ha-camera-stream is a HA built-in custom element — it may not be defined
  // immediately at render time. Wait for it, then push hass + stateObj.
  _syncStreams() {
    if (!this._hass) return;
    const doSync = () => {
      this._cameras.forEach(c => {
        const entityId = c.entity || `camera.${c.id}`;
        const stateObj = this._hass.states[entityId] || null;
        const el = this.shadowRoot.querySelector(`#stream-${c.id}`);
        if (!el) return;
        el.hass = this._hass;
        if (stateObj) el.stateObj = stateObj;
      });
    };
    if (customElements.get('ha-camera-stream')) {
      doSync();
    } else {
      // Trigger HA helper loading once, then wait for element definition
      if (!this._streamHelperTriggered) {
        this._streamHelperTriggered = true;
        if (window.loadCardHelpers) window.loadCardHelpers().catch(() => {});
      }
      customElements.whenDefined('ha-camera-stream')
        .then(() => doSync())
        .catch(() => {});
    }
  }

  // ── Build full shadow DOM ──────────────────────────────────────────────────
  _build() {
    const title = this._config.title || 'Camera & Events';

    const camTabs = this._cameras.map(c =>
      `<div class="tab${this._tab === c.id ? ' active' : ''}" data-tab="${c.id}">${c.icon ? `<ha-icon icon="${c.icon}" style="--mdc-icon-size:14px;display:inline-flex;vertical-align:middle"></ha-icon>` : IC.cam} ${c.label}</div>`
    );
    const n = camTabs.length;
    // Grid layout: Events tab spans full width (row 1), cam tabs fill evenly below
    const perRow = n === 0 ? 1 : n <= 4 ? n : Math.ceil(n / Math.ceil(n / 4));
    // grid-template-columns drives equal-width columns; Events tab uses grid-column:1/-1
    const tabsHtml = `<div class="tab${this._tab === 'events' ? ' active' : ''}" data-tab="events" style="grid-column:1/-1">${IC.bell} Events</div>`
      + camTabs.join('');

    const camPanels = this._cameras.map(c => {
      const entityId = c.entity || `camera.${c.id}`;
      const stateObj = this._hass ? (this._hass.states[entityId] || null) : null;
      const isActive = this._tab === c.id;

      const streamHtml = `<ha-camera-stream id="stream-${c.id}" allow-exoplayer controls muted></ha-camera-stream>`;

      return `
      <div class="cam-view${isActive ? ' active' : ''}" id="cv-${c.id}">
        <div class="stream-wrap">
          ${streamHtml}
          <div class="stream-hud">
            <div class="hud-top">
              <span class="hud-name">${c.label} · ${c.name}</span>
              <span class="hud-live">${_cT('lbl_live')}</span>
            </div>
            <div class="hud-bot">${entityId} · ${_cT('lbl_webrtc')}</div>
          </div>
        </div>
        <div class="cam-actions">
          <button class="act-btn" data-action="open-frigate" data-cam="${c.id}">${IC.link} &nbsp;${_cT('lbl_frigate_ui')}</button>
          <button class="act-btn" data-action="open-go2rtc"  data-cam="${c.id}">${IC.play} &nbsp;${_cT('lbl_go2rtc')}</button>
        </div>
      </div>`;
    }).join('');

    this.shadowRoot.innerHTML = `
      <style>${CSS}</style>
      <style id="dyn-style">${buildDynCSS(this._tileOpacity, this._tileBlur, this._theme)}</style>
      <ha-card>
        <div class="hdr">
          <div class="hdr-left">
            <div class="hdr-icon">${IC.cam}</div>
            <div>
              <div class="hdr-title">${title}</div>

            </div>
          </div>
          <div class="hdr-right">
            <div class="live-dot"><div class="dot"></div>${_cT('lbl_online')}</div>
            <div class="hdr-stats">
              <span class="hdr-stat">${_cT('footer_cams')}: <span class="hdr-stat-val">${this._cameras.length}</span></span>
              <span class="hdr-stat-sep">·</span>
              <span class="hdr-stat">${_cT('footer_events')}: <span class="hdr-stat-val" id="ev-total">0</span></span>
              <span class="hdr-stat-sep">·</span>
              <span class="hdr-stat">${_cT('footer_theme')}: <span class="hdr-stat-val">${this._theme}</span></span>
            </div>
          </div>
        </div>

        <div class="tabs" style="grid-template-columns:repeat(${perRow},1fr)">${tabsHtml}</div>

        <div class="content">
          <div class="ev-panel${this._tab === 'events' ? ' active' : ''}" id="pev">
            <div class="panel-box">
              <div class="panel-hdr">
                ${IC.bell}
                <span class="panel-title">${_cT('panel_events')}</span>
                <span class="ev-count-badge" id="ev-badge">…</span>
                <button class="refresh-btn" id="ref-btn">${IC.ref}</button>
              </div>
              <div class="ev-list" id="ev-list">
                <div class="ev-empty"><div class="spinner"></div><span class="ev-empty-text">${_cT('ev_loading')}</span></div>
              </div>
              <div id="err-bar"></div>
            </div>
          </div>
          ${camPanels}
        </div>

      </ha-card>
      <div class="lb-overlay" id="lb">
        <button class="lb-close" id="lb-close">✕</button>
        <img class="lb-img" id="lb-img" src="" alt="">
        <div class="lb-info" id="lb-info"></div>
        <button class="lb-btn" id="lb-open">${IC.link} &nbsp;${_cT('lb_open_frigate')}</button>
      </div>`;

    this._built = true;
    this._bindUI();
    this._syncStreams();
    if (this._events.length || this._error) this._renderEventList();
  }

  // ── Bind all interactive elements ─────────────────────────────────────────
  _bindUI() {
    // Tabs
    this.shadowRoot.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => {
        this._tab = t.dataset.tab;
        this.shadowRoot.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
        this.shadowRoot.querySelectorAll('.cam-view,.ev-panel').forEach(x => x.classList.remove('active'));
        const target = this._tab === 'events'
          ? this.shadowRoot.querySelector('#pev')
          : this.shadowRoot.querySelector(`#cv-${this._tab}`);
        target?.classList.add('active');
        if (this._tab !== 'events') {
          const cam = this._cameras.find(c => c.id === this._tab);
          if (cam && this._hass) {
            const entityId = cam.entity || `camera.${cam.id}`;
            const stateObj = this._hass.states[entityId] || null;
            const el = this.shadowRoot.querySelector(`#stream-${cam.id}`);
            if (el && stateObj) { el.hass = this._hass; el.stateObj = stateObj; }
          }
        }
      });
    });

    // Refresh events
    this.shadowRoot.querySelector('#ref-btn')?.addEventListener('click', () => this._fetchEvents());

    // Camera buttons
    this.shadowRoot.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const camId = btn.dataset.cam;
        if (btn.dataset.action === 'open-frigate') {
          window.open(`${this._frigateUrl}/cameras/${camId}`, '_blank');
        } else if (btn.dataset.action === 'open-go2rtc') {
          // FIX: safe port replacement using URL API
          try {
            const u = new URL(this._frigateUrl);
            u.port = '1984';
            window.open(`${u.origin}/?src=${camId}`, '_blank');
          } catch {
            window.open(`${this._frigateUrl.replace(/:\d+$/, ':1984')}/?src=${camId}`, '_blank');
          }
        }
      });
    });

    // Lightbox overlay click-outside
    const lb = this.shadowRoot.querySelector('#lb');
    if (lb) lb.addEventListener('click', e => { if (e.target === lb) this._closeLightbox(); });
    this.shadowRoot.querySelector('#lb-close')?.addEventListener('click', () => this._closeLightbox());
    this.shadowRoot.querySelector('#lb-open')?.addEventListener('click', () => {
      const camId = lb ? lb.dataset.camid : '';
      if (camId) window.open(`${this._frigateUrl}/cameras/${camId}`, '_blank');
    });
    // FIX: keydown NOT bound here anymore — done once in connectedCallback
  }

  // ── Tạo URL ảnh với cache-bust dựa trên last_changed của entity ─────────────
  // HA image entity thường giữ cùng 1 URL dù ảnh đã đổi → browser cache cũ
  // Giải pháp: append _cb=<timestamp> để force browser tải lại khi entity thay đổi
  _thumbWithBust(pic, imgState) {
    if (!pic) return pic;
    // Lấy timestamp từ last_changed hoặc last_updated của imgState
    const ts = imgState?.last_changed || imgState?.last_updated;
    if (!ts) return pic;
    const bust = new Date(ts).getTime();
    const sep  = pic.includes('?') ? '&' : '?';
    return `${pic}${sep}_cb=${bust}`;
  }

  // ── Extract Unix timestamp from entity_picture URL ────────────────────────
  _tsFromPicUrl(picUrl) {
    if (!picUrl) return null;
    const m = picUrl.match(/\/notifications\/(\d+(?:\.\d+)?)/);
    if (m) {
      const ts = parseFloat(m[1]);
      if (ts > 1577836800 && ts < 2208988800) return ts;
    }
    return null;
  }

  // ── Trigger snapshot + AI analysis khi motion off→on (manual/ONVIF mode) ───
  async _triggerAISnapshot(cam) {
    if (!this._hass) return;
    const camId     = cam.id;
    const cameraEnt = cam.entity || `camera.${camId}`;

    // Đánh dấu đang chụp
    this._aiCache[camId] = { status: 'analyzing', desc: '', count: null, thumbUrl: null, time: '' };
    this._renderEventList();

    try {
      // 1. Chụp ảnh song song vào 2 thư mục:
      //    - /media/snapshots/ → AI dùng qua media_source
      //    - /config/www/snapshots/ → card dùng qua /local/ (không cần auth, không cần shell_command)
      //    Prefix cec_ để không trùng với blueprint aiwriter_
      const fname = `/media/snapshots/cec_${camId}.jpg`;
      await Promise.all([
        this._hass.callService('camera', 'snapshot', {
          entity_id: cameraEnt,
          filename:  fname,
        }),
        this._hass.callService('camera', 'snapshot', {
          entity_id: cameraEnt,
          filename:  `/config/www/snapshots/cec_${camId}.jpg`,
        }),
      ]);

      // Thumbnail: /local/snapshots/ serve qua /config/www/snapshots/, không cần auth
      // Cache-bust vẫn giữ để đảm bảo browser load ảnh mới nhất
      const bust     = Date.now();
      const thumbUrl = `/local/snapshots/cec_${camId}.jpg?_cb=${bust}`;
      const timeStr  = new Date().toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      const rawTime  = Date.now();

      // Hiện ảnh ngay — trước khi AI xong
      this._aiCache[camId] = { status: 'analyzing', desc: '', count: null, thumbUrl, time: timeStr, rawTime };
      this._renderEventList();

      // 2. Hybrid: poll input_text ai_result_entity để lấy kết quả AI từ blueprint
      const aiTextId = cam.ai_result_entity || `input_text.${camId}_ai_result`;
      const hasAiEntity = !!this._hass.states[aiTextId];

      if (hasAiEntity) {
        // Poll đến khi thấy timestamp mới hơn baseline (blueprint đã ghi xong)
        const pollStart   = Date.now();
        const pollTimeout = 20000;
        const pollInterval = 1500;
        const baselineTs  = this._hass.states[aiTextId]?.last_changed
          ? new Date(this._hass.states[aiTextId].last_changed).getTime()
          : 0;

        await new Promise(resolve => {
          const poll = () => {
            const st = this._hass?.states[aiTextId];
            if (st && st.last_changed) {
              const stTs = new Date(st.last_changed).getTime();
              if (stTs > baselineTs + 1000) {
                try {
                  const parsed = JSON.parse(st.state);
                  const count  = parseInt(parsed.count ?? 0) || 0;
                  const desc   = parsed.desc || '';
                  this._aiCache[camId] = {
                    status:  'done',
                    desc,
                    count,
                    thumbUrl: this._aiCache[camId]?.thumbUrl || thumbUrl,
                    time:     timeStr,
                    rawTime,
                  };
                } catch (_) {
                  this._aiCache[camId] = {
                    ...this._aiCache[camId],
                    status: 'error',
                    desc:   'Không parse được kết quả AI',
                  };
                }
                this._saveCache();
                this._renderEventList();
                return resolve();
              }
            }
            if (Date.now() - pollStart > pollTimeout) {
              this._aiCache[camId] = { ...this._aiCache[camId], status: 'snap_only', desc: '' };
              this._saveCache();
              this._renderEventList();
              return resolve();
            }
            setTimeout(poll, pollInterval);
          };
          setTimeout(poll, pollInterval);
        });
      } else {
        // Không có ai_result_entity — chỉ hiển thị ảnh
        this._aiCache[camId] = { status: 'snap_only', desc: '', count: null, thumbUrl, time: timeStr, rawTime };
        this._saveCache();
      }
    } catch (err) {
      console.error('[CEC] AI snapshot error:', {
        message: err.message,
        code:    err.code,
        error:   err.error,
        stack:   err.stack,
      });
      this._aiCache[camId] = {
        ...(this._aiCache[camId] || {}),
        status: 'error',
        desc:   'Lỗi: ' + (err.message || err),
      };
      this._saveCache();
    }

    this._renderEventList();
  }

  // ── Read events from HA states (no CORS) ─────────────────────────────────
  _fetchEvents() {
    if (!this._hass) return;
    const states = this._hass.states;
    const events = [];
    let errorCount = 0;

    for (const cam of this._cameras) {
      const isManual = (cam.source_mode || 'frigate') === 'manual';

      if (isManual) {
        // ── Manual / ONVIF mode ──────────────────────────────────────────
        // entity dùng để snapshot (camera.xxx) — KHÔNG cần entity_picture
        const cameraEnt = cam.entity || `camera.${cam.id}`;
        const camState  = states[cameraEnt];

        // Occupancy sensor (binary_sensor, tùy chọn)
        const occEntity = cam.occupancy_entity || '';
        const occState  = occEntity ? states[occEntity] : null;

        // Count sensor (tùy chọn)
        const cntEntity = cam.count_entity || '';
        const cntState  = cntEntity ? states[cntEntity] : null;

        // Camera entity phải tồn tại mới xử lý
        if (!camState) continue;
        const isUnavail = camState.state === 'unavailable' || camState.state === 'unknown';
        if (isUnavail) { errorCount++; continue; }

        const occupied = occState ? occState.state === 'on' : false;
        const count    = cntState ? (parseInt(cntState.state) || 0) : 0;
        const cacheKey = `_lastCount_${cam.id}`;
        if (count > 0) this[cacheKey] = count;
        const lastCount = this[cacheKey] || 0;

        // Detect off→on transition → trigger snapshot + AI
        // prevOcc undefined = lần đầu load, không trigger (chờ lần tiếp theo)
        // prevOcc false → true = trigger
        const prevOcc = this._prevOccupied[cam.id];
        const isFirstLoad = prevOcc === undefined;
        if (!isFirstLoad && occupied && !prevOcc) {
          console.debug('[CEC] Motion trigger detected for', cam.id, '— launching AI snapshot');
          this._triggerAISnapshot(cam);
        }
        if (isFirstLoad) {
          console.debug('[CEC] First load state for', cam.id, '— occupied:', occupied);
        }
        this._prevOccupied[cam.id] = occupied;

        // ── Đọc input_text ai_result_entity (blueprint ghi sau mỗi lần motion) ──
        // Ưu tiên: input_text entity (luôn mới nhất) > aiCache (localStorage)
        const aiTextId  = cam.ai_result_entity || `input_text.${cam.id}_ai_result`;
        const aiTextSt  = states[aiTextId];
        let aiData      = this._aiCache[cam.id] || {};

        if (aiTextSt && aiTextSt.state && aiTextSt.state !== 'unknown' && aiTextSt.state !== 'unavailable') {
          try {
            const parsed    = JSON.parse(aiTextSt.state);
            const entTs     = aiTextSt.last_changed
              ? new Date(aiTextSt.last_changed).getTime()
              : 0;
            const cacheTs   = aiData.rawTime || 0;

            // Chỉ cập nhật cache khi entity mới hơn (tránh ghi đè khi đang poll)
            if (entTs > cacheTs || aiData.status !== 'done') {
              // Cache-bust thumbnail bằng last_changed của entity (không phải Date.now())
              // → đảm bảo URL thay đổi khi blueprint ghi ảnh mới dù filename giống cũ
              let snapUrl = parsed.snap || null;
              if (snapUrl) {
                const sep = snapUrl.includes('?') ? '&' : '?';
                snapUrl   = `${snapUrl}${sep}_cb=${entTs}`;
              }

              const timeFromJson = parsed.time || null; // "HH:MM DD/MM" từ blueprint
              const timeDisp     = timeFromJson
                || (entTs ? new Date(entTs).toLocaleString('vi-VN', {
                    day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'
                  }) : '--');

              const newData = {
                status:   'done',
                count:    parseInt(parsed.count ?? 0) || 0,
                desc:     parsed.desc || '',
                thumbUrl: snapUrl,
                time:     timeDisp,
                rawTime:  entTs,
              };

              // Hợp nhất vào cache và persist
              this._aiCache[cam.id] = newData;
              aiData = newData;
              this._saveCache();
            }
          } catch (_) {
            // JSON parse lỗi — giữ aiCache cũ
          }
        }

        const thumbUrl = aiData.thumbUrl || null;
        const timeStr  = aiData.time || (camState.last_changed
          ? new Date(camState.last_changed).getTime()
            ? new Date(camState.last_changed).toLocaleString('vi-VN', {
                day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'
              })
            : '--'
          : '--');

        events.push({
          id:         cameraEnt,
          camId:      cam.id,
          cam:        cam.name,
          label:      'manual',
          time:       timeStr,
          rawTime:    aiData.rawTime || new Date(camState.last_changed || 0).getTime(),
          score:      null,
          hasSnap:    !!thumbUrl,
          thumbUrl,
          occupied,
          count,
          lastCount,
          isManual:   true,
          aiStatus:   aiData.status ?? null,
          aiDesc:     aiData.desc   ?? '',
          aiCount:    aiData.count  ?? null,
          aiTime:     aiData.time   ?? '',
        });

      } else {
        // ── Frigate mode (default) ───────────────────────────────────────
        const imgId    = `image.${cam.id}_person`;
        const imgState = states[imgId];

        const slug     = cam.ha_slug || cam.id.replace(/^camera_/, '');
        const cntState = states[`sensor.${slug}_person_count`]
                      || states[`sensor.${cam.id}_person_count`];
        const occState = states[`binary_sensor.${slug}_person_occupancy`]
                      || states[`binary_sensor.${cam.id}_person_occupancy`];

        if (!imgState) continue;

        const isUnavail = imgState.state === 'unavailable' || imgState.state === 'unknown';
        if (isUnavail) { errorCount++; continue; }

        const rawPic = imgState.attributes?.entity_picture || null;
        const pic    = this._thumbWithBust(rawPic, imgState);

        const picTs   = this._tsFromPicUrl(pic);
        const rawTime = picTs
          ? picTs * 1000
          : imgState.last_changed
            ? new Date(imgState.last_changed).getTime()
            : imgState.last_updated
              ? new Date(imgState.last_updated).getTime()
              : 0;

        const timeStr = rawTime
          ? new Date(rawTime).toLocaleString('vi-VN', {
              day: '2-digit', month: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            })
          : '--';

        const count = cntState ? (parseInt(cntState.state) || 0) : 0;
        const cacheKey = `_lastCount_${cam.id}`;
        if (count > 0) this[cacheKey] = count;
        const lastCount = this[cacheKey] || 0;

        events.push({
          id:       imgId,
          camId:    cam.id,
          cam:      cam.name,
          label:    'person',
          time:     timeStr,
          rawTime,
          score:    null,
          hasSnap:  !!rawPic,
          thumbUrl: pic,
          occupied: occState ? occState.state === 'on' : false,
          count,
          lastCount,
        });
      }
    }

    events.sort((a, b) => {
      if (a.occupied !== b.occupied) return a.occupied ? -1 : 1;
      return b.rawTime - a.rawTime;
    });

    this._events = events;
    // FIX: _error is now actually set when something is wrong
    this._error = errorCount > 0 && events.length === 0
      ? `${errorCount} camera entity không khả dụng (unavailable)`
      : null;
    this._renderEventList();
  }

  // ── Render event list ─────────────────────────────────────────────────────
  _renderEventList() {
    const badge  = this.shadowRoot.querySelector('#ev-badge');
    const total  = this.shadowRoot.querySelector('#ev-total');
    const errBar = this.shadowRoot.querySelector('#err-bar');
    if (badge)  badge.textContent = `${this._events.length} events`;
    if (total)  total.textContent = this._events.length;
    if (errBar) errBar.innerHTML  = this._error
      ? `<div class="err-bar" title="${this._error}">⚠ ${this._error.length > 120 ? this._error.substring(0, 120) + '…' : this._error}</div>`
      : '';

    const listEl = this.shadowRoot.querySelector('#ev-list');
    if (!listEl) return;

    if (!this._events.length) {
      listEl.innerHTML = `<div class="ev-empty">${IC.ghost}<span class="ev-empty-text">${this._error ? _cT('ev_error') : _cT('ev_empty')}</span></div>`;
      return;
    }

    // FIX: Smart diff — tránh xóa/tạo lại DOM (và img) không cần thiết mỗi lần hass update.
    // Chỉ full-rebuild khi danh sách camera thay đổi (số lượng / thứ tự / id khác).
    // Key chỉ dựa vào id — dùng để detect camera mới thêm/xoá/đổi thứ tự
    const newIds = this._events.map(ev => ev.id).join(',');
    const needFullRebuild = listEl.dataset.evIds !== newIds;

    if (needFullRebuild) {
      // Full rebuild — số lượng / thứ tự camera thay đổi
      const rows = this._events.map(ev => this._buildRow(ev)).join('');
      listEl.innerHTML = rows;
      listEl.dataset.evIds = newIds;
      this._bindRowClicks(listEl);
    } else {
      // Patch từng row — không xóa DOM, chỉ cập nhật những gì thay đổi
      this._events.forEach(ev => {
        const row = listEl.querySelector(`[data-evid="${ev.id}"]`);
        if (!row) return;

        // motion class
        row.classList.toggle('motion-active', ev.occupied);

        // time text
        const timeEl = row.querySelector('.ev-time-val');
        if (timeEl) timeEl.textContent = `${_cT('ev_updated')} ${ev.time}`;

        // count
        const countEl = row.querySelector('.ev-count-val');
        if (countEl) {
          const label = ev.count > 0 ? _cT('ev_person_count',{n:ev.count}) : (ev.lastCount > 0 ? _cT('ev_person_count',{n:ev.lastCount}) : _cT('ev_person'));
          countEl.textContent = label;
        }

        // action badge
        const badgeEl = row.querySelector('.ev-action-badge');
        if (badgeEl) {
          badgeEl.textContent = ev.occupied ? _cT('ev_motion') : _cT('ev_clear');
          badgeEl.style.color = ev.occupied ? '#4ade80' : 'rgba(148,163,184,.4)';
        }

        // Thumbnail: nếu URL mới → rebuild phần thumb để load ảnh mới
        const prevThumb = row.dataset.thumb || '';
        const newThumb  = ev.thumbUrl || '';
        if (newThumb && prevThumb !== newThumb) {
          const thumbDiv = row.querySelector('.ev-thumb');
          if (thumbDiv) {
            thumbDiv.innerHTML = `<img src="${newThumb}" alt="" onerror="this.style.display='none'">`;
          }
        }

        // AI bar patch (manual mode)
        if (ev.isManual) {
          const bodyEl = row.querySelector('.ev-body');
          let aiBar = row.querySelector('.ai-bar');
          let newAiHtml = '';
          if (ev.aiStatus === 'analyzing') {
            newAiHtml = `<div class="ai-bar ai-analyzing"><span class="ai-spinner"></span><span>Đang phân tích ảnh…</span></div>`;
          } else if (ev.aiStatus === 'done' && ev.aiDesc) {
            newAiHtml = `<div class="ai-bar ai-done"><span class="ai-icon">🤖</span><span class="ai-desc-val">${ev.aiDesc}</span></div>`;
          } else if (ev.aiStatus === 'error') {
            newAiHtml = `<div class="ai-bar ai-error"><span>⚠ ${ev.aiDesc || 'AI lỗi'}</span></div>`;
          } else if (ev.aiStatus === 'snap_only') {
            newAiHtml = `<div class="ai-bar ai-snap"><span>📸 Đã chụp ảnh (chưa cấu hình AI)</span></div>`;
          }
          if (aiBar) aiBar.outerHTML = newAiHtml || '';
          else if (newAiHtml && bodyEl) bodyEl.insertAdjacentHTML('beforeend', newAiHtml);

          // Update time nếu có aiTime
          if (ev.aiTime) {
            const timeEl2 = row.querySelector('.ev-time-val');
            if (timeEl2) timeEl2.textContent = `${_cT('ev_updated')} ${ev.aiTime}`;
          }

          // Update count nếu AI count có
          if (ev.aiCount != null) {
            const countEl2 = row.querySelector('.ev-count-val');
            if (countEl2) countEl2.textContent = ev.aiCount > 0 ? _cT('ev_person_count',{n:ev.aiCount}) : _cT('ev_person');
          }
        }

        // sync data attributes cho lightbox
        row.dataset.thumb = newThumb;
        row.dataset.time  = ev.aiTime || ev.time;
      });
    }
  }

  _buildRow(ev) {
    const thumb = ev.hasSnap && ev.thumbUrl
      ? `<img src="${ev.thumbUrl}" alt="" onerror="this.style.display='none'">`
      : `<div style="opacity:.15;display:flex;align-items:center;justify-content:center;width:100%;height:100%">${IC.ghost}</div>`;
    const actionBadge = ev.occupied
      ? `<span class="ev-action-badge" style="font-size:9px;font-family:'Space Mono',monospace;color:#4ade80;letter-spacing:1px">${_cT('ev_motion')}</span>`
      : `<span class="ev-action-badge" style="font-size:9px;font-family:'Space Mono',monospace;color:rgba(148,163,184,.4);letter-spacing:1px">${_cT('ev_clear')}</span>`;

    // Count: ưu tiên AI count nếu có, fallback sensor count
    const displayCount = ev.aiCount != null ? ev.aiCount : (ev.count || ev.lastCount || 0);
    const countLabel   = displayCount > 0
      ? _cT('ev_person_count', {n: displayCount})
      : _cT('ev_person');

    // AI status indicator + description (chỉ manual mode)
    let aiBar = '';
    if (ev.isManual) {
      if (ev.aiStatus === 'analyzing') {
        aiBar = `<div class="ai-bar ai-analyzing">
          <span class="ai-spinner"></span>
          <span>Đang phân tích ảnh…</span>
        </div>`;
      } else if (ev.aiStatus === 'done' && ev.aiDesc) {
        aiBar = `<div class="ai-bar ai-done">
          <span class="ai-icon">🤖</span>
          <span class="ai-desc-val">${ev.aiDesc}</span>
        </div>`;
      } else if (ev.aiStatus === 'error') {
        aiBar = `<div class="ai-bar ai-error">
          <span>⚠ ${ev.aiDesc || 'AI lỗi'}</span>
        </div>`;
      } else if (ev.aiStatus === 'snap_only') {
        aiBar = `<div class="ai-bar ai-snap">
          <span>📸 Đã chụp ảnh (chưa cấu hình AI)</span>
        </div>`;
      }
    }

    return `
      <div class="ev-row${ev.occupied ? ' motion-active' : ''}${ev.isManual ? ' ev-manual' : ''}" data-evid="${ev.id}" data-camid="${ev.camId}" data-thumb="${ev.thumbUrl || ''}" data-camname="${ev.cam}" data-time="${ev.time}" data-aidesc="${(ev.aiDesc||'').replace(/"/g,'&quot;')}" data-aicount="${ev.aiCount ?? ''}" style="cursor:pointer">
        <div class="ev-thumb">${thumb}</div>
        <div class="ev-body" style="flex:1;min-width:0">
          <div class="ev-cam-name">${ev.cam}${ev.isManual ? ' <span style="font-size:8px;background:rgba(251,146,60,.2);color:#f97316;border-radius:3px;padding:1px 4px;vertical-align:middle">ONVIF</span>' : ''}</div>
          <div class="ev-time ev-time-val">${_cT('ev_updated')} ${ev.aiTime || ev.time}</div>
          ${aiBar}
        </div>
        <div class="ev-right">
          <span class="ev-chip chip-person ev-count-val">${countLabel}</span>
        </div>
        ${actionBadge}
      </div>`;
  }

  _bindRowClicks(listEl) {
    listEl.querySelectorAll('.ev-row').forEach(row => {
      row.addEventListener('click', () => {
        const camId   = row.dataset.camid;
        const thumb   = row.dataset.thumb;
        const camName = row.dataset.camname;
        const time    = row.dataset.time;
        const aiDesc  = row.dataset.aidesc  || '';
        const aiCount = row.dataset.aicount !== '' ? parseInt(row.dataset.aicount) : null;
        if (thumb) this._openLightbox(thumb, camName, time, camId, aiDesc, aiCount);
        else if (camId) window.open(`${this._frigateUrl}/cameras/${camId}`, '_blank');
      });
    });
  }

  _openLightbox(thumbUrl, camName, time, camId, aiDesc, aiCount) {
    const lb   = this.shadowRoot.querySelector('#lb');
    const img  = this.shadowRoot.querySelector('#lb-img');
    const info = this.shadowRoot.querySelector('#lb-info');
    if (!lb || !img) return;
    img.src      = thumbUrl;
    if (info) info.textContent = `${camName}  ·  ${time}`;
    lb.dataset.camid = camId || '';

    // AI description panel
    let aiEl = lb.querySelector('.lb-ai');
    if (aiDesc) {
      const countLine = (aiCount != null && aiCount >= 0)
        ? `<div class="lb-ai-count">👤 ${aiCount > 0 ? aiCount + ' người' : 'Không có người'}</div>`
        : '';
      const html = `<div class="lb-ai"><span class="lb-ai-icon">🤖</span><div class="lb-ai-body">${countLine}<div class="lb-ai-desc">${aiDesc}</div></div></div>`;
      if (aiEl) aiEl.outerHTML = html;
      else {
        // Insert before the Frigate button
        const btn = lb.querySelector('.lb-btn');
        if (btn) btn.insertAdjacentHTML('beforebegin', html);
      }
    } else {
      // No AI desc — remove panel if present
      if (aiEl) aiEl.remove();
    }

    lb.classList.add('open');
  }

  _closeLightbox() {
    const lb = this.shadowRoot.querySelector('#lb');
    if (lb) lb.classList.remove('open');
  }


}

if (!customElements.get('camera-events-card')) {
  customElements.define('camera-events-card', CameraEventsCard);
}
// ═══════════════════════════════════════════════════════════════════════════════
//  i18n
// ═══════════════════════════════════════════════════════════════════════════════
function _cecGetLang() { try { return localStorage.getItem('cec_lang') || 'en'; } catch { return 'en'; } }
function _cecSetLang(l) { try { localStorage.setItem('cec_lang', l); } catch {} }

const CEC_I18N = {
  vi: {
    card_title:       'Camera Events Card v1.0',
    card_desc:        'Camera realtime + Frigate events từ HA states',
    sec_appearance:   '🎨 Giao diện & Hiển thị',
    sec_cameras:      '📷 Danh sách camera',
    lbl_lang:         '🌐 Ngôn ngữ',
    lbl_theme:        '🌓 Chủ đề',
    lbl_theme_dark:   '🌙 Dark',
    lbl_theme_light:  '☀️ Light',
    lbl_opacity:      '🪟 Độ trong suốt',
    lbl_blur:         '✨ Độ mờ nền (blur)',
    hint_opacity:     '0 = trong suốt · 0.6 = mờ đục',
    hint_blur:        '0px = không mờ · 20px = mờ tối đa',
    lbl_frigate:      'Frigate URL',
    lbl_title:        'Tiêu đề card',
    lbl_cam_id:       'Camera ID (Frigate)',
    lbl_cam_entity:   'Entity HA',
    lbl_cam_name:     'Tên hiển thị',
    lbl_cam_icon:     'Icon (MDI)',
    btn_add_cam:      '➕ Thêm camera',
    btn_del_cam:      '🗑️',
    btn_move_up:      '↑',
    btn_move_down:    '↓',
    lbl_lang_vi:      '🇻🇳 Tiếng Việt',
    lbl_lang_en:      '🇬🇧 English',
    lbl_lang_sl:      '🇸🇮 Slovenščina',
    no_cameras:       '(Chưa có camera nào)',
    tip:              '💡 <strong>Mẹo:</strong> Bấm <strong>LƯU</strong> sau khi chỉnh xong. YAML: <code>type: custom:camera-events-card</code>',
    // card UI strings
    hdr_sub:          '{n} camera · Frigate NVR',
    lbl_online:       'ONLINE',
    lbl_live:         '● LIVE',
    lbl_webrtc:       'WebRTC / HLS',
    lbl_frigate_ui:   'Frigate UI',
    lbl_go2rtc:       'go2rtc Player',
    panel_events:     'Sự kiện gần đây',
    ev_loading:       'Đang tải…',
    ev_empty:         'Chưa có sự kiện',
    ev_error:         'Lỗi tải events',
    ev_updated:       'Cập nhật:',
    ev_person:        'Người',
    ev_person_count:  '{n} người',
    ev_motion:        '● MOTION',
    ev_clear:         '○ CLEAR',
    footer_cams:      'Cameras',
    footer_events:    'Events',
    footer_theme:     'Theme',
    lb_open_frigate:  'Mở Frigate',
    cam_name_ph:          'Cổng Chính',
    lbl_source_mode:      'Nguồn dữ liệu snapshot',
    lbl_snapshot_entity:  'Entity snapshot (camera / image)',
    hint_snapshot_entity: 'Dùng entity_picture của entity này làm ảnh thumbnail',
    lbl_occupancy_entity: 'Cảm biến có người (binary_sensor)',
    hint_occupancy_entity:'VD: binary_sensor.phong_khach_occupancy',
    lbl_count_entity:     'Cảm biến đếm người (sensor)',
    hint_count_entity:    'VD: sensor.phong_khach_person_count',
  },
  en: {
    card_title:       'Camera Events Card v1.0',
    card_desc:        'Realtime camera + Frigate events from HA states',
    sec_appearance:   '🎨 Appearance & Display',
    sec_cameras:      '📷 Camera list',
    lbl_lang:         '🌐 Language',
    lbl_theme:        '🌓 Theme',
    lbl_theme_dark:   '🌙 Dark',
    lbl_theme_light:  '☀️ Light',
    lbl_opacity:      '🪟 Tile opacity',
    lbl_blur:         '✨ Background blur',
    hint_opacity:     '0 = transparent · 0.6 = opaque',
    hint_blur:        '0px = no blur · 20px = max blur',
    lbl_frigate:      'Frigate URL',
    lbl_title:        'Card title',
    lbl_cam_id:       'Camera ID (Frigate)',
    lbl_cam_entity:   'HA Entity',
    lbl_cam_name:     'Display name',
    lbl_cam_icon:     'Icon (MDI)',
    btn_add_cam:      '➕ Add camera',
    btn_del_cam:      '🗑️',
    btn_move_up:      '↑',
    btn_move_down:    '↓',
    lbl_lang_vi:      '🇻🇳 Tiếng Việt',
    lbl_lang_en:      '🇬🇧 English',
    lbl_lang_sl:      '🇸🇮 Slovenščina',
    no_cameras:       '(No cameras yet)',
    tip:              '💡 <strong>Tip:</strong> Click <strong>SAVE</strong> after editing. YAML: <code>type: custom:camera-events-card</code>',
    // card UI strings
    hdr_sub:          '{n} cameras · Frigate NVR',
    lbl_online:       'ONLINE',
    lbl_live:         '● LIVE',
    lbl_webrtc:       'WebRTC / HLS',
    lbl_frigate_ui:   'Frigate UI',
    lbl_go2rtc:       'go2rtc Player',
    panel_events:     'Recent events',
    ev_loading:       'Loading…',
    ev_empty:         'No events yet',
    ev_error:         'Error loading events',
    ev_updated:       'Updated:',
    ev_person:        'Person',
    ev_person_count:  '{n} people',
    ev_motion:        '● MOTION',
    ev_clear:         '○ CLEAR',
    footer_cams:      'Cameras',
    footer_events:    'Events',
    footer_theme:     'Theme',
    lb_open_frigate:  'Open Frigate',
    cam_name_ph:          'Main Gate',
    lbl_source_mode:      'Snapshot source',
    lbl_snapshot_entity:  'Snapshot entity (camera / image)',
    hint_snapshot_entity: 'Uses entity_picture from this entity as thumbnail',
    lbl_occupancy_entity: 'Occupancy sensor (binary_sensor, optional)',
    hint_occupancy_entity:'e.g. binary_sensor.living_room_occupancy',
    lbl_count_entity:     'Person count sensor (sensor, optional)',
    hint_count_entity:    'e.g. sensor.living_room_person_count',
  },
  sl: {
    card_title:       'Kartica Kamer in Dogodkov v1.0',
    card_desc:        'Kamera v realnem času + dogodki Frigate iz stanj HA',
    sec_appearance:   '🎨 Videz & Prikaz',
    sec_cameras:      '📷 Seznam kamer',
    lbl_lang:         '🌐 Jezik',
    lbl_theme:        '🌓 Tema',
    lbl_theme_dark:   '🌙 Temna',
    lbl_theme_light:  '☀️ Svetla',
    lbl_opacity:      '🪟 Prosojnost ploščice',
    lbl_blur:         '✨ Zamegljenost ozadja',
    hint_opacity:     '0 = prosojno · 0.6 = neprosojno',
    hint_blur:        '0px = brez zameglitve · 20px = max zameglitev',
    lbl_frigate:      'Frigate URL',
    lbl_title:        'Naslov kartice',
    lbl_cam_id:       'ID kamere (Frigate)',
    lbl_cam_entity:   'Entiteta HA',
    lbl_cam_name:     'Prikazno ime',
    lbl_cam_icon:     'Ikona (MDI)',
    btn_add_cam:      '➕ Dodaj kamero',
    btn_del_cam:      '🗑️',
    btn_move_up:      '↑',
    btn_move_down:    '↓',
    lbl_lang_vi:      '🇻🇳 Tiếng Việt',
    lbl_lang_en:      '🇬🇧 English',
    lbl_lang_sl:      '🇸🇮 Slovenščina',
    no_cameras:       '(Ni kamer)',
    tip:              '💡 <strong>Namig:</strong> Kliknite <strong>SHRANI</strong> po urejanju. YAML: <code>type: custom:camera-events-card</code>',
    // card UI strings
    hdr_sub:          '{n} kamer · Frigate NVR',
    lbl_online:       'V ŽIVO',
    lbl_live:         '● V ŽIVO',
    lbl_webrtc:       'WebRTC / HLS',
    lbl_frigate_ui:   'Frigate UI',
    lbl_go2rtc:       'go2rtc Predvajalnik',
    panel_events:     'Nedavni dogodki',
    ev_loading:       'Nalaganje…',
    ev_empty:         'Ni dogodkov',
    ev_error:         'Napaka pri nalaganju',
    ev_updated:       'Posodobljeno:',
    ev_person:        'Oseba',
    ev_person_count:  '{n} osebi',
    ev_motion:        '● GIBANJE',
    ev_clear:         '○ PROSTO',
    footer_cams:      'Kamere',
    footer_events:    'Dogodki',
    footer_theme:     'Tema',
    lb_open_frigate:  'Odpri Frigate',
    cam_name_ph:          'Glavni vhod',
    lbl_source_mode:      'Vir posnetkov',
    lbl_snapshot_entity:  'Entiteta posnetka (camera / image)',
    hint_snapshot_entity: 'Uporablja entity_picture te entitete kot sličico',
    lbl_occupancy_entity: 'Senzor prisotnosti (binary_sensor, neobvezno)',
    hint_occupancy_entity:'npr. binary_sensor.dnevna_soba_zasedenost',
    lbl_count_entity:     'Senzor štetja oseb (sensor, neobvezno)',
    hint_count_entity:    'npr. sensor.dnevna_soba_stevilo_oseb',
  },
};

function _cT(k, vars) {
  const d = CEC_I18N[_cecGetLang()] || CEC_I18N['en'];
  let s = d[k] ?? CEC_I18N['en'][k] ?? CEC_I18N['vi'][k] ?? k;
  if (vars) Object.entries(vars).forEach(([k2,v]) => { s = s.replace('{'+k2+'}', v); });
  return s;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Visual Editor — Lit Element (fixes race condition với ha-entity-picker)
//
//  Thay thế toàn bộ class CameraEventsCardEditor (HTMLElement + innerHTML)
//  bằng LitElement để:
//    1. Property binding (.hass=${x}) — không cần querySelectorAll thủ công
//    2. Reactive re-render — Lit tự cập nhật picker khi hass/config thay đổi
//    3. customElements.whenDefined() — Lit xử lý nội bộ, không race condition
//    4. Giữ nguyên 100% logic: i18n, accordion, source_mode, move/del, debounce
// ═══════════════════════════════════════════════════════════════════════════════

// ── Shared editor CSS ──────────────────────────────────────────────────────────
const EDITOR_CSS = `
  :host{display:block;padding:4px 0;font-family:-apple-system,'Segoe UI',sans-serif}
  *{box-sizing:border-box}
  .acc-wrap{border:1px solid var(--divider-color,#e0e0e0);border-radius:12px;margin-bottom:8px;overflow:hidden}
  .acc-head{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;cursor:pointer;
    background:var(--secondary-background-color,#f5f5f5);font-size:13px;font-weight:700;
    color:var(--primary-text-color,#111);user-select:none;transition:background .15s}
  .acc-head:hover{background:rgba(0,0,0,.05)}
  .acc-arrow{font-size:14px;color:var(--secondary-text-color,#888)}
  .acc-body{padding:14px;border-top:1px solid var(--divider-color,#e0e0e0);background:var(--card-background-color,#fff)}
  .row{display:flex;flex-direction:column;margin-bottom:12px}
  .row:last-child{margin-bottom:0}
  .row label{font-size:11.5px;color:var(--secondary-text-color,#666);margin-bottom:4px;font-weight:600}
  .sl-row{display:flex;align-items:center;gap:10px;margin-bottom:12px}
  .sl-row label{font-size:11.5px;font-weight:600;color:var(--secondary-text-color,#666);min-width:140px;flex-shrink:0}
  .sl-row input[type=range]{flex:1;accent-color:var(--primary-color,#03a9f4)}
  .slv{font-size:12px;font-weight:700;color:var(--primary-color,#03a9f4);min-width:42px;text-align:right}
  .hint{font-size:11px;color:var(--secondary-text-color,#999);margin-top:3px;line-height:1.5}
  .divider{height:1px;background:var(--divider-color,#e0e0e0);margin:10px 0}
  .bg{display:flex;gap:6px;flex-wrap:wrap}
  .ob{flex:1;min-width:56px;padding:7px 6px;border-radius:8px;border:1.5px solid var(--divider-color,#ddd);
    background:var(--secondary-background-color,#f5f5f5);cursor:pointer;text-align:center;
    font-size:12px;color:var(--primary-text-color,#111);transition:all .18s;user-select:none}
  .ob.on{border-color:var(--primary-color,#03a9f4);background:rgba(3,169,244,.13);color:var(--primary-color,#03a9f4);font-weight:700}
  .ob:hover{background:rgba(3,169,244,.07)}
  input[type=text]{background:var(--input-fill-color,rgba(0,0,0,.04));border:1px solid var(--divider-color,#ddd);
    border-radius:8px;padding:7px 10px;font-size:12px;color:var(--primary-text-color,#111);font-family:inherit;width:100%}
  .cam-card{border:1px solid var(--divider-color,#e0e0e0);border-radius:10px;margin-bottom:10px;overflow:hidden}
  .cam-head{display:flex;align-items:center;gap:8px;padding:10px 12px;
    background:var(--secondary-background-color,#f5f5f5);cursor:pointer;user-select:none}
  .cam-head-label{flex:1;font-size:12.5px;font-weight:700;color:var(--primary-text-color,#111)}
  .cam-body{padding:12px;border-top:1px solid var(--divider-color,#e0e0e0);background:var(--card-background-color,#fff)}
  .cam-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px}
  .btn-del{flex-shrink:0;background:rgba(220,50,50,.11);border:1px solid rgba(220,50,50,.28);
    color:#c44;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px;font-weight:700;transition:all .15s}
  .btn-del:hover{background:rgba(220,50,50,.24)}
  .btn-move{flex-shrink:0;background:rgba(80,80,80,.08);border:1px solid rgba(120,120,120,.22);
    color:var(--secondary-text-color,#666);border-radius:6px;padding:4px 7px;cursor:pointer;font-size:13px;line-height:1;transition:all .15s}
  .btn-move:hover{background:rgba(3,169,244,.14);border-color:rgba(3,169,244,.4);color:var(--primary-color,#03a9f4)}
  .btn-add-cam{display:flex;align-items:center;gap:6px;background:rgba(3,169,244,.07);
    border:1.5px dashed rgba(3,169,244,.38);color:var(--primary-color,#03a9f4);border-radius:10px;
    padding:10px 14px;cursor:pointer;font-size:12.5px;font-weight:600;width:100%;justify-content:center;
    margin-top:8px;transition:all .15s}
  .btn-add-cam:hover{background:rgba(3,169,244,.18)}
  .sec-label{display:inline-block;background:rgba(3,169,244,.13);color:var(--primary-color,#03a9f4);
    border-radius:6px;padding:2px 8px;font-size:10.5px;font-weight:700;margin-bottom:8px}
  .tip-box{margin:8px 0 4px;padding:10px 12px;background:var(--secondary-background-color,#f5f5f5);
    border-radius:8px;border:1px solid var(--divider-color,#ddd);font-size:11px;color:var(--secondary-text-color,#666);line-height:1.6}
  code{background:rgba(0,0,0,.07);border-radius:4px;padding:1px 5px;font-size:10.5px}
  .ent-badge{display:inline-block;font-size:9px;padding:1px 5px;border-radius:4px;
    margin-left:4px;background:rgba(3,169,244,.12);color:var(--primary-color,#03a9f4);vertical-align:middle}
  .src-toggle{display:flex;gap:0;border-radius:8px;overflow:hidden;border:1.5px solid var(--divider-color,#ddd);margin-bottom:10px}
  .src-btn{flex:1;padding:7px 6px;text-align:center;font-size:11.5px;font-weight:600;cursor:pointer;
    background:var(--secondary-background-color,#f5f5f5);color:var(--secondary-text-color,#666);
    border:none;transition:all .15s;line-height:1.4}
  .src-btn.on{background:var(--primary-color,#03a9f4);color:#fff}
  .src-btn:first-child{border-right:1.5px solid var(--divider-color,#ddd)}
  .manual-fields{background:rgba(3,169,244,.04);border:1px solid rgba(3,169,244,.18);
    border-radius:8px;padding:10px;margin-top:8px;display:flex;flex-direction:column;gap:8px}
  .manual-fields .row{margin-bottom:0}
  .field-hint{font-size:10px;color:var(--secondary-text-color,#999);margin-top:2px;line-height:1.4}
  ha-entity-picker{display:block;width:100%}
  ha-icon-picker{display:block;flex:1;min-width:0}
`;

// ── Lit-based Editor ───────────────────────────────────────────────────────────
class CameraEventsCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config    = {};
    this._hass      = null;
    this._open      = {};        // accordion open state: { appearance, cameras, 'cam-0', ... }
    this._fireTimer = null;
  }

  // ── HA lifecycle ──────────────────────────────────────────────────────────
  setConfig(cfg) {
    this._config = JSON.parse(JSON.stringify(cfg));
    this._scheduleRender();
  }

  set hass(h) {
    this._hass = h;
    // Push hass vào tất cả picker đã render — đây là "recovery" path
    // khi picker được upgrade muộn hơn lần set đầu tiên
    this._pushHassToAllPickers();
  }

  // ── Internal helpers ──────────────────────────────────────────────────────
  _fire() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this._config }, bubbles: true, composed: true,
    }));
  }

  _fireDebounced() {
    clearTimeout(this._fireTimer);
    this._fireTimer = setTimeout(() => this._fire(), 350);
  }

  _getCameras() {
    return this._config.cameras
      ? JSON.parse(JSON.stringify(this._config.cameras))
      : JSON.parse(JSON.stringify(DEFAULT_CAMERAS));
  }

  // ── Schedule render ───────────────────────────────────────────────────────
  // Render skeleton synchronously so HA visual editor sees non-empty shadowRoot
  // immediately. Async content (pickers) fills in on next microtask.
  _scheduleRender() {
    // Always write skeleton CSS+structure synchronously on first call
    if (!this._skeletonWritten) {
      this._skeletonWritten = true;
      this.shadowRoot.innerHTML = `<style>${EDITOR_CSS}</style>
        <div style="padding:16px;font-size:12px;color:var(--secondary-text-color,#888);
          display:flex;align-items:center;gap:8px">
          <div style="width:16px;height:16px;border-radius:50%;border:2px solid var(--primary-color,#03a9f4);
            border-top-color:transparent;animation:_cespin .7s linear infinite"></div>
          Loading editor…
        </div>
        <style>@keyframes _cespin{to{transform:rotate(360deg)}}</style>`;
    }

    if (this._renderPending) return;
    this._renderPending = true;
    Promise.resolve().then(() => {
      this._renderPending = false;
      this._render();
    });
  }

  // ── Ensure ha-entity-picker & ha-icon-picker are defined before render ────
  async _ensurePickers() {
    // Only run once per editor instance
    if (this._pickersReady !== undefined) return;
    this._pickersReady = false; // mark in-progress so concurrent calls skip

    const needs = [];
    if (!customElements.get('ha-entity-picker')) needs.push('ha-entity-picker');
    if (!customElements.get('ha-icon-picker'))   needs.push('ha-icon-picker');

    if (needs.length) {
      // loadCardHelpers triggers HA to define pickers — may not exist on all installs
      if (window.loadCardHelpers) {
        try { await window.loadCardHelpers(); } catch (_) {}
      }

      // Wait for each picker with a 5s timeout.
      // On misconfigured HA (missing HACS resources, 404 JS files, no loadCardHelpers),
      // whenDefined() blocks forever — the timeout ensures editor always renders.
      const withTimeout = tag => Promise.race([
        customElements.whenDefined(tag),
        new Promise(r => setTimeout(r, 5000)), // give up after 5s
      ]).catch(() => {});

      await Promise.all(needs.map(withTimeout));
    }

    // Record which pickers actually loaded — used by _renderCamCard for fallback
    this._pickersReady    = !!customElements.get('ha-entity-picker');
    this._iconPickerReady = !!customElements.get('ha-icon-picker');
  }

  // ── Main render ───────────────────────────────────────────────────────────
  async _render() {
    // Ensure pickers are defined BEFORE writing innerHTML
    await this._ensurePickers();

    const cfg     = this._config;
    const cameras = this._getCameras();
    const lang    = _cecGetLang();
    const opacity = cfg.tile_opacity != null ? cfg.tile_opacity : 0.18;
    const blur    = cfg.tile_blur    != null ? cfg.tile_blur    : 12;
    const theme   = cfg.theme || 'dark';

    this.shadowRoot.innerHTML = `<style>${EDITOR_CSS}</style>

    <div style="text-align:center;padding:12px 14px 4px;font-size:11px;color:var(--secondary-text-color);line-height:1.7;">
      🖥️ <strong style="color:var(--primary-color)">camera-events-card v1.0</strong> — System Monitor Assistant<br/>
      Designed by <strong style="color:var(--primary-color)">@doanlong1412</strong> 🇻🇳
      &nbsp;&nbsp;
      <a href="https://www.paypal.com/paypalme/doanlong1412" target="_blank" rel="noopener"
        style="display:inline-flex;align-items:center;gap:5px;margin-top:6px;
               padding:5px 12px;border-radius:20px;text-decoration:none;font-size:11px;font-weight:700;
               background:linear-gradient(135deg,rgba(255,180,0,0.18),rgba(255,120,0,0.12));
               border:1px solid rgba(255,160,0,0.45);color:#ffb830;
               box-shadow:0 2px 8px rgba(255,150,0,0.15);transition:all 0.2s;cursor:pointer;"
      >☕ Buy me a coffee</a>
    </div>

    <!-- ══ APPEARANCE ══ -->
    <div class="acc-wrap">
      <div class="acc-head" id="head-appearance">
        <span>${_cT('sec_appearance')}</span>
        <span class="acc-arrow" id="arrow-appearance">${this._open.appearance ? '▾' : '▸'}</span>
      </div>
      <div class="acc-body" id="body-appearance" style="display:${this._open.appearance ? 'block' : 'none'}">

        <div class="row">
          <label>${_cT('lbl_lang')}</label>
          <div class="bg">
            <div class="ob${lang === 'vi' ? ' on' : ''}" data-lang="vi">${_cT('lbl_lang_vi')}</div>
            <div class="ob${lang === 'en' ? ' on' : ''}" data-lang="en">${_cT('lbl_lang_en')}</div>
            <div class="ob${lang === 'sl' ? ' on' : ''}" data-lang="sl">${_cT('lbl_lang_sl')}</div>
          </div>
        </div>
        <div class="divider"></div>

        <div class="row">
          <label>${_cT('lbl_theme')}</label>
          <div class="bg">
            <div class="ob${theme === 'dark'  ? ' on' : ''}" data-theme-val="dark">${_cT('lbl_theme_dark')}</div>
            <div class="ob${theme === 'light' ? ' on' : ''}" data-theme-val="light">${_cT('lbl_theme_light')}</div>
          </div>
        </div>
        <div class="divider"></div>

        <div class="row">
          <label>${_cT('lbl_title')}</label>
          <input type="text" id="titleInp" value="${cfg.title || 'Camera & Events'}" placeholder="Camera & Events"/>
        </div>
        <div class="divider"></div>

        <div class="sl-row">
          <label>${_cT('lbl_opacity')}</label>
          <input type="range" id="opacitySl" min="0" max="0.6" step="0.01" value="${opacity}"/>
          <span class="slv" id="opacityV">${parseFloat(opacity).toFixed(2)}</span>
        </div>
        <div class="hint" style="margin-top:-8px;margin-bottom:12px">${_cT('hint_opacity')}</div>

        <div class="sl-row">
          <label>${_cT('lbl_blur')}</label>
          <input type="range" id="blurSl" min="0" max="20" step="1" value="${blur}"/>
          <span class="slv" id="blurV">${blur}px</span>
        </div>
        <div class="hint" style="margin-top:-8px;margin-bottom:12px">${_cT('hint_blur')}</div>

        <div class="row">
          <label>${_cT('lbl_frigate')}</label>
          <input type="text" id="frigateInp" value="${cfg.frigate_url || DEFAULT_FRIGATE_URL}" placeholder="http://192.168.10.10:5000"/>
        </div>
      </div>
    </div>

    <!-- ══ CAMERAS ══ -->
    <div class="acc-wrap">
      <div class="acc-head" id="head-cameras">
        <span>${_cT('sec_cameras')}</span>
        <span class="acc-arrow" id="arrow-cameras">${this._open.cameras ? '▾' : '▸'}</span>
      </div>
      <div class="acc-body" id="body-cameras" style="display:${this._open.cameras ? 'block' : 'none'}">
        <div id="cameras-list">
          ${cameras.length === 0
            ? `<div style="font-size:12px;color:var(--secondary-text-color,#999);text-align:center;padding:12px">${_cT('no_cameras')}</div>`
            : cameras.map((cam, ci) => this._renderCamCard(cam, ci)).join('')}
        </div>
        <button class="btn-add-cam" id="btn-add-cam">${_cT('btn_add_cam')}</button>
      </div>
    </div>

    <div class="tip-box">${_cT('tip')}</div>`;

    // Wire all event listeners, then set picker properties
    this._wireAll();

    // Delay one microtask so browser upgrades custom elements,
    // then push hass + values to all pickers
    await Promise.resolve();
    this._pushHassToAllPickers();
    this._applyAllPickerValues();
  }

  // ── Push hass to every picker (called on set hass AND after render) ────────
  _pushHassToAllPickers() {
    if (!this._hass) return;
    this.shadowRoot.querySelectorAll('ha-entity-picker,ha-icon-picker').forEach(el => {
      el.hass = this._hass;
    });
    // ha-selector fallback also needs hass
    this.shadowRoot.querySelectorAll('ha-selector[data-fallback="selector"]').forEach(el => {
      el.hass = this._hass;
    });
  }

  // ── Set .value on all entity + icon pickers ───────────────────────────────
  _applyAllPickerValues() {
    const cameras = this._getCameras();

    // ── ha-entity-picker (tier 1) ─────────────────────────────────────────
    this.shadowRoot.querySelectorAll('ha-entity-picker').forEach(picker => {
      const ci    = parseInt(picker.dataset.ci);
      const field = picker.dataset.field;
      const cam   = cameras[ci];
      if (!cam) return;
      if (this._hass) picker.hass = this._hass;

      let val = '';
      if (field === 'id') {
        val = cam.id ? 'camera.' + cam.id : '';
      } else if (field === 'ai_result_entity') {
        val = cam.ai_result_entity || (cam.id ? `input_text.${cam.id}_ai_result` : '');
      } else {
        val = cam[field] || '';
      }
      if (picker.value !== val) picker.value = val;
    });

    // ── ha-selector fallback (tier 2) ─────────────────────────────────────
    // ha-selector needs .hass and .selector = {entity:{domain:[]}} as JS props
    // and fires 'value-changed' with e.detail.value just like ha-entity-picker
    this.shadowRoot.querySelectorAll('ha-selector[data-fallback="selector"]').forEach(sel => {
      const ci     = parseInt(sel.dataset.ci);
      const field  = sel.dataset.field;
      const domain = sel.dataset.selectorDomain || null;
      const cam    = cameras[ci];
      if (!cam) return;

      // Push hass
      if (this._hass) sel.hass = this._hass;

      // Build selector config
      const selectorConfig = domain
        ? { entity: { domain } }
        : { entity: {} };
      sel.selector = selectorConfig;

      // Set current value
      let val = '';
      if (field === 'id')                    val = cam.id ? 'camera.' + cam.id : '';
      else if (field === 'ai_result_entity') val = cam.ai_result_entity || (cam.id ? `input_text.${cam.id}_ai_result` : '');
      else                                   val = cam[field] || '';
      if (sel.value !== val) sel.value = val;
    });

    // ── ha-icon-picker ────────────────────────────────────────────────────
    this.shadowRoot.querySelectorAll('ha-icon-picker').forEach(picker => {
      const ci  = parseInt(picker.dataset.ci);
      const cam = cameras[ci];
      if (!cam) return;
      if (picker.value !== (cam.icon || '')) picker.value = cam.icon || '';
    });
  }

  // ── Render a single camera card (returns HTML string) ─────────────────────
  _renderCamCard(cam, ci) {
    const open     = !!this._open[`cam-${ci}`];
    const isManual = (cam.source_mode || 'frigate') === 'manual';

    // _picker priority:
    //   1. ha-entity-picker  — best UX, but may not load if HACS resources are 404
    //   2. ha-selector       — always defined in HA, has autocomplete + domain filter
    //   3. <input type=text> — last resort, always works
    const _hasSelectorReady = !!customElements.get('ha-selector');
    const _picker = (field, domains) => {
      if (this._pickersReady) {
        const domainsAttr = domains ? `include-domains='${JSON.stringify(domains)}'` : '';
        return `<ha-entity-picker
          id="ep-${ci}-${field}"
          data-ci="${ci}"
          data-field="${field}"
          allow-custom-entity
          ${domainsAttr}
        ></ha-entity-picker>`;
      }
      // Fallback tier 2: ha-selector (always available, has autocomplete)
      let curVal = '';
      if (field === 'id')                   curVal = cam.id ? 'camera.' + cam.id : '';
      else if (field === 'ai_result_entity') curVal = cam.ai_result_entity || (cam.id ? `input_text.${cam.id}_ai_result` : '');
      else                                   curVal = cam[field] || '';

      if (_hasSelectorReady) {
        // ha-selector needs .selector and .value set via JS after render
        // We encode the config as data attributes and apply in _applyAllPickerValues
        const domain = domains?.[0] ?? null;
        return `<ha-selector
          id="ep-${ci}-${field}"
          data-ci="${ci}"
          data-field="${field}"
          data-selector-domain="${domain || ''}"
          data-fallback="selector"
        ></ha-selector>`;
      }
      // Fallback tier 3: plain text input
      return `<input type="text"
        id="ep-${ci}-${field}"
        class="cam-inp"
        data-ci="${ci}"
        data-field="${field}"
        value="${curVal.replace(/"/g, '&quot;')}"
        placeholder="${field.replace(/_/g,' ')}"
      />`;
    };

    const manualSection = isManual ? `
      <div class="manual-fields">
        <div class="row">
          <label>${_cT('lbl_occupancy_entity')} <span class="ent-badge">binary_sensor · tùy chọn</span></label>
          ${_picker('occupancy_entity', ['binary_sensor'])}
          <div class="field-hint">${_cT('hint_occupancy_entity')}</div>
        </div>
        <div class="row">
          <label>${_cT('lbl_count_entity')} <span class="ent-badge">sensor · tùy chọn</span></label>
          ${_picker('count_entity', ['sensor'])}
          <div class="field-hint">${_cT('hint_count_entity')}</div>
        </div>
        <div class="row">
          <label>📝 AI Result Entity <span class="ent-badge">input_text · tùy chọn</span></label>
          ${_picker('ai_result_entity', ['input_text'])}
          <div class="field-hint">Entity <code>input_text</code> được blueprint <em>camera_ai_result_writer</em> ghi kết quả vào. Card poll entity này để lấy mô tả AI sau khi chụp ảnh.</div>
        </div>
      </div>` : '';

    const iconPreview = cam.icon
      ? `<ha-icon icon="${cam.icon}" style="--mdc-icon-size:20px;color:var(--primary-color,#03a9f4);flex-shrink:0"></ha-icon>`
      : '';
    const headIcon = cam.icon
      ? `<ha-icon icon="${cam.icon}" style="--mdc-icon-size:15px;display:inline-flex;vertical-align:middle"></ha-icon>`
      : '📷';
    const onvifBadge = isManual
      ? `<span style="font-size:9px;background:rgba(251,146,60,.18);color:#f97316;border-radius:4px;padding:1px 5px;font-weight:700">ONVIF</span>`
      : '';

    return `<div class="cam-card" data-ci="${ci}">
      <div class="cam-head" id="chead-${ci}">
        <span class="cam-head-label">${headIcon} ${cam.label || cam.name || ('CAM ' + (ci + 1))} ${onvifBadge}</span>
        <button class="btn-move" data-move-cam="${ci}" data-dir="up">${_cT('btn_move_up')}</button>
        <button class="btn-move" data-move-cam="${ci}" data-dir="down">${_cT('btn_move_down')}</button>
        <button class="btn-del" data-del-cam="${ci}">${_cT('btn_del_cam')}</button>
        <span class="acc-arrow" id="carrow-${ci}">${open ? '▾' : '▸'}</span>
      </div>
      <div class="cam-body" id="cbody-${ci}" style="display:${open ? 'block' : 'none'}">

        <!-- Source mode -->
        <div style="margin-bottom:10px">
          <label style="font-size:11.5px;font-weight:600;color:var(--secondary-text-color,#666);display:block;margin-bottom:6px">${_cT('lbl_source_mode')}</label>
          <div class="src-toggle">
            <button class="src-btn${!isManual ? ' on' : ''}" data-src-mode="frigate" data-ci="${ci}">🦅 Frigate</button>
            <button class="src-btn${isManual  ? ' on' : ''}" data-src-mode="manual"  data-ci="${ci}">📡 ONVIF / Manual</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:start">
          <!-- Left col -->
          <div style="display:flex;flex-direction:column;gap:6px">
            <div class="row" style="margin-bottom:0">
              <label>${_cT('lbl_cam_id')}</label>
              ${_picker('id', ['camera'])}
            </div>
            <div class="row" style="margin-bottom:0">
              <label>${_cT('lbl_cam_entity')}</label>
              ${_picker('entity', ['camera'])}
              ${isManual ? `<div class="field-hint">Camera dùng để chụp snapshot khi motion trigger</div>` : ''}
            </div>
          </div>
          <!-- Right col -->
          <div style="display:flex;flex-direction:column;gap:6px">
            <div class="row" style="margin-bottom:0">
              <label>${_cT('lbl_cam_icon')}</label>
              <div style="display:flex;align-items:center;gap:6px">
                ${this._iconPickerReady
                  ? `<ha-icon-picker id="iconpick-${ci}" data-ci="${ci}"></ha-icon-picker>`
                  : `<input type="text" id="iconpick-${ci}" class="cam-inp"
                       data-ci="${ci}" data-field="icon"
                       value="${(cam.icon || '').replace(/"/g, '&quot;')}"
                       placeholder="mdi:camera" style="flex:1"/>`
                }
                ${iconPreview}
              </div>
            </div>
            <div class="row" style="margin-bottom:0">
              <label>${_cT('lbl_cam_name')}</label>
              <input type="text" class="cam-inp" data-ci="${ci}" data-field="name"
                value="${(cam.name || '').replace(/"/g, '&quot;')}"
                placeholder="${_cT('cam_name_ph')}"/>
            </div>
          </div>
        </div>

        ${manualSection}
      </div>
    </div>`;
  }

  // ── Re-render only the cameras list (after add/del/move/source-mode) ──────
  async _rerenderCameras() {
    const cameras = this._getCameras();
    const list    = this.shadowRoot.getElementById('cameras-list');
    if (!list) return;

    list.innerHTML = cameras.length === 0
      ? `<div style="font-size:12px;color:var(--secondary-text-color,#999);text-align:center;padding:12px">${_cT('no_cameras')}</div>`
      : cameras.map((cam, ci) => this._renderCamCard(cam, ci)).join('');

    this._wireCameras();
    this._wireAccordionCams();

    // Push hass + values after browser upgrades elements
    await Promise.resolve();
    this._pushHassToAllPickers();
    this._applyAllPickerValues();
  }

  // ── Wire ALL listeners (called once after full render) ────────────────────
  _wireAll() {
    this._wireAccordionSections();
    this._wireAccordionCams();
    this._wireAppearance();
    this._wireCameras();
  }

  // ── Accordion: top-level sections ─────────────────────────────────────────
  _wireAccordionSections() {
    ['appearance', 'cameras'].forEach(id => {
      const h = this.shadowRoot.getElementById('head-' + id);
      if (!h) return;
      h.addEventListener('click', () => {
        this._open[id] = !this._open[id];
        const body  = this.shadowRoot.getElementById('body-' + id);
        const arrow = this.shadowRoot.getElementById('arrow-' + id);
        if (body)  body.style.display = this._open[id] ? 'block' : 'none';
        if (arrow) arrow.textContent  = this._open[id] ? '▾' : '▸';
      });
    });
  }

  // ── Accordion: per-camera cards ───────────────────────────────────────────
  _wireAccordionCams() {
    this.shadowRoot.querySelectorAll('.cam-head').forEach(h => {
      const ci = parseInt(h.id.replace('chead-', ''));
      h.addEventListener('click', e => {
        if (e.target.closest('button')) return;
        this._open[`cam-${ci}`] = !this._open[`cam-${ci}`];
        const body  = this.shadowRoot.getElementById(`cbody-${ci}`);
        const arrow = this.shadowRoot.getElementById(`carrow-${ci}`);
        if (body)  body.style.display = this._open[`cam-${ci}`] ? 'block' : 'none';
        if (arrow) arrow.textContent  = this._open[`cam-${ci}`] ? '▾' : '▸';
      });
    });
  }

  // ── Appearance section ────────────────────────────────────────────────────
  _wireAppearance() {
    // Language
    this.shadowRoot.querySelectorAll('[data-lang]').forEach(btn => {
      btn.addEventListener('click', () => {
        _cecSetLang(btn.dataset.lang);
        this._fire();
        this._render(); // full re-render to apply new language
      });
    });

    // Theme
    this.shadowRoot.querySelectorAll('[data-theme-val]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._config = { ...this._config, theme: btn.dataset.themeVal };
        // Update active state visually without full re-render
        this.shadowRoot.querySelectorAll('[data-theme-val]').forEach(b =>
          b.classList.toggle('on', b.dataset.themeVal === btn.dataset.themeVal)
        );
        this._fire();
      });
    });

    // Title
    const titleInp = this.shadowRoot.getElementById('titleInp');
    if (titleInp) {
      titleInp.addEventListener('input', () => {
        this._config = { ...this._config, title: titleInp.value };
        this._fireDebounced();
      });
    }

    // Frigate URL
    const frigateInp = this.shadowRoot.getElementById('frigateInp');
    if (frigateInp) {
      frigateInp.addEventListener('input', () => {
        this._config = { ...this._config, frigate_url: frigateInp.value };
        this._fireDebounced();
      });
    }

    // Opacity slider
    const opSl = this.shadowRoot.getElementById('opacitySl');
    const opV  = this.shadowRoot.getElementById('opacityV');
    if (opSl) {
      opSl.addEventListener('input',  () => { opV.textContent = parseFloat(opSl.value).toFixed(2); });
      opSl.addEventListener('change', () => {
        this._config = { ...this._config, tile_opacity: parseFloat(opSl.value) };
        this._fire();
      });
    }

    // Blur slider
    const blSl = this.shadowRoot.getElementById('blurSl');
    const blV  = this.shadowRoot.getElementById('blurV');
    if (blSl) {
      blSl.addEventListener('input',  () => { blV.textContent = blSl.value + 'px'; });
      blSl.addEventListener('change', () => {
        this._config = { ...this._config, tile_blur: parseInt(blSl.value) };
        this._fire();
      });
    }
  }

  // ── Camera section listeners ──────────────────────────────────────────────
  _wireCameras() {
    // Add camera
    this.shadowRoot.getElementById('btn-add-cam')?.addEventListener('click', () => {
      const arr = [...this._getCameras()];
      arr.push({ id: '', entity: '', label: `CAM ${arr.length + 1}`, name: '' });
      this._config = { ...this._config, cameras: arr };
      this._open[`cam-${arr.length - 1}`] = true;
      this._fire();
      this._rerenderCameras();
    });

    // Delete camera
    this.shadowRoot.querySelectorAll('[data-del-cam]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const ci  = parseInt(btn.dataset.delCam);
        const arr = [...this._getCameras()];
        arr.splice(ci, 1);
        this._config = { ...this._config, cameras: arr };
        this._fire();
        this._rerenderCameras();
      });
    });

    // Move camera up/down
    this.shadowRoot.querySelectorAll('[data-move-cam]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const ci  = parseInt(btn.dataset.moveCam);
        const dir = btn.dataset.dir;
        const arr = [...this._getCameras()];
        const si  = dir === 'up' ? ci - 1 : ci + 1;
        if (si < 0 || si >= arr.length) return;
        [arr[ci], arr[si]] = [arr[si], arr[ci]];
        this._config = { ...this._config, cameras: arr };
        this._fire();
        this._rerenderCameras();
      });
    });

    // Source mode toggle (Frigate ↔ ONVIF/Manual)
    this.shadowRoot.querySelectorAll('[data-src-mode]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const ci   = parseInt(btn.dataset.ci);
        const mode = btn.dataset.srcMode;
        const arr  = [...this._getCameras()];
        arr[ci] = { ...arr[ci], source_mode: mode };
        this._config = { ...this._config, cameras: arr };
        this._open[`cam-${ci}`] = true;
        this._fire();
        this._rerenderCameras();
      });
    });

    // ha-entity-picker: value-changed
    // KEY FIX: listeners trên element object, không phải attribute
    // Picker nhận .hass và .value qua _applyAllPickerValues() sau render
    const _onEntityPickerChange = (picker, e) => {
      const ci    = parseInt(picker.dataset.ci);
      const field = picker.dataset.field;
      let   val   = e.detail.value || '';
      // Camera ID field: strip 'camera.' prefix vì config lưu plain id
      if (field === 'id' && val.startsWith('camera.')) val = val.slice(7);
      const arr = [...this._getCameras()];
      if (!arr[ci]) return;
      arr[ci] = { ...arr[ci], [field]: val };
      if (field === 'name') arr[ci].label = val;
      this._config = { ...this._config, cameras: arr };
      this._fire();
    };

    this.shadowRoot.querySelectorAll('ha-entity-picker').forEach(picker => {
      picker.addEventListener('value-changed', e => _onEntityPickerChange(picker, e));
    });

    // ha-selector fallback: same value-changed event shape as ha-entity-picker
    this.shadowRoot.querySelectorAll('ha-selector[data-fallback="selector"]').forEach(sel => {
      sel.addEventListener('value-changed', e => _onEntityPickerChange(sel, e));
    });

    // ha-icon-picker: value-changed
    this.shadowRoot.querySelectorAll('ha-icon-picker').forEach(picker => {
      picker.addEventListener('value-changed', e => {
        const ci  = parseInt(picker.dataset.ci);
        const arr = [...this._getCameras()];
        if (!arr[ci]) return;
        arr[ci] = { ...arr[ci], icon: e.detail.value || '' };
        this._config = { ...this._config, cameras: arr };
        this._fire();
        // Update preview icon inline (no full re-render needed)
        const preview = picker.nextElementSibling;
        if (preview?.tagName?.toLowerCase() === 'ha-icon') {
          preview.setAttribute('icon', e.detail.value || '');
        }
      });
    });

    // Plain text inputs (camera name)
    this.shadowRoot.querySelectorAll('.cam-inp').forEach(inp => {
      inp.addEventListener('input', () => {
        const ci    = parseInt(inp.dataset.ci);
        const field = inp.dataset.field;
        const arr   = [...this._getCameras()];
        if (!arr[ci]) return;
        arr[ci] = { ...arr[ci], [field]: inp.value };
        if (field === 'name') arr[ci].label = inp.value;
        this._config = { ...this._config, cameras: arr };
        this._fireDebounced();
      });
    });
  }
}

if (!customElements.get('camera-events-card-editor')) {
  customElements.define('camera-events-card-editor', CameraEventsCardEditor);
}

// ── Hook editor vào card ──────────────────────────────────────────────────────
CameraEventsCard.getConfigElement = function () {
  return document.createElement('camera-events-card-editor');
};
CameraEventsCard.getStubConfig = function () {
  return {
    type:         'custom:camera-events-card',
    title:        'Camera & Events',
    theme:        'dark',
    tile_opacity: 0.18,
    tile_blur:    12,
    frigate_url:  DEFAULT_FRIGATE_URL,
    cameras:      DEFAULT_CAMERAS,
  };
};

window.customCards = window.customCards || [];
window.customCards.push({
  type:        'camera-events-card',
  name:        'Camera Events Card',
  description: 'WebRTC/HLS realtime + Frigate events · Visual Editor · Dark/Light · Glassmorphism',
  preview:     false,
});
