/* =====================================================
   WAREEZ PORTFOLIO — main.js
   Intro: code-character sprites fly in and form "WAREEZ"
   Sequence: 5s cinematic → 2.5s loader → site
   ===================================================== */

const NAME_TEXT = "WAREEZ";
const CINEMATIC_DURATION = 5000;
const LOADER_DURATION    = 2500;

const introEl     = document.getElementById("intro");
const loaderEl    = document.getElementById("loader");
const loaderBar   = document.getElementById("loader-bar");
const loaderPct   = document.getElementById("loader-percent");
const loaderTip   = document.getElementById("loader-tip");
const siteEl      = document.getElementById("site");
const heroContent = document.querySelector(".hero-content");

document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- SCENE SETUP ---------- */
const canvas   = document.getElementById("code-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.z = 14;

/* ---------- SAMPLE "WAREEZ" TEXT INTO POINTS ---------- */
function getTextPoints(text, count){
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  const W = 1000, H = 300;
  c.width = W; c.height = H;
  ctx.fillStyle = "#fff";
  ctx.font = "900 180px Orbitron, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, W/2, H/2);

  const data = ctx.getImageData(0,0,W,H).data;
  const pts = [];
  const gap = 4;
  for (let y=0; y<H; y+=gap){
    for (let x=0; x<W; x+=gap){
      const i = (y*W + x)*4;
      if (data[i+3] > 128){
        pts.push({ x:(x-W/2)*0.03, y:-(y-H/2)*0.03, z:0 });
      }
    }
  }
  for (let i=pts.length-1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [pts[i], pts[j]] = [pts[j], pts[i]];
  }
  return pts.slice(0, count);
}

const isMobile = window.matchMedia("(max-width: 600px)").matches;
const TARGET_COUNT = isMobile ? 1200 : 2400;
const targets = getTextPoints(NAME_TEXT, TARGET_COUNT);

/* ---------- CODE CHARACTER SPRITES ---------- */
const CODE_CHARS = [
  "<", ">", "/", "{", "}", "(", ")", ";", "=", "+", "-", "*",
  "def", "for", "if", "fn", "=>", "&&", "||", "!=", "==",
  "div", "span", "body", "html", "css", "js", "py", "a", "p"
];

function makeCharTexture(ch){
  const size = 64;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d");
  ctx.clearRect(0,0,size,size);
  ctx.font = "bold 34px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#bff8ff";
  ctx.shadowColor = "#22d3ee";
  ctx.shadowBlur = 10;
  ctx.fillText(ch, size/2, size/2);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

const spriteGroup = new THREE.Group();
scene.add(spriteGroup);

const spriteObjects    = [];
const startPositions   = [];

for (let i=0; i<targets.length; i++){
  const ch = CODE_CHARS[Math.floor(Math.random()*CODE_CHARS.length)];
  const tex = makeCharTexture(ch);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 1
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.55, 0.55, 1);

  const radius = 22;
  const theta = Math.random()*Math.PI*2;
  const phi   = Math.acos(2*Math.random()-1);
  const r     = radius * (0.4 + Math.random()*0.6);
  const sx = r*Math.sin(phi)*Math.cos(theta);
  const sy = r*Math.sin(phi)*Math.sin(theta);
  const sz = r*Math.cos(phi)*0.6;

  sprite.position.set(sx, sy, sz);
  startPositions.push({ x:sx, y:sy, z:sz });
  spriteObjects.push(sprite);
  spriteGroup.add(sprite);
}

/* ---------- FIT-TO-SCREEN SCALE ---------- */
/* "WAREEZ" in the sampled text is roughly 30 world-units wide.
   This function computes how much to shrink/scale it so it always
   fits inside the viewport on phones and desktops. */
const INTRO_TEXT_WIDTH = 30;
function fitIntroScale(){
  const vw = window.innerWidth;
  const targetW = Math.min(vw * 0.82, 720);
  const fovRad = (camera.fov * Math.PI) / 180;
  const worldHeight = 2 * Math.tan(fovRad / 2) * camera.position.z;
  const worldWidth  = worldHeight * camera.aspect;
  const scale = (targetW / vw) * worldWidth / INTRO_TEXT_WIDTH;
  return Math.min(scale, 1);
}
spriteGroup.scale.setScalar(fitIntroScale());

/* ---------- ANIMATION: code flies in and assembles ---------- */
const clock = new THREE.Clock();
let elapsed = 0;
let cinematicDone = false;

function easeInOutCubic(t){
  return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
}

function animate(){
  if (cinematicDone) return;
  requestAnimationFrame(animate);

  const dt = clock.getDelta();
  elapsed += dt * 1000;
  const progress = Math.min(elapsed / CINEMATIC_DURATION, 1);
  const eased = easeInOutCubic(progress);

  for (let i=0; i<spriteObjects.length; i++){
    const s = spriteObjects[i];
    const t = targets[i];
    const sp = startPositions[i];

    s.position.x = sp.x + (t.x - sp.x) * eased;
    s.position.y = sp.y + (t.y - sp.y) * eased;
    s.position.z = sp.z + (t.z - sp.z) * eased;

    if (progress < 0.85){
      s.position.x += Math.sin(elapsed*0.002 + i) * 0.15 * (1-eased);
      s.position.y += Math.cos(elapsed*0.002 + i) * 0.15 * (1-eased);
    }

    const fadeIn = Math.min(elapsed / 800, 1);
    s.material.opacity = fadeIn * (0.7 + Math.sin(elapsed*0.006 + i*0.05) * 0.25);
  }

  spriteGroup.rotation.y = (1 - eased) * 0.4 * Math.sin(elapsed*0.001);
  spriteGroup.rotation.x = (1 - eased) * 0.15 * Math.cos(elapsed*0.001);

  // apply fitted scale so the name never overflows
  spriteGroup.scale.setScalar(fitIntroScale());

  renderer.render(scene, camera);

  if (progress >= 1 && !cinematicDone){
    cinematicDone = true;
    startLoader();
  }
}
animate();

/* ---------- GAME LOADER ---------- */
const TIPS = [
  "Loading assets…",
  "Compiling shaders…",
  "Calibrating interface…",
  "Almost there…"
];

function startLoader(){
  loaderEl.classList.remove("hidden");
  requestAnimationFrame(()=> loaderEl.classList.add("show"));

  const start = performance.now();
  function tick(now){
    const t = Math.min((now - start) / LOADER_DURATION, 1);
    const pct = Math.floor(t * 100);
    loaderBar.style.width = pct + "%";
    loaderPct.textContent = pct + "%";
    const tipIdx = Math.min(Math.floor(t * TIPS.length), TIPS.length-1);
    loaderTip.textContent = TIPS[tipIdx];
    if (t < 1) requestAnimationFrame(tick);
    else finishIntro();
  }
  requestAnimationFrame(tick);
}

function finishIntro(){
  introEl.classList.add("fade-out");
  siteEl.classList.remove("hidden");
  window.scrollTo(0,0);
  startBgMedia();

  setTimeout(()=>{
    introEl.style.display = "none";
    heroContent.classList.add("visible");
    revealStoryPanels();
    if (typeof startHeroExtras === "function") startHeroExtras();
  }, 1000);
}

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
window.addEventListener("pageshow", ensureBgPlaying);

/* ---------- RESIZE ---------- */
window.addEventListener("resize", ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (typeof fitIntroScale === "function"){
    spriteGroup.scale.setScalar(fitIntroScale());
  }
});
