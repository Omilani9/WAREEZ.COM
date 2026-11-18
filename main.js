/* =====================================================
   WAREEZ PORTFOLIO — main.js
   Intro (about 8 seconds):
     1. Lines of code fly in from every angle and form "WAREEZ"
     2. The name holds still while the loader fills under it
     3. The name rushes toward the screen at high speed
     4. The intro fades away and the site opens
   Everything you may want to tweak is in the INTRO block below.
   ===================================================== */

const INTRO = {
  text:       "WAREEZ",
  assembleMs: 3500,   // lines of code fly in and form the name
  loaderMs:   2500,   // loader fills under the name (the name holds still)
  rushMs:     1000,   // the name rushes toward the screen
  fadeMs:     600,    // intro fades away to reveal the site (starts halfway through the rush)
  safetyMs:   15000,  // if anything stalls, the site opens anyway
  rowDesktop: 12,     // spacing between lines of code in the name (smaller = more lines)
  rowMobile:  18,
  minChars:   3        // shortest line of code allowed (smaller = fills thin parts of the letters)
};

const introEl     = document.getElementById("intro");
const loaderEl    = document.getElementById("loader");
const loaderBar   = document.getElementById("loader-bar");
const loaderPct   = document.getElementById("loader-percent");
const loaderTip   = document.getElementById("loader-tip");
const siteEl      = document.getElementById("site");
const heroContent = document.querySelector(".hero-content");

document.getElementById("year").textContent = new Date().getFullYear();

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile     = window.matchMedia("(max-width: 600px)").matches;

/* ---------- small helpers ---------- */
const clamp        = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInCubic  = t => t * t * t;

/* ---------- CODE THAT THE LETTERS ARE MADE OF ---------- */
const C = { kw:"#c4b5fd", sym:"#22d3ee", str:"#6ee7b7", num:"#fbbf24", name:"#e8f7ff", tag:"#f9a8d4" };
const TOKENS = [
  ["const",C.kw],["let",C.kw],["function",C.kw],["return",C.kw],["import",C.kw],["export",C.kw],
  ["async",C.kw],["await",C.kw],["if",C.kw],["else",C.kw],
  ["=>",C.sym],["=",C.sym],["{",C.sym],["}",C.sym],["(",C.sym],[")",C.sym],["[",C.sym],["]",C.sym],
  [";",C.sym],[",",C.sym],[".",C.sym],["&&",C.sym],["===",C.sym],
  ['"wareez"',C.str],["'ui'",C.str],['"ux"',C.str],["`css`",C.str],
  ["0",C.num],["1",C.num],["100",C.num],["404",C.num],
  ["user",C.name],["page",C.name],["nav",C.name],["hero",C.name],["app",C.name],["init",C.name],
  ["render",C.name],["build",C.name],["ship",C.name],["style",C.name],["layout",C.name],["theme",C.name],
  ["<div>",C.tag],["</div>",C.tag],["<h1>",C.tag],["<nav>",C.tag],["</>",C.tag]
];

function codeChars(n){
  const out = [];
  while (out.length < n){
    const t = TOKENS[Math.floor(Math.random() * TOKENS.length)];
    for (const ch of t[0]) out.push({ ch, color: t[1] });
    out.push({ ch: " ", color: null });
  }
  return out.slice(0, n);
}

const TEX_H = 28, FONT_PX = 22, CHAR_TEX = 13.2;      // one line of code = one small picture
function makeLineCanvas(chars){
  const c = document.createElement("canvas");
  c.width  = Math.ceil(chars.length * CHAR_TEX);
  c.height = TEX_H;
  const ctx = c.getContext("2d");
  ctx.font = "700 " + FONT_PX + "px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(34,211,238,.6)";
  ctx.shadowBlur = 5;
  chars.forEach((o, i) => {
    if (!o.color) return;
    ctx.fillStyle = o.color;
    ctx.fillText(o.ch, (i + 0.5) * CHAR_TEX, TEX_H / 2 + 1);
  });
  return c;
}

/* ---------- TURN THE NAME INTO LINES OF CODE ----------
   The name is drawn once, then scanned row by row. Every stretch of
   letter found on a row becomes one line of code of exactly that length,
   so the letters are literally built out of stacked code lines. */
