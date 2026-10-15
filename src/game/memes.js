// Meme background: an endless parade of original meme-style doodles, emoji and
// teasing captions that drift behind the pipes, plus a "breaking news" ticker on
// the ground. All art is drawn with canvas shapes (no copyrighted meme photos).

// ---------- content ----------
const PHRASES = [
  // doge-speak
  "such fly", "very pipe", "much wow", "so gravity", "wow", "very tap", "such skill", "amaze",
  "much flap", "so pro", "very panic", "such fail", "wow many pipe", "very bird", "much stress",
  // English internet slang
  "skill issue", "touch grass", "ratio", "no cap", "it's giving bird", "main character", "NPC energy",
  "bro thinks he's a pilot", "lag? sure", "certified flapper", "ok boomer", "send help", "copium",
  "not the pipe again", "hold my juice", "rage quit loading…", "git gud", "big yikes", "sus",
  // Thai teasing
  "ปังมาก", "ตึงจัด", "555555", "บินดีๆ สิ", "ไม่ไหวแล้วแม่", "อย่างโหด", "นกไม่ใช่ไก่", "ใจเย็นๆ",
  "ตัวตึง", "สุดจัด", "กดแรงไปป่าว", "นิ้วลั่นอีกละ", "จะร้องไห้", "ไหวไหมเนี่ย", "โปรเพลเยอร์ตัวจริง",
  "เกือบแล้วๆ", "ท่อมาแล้ววว", "ตั้งสติ!", "นี่มันนกหรือหิน", "ใครสอนบินเนี่ย", "แค่นี้เองหรอ",
  "อย่าเพิ่งตาย", "ฝีมือล้วนๆ", "ดวงล้วนๆ", "ไปต่อ!", "คะแนนนี้อายเพื่อน", "ขิงเพื่อนได้แล้ว",
  "กำลังใจมาเต็ม", "เครียดแทนนก", "เดี๋ยวก็ชน", "อะไรจะขนาดนั้น", "พีคมาก", "ฟินเว่อร์",
  "หัวร้อนยัง?", "อีกนิดเดียว", "มือสั่นป่าว", "นกบินหรือนกตก", "แอบเก่งนะเนี่ย",
];

const HEADLINES = [
  "ข่าวด่วน: นกบินชนท่ออีกแล้ว ผู้เชี่ยวชาญชี้ \"skill issue\"",
  "BREAKING: local bird refuses to touch grass, keeps touching pipes",
  "นักวิทยาศาสตร์ยืนยัน กดรัวๆ ไม่ได้ช่วยให้บินดีขึ้น",
  "ตลาดหุ้นนก: STONKS ขึ้น 300% หลังผู้เล่นผ่านท่อที่ 10",
  "Weather: 100% chance of pipes",
  "ผลสำรวจ: 9 ใน 10 คนโทษว่าเน็ตแลค",
  "นกตัวนี้ไม่ใช่ไก่ ย้ำ ไม่ใช่ไก่",
  "Experts baffled as bird flies straight into obvious pipe",
  "ด่วน! เพื่อนในกลุ่ม LINE กำลังแซงคะแนนคุณ",
  "Shiba spotted wearing sunglasses at level 10, refuses to comment",
  "ท่อประกาศ: \"เราไม่ได้ตั้งใจขวาง\"",
  "Study finds 0% of players read this ticker while playing",
  "กรมอุตุฯ เตือน ระวังท่อตกหนักทั่วประเทศ",
  "Bird files complaint against gravity, case dismissed",
];

const LEVEL_UP = [
  "LEVEL UP!", "ตึงขึ้นอีกขั้น", "เริ่มเหงื่อตกยัง?", "NOW WE'RE COOKING", "โหดขึ้นแล้วนะ",
  "หยุดตอนนี้ยังทัน", "MAXIMUM EFFORT", "เพื่อนเริ่มกลัวแล้ว", "SPEED RUN?", "ใจสู้ไหม",
];

