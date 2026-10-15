// Canvas Flappy engine. Framework-free; React only mounts it and listens to callbacks.
//
// The world uses a fixed virtual height (H) so the game feels identical on every screen.
// The virtual width follows the screen's aspect ratio, so phones and desktops both fill
// the frame without stretching.

const H = 640;
const GROUND = 84;
const BIRD_X_RATIO = 0.3;
const BIRD_R = 15;
const GRAVITY = 1900;
const FLAP_VELOCITY = -560;
const MAX_FALL = 900;
const PIPE_W = 78;
const STEP = 1 / 120; // fixed physics timestep (same feel at 60Hz and 144Hz)

export const MAX_LEVEL = 10;

/**
 * Difficulty goes up in steps: one level every 10 points, maxing out at 100+.
 * Pipes start moving up and down at level 1 (10 points).
 */
export function difficulty(score) {
  const level = Math.min(Math.floor(score / 10), MAX_LEVEL);
  const t = level / MAX_LEVEL;
  return {
    level,
    speed: 190 + 210 * t,            // px/s the world scrolls: 190 -> 400
    gap: 175 - 60 * t,               // vertical opening between pipes: 175 -> 115
    spacing: 250 - 55 * t,           // horizontal distance between pipes: 250 -> 195
    wobble: level >= 1 ? 15 + (55 * (level - 1)) / (MAX_LEVEL - 1) : 0, // up/down range: 15 -> 70
    wobbleSpeed: 1.8 + 2.2 * t,      // how fast moving pipes swing
  };
}

