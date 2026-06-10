/* ═══════════════════════════════════════════════════════
   ETW — main.js
   Navbar · Globe (index) · Weapons (history)
   ═══════════════════════════════════════════════════════ */

(function () {
'use strict';

/* ═══════════════════════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════════════════════ */
var navbar = document.getElementById('navbar');
if (navbar) {
  var onScroll = function () { navbar.classList.toggle('scrolled', window.scrollY > 20); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function closeAllPopups() {
  document.querySelectorAll('.popup').forEach(function (p) { p.classList.remove('open'); });
}

document.querySelectorAll('.icon-btn[data-popup]').forEach(function (btn) {
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    var wrap = btn.closest('.icon-wrap');
    var pop  = wrap && wrap.querySelector('.popup');
    if (!pop) return;
    var wasOpen = pop.classList.contains('open');
    closeAllPopups();
    if (!wasOpen) pop.classList.add('open');
  });
});
document.addEventListener('click', closeAllPopups);

var hamburger = document.getElementById('hamburger');
var mobMenu   = document.getElementById('mob-menu');
var mobClose  = document.getElementById('mob-close');
if (hamburger && mobMenu) hamburger.addEventListener('click', function () { mobMenu.classList.add('open'); });
if (mobClose  && mobMenu) mobClose.addEventListener('click',  function () { mobMenu.classList.remove('open'); });
if (mobMenu) {
  mobMenu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { mobMenu.classList.remove('open'); });
  });
}

/* ═══════════════════════════════════════════════════════
   GLOBE  (index.html — #globe-canvas)
   ═══════════════════════════════════════════════════════ */