function buildLines(){
  const W = 1000, H = 300, UNIT = 0.03;                // 1 pixel of this sheet = 0.03 world units
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#fff";
  ctx.font = "900 180px Orbitron, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(INTRO.text, W / 2, H / 2);
  const data = ctx.getImageData(0, 0, W, H).data;
  const filled = (x, y) => data[(y * W + x) * 4 + 3] > 128;

  let top = H, bottom = 0;                             // vertical extent of the letters
  for (let y = 0; y < H; y++){
    for (let x = 0; x < W; x += 3){
      if (filled(x, y)){ if (y < top) top = y; if (y > bottom) bottom = y; break; }
    }
  }

  const rowStep  = isMobile ? INTRO.rowMobile : INTRO.rowDesktop;
  const rowH     = Math.round(rowStep * 0.86);         // height of one line of code (sheet pixels)
  const charMask = rowH * CHAR_TEX / TEX_H;            // width of one character (sheet pixels)
  const lines = [];

  for (let cy = Math.round(top + rowStep / 2); cy < bottom; cy += rowStep){
    let x = 0;
    while (x < W){
      while (x < W && !filled(x, cy)) x++;
      const start = x;
      while (x < W && filled(x, cy)) x++;
      const len = x - start;
      if (len < charMask * INTRO.minChars) continue;   // too short to hold a line of code
      const n = Math.floor(len / charMask);
      const canvas = makeLineCanvas(codeChars(n));
      const h = rowH * UNIT;
      lines.push({
        canvas,
        w: (canvas.width / TEX_H) * h,
        h,
        x: (start + len / 2 - W / 2) * UNIT,
        y: -(cy - H / 2) * UNIT,
        z: (Math.random() - 0.5) * 1.2
      });
    }
  }
  return lines;
}

function buildOutlineCanvas(){                         // faint glowing shape of the name behind the code
  const c = document.createElement("canvas");
  c.width = 1000; c.height = 300;
  const ctx = c.getContext("2d");
  ctx.font = "900 180px Orbitron, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(34,211,238,.9)";
  ctx.shadowBlur = 22;
  ctx.fillStyle = "rgba(34,211,238,.07)";
  ctx.fillText(INTRO.text, 500, 150);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(34,211,238,.45)";
  ctx.strokeText(INTRO.text, 500, 150);
  return c;
}

/* ---------- SCENE ---------- */
const CAM_Z = 14, BASE_FOV = 60;
let renderer, scene, camera, spriteGroup, outline;
let items = [], tunnel = [];
let introDone = false;

/* scale the whole name so it always fits the screen (phones and desktops) */
const INTRO_TEXT_WIDTH = 25.6;                         // width of the name in world units
function fitIntroScale(){
  const vw = window.innerWidth, vh = window.innerHeight;
  const targetW = Math.min(vw * 0.9, 1100);          // how wide the name is on screen (pixels)
  const worldHeight = 2 * Math.tan((BASE_FOV * Math.PI) / 360) * CAM_Z;
  const worldWidth  = worldHeight * (vw / vh);
  return Math.min((targetW / vw) * worldWidth / INTRO_TEXT_WIDTH, 1);
}

function makeSprite(canvas, w, h){
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(w, h, 1);
  return { sp, mat };
}