export function createGame(canvas, { onScore, onDeath, onStart } = {}) {
  const ctx = canvas.getContext("2d");
  let W = 400;
  let scale = 1;
  let dpr = 1;

  const s = {
    phase: "ready", // ready -> playing -> dead
    bird: { y: H * 0.42, vy: 0, rot: 0, flapT: 0 },
    pipes: [],
    score: 0,
    time: 0,
    groundX: 0,
    flash: 0,
    deadT: 0,
  };

  const clouds = Array.from({ length: 6 }, (_, i) => ({
    x: i * 170 + Math.random() * 80,
    y: 40 + Math.random() * 180,
    r: 22 + Math.random() * 18,
  }));

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    scale = rect.height / H;
    W = rect.width / scale;
  }

  const birdX = () => W * BIRD_X_RATIO;

  function spawnPipe(x) {
    const d = difficulty(s.score);
    const margin = 70;
    const minY = margin + d.gap / 2;
    const maxY = H - GROUND - margin - d.gap / 2;
    s.pipes.push({
      x,
      baseY: minY + Math.random() * (maxY - minY),
      gap: d.gap,
      wobble: d.wobble,
      wobbleSpeed: d.wobbleSpeed,
      phase: Math.random() * Math.PI * 2,
      passed: false,
    });
  }

  function pipeY(p) {
    return p.baseY + Math.sin(s.time * p.wobbleSpeed + p.phase) * p.wobble;
  }

  function flap() {
    if (s.phase === "dead") return;
    if (s.phase === "ready") {
      s.phase = "playing";
      spawnPipe(W + 60);
      onStart?.();
    }
    s.bird.vy = FLAP_VELOCITY;
    s.bird.flapT = 0.25;
  }

  function die() {
    if (s.phase === "dead") return;
    s.phase = "dead";
    s.flash = 1;
    s.deadT = 0;
    onDeath?.(s.score);
  }

  function hitsPipe(p) {
    const bx = birdX();
    const by = s.bird.y;
    const gy = pipeY(p);
    const top = { x: p.x, y: -1000, w: PIPE_W, h: gy - p.gap / 2 + 1000 };
    const bot = { x: p.x, y: gy + p.gap / 2, w: PIPE_W, h: H };
    return [top, bot].some((r) => {
      const cx = Math.max(r.x, Math.min(bx, r.x + r.w));
      const cy = Math.max(r.y, Math.min(by, r.y + r.h));
      const dx = bx - cx;
      const dy = by - cy;
      return dx * dx + dy * dy < (BIRD_R - 2) ** 2; // a little forgiving
    });
  }

  function update(dt) {
    s.time += dt;
    s.flash = Math.max(0, s.flash - dt * 3);
    s.bird.flapT = Math.max(0, s.bird.flapT - dt);
    const d = difficulty(s.score);
    const b = s.bird;

    if (s.phase === "ready") {
      b.y = H * 0.42 + Math.sin(s.time * 3) * 10;
      s.groundX = (s.groundX + d.speed * dt) % 40;
      return;
    }

    if (s.phase === "dead") {
      s.deadT += dt;
      if (b.y < H - GROUND - BIRD_R) {
        b.vy = Math.min(b.vy + GRAVITY * dt, MAX_FALL);
        b.y = Math.min(b.y + b.vy * dt, H - GROUND - BIRD_R);
        b.rot = Math.min(b.rot + dt * 8, Math.PI / 2);
      }
      return;
    }

    // playing
    b.vy = Math.min(b.vy + GRAVITY * dt, MAX_FALL);
    b.y += b.vy * dt;
    const targetRot = Math.max(-0.45, Math.min(b.vy / 600, 1.4));
    b.rot += (targetRot - b.rot) * Math.min(1, dt * 12);

    s.groundX = (s.groundX + d.speed * dt) % 40;
    for (const p of s.pipes) p.x -= d.speed * dt;
    for (const c of clouds) {
      c.x -= d.speed * 0.15 * dt;
      if (c.x < -80) { c.x = W + 80; c.y = 40 + Math.random() * 180; }
    }

    const last = s.pipes[s.pipes.length - 1];
    if (!last || last.x < W + 40 - d.spacing - PIPE_W) spawnPipe((last?.x ?? W) + d.spacing + PIPE_W);
    s.pipes = s.pipes.filter((p) => p.x > -PIPE_W - 20);

    for (const p of s.pipes) {
      if (!p.passed && p.x + PIPE_W < birdX() - BIRD_R) {
        p.passed = true;
        s.score += 1;
        onScore?.(s.score);
      }
      if (hitsPipe(p)) return die();
    }

    if (b.y + BIRD_R >= H - GROUND) { b.y = H - GROUND - BIRD_R; return die(); }
    if (b.y - BIRD_R < -60) b.y = -60 + BIRD_R; // can't fly over pipes
  }

  // ---------- drawing ----------
  function draw() {
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#38bdf8");
    sky.addColorStop(0.7, "#bae6fd");
    sky.addColorStop(1, "#e0f2fe");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (const c of clouds) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.arc(c.x + c.r, c.y + 6, c.r * 0.8, 0, Math.PI * 2);
      ctx.arc(c.x - c.r, c.y + 8, c.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // distant hills
    ctx.fillStyle = "#86efac";
    ctx.beginPath();
    ctx.moveTo(0, H - GROUND);
    for (let x = 0; x <= W + 20; x += 20) {
      ctx.lineTo(x, H - GROUND - 40 - Math.sin((x + s.time * 15) / 70) * 18);
    }
    ctx.lineTo(W, H - GROUND);
    ctx.fill();

    for (const p of s.pipes) drawPipe(p);
    drawGround();
    drawBird();

    if (s.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${s.flash * 0.8})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawPipe(p) {
    const gy = pipeY(p);
    const topH = gy - p.gap / 2;
    const botY = gy + p.gap / 2;
    const grad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
    grad.addColorStop(0, "#16a34a");
    grad.addColorStop(0.4, "#4ade80");
    grad.addColorStop(1, "#15803d");
    ctx.fillStyle = grad;
    ctx.strokeStyle = "#14532d";
    ctx.lineWidth = 3;

    const body = (x, y, w, h) => { ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h); };
    body(p.x + 4, -4, PIPE_W - 8, topH - 26 + 4);
    body(p.x, topH - 28, PIPE_W, 28);
    body(p.x + 4, botY + 26, PIPE_W - 8, H - botY);
    body(p.x, botY, PIPE_W, 28);
  }

  function drawGround() {
    const y = H - GROUND;
    ctx.fillStyle = "#65a30d";
    ctx.fillRect(0, y, W, 16);
    ctx.fillStyle = "#4d7c0f";
    for (let x = -s.groundX; x < W + 40; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, y + 16);
      ctx.lineTo(x + 20, y);
      ctx.lineTo(x + 34, y);
      ctx.lineTo(x + 14, y + 16);
      ctx.fill();
    }
    ctx.fillStyle = "#fcd34d";
    ctx.fillRect(0, y + 16, W, GROUND - 16);
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(0, y + 16, W, 4);
    ctx.strokeStyle = "#14532d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  function drawBird() {
    const b = s.bird;
    ctx.save();
    ctx.translate(birdX(), b.y);
    ctx.rotate(b.rot);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#7c2d12";

    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_R + 3, BIRD_R, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // wing flaps quickly after a jump
    const wing = s.phase === "dead" ? 0 : Math.sin(s.time * (b.flapT > 0 ? 40 : 12)) * 6;
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.ellipse(-6, 3 + wing * 0.5, 9, 6 - Math.abs(wing) * 0.3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(7, -6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    if (s.phase === "dead") {
      ctx.lineWidth = 2;
      ctx.moveTo(5, -8); ctx.lineTo(10, -3); ctx.moveTo(10, -8); ctx.lineTo(5, -3);
      ctx.strokeStyle = "#111";
      ctx.stroke();
    } else {
      ctx.arc(9, -6, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#f97316";
    ctx.strokeStyle = "#7c2d12";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(24, 3);
    ctx.lineTo(12, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // ---------- loop ----------
  let raf = 0;
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    acc += Math.min((now - last) / 1000, 0.1); // clamp after tab switches
    last = now;
    while (acc >= STEP) { update(STEP); acc -= STEP; }
    draw();
    raf = requestAnimationFrame(frame);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  raf = requestAnimationFrame(frame);

  return {
    flap,
    get phase() { return s.phase; },
    get deadFor() { return s.deadT; },
    get state() { return s; }, // handy for debugging / tests
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); },
  };
}
