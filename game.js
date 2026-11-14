/* =====================================================
   WAREEZ PORTFOLIO — game.js
   BUG HUNTER: squash the red bugs, never tap the green
   features. 30 seconds. Best score is saved on the device.
   Desktop keys:  Q W E / A S D / Z X C
   ===================================================== */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const arena    = $("#g-arena");
  const overlay  = $("#g-overlay");
  const startBtn = $("#g-start");
  if (!arena || !overlay || !startBtn) return;

  const cells    = Array.from(arena.querySelectorAll(".cell"));
  const scoreEl  = $("#g-score");
  const timeEl   = $("#g-time");
  const streakEl = $("#g-streak");
  const bestEl   = $("#g-best");
  const titleEl  = $("#g-title");
  const textEl   = $("#g-text");

  const ROUND = 30000;           // 30 seconds
  const KEY   = "wareez_bughunter_best";
  const KEYS  = "qweasdzxc";

  const BUG  = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 24L8 16M18 34H6M18 44L8 52M46 24l10-8M46 34h12M46 44l10 8" fill="none" stroke="#ff6b6b" stroke-width="4" stroke-linecap="round"/><ellipse cx="32" cy="38" rx="15" ry="19" fill="#ff6b6b"/><circle cx="32" cy="17" r="9" fill="#ff6b6b"/><circle cx="28" cy="16" r="2.4" fill="#05080d"/><circle cx="36" cy="16" r="2.4" fill="#05080d"/><path d="M32 26v24" stroke="#05080d" stroke-width="3"/></svg>';
  const FEAT = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="10" width="44" height="44" rx="12" fill="#34d399"/><path d="M22 33l8 8 14-16" fill="none" stroke="#05080d" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  let running = false, score = 0, streak = 0, best = 0;
  let endAt = 0, tickId = 0, spawnId = 0;
  const slots = new Array(9).fill(null);

  const canSave = () => !window.wzConsent || window.wzConsent.allowed();

  try { best = parseInt(localStorage.getItem(KEY), 10) || 0; } catch (e) {}

  function setHUD() {
    scoreEl.textContent  = score;
    streakEl.textContent = streak;
    bestEl.textContent   = best;
  }

  function show(i, type, dur) {
    const c = cells[i];
    c.querySelector(".sprite").innerHTML = type === "bug" ? BUG : FEAT;
    c.setAttribute("aria-label", type === "bug" ? "Bug" : "Feature, do not tap");
    c.classList.add("up");
    slots[i] = { type, timer: setTimeout(() => hide(i, true), dur) };
  }

  function hide(i, expired) {
    const s = slots[i];
    if (!s) return;
    clearTimeout(s.timer);
    slots[i] = null;
    cells[i].classList.remove("up");
    if (expired && s.type === "bug") { streak = 0; setHUD(); }   // a missed bug breaks the streak
  }

  function flash(c, cls) {
    c.classList.remove("good", "bad");
    c.classList.add(cls);
    setTimeout(() => c.classList.remove(cls), 320);
  }

  function hit(i) {
    if (!running) return;
    const s = slots[i];
    if (!s) return;
    const type = s.type;
    hide(i, false);
    if (type === "bug") {
      streak++;
      score += 10;
      if (streak % 5 === 0) score += 25;        // streak bonus
      flash(cells[i], "good");
    } else {
      streak = 0;
      score = Math.max(0, score - 15);
      flash(cells[i], "bad");
    }
    setHUD();
  }

  function spawn() {
    if (!running) return;
    const p = 1 - Math.max(0, endAt - Date.now()) / ROUND;     // 0 → 1 as time runs out
    const free = [];
    for (let i = 0; i < 9; i++) if (!slots[i]) free.push(i);
    if (free.length > 6) {                                      // at most 3 targets at once
      const i = free[Math.floor(Math.random() * free.length)];
      show(i, Math.random() < 0.78 ? "bug" : "feature", 1150 - 500 * p);
    }
    spawnId = setTimeout(spawn, 700 - 400 * p + Math.random() * 150);
  }

  function tick() {
    const left = Math.max(0, endAt - Date.now());
    timeEl.textContent = Math.ceil(left / 1000);
    if (left <= 0) end();
  }

  function start() {
    score = 0; streak = 0; running = true;
    endAt = Date.now() + ROUND;
    for (let i = 0; i < 9; i++) hide(i, false);
    setHUD();
    overlay.classList.add("off");
    clearInterval(tickId); clearTimeout(spawnId);
    tickId = setInterval(tick, 100);
    tick();
    spawn();
  }

  function end() {
    running = false;
    clearInterval(tickId); clearTimeout(spawnId);
    for (let i = 0; i < 9; i++) hide(i, false);
    const isBest = score > best;
    if (isBest) {
      best = score;
      if (canSave()) { try { localStorage.setItem(KEY, String(best)); } catch (e) {} }
    }
    setHUD();
    const rank = score >= 350 ? "10x Developer"
               : score >= 220 ? "Senior Developer"
               : score >= 100 ? "Mid-level Developer"
               : "Junior Developer";
    titleEl.textContent = isBest && score > 0 ? "New best: " + score + "!" : "Time's up: " + score + " points";
    textEl.textContent  = "Rank: " + rank + ". " + (isBest && score > 0 ? "Your highest score yet." : "Best: " + best + ".") + " Can you beat it?";
    startBtn.textContent = "Play again";
    overlay.classList.remove("off");
  }

  startBtn.addEventListener("click", start);

  /* taps / clicks (pointerdown = instant on phones) */
  arena.addEventListener("pointerdown", e => {
    const c = e.target.closest(".cell");
    if (c) { e.preventDefault(); hit(cells.indexOf(c)); }
  });
  /* keyboard activation of a focused cell (Enter / Space) */
  arena.addEventListener("click", e => {
    const c = e.target.closest(".cell");
    if (c && e.detail === 0) hit(cells.indexOf(c));
  });
  /* desktop shortcut keys */
  window.addEventListener("keydown", e => {
    if (!running || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    const i = KEYS.indexOf(e.key.toLowerCase());
    if (i > -1) hit(i);
  });

  setHUD();
})();
