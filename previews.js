/* =====================================================
   WAREEZ PORTFOLIO — previews.js
   LIVE PREVIEWS inside the project cards.
   - Each card shows the real site, scaled down to fit.
   - A site is only loaded when its card scrolls into view.
   - If it can't load, the card keeps its colour block.
   ===================================================== */
(function () {
  const frames = Array.from(document.querySelectorAll(".card-frame"));
  if (!frames.length) return;

  const BASE_W = 1280;                       // the width each site is rendered at, then scaled down
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const visuals = frames.map(f => f.parentElement);

  /* scale each preview so a full desktop-width page fits the card */
  function fit(vis) {
    const f = vis.querySelector(".card-frame");
    if (f) f.style.transform = "scale(" + (vis.clientWidth / BASE_W) + ")";
  }
  visuals.forEach(fit);
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(entries => entries.forEach(e => fit(e.target)));
    visuals.forEach(v => ro.observe(v));
  } else {
    window.addEventListener("resize", () => visuals.forEach(fit));
  }

  if (saveData) return;                      // visitors on Data Saver keep the lightweight colour block

  function load(f) {
    if (f.dataset.loaded) return;
    f.dataset.loaded = "1";
    f.addEventListener("load", () => f.parentElement.classList.add("has-frame"), { once: true });
    f.src = f.dataset.src;
  }

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        load(e.target.querySelector(".card-frame"));
      });
    }, { rootMargin: "250px" });
    visuals.forEach(v => io.observe(v));
  } else {
    frames.forEach(load);
  }
})();
