/* =====================================================
   WAREEZ PORTFOLIO — puzzle.js
   BANNER PUZZLE: slide the tiles to rebuild the WAREEZ.com
   banner. 3×3 or 4×4. Moves + time, best score saved.
   Tap a tile next to the gap, or focus the board and use
   the arrow keys.
   ===================================================== */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const stage = $("#p-stage"), board = $("#p-board");
  if (!stage || !board) return;

  const movesEl = $("#p-moves"), timeEl = $("#p-time"), bestEl = $("#p-best"), msg = $("#p-msg");
  const sizeBtns   = Array.from(document.querySelectorAll("[data-size]"));
  const shuffleBtn = $("#p-shuffle"), peekBtn = $("#p-peekbtn"), numsBtn = $("#p-nums");
  const KEY   = "wareez_slide_best_";
  const INTRO = "Slide the tiles to rebuild the WAREEZ.com banner.";

  let n = 3, tiles = [], ghost = null, pos = [], blank = 0;
  let moves = 0, started = false, solved = false, t0 = 0, timerId = 0;

  const bestFor = sz => { try { return parseInt(localStorage.getItem(KEY + sz), 10) || 0; } catch (e) { return 0; } };
  const fmt = s => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  const showBest = () => { const b = bestFor(n); bestEl.textContent = b ? b : "–"; };

  function neighbors(slot) {
    const r = Math.floor(slot / n), c = slot % n, out = [];
    if (r > 0) out.push(slot - n);
    if (r < n - 1) out.push(slot + n);
    if (c > 0) out.push(slot - 1);
    if (c < n - 1) out.push(slot + 1);
    return out;
  }

  /* one tile = a window onto the shared banner artwork (#wz-art) */
  function build() {
    const N = n * n, w = 1600 / n, h = 900 / n, pct = (100 / n) + "%";
    board.innerHTML = "";
    tiles = [];
    for (let id = 0; id < N; id++) {
      const last = id === N - 1;
      const el = document.createElement(last ? "div" : "button");
      el.className = "ptile" + (last ? " ghost" : "");
      if (!last) { el.type = "button"; el.tabIndex = -1; el.dataset.id = id; }
      el.style.width = pct; el.style.height = pct;
      const x = (id % n) * w, y = Math.floor(id / n) * h;
      el.innerHTML = '<svg viewBox="' + x + " " + y + " " + w + " " + h +
        '" preserveAspectRatio="none" aria-hidden="true"><use href="#wz-art"/></svg>' +
        (last ? "" : '<span class="pnum">' + (id + 1) + "</span>");
      board.appendChild(el);
      tiles.push(el);
    }
    ghost = tiles[N - 1];
  }

  function setSlot(el, slot) {
    el.style.transform = "translate(" + (slot % n) * 100 + "%," + Math.floor(slot / n) * 100 + "%)";
  }
  function place() {
    for (let id = 0; id < n * n - 1; id++) setSlot(tiles[id], pos[id]);
    setSlot(ghost, blank);
  }

  /* shuffle by making random legal moves from the solved board,
     so every puzzle is guaranteed to be solvable */
  function shuffle() {
    const N = n * n;
    do {
      pos = [];
      for (let i = 0; i < N - 1; i++) pos[i] = i;
      blank = N - 1;
      let prev = -1;
      for (let k = 0; k < (n === 3 ? 80 : 200); k++) {
        const opts = neighbors(blank).filter(s => s !== prev);
        const s = opts[Math.floor(Math.random() * opts.length)];
        pos[pos.indexOf(s)] = blank;
        prev = blank; blank = s;
      }
    } while (pos.filter((s, i) => s !== i).length < Math.ceil(N / 2));
  }

  function isSolved() {
    for (let i = 0; i < n * n - 1; i++) if (pos[i] !== i) return false;
    return true;
  }

  function reset() {
    clearInterval(timerId);
    moves = 0; started = false; solved = false;
    movesEl.textContent = "0";
    timeEl.textContent = "0:00";
    msg.textContent = INTRO;
    stage.classList.remove("solved");
    board.classList.add("nofx");
    build(); shuffle(); place(); showBest();
    requestAnimationFrame(() => requestAnimationFrame(() => board.classList.remove("nofx")));
  }

  function tickTime() { timeEl.textContent = fmt(Math.round((Date.now() - t0) / 1000)); }

  function move(id) {
    if (solved) return;
    const s = pos[id];
    if (neighbors(blank).indexOf(s) < 0) return;
    pos[id] = blank; blank = s; moves++;
    if (!started) { started = true; t0 = Date.now(); timerId = setInterval(tickTime, 250); }
    movesEl.textContent = moves;
    place();
    if (isSolved()) win();
  }

  function win() {
    solved = true;
    clearInterval(timerId); tickTime();
    stage.classList.add("solved");
    ghost.classList.add("show");
    const secs = Math.round((Date.now() - t0) / 1000);
    const prev = bestFor(n);
    const isBest = !prev || moves < prev;
    if (isBest) { try { localStorage.setItem(KEY + n, String(moves)); } catch (e) {} }
    showBest();
    msg.textContent = "Solved in " + moves + " moves and " + fmt(secs) +
      (isBest ? " — a new best!" : ".") + " Hit Shuffle to go again.";
  }

  /* ---------- controls ---------- */
  board.addEventListener("pointerdown", e => {
    const b = e.target.closest(".ptile:not(.ghost)");
    if (b) { e.preventDefault(); move(parseInt(b.dataset.id, 10)); }
  });
  board.addEventListener("keydown", e => {
    const map = { ArrowUp: blank + n, ArrowDown: blank - n, ArrowLeft: blank + 1, ArrowRight: blank - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    const slot = map[e.key];
    const ok = slot >= 0 && slot < n * n &&
      (e.key === "ArrowUp" || e.key === "ArrowDown" ||
       (e.key === "ArrowLeft" && blank % n < n - 1) ||
       (e.key === "ArrowRight" && blank % n > 0));
    if (ok) { const id = pos.indexOf(slot); if (id > -1) move(id); }
  });

  sizeBtns.forEach(b => b.addEventListener("click", () => {
    n = parseInt(b.dataset.size, 10);
    sizeBtns.forEach(x => { const on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
    reset();
  }));
  shuffleBtn.addEventListener("click", reset);

  const peek = on => stage.classList.toggle("peek", on);
  peekBtn.addEventListener("pointerdown", e => { e.preventDefault(); peek(true); });
  ["pointerup", "pointerleave", "pointercancel"].forEach(ev => peekBtn.addEventListener(ev, () => peek(false)));
  peekBtn.addEventListener("keydown", e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); peek(true); } });
  peekBtn.addEventListener("keyup", () => peek(false));

  numsBtn.addEventListener("click", () => {
    const off = stage.classList.toggle("nonum");
    numsBtn.textContent = "Numbers: " + (off ? "off" : "on");
  });

  reset();
})();
