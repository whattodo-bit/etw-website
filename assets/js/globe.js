/* ============================================================
   globe.js — ETW
   1. Fixed orthographic globe canvas (full viewport, z-index 0)
   2. Civilization canvas animation (history panel, #civ-canvas)
============================================================ */

(function () {
  'use strict';

  /* ══════════════════════════════════════════
     PART 1 — GLOBE
  ══════════════════════════════════════════ */

  /* ── Create fixed canvas ── */
  var gc = document.createElement('canvas');
  gc.id = 'globe-canvas';
  gc.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;display:block;';
  document.body.insertBefore(gc, document.body.firstChild);
  var gctx = gc.getContext('2d');

  /* ── State ── */
  var rY = 0;         // spin angle (auto-decrements = right-to-left)
  var rX = 0.28;      // tilt (X-axis)
  var breathT = 0;    // breathing timer
  var gLastT = null;
  var dragging = false, lastMX = 0, lastMY = 0;
  var curRX = 300, curRY = 290; // updated each frame, used by drag

  /* ── Continent polygons [lon, lat] ── */
  var CONTINENTS = [
    {
      n: 'N.America', clat: 50, clon: -105,
      pts: [
        [-168,71],[-155,60],[-138,59],[-130,54],[-124,49],[-117,46],
        [-117,32],[-97,26],[-90,18],[-83,9],[-77,8],[-77,4],
        [-75,10],[-72,12],[-60,18],[-55,22],[-55,47],[-52,47],
        [-60,47],[-60,65],[-68,76],[-95,76],[-140,70],[-153,62],[-168,71]
      ]
    },
    {
      n: 'S.America', clat: -15, clon: -60,
      pts: [
        [-80,12],[-75,10],[-62,11],[-50,0],[-44,-3],[-35,-4],
        [-35,-8],[-38,-13],[-43,-23],[-48,-28],[-52,-33],[-56,-38],
        [-65,-55],[-68,-55],[-75,-53],[-74,-43],[-70,-38],[-70,-17],
        [-76,-2],[-78,0],[-80,3],[-80,12]
      ]
    },
    {
      n: 'Europe', clat: 52, clon: 14,
      pts: [
        [-10,36],[0,36],[8,36],[15,37],[24,38],[28,38],[33,37],
        [35,38],[28,42],[28,47],[26,52],[22,56],[18,60],[14,58],
        [8,63],[5,62],[0,61],[-5,54],[-8,53],[-10,44],[-10,36]
      ]
    },
    {
      n: 'Africa', clat: 5, clon: 22,
      pts: [
        [-5,37],[5,37],[15,38],[24,37],[28,37],[38,22],[44,12],
        [44,5],[42,0],[38,-5],[36,-18],[34,-28],[27,-34],[18,-34],
        [13,-22],[10,-8],[8,5],[2,5],[-5,5],[-14,10],[-17,15],
        [-16,20],[-12,28],[-5,37]
      ]
    },
    {
      n: 'Asia', clat: 45, clon: 90,
      pts: [
        [26,37],[36,37],[40,38],[44,37],[50,30],[56,25],[62,22],
        [72,22],[80,22],[90,22],[100,20],[105,12],[110,5],[120,5],
        [128,18],[130,20],[140,35],[142,46],[136,50],[132,55],
        [122,65],[112,72],[100,72],[90,72],[80,70],[70,68],
        [60,65],[55,58],[50,55],[44,55],[40,60],[36,55],
        [26,46],[26,37]
      ]
    },
    {
      n: 'Oceania', clat: -25, clon: 135,
      pts: [
        [114,-22],[118,-20],[122,-18],[128,-15],[136,-12],[138,-14],
        [140,-17],[148,-20],[152,-24],[153,-28],[152,-32],[148,-38],
        [144,-38],[140,-36],[130,-33],[124,-32],[118,-28],[114,-26],[114,-22]
      ]
    },
    {
      n: 'Antarctica', clat: -80, clon: 0,
      pts: [
        [0,-68],[30,-66],[60,-66],[90,-68],[120,-66],[150,-68],
        [180,-66],[210,-68],[240,-66],[270,-68],[300,-66],[330,-68],[360,-68]
      ]
    }
  ];

  /* ── City dots [lat, lon] ── */
  var CITIES = [
    [51.5,  -0.1],  // London
    [40.7, -74.0],  // New York
    [55.7,  37.6],  // Moscow
    [39.9, 116.4],  // Beijing
    [28.6,  77.2],  // Delhi
    [30.0,  31.2],  // Cairo
    [41.9,  12.5],  // Rome
    [41.0,  28.9],  // Istanbul
    [37.9,  23.7],  // Athens
    [33.3,  44.4],  // Baghdad
    [31.2,  29.9],  // Alexandria
    [36.8,  10.2],  // Carthage (Tunis)
    [39.7,  66.9]   // Samarkand
  ];

  /* ── 3D projection ── */
  function proj(lat, lon, rotY, rotX) {
    var la = lat * Math.PI / 180;
    var lo = lon * Math.PI / 180;
    var x0 = Math.cos(la) * Math.sin(lo);
    var y0 = Math.sin(la);
    var z0 = Math.cos(la) * Math.cos(lo);
    // Y rotation (spin)
    var x1 =  x0 * Math.cos(rotY) + z0 * Math.sin(rotY);
    var z1 = -x0 * Math.sin(rotY) + z0 * Math.cos(rotY);
    // X tilt
    var y2 =  y0 * Math.cos(rotX) - z1 * Math.sin(rotX);
    var z2 =  y0 * Math.sin(rotX) + z1 * Math.cos(rotX);
    return { sx: x1, sy: y2, z: z2 };
  }

  /* ── Globe draw frame ── */
  function gFrame(ts) {
    if (gLastT === null) gLastT = ts;
    var dt = Math.min((ts - gLastT) / 1000, 0.1);
    gLastT = ts;

    /* Auto-rotate right-to-left (East to West on screen) */
    if (!dragging) rY -= (2 * Math.PI / 100) * dt;

    breathT += dt;

    var W = window.innerWidth;
    var H = window.innerHeight;
    gc.width  = W;
    gc.height = H;

    /* Breathing ellipse radii */
    var baseR = Math.min(W, H) * 0.375;  /* 75 vmin / 2 */
    var RX = baseR * (1.00 + 0.048 * Math.sin(breathT * 0.21));
    var RY = baseR * (0.96 + 0.036 * Math.cos(breathT * 0.17 + 0.9));
    /* Subtle center drift */
    var CX = W / 2 + 7 * Math.sin(breathT * 0.13);
    var CY = H / 2 + 5 * Math.cos(breathT * 0.09 + 0.4);

    curRX = RX; curRY = RY;

    gctx.clearRect(0, 0, W, H);

    /* Clip to ellipse */
    gctx.save();
    gctx.beginPath();
    gctx.ellipse(CX, CY, RX, RY, 0, 0, Math.PI * 2);
    gctx.clip();

    /* Draw continents */
    gctx.lineWidth   = 1;
    gctx.strokeStyle = 'rgba(196,147,42,0.45)';
    gctx.fillStyle   = 'rgba(26,31,94,0.5)';

    CONTINENTS.forEach(function (cont) {
      var cp = proj(cont.clat, cont.clon, rY, rX);
      if (cp.z < -0.05) return;

      gctx.beginPath();
      var started = false;
      var lastVisible = false;

      cont.pts.forEach(function (pt) {
        var p = proj(pt[1], pt[0], rY, rX);
        var visible = p.z > -0.02;
        var sx = CX + p.sx * RX;
        var sy = CY - p.sy * RY;

        if (visible) {
          if (!started || !lastVisible) { gctx.moveTo(sx, sy); started = true; }
          else gctx.lineTo(sx, sy);
        }
        lastVisible = visible;
      });

      if (started) {
        gctx.closePath();
        gctx.fill();
        gctx.stroke();
      }
    });

    /* City dots */
    gctx.fillStyle = 'rgba(196,147,42,0.5)';
    CITIES.forEach(function (c) {
      var p = proj(c[0], c[1], rY, rX);
      if (p.z < 0.05) return;
      gctx.beginPath();
      gctx.arc(CX + p.sx * RX, CY - p.sy * RY, 2.5, 0, Math.PI * 2);
      gctx.fill();
    });

    gctx.restore();

    /* Soft outer halo */
    gctx.save();
    var halo = gctx.createRadialGradient(CX, CY, RX * 0.85, CX, CY, RX * 1.12);
    halo.addColorStop(0, 'rgba(196,147,42,0.0)');
    halo.addColorStop(1, 'rgba(196,147,42,0.035)');
    gctx.beginPath();
    gctx.ellipse(CX, CY, RX * 1.12, RY * 1.12, 0, 0, Math.PI * 2);
    gctx.fillStyle = halo;
    gctx.fill();
    gctx.restore();

    requestAnimationFrame(gFrame);
  }

  requestAnimationFrame(gFrame);

  /* ── Drag: document-level, skip interactive elements ── */
  document.addEventListener('mousedown', function (e) {
    var t = e.target.tagName.toLowerCase();
    if (t === 'a' || t === 'button' || t === 'input' || t === 'textarea') return;
    dragging = true; lastMX = e.clientX; lastMY = e.clientY;
  });
  window.addEventListener('mouseup',   function () { dragging = false; });
  window.addEventListener('mousemove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastMX;
    var dy = e.clientY - lastMY;
    lastMX = e.clientX; lastMY = e.clientY;
    rY += dx / curRX;
    rX += dy / curRY;
    rX = Math.max(-1.4, Math.min(1.4, rX));
  });
  document.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    var t = e.target.tagName.toLowerCase();
    if (t === 'a' || t === 'button') return;
    dragging = true;
    lastMX = e.touches[0].clientX; lastMY = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchend', function () { dragging = false; });
  window.addEventListener('touchmove', function (e) {
    if (!dragging || e.touches.length !== 1) return;
    var dx = e.touches[0].clientX - lastMX;
    var dy = e.touches[0].clientY - lastMY;
    lastMX = e.touches[0].clientX; lastMY = e.touches[0].clientY;
    rY += dx / curRX;
    rX += dy / curRY;
    rX = Math.max(-1.4, Math.min(1.4, rX));
  }, { passive: true });


  /* ══════════════════════════════════════════
     PART 2 — CIVILIZATION ANIMATION
     History panel canvas (#civ-canvas)
  ══════════════════════════════════════════ */

  var civCanvas = document.getElementById('civ-canvas');
  if (!civCanvas) return;

  var cctx = civCanvas.getContext('2d');
  var GOLD = '#C4932A';
  var MAX_ALPHA = 0.07;
  var civT = 0;
  var CYCLE = 40;   /* seconds per full loop */
  var cLastT = null;

  /* ── Phase envelope: smooth bell curve over [start, end] ── */
  function envelope(t, start, end) {
    var x = (t - start) / (end - start);
    if (x <= 0 || x >= 1) return 0;
    return Math.sin(x * Math.PI);
  }

  /* ── Pillar ── */
  function drawPillar(cx, baseY, h, alpha, crumble) {
    if (alpha <= 0) return;
    cctx.save();
    cctx.globalAlpha = MAX_ALPHA * alpha;
    cctx.strokeStyle = GOLD;
    cctx.lineWidth = 1;

    var noise = crumble * (Math.random() * 2.5);
    var bw = 14;

    /* Base plinth */
    cctx.strokeRect(cx - bw, baseY - h * 0.06 + noise, bw * 2, h * 0.06);
    /* Shaft */
    cctx.strokeRect(cx - bw * 0.45 + noise, baseY - h * 0.9, bw * 0.9, h * 0.84);
    /* Capital */
    cctx.strokeRect(cx - bw * 0.8 + noise, baseY - h, bw * 1.6, h * 0.08);
    /* Echinus curve hint */
    cctx.beginPath();
    cctx.moveTo(cx - bw * 0.45, baseY - h * 0.91);
    cctx.quadraticCurveTo(cx - bw * 0.6, baseY - h * 0.94, cx - bw * 0.8, baseY - h);
    cctx.moveTo(cx + bw * 0.45, baseY - h * 0.91);
    cctx.quadraticCurveTo(cx + bw * 0.6, baseY - h * 0.94, cx + bw * 0.8, baseY - h);
    cctx.stroke();

    cctx.restore();
  }

  /* ── Colosseum ── */
  function drawColosseum(alpha) {
    if (alpha <= 0) return;
    var W = civCanvas.width, H = civCanvas.height;
    var cx = W / 2, cy = H / 2 + 40;
    var rx = Math.min(W * 0.28, 180);
    var ry = rx * 0.55;

    cctx.save();
    cctx.globalAlpha = MAX_ALPHA * alpha;
    cctx.strokeStyle = GOLD;
    cctx.lineWidth = 1;

    /* Outer ellipse */
    cctx.beginPath();
    cctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    cctx.stroke();

    /* Middle ring */
    cctx.beginPath();
    cctx.ellipse(cx, cy, rx * 0.72, ry * 0.72, 0, 0, Math.PI * 2);
    cctx.stroke();

    /* Inner ring */
    cctx.beginPath();
    cctx.ellipse(cx, cy, rx * 0.44, ry * 0.44, 0, 0, Math.PI * 2);
    cctx.stroke();

    /* Ground line */
    cctx.beginPath();
    cctx.moveTo(cx - rx, cy); cctx.lineTo(cx + rx, cy);
    cctx.stroke();

    /* Arch openings in outer ring */
    for (var i = 0; i < 10; i++) {
      var angle = (i / 10) * Math.PI * 2;
      var ax = cx + rx * 0.86 * Math.cos(angle);
      var ay = cy + ry * 0.86 * Math.sin(angle);
      cctx.beginPath();
      cctx.arc(ax, ay, 5, 0, Math.PI * 2);
      cctx.stroke();
    }

    /* Vertical ribs */
    for (var j = 0; j < 6; j++) {
      var a2 = (j / 6) * Math.PI * 2;
      var x1 = cx + rx * 0.44 * Math.cos(a2);
      var y1 = cy + ry * 0.44 * Math.sin(a2);
      var x2 = cx + rx * Math.cos(a2);
      var y2 = cy + ry * Math.sin(a2);
      cctx.beginPath();
      cctx.moveTo(x1, y1); cctx.lineTo(x2, y2);
      cctx.stroke();
    }

    cctx.restore();
  }

  /* ── Arch of Triumph ── */
  function drawArch(alpha) {
    if (alpha <= 0) return;
    var W = civCanvas.width, H = civCanvas.height;
    var cx = W / 2;
    var baseY = H * 0.78;
    var aw = 130, ah = 90;   /* total arch width/height */
    var ow = 44, oh = 58;    /* main opening */
    var sw = 18, sh = 36;    /* side openings */

    cctx.save();
    cctx.globalAlpha = MAX_ALPHA * alpha;
    cctx.strokeStyle = GOLD;
    cctx.lineWidth = 1;

    /* Attic block */
    cctx.strokeRect(cx - aw / 2, baseY - ah, aw, ah * 0.2);

    /* Left pier */
    cctx.strokeRect(cx - aw / 2, baseY - ah * 0.8, (aw - ow) / 2 - sw / 2 - 4, ah * 0.8);

    /* Right pier */
    cctx.strokeRect(cx + ow / 2 + sw / 2 + 4, baseY - ah * 0.8, (aw - ow) / 2 - sw / 2 - 4, ah * 0.8);

    /* Inner piers (flanking main arch) */
    cctx.strokeRect(cx - ow / 2 - 6, baseY - ah * 0.8, 6, ah * 0.8);
    cctx.strokeRect(cx + ow / 2, baseY - ah * 0.8, 6, ah * 0.8);

    /* Main arch opening */
    var archCenterY = baseY - oh;
    cctx.beginPath();
    cctx.arc(cx, archCenterY, ow / 2, Math.PI, 0);
    cctx.lineTo(cx + ow / 2, baseY);
    cctx.moveTo(cx - ow / 2, archCenterY);
    cctx.lineTo(cx - ow / 2, baseY);
    cctx.stroke();

    /* Left side opening */
    var lx = cx - ow / 2 - sw / 2 - 10;
    cctx.beginPath();
    cctx.arc(lx, baseY - sh, sw / 2, Math.PI, 0);
    cctx.lineTo(lx + sw / 2, baseY);
    cctx.moveTo(lx - sw / 2, baseY - sh);
    cctx.lineTo(lx - sw / 2, baseY);
    cctx.stroke();

    /* Right side opening */
    var rx2 = cx + ow / 2 + sw / 2 + 10;
    cctx.beginPath();
    cctx.arc(rx2, baseY - sh, sw / 2, Math.PI, 0);
    cctx.lineTo(rx2 + sw / 2, baseY);
    cctx.moveTo(rx2 - sw / 2, baseY - sh);
    cctx.lineTo(rx2 - sw / 2, baseY);
    cctx.stroke();

    cctx.restore();
  }

  /* ── Civilization loop ── */
  function civFrame(ts) {
    if (cLastT === null) cLastT = ts;
    var dt = Math.min((ts - cLastT) / 1000, 0.1);
    cLastT = ts;
    civT += dt;

    var W = civCanvas.offsetWidth  || 800;
    var H = civCanvas.offsetHeight || 520;
    civCanvas.width  = W;
    civCanvas.height = H;

    cctx.clearRect(0, 0, W, H);

    var t = civT % CYCLE;
    /*
      Phase windows (within 40s cycle):
      Pillars rise:         0  → 16s  (peak alpha ~8s)
      Colosseum fades in:   6  → 22s  (peak ~14s)
      Arch appears:        14  → 30s  (peak ~22s)
      Crumble / fade out:  26  → 40s  (all fade, slight noise)
    */
    var pillarA  = envelope(t,  0, 26);
    var colosA   = envelope(t,  6, 30);
    var archA    = envelope(t, 14, 38);
    var crumble  = Math.max(0, (t - 26) / 14);   /* 0→1 over crumble phase */

    /* Pillar progress (rises over first 8s) */
    var pillarProgress = Math.min(1, t / 8);

    /* Pillar positions */
    var baseY   = H * 0.82;
    var pillarH = H * 0.34;
    var cx      = W / 2;
    var spacing = W * 0.09;

    var pillarXs = [
      cx - spacing * 2,
      cx - spacing,
      cx,
      cx + spacing,
      cx + spacing * 2
    ];

    pillarXs.forEach(function (px) {
      drawPillar(px, baseY, pillarH * pillarProgress, pillarA, crumble);
    });

    drawColosseum(colosA);
    drawArch(archA);

    requestAnimationFrame(civFrame);
  }

  requestAnimationFrame(civFrame);

  /* History panel → navigate */
  var panel = document.getElementById('history-panel');
  if (panel) {
    panel.addEventListener('click', function () {
      window.location.href = 'history.html';
    });
  }

})();
