/* =====================================================
   WAREEZ PORTFOLIO — widgets.js
   1. Comment box (chat icon) — private: comments are emailed to you
   2. Cookie notice — Accept / Decline
   Both stay hidden at first and appear only after the visitor scrolls.
   ===================================================== */
(function () {

  /* ============ SETTINGS — the only thing you must edit ============
     1. Go to https://web3forms.com and enter the email that should receive comments.
     2. They email you an "access key". Paste it between the quotes below.
        (The key is safe to leave in public website code.) */
  const WEB3FORMS_KEY = "930f7e39-fd78-44f7-902f-3ab7c6d5df7b";
  const EMAIL_SUBJECT = "New comment on WAREEZ.com";

  const CHAT_SHOW_AT   = 0.6;   // chat icon appears after scrolling this many screen-heights
  const COOKIE_SHOW_AT = 0.3;   // cookie notice appears after scrolling this many screen-heights
  /* ================================================================== */

  const $ = (s, r = document) => r.querySelector(s);
  const CONSENT_KEY = "wareez_cookie_choice";
  const SAVED_KEYS  = ["wareez_bughunter_best", "wareez_slide_best_3", "wareez_slide_best_4"];

  /* ---------- cookie / storage consent (also read by game.js and puzzle.js) ---------- */
  const store = {
    get() { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(CONSENT_KEY, v); } catch (e) {} }
  };
  window.wzConsent = {
    choice:  () => store.get(),
    allowed: () => store.get() === "accepted"
  };

  const cookie = $("#cookie");
  let decided = !!store.get();

  function decide(choice) {
    store.set(choice);
    decided = true;
    if (choice === "declined") {
      try { SAVED_KEYS.forEach(k => localStorage.removeItem(k)); } catch (e) {}
    }
    if (cookie) cookie.classList.remove("show");
    document.body.classList.remove("cookie-open");
  }
  if (cookie) {
    $("#cookie-accept").addEventListener("click",  () => decide("accepted"));
    $("#cookie-decline").addEventListener("click", () => decide("declined"));
  }

  /* ---------- comment box ---------- */
  const fab     = $("#chat-fab");
  const panel   = $("#chat-panel");
  const form    = $("#chat-form");
  const statusEl = $("#chat-status");
  let panelOpen = false, sending = false, lastSent = 0;

  function setStatus(text, cls) {
    statusEl.textContent = text || "";
    statusEl.className = "chat-status" + (cls ? " " + cls : "");
  }
  function openPanel() {
    panelOpen = true;
    panel.classList.add("open");
    fab.classList.add("is-open");
    fab.setAttribute("aria-expanded", "true");
    setTimeout(() => { const n = $("#cf-name"); if (n) n.focus(); }, 60);
  }
  function closePanel() {
    panelOpen = false;
    panel.classList.remove("open");
    fab.classList.remove("is-open");
    fab.setAttribute("aria-expanded", "false");
    update();
  }

  if (fab && panel && form) {
    fab.addEventListener("click", () => (panelOpen ? closePanel() : openPanel()));
    $("#chat-close").addEventListener("click", closePanel);
    window.addEventListener("keydown", e => { if (e.key === "Escape" && panelOpen) closePanel(); });

    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (sending) return;

      const name    = $("#cf-name").value.trim();
      const email   = $("#cf-email").value.trim();
      const message = $("#cf-message").value.trim();
      const trap    = form.querySelector(".hp");

      if (trap && trap.checked) return;                                   // a bot filled the hidden box
      if (!name || message.length < 3) { setStatus("Please add your name and a comment.", "err"); return; }
      if (email && !/^\S+@\S+\.\S+$/.test(email)) { setStatus("That email doesn't look right.", "err"); return; }
      if (Date.now() - lastSent < 30000) { setStatus("Please wait a moment before sending another one.", "err"); return; }
      if (!WEB3FORMS_KEY || WEB3FORMS_KEY.indexOf("PASTE_") === 0) {
        console.warn("[widgets.js] Comments are not switched on yet: paste your Web3Forms access key at the top of widgets.js.");
        setStatus("Sorry, comments aren't switched on yet.", "err");
        return;
      }

      sending = true;
      $("#chat-send").disabled = true;
      setStatus("Sending…");
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: WEB3FORMS_KEY,
            subject: EMAIL_SUBJECT,
            from_name: "WAREEZ.com",
            name: name,
            email: email || undefined,
            replyto: email || undefined,
            message: message,
            botcheck: false
          })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success !== false) {
          lastSent = Date.now();
          form.reset();
          setStatus("Thank you! Your comment was sent.", "ok");
          setTimeout(() => { if (panelOpen) closePanel(); setStatus(""); }, 2600);
        } else {
          setStatus("Sorry, that didn't send. Please try again.", "err");
        }
      } catch (err) {
        setStatus("No connection. Please try again.", "err");
      }
      sending = false;
      $("#chat-send").disabled = false;
    });
  }

  /* ---------- reveal on scroll ---------- */
  function update() {
    const y  = window.scrollY || document.documentElement.scrollTop || 0;
    const vh = window.innerHeight;
    if (fab) fab.classList.toggle("show", panelOpen || y > vh * CHAT_SHOW_AT);
    if (cookie && !decided && y > vh * COOKIE_SHOW_AT) {
      cookie.classList.add("show");
      document.body.classList.add("cookie-open");
    }
  }
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