var globeEl = document.getElementById('globe-canvas');
if (globeEl) {

  var gc = globeEl.getContext('2d');
  var gW, gH, gCx, gCy, gR;
  var autoRotY   = 0;      // accumulates from rAF
  var dragRotY   = 0;
  var dragRotX   = 0;
  var tiltBase   = 0.22;   // ~12° north-tilt
  var dragging   = false;
  var lastMX = 0, lastMY = 0;
  var prevTime   = null;

  /* ── Continent polygons [lat, lon] ─────────────────── */
  var CONTINENTS = [
    // Africa
    [[37,-6],[38,10],[33,32],[22,38],[12,44],[5,42],[-1,41],[-11,40],
     [-26,33],[-35,20],[-34,18],[-29,17],[-18,12],[-4,10],[5,2],
     [5,-8],[5,-16],[15,-17],[22,-17],[35,-5]],
    // Europe (mainland)
    [[71,26],[65,-5],[57,-10],[51,-10],[50,-4],[44,-8],[36,-5],
     [36,28],[41,30],[43,41],[47,40],[47,50],[55,50],[60,55],[68,35]],
    // Russia / North Asia
    [[68,35],[60,55],[55,50],[47,50],[40,55],[40,70],[50,80],
     [55,90],[55,110],[55,122],[48,140],[50,155],[64,170],
     [73,163],[73,132],[78,102],[74,80],[73,55]],
    // South & SE Asia
    [[47,50],[47,40],[43,41],[36,28],[29,35],[22,38],[15,50],
     [22,57],[8,77],[22,68],[5,99],[1,103],[10,104],[22,114],
     [30,122],[44,135],[48,140],[55,122],[55,90],[50,80],[40,70],[40,55]],
    // North America
    [[72,-73],[71,-83],[71,-155],[60,-162],[55,-130],[48,-123],
     [32,-117],[23,-110],[15,-87],[8,-77],[11,-72],[18,-72],
     [25,-80],[35,-76],[45,-67],[47,-53],[55,-55],[62,-64]],
    // South America
    [[8,-77],[11,-72],[12,-62],[10,-60],[5,-52],[-5,-35],
     [-15,-38],[-23,-43],[-35,-57],[-53,-67],[-55,-65],
     [-44,-65],[-30,-50],[-10,-75],[0,-78],[5,-77]],
    // Australia
    [[-15,130],[-18,140],[-25,153],[-38,147],[-39,144],
     [-35,137],[-35,117],[-25,113],[-20,119]],
    // Greenland
    [[83,-44],[83,-15],[72,-20],[63,-50],[66,-56],[70,-55],[76,-55]],
    // Japan (simplified)
    [[45,142],[43,141],[38,141],[33,130],[31,130],[33,129],[40,139],[45,142]],
    // UK
    [[58,-5],[51,-5],[51,1],[53,0],[55,-2],[56,-3],[58,-3],[58,-5]],
    // Iceland
    [[66,-24],[64,-22],[63,-18],[64,-13],[65,-13],[66,-16],[66,-24]],
    // Madagascar
    [[-13,49],[-16,50],[-25,44],[-25,47],[-13,49]],
    // New Zealand (North Island approx)
    [[-37,174],[-38,176],[-41,175],[-40,172],[-37,174]],
    // Sri Lanka
    [[10,80],[6,80],[7,82],[10,80]],
    // Philippines approx (Luzon)
    [[18,122],[15,121],[11,122],[14,124],[18,122]],
    // Borneo approx
    [[7,116],[4,118],[1,118],[4,113],[7,116]],
    // Sumatra approx
    [[5,95],[3,98],[0,102],[-4,105],[-5,105],[0,99],[5,95]],
  ];

  /* ── City dots [lat, lon] ─────────────────────────── */
  var CITIES = [
    [51.5,-0.1],[40.7,-74],[55.7,37.6],[39.9,116.4],
    [28.6,77.2],[30,31.2],[41.9,12.5],[41,29],
    [33.3,44.4],[36.9,10.3],[37.9,23.7],[31.2,29.9],
    [39.7,66.9],[19.4,-99.1],
  ];

  /* ── Projection ───────────────────────────────────── */
  function geo3D(lat, lon, rY, rX) {
    var phi = lat * Math.PI / 180;
    var lam = lon * Math.PI / 180;
    var x = Math.cos(phi) * Math.sin(lam);
    var y = Math.sin(phi);
    var z = Math.cos(phi) * Math.cos(lam);
    // rotate Y (spin)
    var x1 = x * Math.cos(rY) + z * Math.sin(rY);
    var z1 = -x * Math.sin(rY) + z * Math.cos(rY);
    x = x1; z = z1;
    // rotate X (tilt)
    var y2 = y * Math.cos(rX) - z * Math.sin(rX);
    var z2 = y * Math.sin(rX) + z * Math.cos(rX);
    return { x: x, y: y2, z: z2 };
  }

  function screenPt(lat, lon, rY, rX) {
    var p = geo3D(lat, lon, rY, rX);
    return { sx: gCx + p.x * gR, sy: gCy - p.y * gR, z: p.z };
  }

  function drawContinent(pts, rY, rX) {
    // centroid visibility check
    var clat = 0, clon = 0;
    for (var i = 0; i < pts.length; i++) { clat += pts[i][0]; clon += pts[i][1]; }
    var cp = geo3D(clat / pts.length, clon / pts.length, rY, rX);
    if (cp.z < -0.15) return;

    var proj = pts.map(function (p) { return screenPt(p[0], p[1], rY, rX); });

    gc.beginPath();
    // Use segments: connect only consecutive visible points
    var started = false;
    for (var j = 0; j < proj.length; j++) {
      var p = proj[j];
      if (p.z > 0) {
        if (!started) { gc.moveTo(p.sx, p.sy); started = true; }
        else { gc.lineTo(p.sx, p.sy); }
      } else {
        // If we were drawing, close this sub-segment
        if (started) { started = false; }
      }
    }
    // Close back to first visible point if all on front
    if (cp.z > 0.5) gc.closePath();
    gc.fill();
    gc.stroke();
  }

  function drawGlobe(ts) {
    if (prevTime !== null) {
      var dt = Math.min((ts - prevTime) / 1000, 0.1);
      autoRotY += (dt / 90) * Math.PI * 2; // 1 rev per 90s
    }
    prevTime = ts;

    gc.clearRect(0, 0, gW, gH);

    var rY = autoRotY + dragRotY;
    var rX = tiltBase + dragRotX;

    // Clip to globe circle
    gc.save();
    gc.beginPath();
    gc.arc(gCx, gCy, gR, 0, Math.PI * 2);
    gc.clip();

    gc.fillStyle   = 'rgba(26,31,94,0.8)';
    gc.strokeStyle = 'rgba(196,147,42,0.25)';
    gc.lineWidth   = 0.7;

    for (var k = 0; k < CONTINENTS.length; k++) {
      drawContinent(CONTINENTS[k], rY, rX);
    }

    gc.restore();

    // City dots (outside clip OK — inside globe naturally)
    for (var c = 0; c < CITIES.length; c++) {
      var cp2 = screenPt(CITIES[c][0], CITIES[c][1], rY, rX);
      if (cp2.z < 0) continue;
      gc.beginPath();
      gc.arc(cp2.sx, cp2.sy, 2, 0, Math.PI * 2);
      gc.fillStyle = 'rgba(196,147,42,0.55)';
      gc.fill();
    }

    requestAnimationFrame(drawGlobe);
  }

  function resizeGlobe() {
    gW = window.innerWidth;
    gH = window.innerHeight;
    globeEl.width  = gW;
    globeEl.height = gH;
    gCx = gW / 2;
    gCy = gH / 2;
    gR  = Math.min(gW, gH) * 0.425; // 85vmin / 2
  }

  // Mouse / Touch drag (attached to document so works through overlaid content)
  document.addEventListener('mousedown', function (e) { dragging = true; lastMX = e.clientX; lastMY = e.clientY; });
  document.addEventListener('mousemove', function (e) {
    if (!dragging) return;
    dragRotY += (e.clientX - lastMX) * 0.005;
    dragRotX -= (e.clientY - lastMY) * 0.005;
    dragRotX  = Math.max(-1.3, Math.min(1.3, dragRotX));
    lastMX = e.clientX; lastMY = e.clientY;
  });
  document.addEventListener('mouseup', function () { dragging = false; });

  document.addEventListener('touchstart', function (e) {
    dragging = true;
    lastMX = e.touches[0].clientX;
    lastMY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (!dragging) return;
    dragRotY += (e.touches[0].clientX - lastMX) * 0.005;
    dragRotX -= (e.touches[0].clientY - lastMY) * 0.005;
    dragRotX  = Math.max(-1.3, Math.min(1.3, dragRotX));
    lastMX = e.touches[0].clientX;
    lastMY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', function () { dragging = false; });

  window.addEventListener('resize', resizeGlobe);
  resizeGlobe();
  requestAnimationFrame(drawGlobe);
}

/* ═══════════════════════════════════════════════════════
   WEAPONS  (history.html — #weapons-canvas)
   ═══════════════════════════════════════════════════════ */
var weaponsEl = document.getElementById('weapons-canvas');
if (weaponsEl) {

  var wc  = weaponsEl.getContext('2d');
  var wW, wH;
  var wPrev = null;

  /* ── Weapon draw functions (normalized, centered at 0,0) */
  var DRAWS = [

    /* 0 — SPEARHEAD */
    function (c) {
      c.beginPath();
      c.moveTo(0,-60); c.lineTo(13,-5); c.lineTo(8,5);
      c.lineTo(8,55);  c.lineTo(-8,55); c.lineTo(-8,5);
      c.lineTo(-13,-5); c.closePath(); c.stroke();
    },

    /* 1 — SWORD */
    function (c) {
      c.beginPath();
      c.moveTo(0,-90); c.lineTo(5,-10); c.lineTo(5,18);
      c.lineTo(22,22); c.lineTo(22,32); c.lineTo(5,35);
      c.lineTo(5,58);  c.lineTo(8,64);  c.lineTo(0,70);
      c.lineTo(-8,64); c.lineTo(-5,58); c.lineTo(-5,35);
      c.lineTo(-22,32);c.lineTo(-22,22);c.lineTo(-5,18);
      c.lineTo(-5,-10); c.closePath(); c.stroke();
    },

    /* 2 — LONGBOW */
    function (c) {
      c.beginPath();
      c.arc(42, 0, 62, Math.PI * 0.62, Math.PI * 1.38);
      c.stroke();
      var ang = Math.PI * 0.62;
      var sx  = 42 - 62 * Math.cos(ang);
      var sy  =    - 62 * Math.sin(ang);
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx, -sy); c.stroke();
    },

    /* 3 — CANNON */
    function (c) {
      c.strokeRect(-10,-62, 20, 80);
      c.strokeRect(-24, 15, 48, 22);
      c.beginPath(); c.arc(-16, 41, 12, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc( 16, 41, 12, 0, Math.PI * 2); c.stroke();
      c.beginPath();
      c.moveTo(-8,-62); c.lineTo(-12,-76);
      c.moveTo( 8,-62); c.lineTo( 12,-76);
      c.moveTo( 0,-62); c.lineTo(  0,-78);
      c.stroke();
    },

    /* 4 — MUSKET */
    function (c) {
      c.beginPath();
      c.moveTo(-4,-88); c.lineTo(-4, 48); c.lineTo(-14, 80);
      c.stroke();
      c.beginPath();
      c.moveTo( 4,-88); c.lineTo( 4, 48); c.lineTo( 14, 58);
      c.stroke();
      c.strokeRect(4, 18, 20, 14);
      c.beginPath(); c.moveTo(22,18); c.lineTo(30,11); c.lineTo(27,20); c.stroke();
    },

    /* 5 — REVOLVER */
    function (c) {
      c.strokeRect(-5,-58, 10, 32);
      c.beginPath(); c.arc(13,-20, 16, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(13,-20,  5, 0, Math.PI * 2); c.stroke();
      c.beginPath();
      c.moveTo(-5,-26); c.lineTo(-5, 10); c.lineTo(8, 28); c.lineTo(16,28); c.lineTo(16,-26);
      c.stroke();
      c.beginPath();
      c.moveTo(-5, 10); c.lineTo(-12,44); c.lineTo(-4,54); c.lineTo(8,50); c.lineTo(8,28);
      c.stroke();
    },

    /* 6 — MACHINE GUN */
    function (c) {
      c.strokeRect(-5,-84, 10, 60);
      c.strokeRect(-13,-24, 26, 34);
      c.beginPath();
      c.moveTo(13, 8); c.lineTo(20,14); c.lineTo(20,42); c.lineTo(8,50); c.lineTo(-2,44); c.lineTo(-2,12);
      c.stroke();
      c.strokeRect(-4, 10, 8, 30);
    },

    /* 7 — TANK */
    function (c) {
      c.strokeRect(-52, 4, 104, 30);
      c.beginPath(); c.arc(0,-6, 24, Math.PI, 0, false); c.closePath(); c.stroke();
      c.strokeRect(-4,-14, 52,  6);
      c.strokeRect(-57, 30, 114, 14);
      [-42,-21,0,21,42].forEach(function (x) {
        c.beginPath(); c.arc(x, 37, 7, 0, Math.PI * 2); c.stroke();
      });
    },

    /* 8 — BAZOOKA */
    function (c) {
      c.strokeRect(-9,-72, 18, 112);
      c.beginPath(); c.moveTo(-11,-72); c.lineTo(11,-72); c.stroke();
      c.beginPath();
      c.moveTo(-9,10); c.lineTo(-24,32); c.lineTo(-24,44); c.lineTo(-9,44);
      c.stroke();
      c.strokeRect(9, 0, 15, 20);
    },

    /* 9 — MISSILE */
    function (c) {
      c.beginPath();
      c.moveTo(0,-82); c.lineTo(11,-55); c.lineTo(11,42); c.lineTo(-11,42); c.lineTo(-11,-55);
      c.closePath(); c.stroke();
      c.beginPath(); c.moveTo(11,26); c.lineTo(28,52); c.lineTo(11,42); c.stroke();
      c.beginPath(); c.moveTo(-11,26); c.lineTo(-28,52); c.lineTo(-11,42); c.stroke();
      c.beginPath();
      c.moveTo(-9,42); c.lineTo(-13,60); c.lineTo(13,60); c.lineTo(9,42);
      c.stroke();
    },

    /* 10 — MUSHROOM CLOUD */
    function (c) {
      c.beginPath();
      c.moveTo(-10,82); c.lineTo(-8,20); c.lineTo(8,20); c.lineTo(10,82);
      c.stroke();
      c.beginPath(); c.ellipse(0, 14, 22, 10, 0, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.ellipse(0,-20, 40, 30, 0, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.ellipse(0,-50, 30, 16, 0, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(-20,-52,  9, Math.PI, 0); c.stroke();
      c.beginPath(); c.arc(  0,-58, 11, Math.PI, 0); c.stroke();
      c.beginPath(); c.arc( 20,-52,  9, Math.PI, 0); c.stroke();
    },
  ];

  /* ── Instance layout ─────────────────────────────────
     8 instances placed in the peripheral zones:
     left edge, right edge, bottom corners — never
     clustered in the dead-center of the viewport.      */
  var LAYOUTS = [
    { bx: 0.06, by: 0.22 }, { bx: 0.92, by: 0.18 },
    { bx: 0.04, by: 0.60 }, { bx: 0.94, by: 0.65 },
    { bx: 0.12, by: 0.88 }, { bx: 0.86, by: 0.85 },
    { bx: 0.08, by: 0.42 }, { bx: 0.90, by: 0.44 },
  ];

  var instances = [];

  function initWeapons() {
    instances = LAYOUTS.map(function (l, i) {
      return {
        x:         l.bx * wW,
        y:         l.by * wH,
        bx:        l.bx,
        by:        l.by,
        scale:     0.35 + Math.random() * 0.40,
        widx:      i % DRAWS.length,
        timer:     Math.random() * 9,
        speed:     28 + Math.random() * 27,   // px/sec — visible cinematic drift
      };
    });
  }

  var CYCLE      = 9;      // seconds per weapon
  var FADE_IN    = 1.8;    // fade-in duration
  var FADE_OUT   = 1.8;    // fade-out duration

  function drawWeapons(ts) {
    var dt = wPrev === null ? 0 : Math.min((ts - wPrev) / 1000, 0.1);
    wPrev = ts;

    wc.clearRect(0, 0, wW, wH);

    instances.forEach(function (inst) {
      inst.timer += dt;
      inst.x     -= inst.speed * dt;

      // wrap off-screen left → reappear right
      if (inst.x < -120) { inst.x = wW + 100; }

      // change weapon at cycle boundary
      if (inst.timer >= CYCLE) {
        inst.timer -= CYCLE;
        inst.widx   = (inst.widx + 1) % DRAWS.length;
      }

      // opacity envelope
      var t = inst.timer;
      var alpha;
      if      (t < FADE_IN)             alpha = t / FADE_IN;
      else if (t > CYCLE - FADE_OUT)    alpha = (CYCLE - t) / FADE_OUT;
      else                               alpha = 1;

      alpha = Math.max(0, Math.min(1, alpha));
      if (alpha < 0.01) return;

      wc.save();
      wc.translate(inst.x, inst.y);
      wc.scale(inst.scale, inst.scale);
      wc.strokeStyle = 'rgba(196,147,42,' + alpha + ')';
      wc.lineWidth   = 1.6 / inst.scale;
      wc.fillStyle   = 'transparent';
      wc.lineCap     = 'round';
      wc.lineJoin    = 'round';

      DRAWS[inst.widx](wc);

      wc.restore();
    });

    requestAnimationFrame(drawWeapons);
  }

  function resizeWeapons() {
    wW = window.innerWidth;
    wH = window.innerHeight;
    weaponsEl.width  = wW;
    weaponsEl.height = wH;
    // reposition instances proportionally
    if (instances.length) {
      instances.forEach(function (inst, i) {
        inst.y = LAYOUTS[i].by * wH;
        // keep x relative to current scroll
      });
    }
  }

  window.addEventListener('resize', resizeWeapons);
  resizeWeapons();
  initWeapons();
  requestAnimationFrame(drawWeapons);
}

})();
