/* ============================================
   ETW — Solar System Canvas Background
============================================ */
(function(){
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, CX, CY, unit, stars = [], asteroids = [];

  const PLANETS = [
    {name:'Mercury',a:0.075,e:0.205,inc:0.06, speed:4.15,  r:2.0, tint:1.00, rot:0.05},
    {name:'Venus',  a:0.120,e:0.007,inc:0.04, speed:1.62,  r:3.2, tint:0.95, rot:0.02},
    {name:'Earth',  a:0.165,e:0.017,inc:0.00, speed:1.00,  r:3.4, tint:0.90, rot:0.10, moon:true},
    {name:'Mars',   a:0.220,e:0.093,inc:0.03, speed:0.53,  r:2.6, tint:0.82, rot:0.09},
    {name:'Jupiter',a:0.305,e:0.049,inc:0.02, speed:0.084, r:8.2, tint:0.98, rot:0.22, bands:true},
    {name:'Saturn', a:0.390,e:0.057,inc:0.04, speed:0.034, r:6.8, tint:1.00, rot:0.18, rings:true},
    {name:'Uranus', a:0.468,e:0.046,inc:0.01, speed:0.012, r:5.0, tint:0.88, rot:0.14},
    {name:'Neptune',a:0.535,e:0.010,inc:0.03, speed:0.006, r:4.8, tint:0.85, rot:0.12}
  ];

  function mulberry32(seed){
    return function(){
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function initStars(){
    const rand = mulberry32(1337);
    stars = [];
    for (let i = 0; i < 160; i++){
      stars.push({
        x: rand(), y: rand(),
        r: rand() * 1.1 + 0.2,
        a: rand() * 0.5 + 0.25
      });
    }
  }

  function initAsteroids(){
    const rand = mulberry32(4242);
    asteroids = [];
    for (let i = 0; i < 90; i++){
      const r = 0.235 + rand() * 0.055;
      const ang = rand() * Math.PI * 2;
      asteroids.push({ r, ang, speed: 0.18 + rand() * 0.15, s: rand() * 0.8 + 0.2 });
    }
  }

  function resize(){
    W = canvas.width = window.innerWidth * devicePixelRatio;
    H = canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    CX = W / 2; CY = H / 2;
    unit = Math.min(W, H) * 0.88;
  }

  function drawStars(){
    for (const s of stars){
      ctx.globalAlpha = s.a;
      ctx.fillStyle = 'rgba(200,169,110,1)';
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r * devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawSun(t){
    const minDim = Math.min(W, H);
    const glowR = minDim * 0.03;
    const coreR = minDim * 0.009;

    const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, glowR);
    grad.addColorStop(0,    'rgba(226,201,138,0.55)');
    grad.addColorStop(0.45, 'rgba(200,169,110,0.22)');
    grad.addColorStop(1,    'rgba(200,169,110,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(CX, CY, glowR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(234,210,150,0.95)';
    ctx.beginPath();
    ctx.arc(CX, CY, coreR, 0, Math.PI * 2);
    ctx.fill();

    const spokeLen = glowR * 1.25;
    const rot = t * 0.00012;
    ctx.strokeStyle = 'rgba(200,169,110,0.28)';
    ctx.lineWidth = 1 * devicePixelRatio;
    for (let i = 0; i < 12; i++){
      const a = (i / 12) * Math.PI * 2 + rot;
      const x1 = CX + Math.cos(a) * coreR * 1.6;
      const y1 = CY + Math.sin(a) * coreR * 1.6;
      const x2 = CX + Math.cos(a) * spokeLen;
      const y2 = CY + Math.sin(a) * spokeLen;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  function drawOrbit(p){
    const a = p.a * unit;
    const b = a * Math.sqrt(1 - p.e * p.e);
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(p.inc);
    ctx.strokeStyle = 'rgba(200,169,110,0.12)';
    ctx.lineWidth = 1 * devicePixelRatio;
    ctx.beginPath();
    ctx.ellipse(0, 0, a, b, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function planetPos(p, t){
    const a = p.a * unit;
    const b = a * Math.sqrt(1 - p.e * p.e);
    const ang = t * 0.00018 * p.speed;
    const lx = Math.cos(ang) * a;
    const ly = Math.sin(ang) * b;
    const cos = Math.cos(p.inc), sin = Math.sin(p.inc);
    return { x: CX + lx * cos - ly * sin, y: CY + lx * sin + ly * cos };
  }

  function planetColor(tint, alpha){
    const r = Math.round(200 * tint + 26);
    const g = Math.round(169 * tint + 22);
    const b = Math.round(110 * tint + 18);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function drawPlanet(p, t){
    const pos = planetPos(p, t);
    const rad = p.r * devicePixelRatio;
    const rotAng = t * 0.0004 * p.rot;

    ctx.fillStyle = planetColor(p.tint, 0.9);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, rad, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = planetColor(p.tint, 0.4);
    ctx.lineWidth = 0.8 * devicePixelRatio;
    ctx.stroke();

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(rotAng);
    ctx.strokeStyle = 'rgba(11,9,16,0.45)';
    ctx.lineWidth = 0.7 * devicePixelRatio;
    ctx.beginPath();
    ctx.moveTo(-rad * 0.9, 0);
    ctx.lineTo(rad * 0.9, 0);
    ctx.stroke();

    if (p.bands){
      ctx.strokeStyle = 'rgba(11,9,16,0.35)';
      for (let i = -2; i <= 2; i++){
        if (i === 0) continue;
        ctx.beginPath();
        const y = rad * 0.35 * i;
        const w = Math.sqrt(Math.max(0, rad * rad - y * y)) * 0.95;
        ctx.moveTo(-w, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Saturn — two clean elegant rings, small enough to not overlap nearby orbits
    if (p.rings){
      const ringScales = [1.22, 1.38];
      const ringTilt   = 0.36;
      for (let i = 0; i < 2; i++){
        const ringRot = t * (0.00022 + i * 0.0001);
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(ringRot);
        ctx.strokeStyle = planetColor(p.tint, i === 0 ? 0.6 : 0.35);
        ctx.lineWidth = 1 * devicePixelRatio;
        ctx.beginPath();
        ctx.ellipse(0, 0, rad * ringScales[i], rad * ringScales[i] * ringTilt, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    if (p.moon){
      const moonOrbitR = rad * 3.2;
      const moonAng = t * 0.0009;
      ctx.strokeStyle = 'rgba(200,169,110,0.09)';
      ctx.lineWidth = 0.8 * devicePixelRatio;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, moonOrbitR, 0, Math.PI * 2);
      ctx.stroke();
      const mx = pos.x + Math.cos(moonAng) * moonOrbitR;
      const my = pos.y + Math.sin(moonAng) * moonOrbitR;
      ctx.fillStyle = planetColor(0.7, 0.85);
      ctx.beginPath();
      ctx.arc(mx, my, rad * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawAsteroids(t){
    ctx.fillStyle = 'rgba(200,169,110,0.45)';
    for (const a of asteroids){
      const ang = a.ang + t * 0.00008 * a.speed;
      const r = a.r * unit;
      const x = CX + Math.cos(ang) * r;
      const y = CY + Math.sin(ang) * r * 0.98;
      ctx.beginPath();
      ctx.arc(x, y, a.s * devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(t){
    ctx.clearRect(0, 0, W, H);
    drawStars();
    for (const p of PLANETS) drawOrbit(p);
    drawAsteroids(t);
    drawSun(t);
    for (const p of PLANETS) drawPlanet(p, t);
    requestAnimationFrame(frame);
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function start(){
    resize(); initStars(); initAsteroids();
    if (reduceMotion){ frame(0); }
    else { requestAnimationFrame(frame); }
  }

  window.addEventListener('resize', () => { resize(); initStars(); initAsteroids(); });
  start();
})();