function setupScene(lines){
  const canvas = document.getElementById("code-canvas");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene  = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(BASE_FOV, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = CAM_Z;

  spriteGroup = new THREE.Group();
  scene.add(spriteGroup);
  spriteGroup.scale.setScalar(fitIntroScale());

  /* faint outline of the name, behind the code */
  const o = makeSprite(buildOutlineCanvas(), 30, 9);
  outline = o;
  o.sp.position.set(0, 0, -0.3);
  spriteGroup.add(o.sp);

  /* the lines of code that form the name */
  items = lines.map(L => {
    const s = makeSprite(L.canvas, L.w, L.h);
    const R = 18 + Math.random() * 14;                 // start somewhere around the screen, near or far
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const it = {
      sp: s.sp, mat: s.mat,
      tx: L.x, ty: L.y, tz: L.z,
      sx: R * Math.sin(ph) * Math.cos(th),
      sy: R * Math.sin(ph) * Math.sin(th),
      sz: R * Math.cos(ph) * 0.8,
      delay: Math.random() * 0.45,
      curve: (Math.random() - 0.5) * 9,
      rot0: (Math.random() - 0.5) * Math.PI * 1.2,
      rotEnd: (Math.random() - 0.5) * 1.0,
      op: 0.8 + Math.random() * 0.2,
      phase: Math.random() * 6.28
    };
    s.sp.position.set(it.sx, it.sy, it.sz);
    spriteGroup.add(s.sp);
    return it;
  });

  /* loose code tokens that streak past during the rush (kept to the edges, clear of the name) */
  const pool = ["const", "<div>", "=>", "{ }", "function", "</>", "return", "css", "html", "[ ]", "&&", "await"];
  const colors = [C.kw, C.tag, C.sym, C.sym, C.kw, C.tag, C.kw, C.str, C.tag, C.sym, C.sym, C.kw];
  tunnel = [];
  for (let i = 0; i < (isMobile ? 50 : 90); i++){
    const k = Math.floor(Math.random() * pool.length);
    const chars = Array.from(pool[k]).map(ch => ({ ch, color: colors[k] }));
    const cv = makeLineCanvas(chars);
    const h = 0.42;
    const s = makeSprite(cv, (cv.width / TEX_H) * h, h);
    let x, y;
    if (Math.random() < 0.5){                            // left or right of the name
      x = (Math.random() < 0.5 ? -1 : 1) * (9 + Math.random() * 6);
      y = (Math.random() - 0.5) * 10;
    } else {                                             // above or below the name
      x = (Math.random() - 0.5) * 26;
      y = (Math.random() < 0.5 ? -1 : 1) * (2.6 + Math.random() * 4.5);
    }
    s.sp.position.set(x, y, -2 + Math.random() * 9);
    scene.add(s.sp);
    tunnel.push({ sp: s.sp, mat: s.mat, z: s.sp.position.z, op: 0.5 + Math.random() * 0.4 });
  }
}

/* ---------- ANIMATION STAGES ---------- */
function updateAssemble(a){                            // a: 0 → 1
  items.forEach(it => {
    const tl = clamp((a - it.delay) / 0.55);
    const e  = easeOutCubic(tl);
    const dx = it.tx - it.sx, dy = it.ty - it.sy, dz = it.tz - it.sz;
    const len = Math.hypot(dx, dy) || 1;
    const off = Math.sin(Math.PI * tl) * it.curve;     // curved flight path
    it.sp.position.set(it.sx + dx * e - (dy / len) * off,
                       it.sy + dy * e + (dx / len) * off,
                       it.sz + dz * e);
    it.mat.rotation = it.rot0 * (1 - e);
    it.mat.opacity  = it.op * clamp(tl * 4);
  });
  outline.mat.opacity = 0.9 * clamp((a - 0.55) / 0.45);
  spriteGroup.rotation.y = (1 - easeOutCubic(a)) * 0.3;
}

function updateHold(sec){                              // the name is still; the code shimmers
  items.forEach(it => {
    it.mat.opacity = it.op * (0.84 + 0.16 * Math.sin(sec * 2.4 + it.phase));
  });
  outline.mat.opacity = 0.78 + 0.14 * Math.sin(sec * 1.8);
}

function updateRush(p){                                // p: 0 → 1, accelerating toward the screen
  const e = easeInCubic(p);
  camera.position.z = CAM_Z - 17 * e;
  camera.fov = BASE_FOV + 45 * p * p;
  camera.updateProjectionMatrix();
  const gs = spriteGroup.scale.x;
  const spread = 1 + 1.8 * e;                          // lines peel outward as we fly through
  const out = 1 - clamp((p - 0.82) / 0.18);
  items.forEach(it => {
    it.sp.position.set(it.tx * spread, it.ty * spread, it.tz);
    it.mat.rotation = it.rotEnd * e;
    const dist = camera.position.z - it.tz * gs;
    it.mat.opacity = it.op * clamp(dist / 1.5) * out;
  });
  outline.mat.opacity = 0.8 * (1 - clamp(p * 2));
  tunnel.forEach(t => {
    const dist = camera.position.z - t.z;
    t.mat.opacity = t.op * clamp(p * 4) * clamp(dist / 3) * out;
  });
}

/* ---------- LOADER (under the name) ---------- */
const TIPS = [
  "Loading assets…",
  "Compiling shaders…",
  "Calibrating interface…",
  "Almost there…"
];

function startLoader(ms, onDone){
  loaderEl.classList.remove("hidden");
  requestAnimationFrame(()=> loaderEl.classList.add("show"));

  const start = performance.now();
  function tick(now){
    const t = Math.min((now - start) / ms, 1);
    const pct = Math.floor(t * 100);
    loaderBar.style.width = pct + "%";
    loaderPct.textContent = pct + "%";
    const tipIdx = Math.min(Math.floor(t * TIPS.length), TIPS.length-1);
    loaderTip.textContent = TIPS[tipIdx];
    if (t < 1) requestAnimationFrame(tick);
    else onDone();
  }
  requestAnimationFrame(tick);
}

/* ---------- OPEN THE SITE ---------- */
let siteOpened = false;
function finishIntro(){
  if (siteOpened) return;
  siteOpened = true;
  introEl.style.transitionDuration = INTRO.fadeMs + "ms";
  introEl.classList.add("fade-out");
  siteEl.classList.remove("hidden");
  window.scrollTo(0,0);
  startBgMedia();

  setTimeout(()=>{
    introEl.style.display = "none";
    heroContent.classList.add("visible");
    revealStoryPanels();
    if (typeof startHeroExtras === "function") startHeroExtras();
  }, INTRO.fadeMs + 150);
}

/* ---------- RUN THE INTRO ---------- */
function runIntro(){
  let phase = "assemble", pt = 0, last = performance.now(), opened = false;

  if (reduceMotion){                                   // no flying: show the finished name, then open
    updateAssemble(1);
    renderer.render(scene, camera);
    startLoader(1200, () => { introDone = true; finishIntro(); });
    return;
  }

  function frame(now){
    if (introDone) return;
    requestAnimationFrame(frame);
    pt += Math.min(now - last, 50);                    // clamp so a tab switch never makes it jump
    last = now;

    if (phase === "assemble"){
      const a = Math.min(pt / INTRO.assembleMs, 1);
      updateAssemble(a);
      if (a >= 1){
        phase = "hold"; pt = 0;
        startLoader(INTRO.loaderMs, () => {
          loaderEl.classList.remove("show");
          phase = "rush"; pt = 0;
        });
      }
    } else if (phase === "hold"){
      updateHold(pt / 1000);
    } else if (phase === "rush"){
      const p = Math.min(pt / INTRO.rushMs, 1);
      updateRush(p);
      if (p >= 0.5 && !opened){ opened = true; finishIntro(); }
      if (p >= 1){ introDone = true; }
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}

function fontsReady(){                                 // draw the code only once the fonts are in
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  const loaded = Promise.all([
    document.fonts.load("900 60px Orbitron"),
    document.fonts.load("700 22px 'JetBrains Mono'")
  ]).catch(()=>{});
  return Promise.race([loaded, new Promise(r => setTimeout(r, 1200))]);
}

function startIntro(){
  try {
    if (typeof THREE === "undefined") throw new Error("three.js did not load");
    setupScene(buildLines());
    runIntro();
  } catch (err) {                                      // never leave the visitor on a black screen
    console.warn("[intro] skipped:", err);
    finishIntro();
  }
}
setTimeout(()=>{ if (!siteOpened) finishIntro(); }, INTRO.safetyMs);
fontsReady().then(startIntro);

/* ---------- STORY REVEAL ---------- */
function revealStoryPanels(){
  const panels = document.querySelectorAll(".story-panel");
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if (e.isIntersecting) e.target.classList.add("visible");
    });
  }, { threshold: 0.2 });
  panels.forEach(p=> io.observe(p));
}

