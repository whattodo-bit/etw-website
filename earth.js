/* ============================================
   ETW — Earth Canvas Background (articles page)
============================================ */
(function(){
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize(){
    W = canvas.width  = window.innerWidth  * devicePixelRatio;
    H = canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }

  function frame(t){
    ctx.clearRect(0, 0, W, H);

    const cx = W * 0.72;
    const cy = H * 0.50;
    const r  = Math.min(W, H) * 0.34;

    /* dark base sphere */
    const base = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    base.addColorStop(0,   'rgba(22,18,12,0.90)');
    base.addColorStop(0.6, 'rgba(11,9,16,0.97)');
    base.addColorStop(1,   'rgba(6,5,8,1)');
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    /* day-side glow — upper left */
    const offX = cx - r * 0.28;
    const offY = cy - r * 0.22;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    const day = ctx.createRadialGradient(offX, offY, 0, cx, cy, r);
    day.addColorStop(0,    'rgba(200,169,110,0.24)');
    day.addColorStop(0.4,  'rgba(180,145,88,0.10)');
    day.addColorStop(0.75, 'rgba(140,110,60,0.03)');
    day.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = day;
    ctx.fillRect(0, 0, W, H);

    /* rotating surface lines */
    const surfRot = t * 0.000055;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(surfRot);
    ctx.lineWidth = 0.8 * devicePixelRatio;
    for (let i = -4; i <= 4; i++){
      const y  = r * 0.18 * i;
      const hw = Math.sqrt(Math.max(0, r * r - y * y)) * 0.92;
      ctx.beginPath();
      ctx.moveTo(-hw, y);
      ctx.lineTo( hw, y);
      ctx.strokeStyle = `rgba(200,169,110,${0.04 + Math.abs(i) * 0.005})`;
      ctx.stroke();
    }
    ctx.restore();

    /* cloud layer — slightly faster rotation */
    const cloudRot = t * 0.000075;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(cloudRot);
    for (let i = 0; i < 6; i++){
      const a   = (i / 6) * Math.PI * 2 + 0.4;
      const cr  = r * (0.52 + (i % 3) * 0.12);
      const cw  = r * 0.22;
      const cx2 = Math.cos(a) * cr;
      const cy2 = Math.sin(a) * cr * 0.38;
      const cg  = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, cw);
      cg.addColorStop(0, 'rgba(220,195,145,0.07)');
      cg.addColorStop(1, 'rgba(220,195,145,0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.ellipse(cx2, cy2, cw, cw * 0.35, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.restore(); /* end clip */

    /* atmosphere rim */
    const atmo = ctx.createRadialGradient(cx, cy, r * 0.92, cx, cy, r * 1.06);
    atmo.addColorStop(0, 'rgba(200,169,110,0.09)');
    atmo.addColorStop(1, 'rgba(200,169,110,0)');
    ctx.fillStyle = atmo;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.06, 0, Math.PI * 2);
    ctx.fill();

    /* vignette — keeps left-side text readable */
    const vig = ctx.createRadialGradient(W * 0.28, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.75);
    vig.addColorStop(0, 'rgba(6,5,8,0)');
    vig.addColorStop(1, 'rgba(6,5,8,0.85)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);
})();
