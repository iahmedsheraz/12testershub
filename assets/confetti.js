(function () {
  'use strict';

  console.log('[confetti] script loaded');   // ← debug: check console

  // Respect accessibility (remove this block for testing)
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    console.log('[confetti] skipped — reduced motion');
    return;
  }

  // Create canvas dynamically (cannot be stripped by CMS)
  var canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:fixed!important;top:0!important;left:0!important;' +
    'width:100vw!important;height:100vh!important;' +
    'pointer-events:none!important;z-index:2147483647!important;';
  document.body.appendChild(canvas);
  console.log('[confetti] canvas added');

  var ctx = canvas.getContext('2d');
  var particles = [];
  var running = false;

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    canvas.width  = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function makeParticle(x, y, colors) {
    var angle = Math.random() * Math.PI * 2;
    var speed = 6 + Math.random() * 10;
    var isCircle = Math.random() > 0.55;
    return {
      x:x, y:y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      gravity: 0.28 + Math.random() * 0.12,
      drag: 0.985,
      size: 5 + Math.random() * 7,
      color: colors[(Math.random() * colors.length) | 0],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.35,
      life: 1,
      decay: 0.007 + Math.random() * 0.008,
      shape: isCircle ? 'circle' : 'rect'
    };
  }

  function burst(x, y, count, colors) {
    for (var i = 0; i < count; i++) particles.push(makeParticle(x, y, colors));
    if (!running) start();
  }

  function loop() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.life -= p.decay;

      if (p.life <= 0 || p.y > window.innerHeight + 40) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
      }
      ctx.restore();
    }
    if (particles.length > 0) requestAnimationFrame(loop);
    else running = false;
  }

  function start() { running = true; requestAnimationFrame(loop); }

  var palette = ['#C8FF00', '#0B7A4B', '#25D366', '#FFD700', '#FF6B6B', '#4ECDC4'];

  function celebrate() {
    console.log('[confetti] celebrate!');
    var w = window.innerWidth;
    var h = window.innerHeight;
    var shots = 0;
    var interval = setInterval(function () {
      burst(0, h * 0.72, 14, palette);
      burst(w, h * 0.72, 14, palette);
      if (shots % 2 === 0) burst(w * 0.5, h * 0.15, 10, palette);
      shots++;
      if (shots >= 10) clearInterval(interval);
    }, 250);
  }

  // Wait for DOM ready if needed
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(celebrate, 600);
    });
  } else {
    setTimeout(celebrate, 600);
  }

  // Expose for manual testing from console
  window.__confettiTest = celebrate;

})();