/* ---------- BACKGROUND VIDEO (loop + sound, no controls) ---------- */
const bgVideo = document.getElementById("bg-video");
bgVideo.loop = true;
bgVideo.controls = false;

let userGestured = false;

function ensureBgPlaying(){
  if (!bgVideo.paused && !bgVideo.ended) return;
  const p = bgVideo.play();
  if (p && p.catch){
    p.catch(()=>{
      bgVideo.muted = true;
      bgVideo.play().catch(()=>{});
    });
  }
}

function tryUnmute(){
  if (!bgVideo.muted) return;
  bgVideo.muted = false;
  bgVideo.volume = 0.6;
  const p = bgVideo.play();
  if (p && p.then){
    p.then(removeGestureListeners).catch(()=>{
      bgVideo.muted = true;
      ensureBgPlaying();
    });
  }
}

function startBgMedia(){
  ensureBgPlaying();
  if (userGestured) tryUnmute();
}

const GESTURE_EVENTS = ["pointerdown","pointerup","click","keydown","touchend"];
function onGesture(){
  userGestured = true;
  if (!siteEl.classList.contains("hidden")) tryUnmute();
}
function removeGestureListeners(){
  GESTURE_EVENTS.forEach(evt => window.removeEventListener(evt, onGesture));
}
GESTURE_EVENTS.forEach(evt => window.addEventListener(evt, onGesture, { passive:true }));

bgVideo.addEventListener("pause",  ()=>{ if (!document.hidden) ensureBgPlaying(); });
bgVideo.addEventListener("ended",  ()=>{ bgVideo.currentTime = 0; ensureBgPlaying(); });
bgVideo.addEventListener("stalled",ensureBgPlaying);
document.addEventListener("visibilitychange", ()=>{ if (!document.hidden) ensureBgPlaying(); });

/* When the visitor leaves the page (other tab, minimized, phone locked, app switched),
   only the SOUND is switched off. The video itself is never paused or restarted.
   When they come back, the sound simply switches back on. */
let soundWasOn = false;
function muteWhileAway(){
  if (!bgVideo.muted){ soundWasOn = true; bgVideo.muted = true; }
}
function soundBack(){
  if (soundWasOn){
    soundWasOn = false;
    bgVideo.muted = false;
    bgVideo.volume = 0.6;
  }
  ensureBgPlaying();
}
document.addEventListener("visibilitychange", ()=>{ document.hidden ? muteWhileAway() : soundBack(); });
window.addEventListener("pagehide", muteWhileAway);
window.addEventListener("pageshow", soundBack);

/* ---------- RESIZE ---------- */
window.addEventListener("resize", ()=>{
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (spriteGroup) spriteGroup.scale.setScalar(fitIntroScale());
});