const EMOJI = [
  "😂", "💀", "🗿", "🤡", "🔥", "🙈", "😭", "🥴", "🤣", "🫠", "👀", "🐔", "🦆", "🍌", "💅",
  "🤌", "😤", "🚀", "🐸", "😎", "🤯", "🥲", "👻", "🍗", "🧂", "📉", "📈", "🫡", "🤪", "😱",
];

const COLORS = ["#ff2bd6", "#00c853", "#ff3d00", "#2962ff", "#ffd600", "#aa00ff", "#00b8d4", "#ff6d00"];
const DOGE_FONT = '"Comic Neue", "Comic Sans MS", "Mitr", cursive';
const IMPACT_FONT = '"Anton", "Mitr", Impact, "Arial Narrow", sans-serif';
const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
const DOODLES = ["shiba", "cool-shiba", "cat", "stonks", "notstonks", "bonk", "brain", "chicken", "moai", "clown"];

// Real meme photos (public-domain images with meme captions). The app registers them at
// startup; until they load, the parade simply uses doodles instead.
const PHOTOS = [];
export function registerMemeImages(list) {
  for (const { src, top = "", bottom = "" } of list) {
    const img = new Image();
    img.onload = () => PHOTOS.push({ img, top, bottom });
    img.src = src;
  }
}

/** Shuffle bag: hands out every item once, in random order, before repeating. */
function bag(items) {
  let pool = [];
  return () => {
    if (!pool.length) {
      pool = items.slice();
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
    }
    return pool.pop();
  };
}

