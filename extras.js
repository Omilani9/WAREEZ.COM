/* =====================================================
   WAREEZ PORTFOLIO — extras.js
   Main-page extras:
   1. Cipher "decrypt" effect on the name (click it to replay)
   2. Typed rotating line under the name
   3. Animated counters
   4. Infinite tech marquee
   5. Interactive terminal (type or tap commands)
   6. Code-character cursor trail (desktop)
   7. Tilt + spotlight on project cards (desktop)
   8. Live visitor clock (top-left)
   ===================================================== */
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer  = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const CIPHER = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789<>/{}[]=+*#";

  /* ---------- 1. DECRYPT EFFECT ---------- */
  function decrypt(el, duration) {
    const finalText = el.dataset.final || (el.dataset.final = el.textContent.trim());
    if (reduceMotion) { el.textContent = finalText; return; }
    const token = (el._decToken = (el._decToken || 0) + 1);
    const start = performance.now();
    const len = finalText.length;
    (function frame(now) {
      if (el._decToken !== token) return;
      const p = Math.min((now - start) / duration, 1);
      let out = "";
      for (let i = 0; i < len; i++) {
        const ch = finalText[i];
        const lockAt = 0.25 + 0.7 * (i / len);       // letters lock left → right
        out += (ch === " " || p >= lockAt) ? ch : CIPHER[Math.floor(Math.random() * CIPHER.length)];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = finalText;               // always ends on the full word
    })(start);
  }

  /* ---------- 2. TYPED LINE ---------- */
  const PHRASES = [
    "HTML · CSS · JavaScript · React",
    "websites that load fast and look sharp",
    "3 live projects, shipped from scratch",
    "open to freelance & full-time roles"
  ];
  function startTyped() {
    const out = $("#typed");
    if (!out) return;
    if (reduceMotion) { out.textContent = PHRASES[0]; return; }
    let p = 0, i = 0, deleting = false;
    (function tick() {
      const full = PHRASES[p];
      i += deleting ? -1 : 1;
      out.textContent = full.slice(0, i);
      let delay = deleting ? 26 : 55;
      if (!deleting && i === full.length) { deleting = true; delay = 1700; }
      else if (deleting && i === 0)       { deleting = false; p = (p + 1) % PHRASES.length; delay = 350; }
      setTimeout(tick, delay);
    })();
  }

  /* Called by main.js when the intro has finished */
  let heroStarted = false;
  window.startHeroExtras = function () {
    if (heroStarted) return;
    heroStarted = true;
    const title = $(".hero-title");
    if (title) {
      title.setAttribute("aria-label", "WAREEZ");
      decrypt(title, 1300);
      ["mouseenter", "click"].forEach(evt =>
        title.addEventListener(evt, () => decrypt(title, 800)));
    }
    startTyped();
  };

  /* ---------- 3. COUNTERS ---------- */
  function initCounters() {
    const nums = $$(".stat-num[data-count]");
    if (!nums.length || reduceMotion) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const el = e.target;
        const end = +el.dataset.count, suffix = el.dataset.suffix || "";
        const t0 = performance.now(), dur = 1400;
        (function step(now) {
          const p = Math.min((now - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(end * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.6 });
    nums.forEach(n => { n.textContent = "0" + (n.dataset.suffix || ""); io.observe(n); });
  }

  /* ---------- 4. MARQUEE (duplicate the set so it loops seamlessly) ---------- */
  function initMarquee() {
    const track = $("#marquee-track");
    if (track) track.innerHTML += track.innerHTML;
  }

  /* ---------- 5. TERMINAL ---------- */
  function initTerminal() {
    const body  = $("#term-body");
    const form  = $("#term-form");
    const input = $("#term-input");
    const chips = $("#term-chips");
    const box   = $("#term");
    if (!body || !form || !input || !box) return;

    const EMAIL  = "omilaniwareez9@gmail.com";
    const RESUME = { href: "Wareez___Frontend_Developer_Resume.pdf", name: "Wareez_Frontend_Developer_Resume.pdf" };
    const PROMPT = "wareez@portfolio:~$ ";
    const THEMES = [
      { n: "cyan",    a: "#22d3ee", g: "#0ea5e9", ar: "34,211,238",  gr: "14,165,233" },
      { n: "violet",  a: "#a78bfa", g: "#7c3aed", ar: "167,139,250", gr: "124,58,237" },
      { n: "emerald", a: "#34d399", g: "#059669", ar: "52,211,153",  gr: "5,150,105" },
      { n: "amber",   a: "#fbbf24", g: "#f59e0b", ar: "251,191,36",  gr: "245,158,11" },
      { n: "rose",    a: "#fb7185", g: "#e11d48", ar: "251,113,133", gr: "225,29,72" }
    ];
    let themeIdx = 0;
    const history = [];
    let hIdx = 0;
    let queue = Promise.resolve();

    const wait = ms => new Promise(r => setTimeout(r, reduceMotion ? 0 : ms));

    function line(content, cls) {
      const div = document.createElement("div");
      div.className = "t-line" + (cls ? " " + cls : "");
      if (content && typeof content === "object") {
        const a = document.createElement("a");
        a.href = content.href; a.target = "_blank"; a.rel = "noopener";
        a.textContent = content.text;
        div.appendChild(a);
      } else {
        div.textContent = content;
      }
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }
    async function say(lines, cls) {
      for (const l of lines) { line(l, cls); await wait(70); }
    }

    const CMDS = {
      help() {
        return say([
          "Available commands:",
          "  about      who I am",
          "  skills     what I work with",
          "  projects   things I've shipped",
          "  resume     download my CV",
          "  contact    get in touch",
          "  theme      change the accent colour",
          "  hire       the fast way to start a project",
          "  clear      wipe the screen"
        ]);
      },
      about() {
        return say([
          "Wareez — Frontend Developer & Website Creator.",
          "Studied Social Studies Education, found the browser,",
          "switched lanes. One year, three shipped products.",
          "I build sites that load fast, look sharp, and work on any device."
        ]);
      },
      whoami() {
        return say(["a developer who treats your project like it matters."]);
      },
      skills() {
        return say([
          "Languages : HTML5, CSS3, JavaScript (ES6+)",
          "Library   : React",
          "Styling   : Responsive design, Flexbox, CSS Grid, animations",
          "Tools     : Git, GitHub, VS Code, Vercel"
        ]);
      },
      async projects() {
        await say(["Live projects (click to open):"]);
        line({ text: "  01  GiftDrop    ↗ gift-drop-eta.vercel.app", href: "https://gift-drop-eta.vercel.app" }); await wait(70);
        line({ text: "  02  Nestech     ↗ nastech-gen.vercel.app",   href: "https://nastech-gen.vercel.app" });   await wait(70);
        line({ text: "  03  Maison Ari  ↗ maisonari.vercel.app",     href: "https://maisonari.vercel.app" });
      },
      async resume() {
        await say(["Preparing download…"]);
        const a = document.createElement("a");
        a.href = RESUME.href; a.download = RESUME.name;
        document.body.appendChild(a); a.click(); a.remove();
        await say(["✔ Resume downloaded — check your downloads folder."], "ok");
      },
      async contact() {
        await say(["Let's talk:"]);
        line({ text: "  " + EMAIL, href: "mailto:" + EMAIL });
        await wait(70);
        line("  or run: hire");
      },
      async hire() {
        await say(["Checking availability…"]);
        await wait(300);
        await say(["✔ Open to freelance & full-time roles.", "Opening your email app…"], "ok");
        await wait(500);
        window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Let's build something");
      },
      theme() {
        themeIdx = (themeIdx + 1) % THEMES.length;
        const t = THEMES[themeIdx], root = document.documentElement.style;
        root.setProperty("--accent", t.a);
        root.setProperty("--accent-glow", t.g);
        root.setProperty("--accent-rgb", t.ar);
        root.setProperty("--glow-rgb", t.gr);
        return say(["Accent colour → " + t.n + "  (run theme again to cycle)"], "ok");
      },
      clear() { body.innerHTML = ""; return Promise.resolve(); }
    };

    function exec(raw) {
      const text = raw.trim();
      if (!text) return;
      history.push(text); hIdx = history.length;
      line(PROMPT + text, "cmd");
      const key = text.toLowerCase().replace(/^sudo\s+/, "").split(/\s+/)[0];
      queue = queue.then(() => {
        if (/^sudo\s/i.test(text) && key === "hire") line("[sudo] permission granted", "ok");
        if (CMDS[key]) return CMDS[key]();
        line("command not found: " + key + "  — type 'help'", "err");
      });
    }

    form.addEventListener("submit", e => {
      e.preventDefault();
      exec(input.value);
      input.value = "";
    });

    input.addEventListener("keydown", e => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (history.length) { hIdx = Math.max(0, hIdx - 1); input.value = history[hIdx] || ""; }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        hIdx = Math.min(history.length, hIdx + 1);
        input.value = history[hIdx] || "";
      } else if (e.key === "Tab") {
        e.preventDefault();
        const v = input.value.trim().toLowerCase();
        if (!v) return;
        const m = Object.keys(CMDS).filter(k => k.startsWith(v));
        if (m.length === 1) input.value = m[0];
      }
    });

    if (chips) chips.addEventListener("click", e => {
      const b = e.target.closest("button[data-cmd]");
      if (b) exec(b.dataset.cmd);
    });

    /* welcome message the first time the terminal scrolls into view */
    const boot = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      boot.disconnect();
      queue = queue.then(() => say([
        "Welcome to Wareez's terminal.",
        "Type 'help' or tap a command below."
      ]));
    }, { threshold: 0.35 });
    boot.observe(box);
  }

  /* ---------- 6. CURSOR CODE TRAIL ---------- */
  function initTrail() {
    if (!finePointer || reduceMotion) return;
    const chars = ["<", ">", "/", "{", "}", "(", ")", ";", "=", "+", "*", "&&", "=>", "fn", "js", "</>"];
    const site = document.getElementById("site");
    let last = 0;
    window.addEventListener("pointermove", e => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      if (site && site.classList.contains("hidden")) return;
      const now = performance.now();
      if (now - last < 45) return;
      last = now;
      const s = document.createElement("span");
      s.className = "trail-char";
      s.textContent = chars[Math.floor(Math.random() * chars.length)];
      s.style.setProperty("--x", (e.clientX + 10) + "px");
      s.style.setProperty("--y", (e.clientY + 10) + "px");
      document.body.appendChild(s);
      s.addEventListener("animationend", () => s.remove());
    }, { passive: true });
  }

  /* ---------- 7. CARD TILT + SPOTLIGHT ---------- */
  function initTilt() {
    if (!finePointer || reduceMotion) return;
    $$(".card").forEach(card => {
      card.addEventListener("pointermove", e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", (px * 100) + "%");
        card.style.setProperty("--my", (py * 100) + "%");
        card.style.setProperty("--ry", ((px - 0.5) * 10) + "deg");
        card.style.setProperty("--rx", ((0.5 - py) * 10) + "deg");
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ---------- 8. LIVE VISITOR CLOCK ---------- */
  (function liveClock(){
    const locEl  = document.getElementById("clock-location");
    const timeEl = document.getElementById("clock-time");
    if (!locEl || !timeEl) return;

    let tz = "UTC";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch(e) {}

    function cityFromTz(zone){
      const map = {
        "Africa/Lagos":"Lagos, Nigeria",
        "Africa/Abuja":"Abuja, Nigeria",
        "Africa/Accra":"Accra, Ghana",
        "Africa/Nairobi":"Nairobi, Kenya",
        "Africa/Johannesburg":"Johannesburg, SA",
        "Africa/Cairo":"Cairo, Egypt",
        "Europe/London":"London, UK",
        "Europe/Paris":"Paris, France",
        "Europe/Berlin":"Berlin, Germany",
        "Europe/Madrid":"Madrid, Spain",
        "Europe/Rome":"Rome, Italy",
        "Europe/Amsterdam":"Amsterdam, NL",
        "Europe/Dublin":"Dublin, Ireland",
        "Europe/Lisbon":"Lisbon, Portugal",
        "Europe/Moscow":"Moscow, Russia",
        "America/New_York":"New York, USA",
        "America/Chicago":"Chicago, USA",
        "America/Denver":"Denver, USA",
        "America/Los_Angeles":"Los Angeles, USA",
        "America/Toronto":"Toronto, Canada",
        "America/Vancouver":"Vancouver, Canada",
        "America/Sao_Paulo":"São Paulo, Brazil",
        "America/Mexico_City":"Mexico City, MX",
        "America/Bogota":"Bogotá, Colombia",
        "Asia/Tokyo":"Tokyo, Japan",
        "Asia/Seoul":"Seoul, South Korea",
        "Asia/Shanghai":"Shanghai, China",
        "Asia/Hong_Kong":"Hong Kong",
        "Asia/Singapore":"Singapore",
        "Asia/Dubai":"Dubai, UAE",
        "Asia/Riyadh":"Riyadh, Saudi Arabia",
        "Asia/Kolkata":"India",
        "Asia/Karachi":"Karachi, Pakistan",
        "Asia/Dhaka":"Dhaka, Bangladesh",
        "Asia/Jakarta":"Jakarta, Indonesia",
        "Asia/Manila":"Manila, Philippines",
        "Asia/Bangkok":"Bangkok, Thailand",
        "Australia/Sydney":"Sydney, Australia",
        "Australia/Melbourne":"Melbourne, Australia",
        "Pacific/Auckland":"Auckland, NZ"
      };
      if (map[zone]) return map[zone];
      const parts = zone.split("/");
      return (parts[parts.length - 1] || zone).replace(/_/g, " ");
    }

    locEl.textContent = cityFromTz(tz);

    function tick(){
      try{
        timeEl.textContent = new Date().toLocaleTimeString("en-GB", {
          timeZone: tz, hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false
        });
      } catch(e){
        timeEl.textContent = new Date().toLocaleTimeString("en-GB", { hour12:false });
      }
    }
    tick();
    setInterval(tick, 1000);
  })();

  initCounters();
  initMarquee();
  initTerminal();
  initTrail();
  initTilt();
})();