export const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function createMemeLayer(ctx, H, GROUND) {
  const nextPhrase = bag(PHRASES);
  const nextEmoji = bag(EMOJI);
  const nextDoodle = bag(DOODLES);
  const nextColor = bag(COLORS);
  const nextLevelUp = bag(LEVEL_UP);
  let photoBag = null;
  let photoCount = 0;
  const nextPhoto = () => {
    if (photoCount !== PHOTOS.length) { photoBag = bag(PHOTOS); photoCount = PHOTOS.length; }
    return photoBag();
  };
  const ticker = HEADLINES.slice().sort(() => Math.random() - 0.5).join("     •     ") + "     •     ";
  let tickerX = 0;
  let tickerW = 0;
  let pop = null; // big level-up caption { text, t }

  // Two depths: far items are small, faded and slow; near items are bigger and faster.
  const LAYERS = [
    { parallax: 0.16, idle: 14, gap: [-15, 55], alpha: 0.6, scale: 0.7 },
    { parallax: 0.38, idle: 30, gap: [35, 115], alpha: 0.9, scale: 1 },
  ];
  const items = [[], []];
  // Horizontal lanes keep neighbours from piling up at the same height.
  const LANES = 6;
  const nextLane = [bag([...Array(LANES).keys()]), bag([...Array(LANES).keys()])];

  function spawn(layer, x) {
    const L = LAYERS[layer];
    const roll = Math.random();
    const photoShare = PHOTOS.length ? 0.18 : 0;
    const kind = roll < 0.45 ? "text" : roll < 0.65 ? "emoji" : roll < 1 - photoShare ? "doodle" : "photo";
    const item = {
      kind,
      x,
      y: 50 + ((nextLane[layer]() + 0.2 + Math.random() * 0.6) / LANES) * (H - GROUND - 120),
      rot: (Math.random() - 0.5) * 0.4,
      bob: Math.random() * Math.PI * 2,
      spin: kind === "emoji" ? (Math.random() - 0.5) * 1.2 : 0,
    };
    if (kind === "text") {
      item.text = nextPhrase();
      item.style = Math.random() < 0.6 ? "doge" : "impact";
      item.color = nextColor();
      item.size = (item.style === "impact" ? 26 : 22) * L.scale + Math.random() * 10;
    } else if (kind === "emoji") {
      item.text = nextEmoji();
      item.size = (34 + Math.random() * 20) * L.scale;
    } else if (kind === "photo") {
      item.photo = nextPhoto();
      item.size = (40 + Math.random() * 12) * L.scale;
    } else {
      item.doodle = nextDoodle();
      item.size = (34 + Math.random() * 14) * L.scale;
    }
    item.w = estimateWidth(item);
    items[layer].push(item);
  }

  function estimateWidth(item) {
    if (item.kind === "text") {
      ctx.font = fontFor(item);
      return ctx.measureText(item.text).width;
    }
    return item.size * (item.kind === "photo" ? 2.8 : 2.4);
  }

  const fontFor = (item) =>
    item.style === "impact" ? `400 ${item.size}px ${IMPACT_FONT}` : `700 ${item.size}px ${DOGE_FONT}`;

  function fill(W) {
    LAYERS.forEach((L, layer) => {
      const list = items[layer];
      let right = list.length ? Math.max(...list.map((i) => i.x + i.w)) : -40;
      while (right < W + 300) {
        const x = right + L.gap[0] + Math.random() * (L.gap[1] - L.gap[0]);
        spawn(layer, x);
        right = x + list[list.length - 1].w;
      }
    });
  }

  return {
    update(dt, W, speed, playing) {
      LAYERS.forEach((L, layer) => {
        const v = playing ? speed * L.parallax : L.idle;
        for (const it of items[layer]) {
          it.x -= v * dt;
          it.bob += dt * 1.6;
          it.rot += it.spin * dt;
        }
        items[layer] = items[layer].filter((it) => it.x + it.w > -60);
      });
      fill(W);
      tickerX += (playing ? speed : 40) * dt;
      if (tickerW && tickerX > tickerW) tickerX -= tickerW;
      if (pop) pop.t += dt;
      if (pop && pop.t > 1.8) pop = null;
    },

    levelUp() {
      pop = { text: nextLevelUp(), t: 0 };
    },

    drawLayer(layer, time) {
      const L = LAYERS[layer];
      for (const it of items[layer]) {
        ctx.save();
        ctx.globalAlpha = L.alpha;
        ctx.translate(it.x, it.y + Math.sin(it.bob) * 6);
        ctx.rotate(it.rot);
        if (it.kind === "text") drawText(it);
        else if (it.kind === "emoji") {
          ctx.font = `${it.size}px ${EMOJI_FONT}`;
          ctx.textBaseline = "middle";
          ctx.fillText(it.text, 0, 0);
        } else if (it.kind === "photo") drawPhoto(it.photo, it.size);
        else drawDoodle(it.doodle, it.size, time);
        ctx.restore();
      }
    },

    drawPop(W) {
      if (!pop) return;
      const k = pop.t;
      const scale = k < 0.25 ? 0.4 + (k / 0.25) * 0.8 : 1.2 - Math.min(0.2, (k - 0.25) * 0.4);
      const alpha = k < 1.3 ? 1 : Math.max(0, 1 - (k - 1.3) / 0.5);
      ctx.save();
      ctx.globalAlpha = alpha * 0.9;
      ctx.translate(W / 2, H * 0.36);
      ctx.rotate(-0.06);
      ctx.scale(scale, scale);
      ctx.font = `400 46px ${IMPACT_FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#000";
      ctx.strokeText(pop.text, 0, 0);
      ctx.fillStyle = "#ffe14d";
      ctx.fillText(pop.text, 0, 0);
      ctx.restore();
    },

    drawTicker(W) {
      const y = H - GROUND + 52;
      ctx.save();
      ctx.fillStyle = "rgba(124, 45, 18, 0.9)";
      ctx.fillRect(0, y - 15, W, 30);
      ctx.fillStyle = "#e11d48";
      ctx.fillRect(0, y - 15, 92, 30);
      ctx.font = `400 16px ${IMPACT_FONT}`;
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText("ข่าวด่วน", 14, y + 1);
      ctx.beginPath();
      ctx.rect(96, y - 15, W - 96, 30);
      ctx.clip();
      ctx.font = `600 15px "Mitr", "Baloo 2", sans-serif`;
      if (!tickerW) tickerW = ctx.measureText(ticker).width;
      ctx.fillStyle = "#fde68a";
      for (let x = 96 - tickerX; x < W; x += tickerW) ctx.fillText(ticker, x, y + 1);
      ctx.restore();
    },
  };

  function drawText(it) {
    ctx.font = fontFor(it);
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    if (it.style === "impact") {
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#000";
      ctx.strokeText(it.text.toUpperCase(), 0, 0);
      ctx.fillStyle = "#fff";
      ctx.fillText(it.text.toUpperCase(), 0, 0);
    } else {
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.strokeText(it.text, 0, 0);
      ctx.fillStyle = it.color;
      ctx.fillText(it.text, 0, 0);
    }
  }

  // Classic meme card: the photo with white impact-style captions top and bottom.
  function drawPhoto({ img, top, bottom }, r) {
    const w = r * 2.6;
    const h = Math.min(w * (img.naturalHeight / img.naturalWidth), w * 1.3);
    const x = 0;
    const y = -h / 2;
    ctx.fillStyle = "#fff";
    ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
    ctx.drawImage(img, x, y, w, h);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
    ctx.save();
    ctx.translate(x + w / 2, 0);
    const size = Math.max(12, r * 0.34);
    if (top) caption(top.toUpperCase(), y + size * 0.75, size);
    if (bottom) caption(bottom.toUpperCase(), -y - size * 0.7, size);
    ctx.restore();
  }

  function caption(text, y, size) {
    ctx.font = `400 ${size}px ${IMPACT_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = size * 0.22;
    ctx.strokeStyle = "#000";
    ctx.strokeText(text, 0, y);
    ctx.fillStyle = "#fff";
    ctx.fillText(text, 0, y);
    ctx.textAlign = "start";
  }

  function drawDoodle(name, r, time) {
    ctx.translate(r, 0);
    switch (name) {
      case "shiba":
        drawShiba(ctx, 0, 0, r, time, 0);
        caption("wow", r * 1.15, r * 0.45);
        break;
      case "cool-shiba":
        drawShiba(ctx, 0, 0, r, time, 1);
        caption("DEAL WITH IT", r * 1.15, r * 0.36);
        break;
      case "cat":
        drawCat(r);
        caption("ไม่ได้ช่วยเลย", r * 1.1, r * 0.36);
        break;
      case "stonks":
        drawChart(r, true);
        break;
      case "notstonks":
        drawChart(r, false);
        break;
      case "bonk":
        drawShiba(ctx, 0, 0, r * 0.8, time, 0);
        drawBat(r, time);
        caption("BONK", -r * 1.05, r * 0.5);
        break;
      case "brain":
        drawBrain(r, time);
        caption("BIG BRAIN", r * 1.05, r * 0.38);
        break;
      case "chicken":
        drawChicken(r);
        caption("ไม่ใช่นก!", r * 1.05, r * 0.4);
        break;
      case "moai":
        drawMoai(r);
        caption("...", r * 1.15, r * 0.5);
        break;
      case "clown":
        drawClown(r);
        caption("ตัวตลกคือเรา", r * 1.1, r * 0.34);
        break;
    }
  }

  function drawCat(r) {
    ctx.lineWidth = r * 0.06;
    ctx.strokeStyle = "#2b2b33";
    ctx.fillStyle = "#cfd3dc";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * r * 0.2, -r * 0.6);
      ctx.lineTo(side * r * 0.75, -r * 1.05);
      ctx.lineTo(side * r * 0.85, -r * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.9, r * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // smug half-closed eyes
    ctx.lineWidth = r * 0.08;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * r * 0.5, -r * 0.12);
      ctx.lineTo(side * r * 0.18, -r * 0.08);
      ctx.stroke();
    }
    ctx.fillStyle = "#f472b6";
    ctx.beginPath();
    ctx.moveTo(-r * 0.08, r * 0.08);
    ctx.lineTo(r * 0.08, r * 0.08);
    ctx.lineTo(0, r * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = r * 0.05;
    ctx.beginPath(); // ω mouth
    ctx.arc(-r * 0.1, r * 0.24, r * 0.1, 0, Math.PI);
    ctx.arc(r * 0.1, r * 0.24, r * 0.1, 0, Math.PI);
    ctx.stroke();
    ctx.lineWidth = r * 0.03;
    for (const side of [-1, 1]) {
      for (const dy of [0.12, 0.26]) {
        ctx.beginPath();
        ctx.moveTo(side * r * 0.4, r * dy);
        ctx.lineTo(side * r * 1.1, r * (dy - 0.06));
        ctx.stroke();
      }
    }
  }

  function drawChart(r, up) {
    const w = r * 2.2;
    const h = r * 1.5;
    ctx.fillStyle = "#0b1020";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = r * 0.05;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = up ? "#22c55e" : "#ef4444";
    ctx.lineWidth = r * 0.12;
    ctx.lineJoin = "round";
    const pts = up
      ? [[-0.9, 0.5], [-0.5, 0.15], [-0.2, 0.3], [0.2, -0.1], [0.45, 0.05], [0.85, -0.5]]
      : [[-0.9, -0.5], [-0.5, -0.1], [-0.2, -0.25], [0.2, 0.15], [0.45, 0.0], [0.85, 0.5]];
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px * w * 0.5, py * h) : ctx.moveTo(px * w * 0.5, py * h)));
    ctx.stroke();
    const [ex, ey] = pts[pts.length - 1];
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.arc(ex * w * 0.5, ey * h, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
    caption(up ? "STONKS" : "NOT STONKS", h / 2 + r * 0.4, r * 0.48);
  }

  function drawBat(r, time) {
    ctx.save();
    ctx.translate(r * 0.55, -r * 0.55);
    ctx.rotate(-0.9 + Math.sin(time * 6) * 0.35);
    ctx.fillStyle = "#a16207";
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = r * 0.05;
    ctx.beginPath();
    ctx.roundRect(-r * 0.1, -r * 1.1, r * 0.26, r * 1.15, r * 0.12);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawBrain(r, time) {
    ctx.save();
    ctx.strokeStyle = "rgba(125, 211, 252, 0.9)";
    ctx.lineWidth = r * 0.06;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + time * 0.8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.8);
      ctx.lineTo(Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.1);
      ctx.stroke();
    }
    ctx.fillStyle = "#f9a8d4";
    ctx.strokeStyle = "#9d174d";
    ctx.lineWidth = r * 0.06;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.9, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = r * 0.05;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.65);
    ctx.lineTo(0, r * 0.65);
    for (const [x, y] of [[-0.5, -0.3], [0.45, -0.25], [-0.4, 0.25], [0.5, 0.3]]) {
      ctx.moveTo(x * r - r * 0.2, y * r);
      ctx.quadraticCurveTo(x * r, y * r - r * 0.25, x * r + r * 0.2, y * r);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawChicken(r) {
    ctx.lineWidth = r * 0.05;
    ctx.strokeStyle = "#57534e";
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(-r * 0.1, -r * 0.75, r * 0.16, 0, Math.PI * 2);
    ctx.arc(r * 0.12, -r * 0.8, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fafaf9";
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.75, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.moveTo(r * 0.55, -r * 0.1);
    ctx.lineTo(r * 0.95, 0);
    ctx.lineTo(r * 0.55, r * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(r * 0.3, -r * 0.22, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMoai(r) {
    ctx.fillStyle = "#78716c";
    ctx.strokeStyle = "#292524";
    ctx.lineWidth = r * 0.05;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.95);
    ctx.lineTo(r * 0.5, -r * 0.95);
    ctx.lineTo(r * 0.6, r * 0.9);
    ctx.lineTo(-r * 0.6, r * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#44403c";
    ctx.fillRect(-r * 0.45, -r * 0.45, r * 0.9, r * 0.14); // heavy brow
    ctx.fillRect(-r * 0.1, -r * 0.3, r * 0.2, r * 0.6); // long nose
    ctx.fillRect(-r * 0.3, r * 0.48, r * 0.6, r * 0.09); // flat mouth
  }

  function drawClown(r) {
    ctx.fillStyle = "#f97316";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(side * r * 0.75, -r * 0.35, r * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#fff7ed";
    ctx.strokeStyle = "#7c2d12";
    ctx.lineWidth = r * 0.05;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(0, r * 0.05, r * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1e3a8a";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(side * r * 0.3, -r * 0.25, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = r * 0.1;
    ctx.beginPath();
    ctx.arc(0, r * 0.2, r * 0.38, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
}

/** An original Doge-style shiba drawn with shapes, glancing sideways. `glasses` 0..1 slides on pixel shades. */
export function drawShiba(ctx, x, y, r, time, glasses) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.18 + Math.sin(time * 0.8) * 0.05);
  ctx.lineWidth = r * 0.05;
  ctx.strokeStyle = "#7a4a12";
  const fur = "#e9a548";
  const cream = "#fbe7c6";

  for (const side of [-1, 1]) {
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.moveTo(side * r * 0.25, -r * 0.7);
    ctx.lineTo(side * r * 0.85, -r * 1.25);
    ctx.lineTo(side * r * 0.95, -r * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f5c7a1";
    ctx.beginPath();
    ctx.moveTo(side * r * 0.42, -r * 0.7);
    ctx.lineTo(side * r * 0.8, -r * 1.05);
    ctx.lineTo(side * r * 0.84, -r * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.86, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = cream;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.32, r * 0.62, r * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const side of [-1, 1]) {
    ctx.beginPath(); // the shiba "eyebrow" dots
    ctx.ellipse(side * r * 0.36, -r * 0.42, r * 0.11, r * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const side of [-1, 1]) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(side * r * 0.36, -r * 0.18, r * 0.16, r * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1b1206";
    ctx.beginPath();
    ctx.arc(side * r * 0.36 - r * 0.08, -r * 0.17, r * 0.075, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#1b1206";
  ctx.beginPath();
  ctx.ellipse(0, r * 0.12, r * 0.14, r * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = r * 0.045;
  ctx.strokeStyle = "#1b1206";
  ctx.beginPath();
  ctx.moveTo(0, r * 0.2);
  ctx.quadraticCurveTo(-r * 0.08, r * 0.42, -r * 0.26, r * 0.36);
  ctx.moveTo(0, r * 0.2);
  ctx.quadraticCurveTo(r * 0.1, r * 0.4, r * 0.3, r * 0.3);
  ctx.stroke();

  if (glasses > 0.01) {
    const px = r * 0.09;
    const gy = -r * 0.18 - (1 - glasses) * r * 2.2;
    ctx.fillStyle = "#000";
    ctx.fillRect(-r * 0.7, gy - px * 1.5, r * 1.4, px);
    for (const side of [-1, 1]) {
      const cx = side * r * 0.36 - px * 2.5;
      ctx.fillRect(cx, gy - px * 0.5, px * 5, px * 2);
      ctx.fillRect(cx + px, gy + px * 1.5, px * 3, px);
    }
    ctx.fillStyle = "#fff";
    for (const side of [-1, 1]) ctx.fillRect(side * r * 0.36 - px * 1.5, gy - px * 0.5, px, px);
  }
  ctx.restore();
}
