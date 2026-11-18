(() => {
  "use strict";

  // Contact form: the only thing a visitor can submit. It opens the visitor's
  // mail app with the message filled in. Nothing is sent from this site.
  const EMAIL = "arshalsoren@gmail.com";
  const form = document.getElementById("contact-form");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();

    const subject = `Message from ${name} via your portfolio`;
    const body = `${message}\n\n— ${name} (${email})`;
    const href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  });

  // Scroll-linked session. When a command's block reaches the middle of the
  // screen, its stage pins there. While it stays pinned, the command types and
  // its results appear, driven by scroll. Once the run is done, the stage
  // scrolls on normally. Nothing moves unless the reader scrolls. Progress never
  // goes back, so scrolling up does not hide text already shown.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const steps = [...document.querySelectorAll(".step")];
  if (reduceMotion || steps.length === 0) return;

  document.documentElement.classList.add("js-live");

  const TYPE_SHARE = 0.5; // share of the run spent typing the command

  for (const step of steps) {
    step.command = step.dataset.cmd;
    step.typed = step.querySelector(".typed");
    step.cursor = step.querySelector(".cmd");
    step.items = [...step.querySelector(".out").children];
    step.runSpace = step.querySelector(".run-space");
    step.progress = 0;
    step.typed.textContent = "";
    step.items.forEach((el) => el.classList.remove("shown"));
  }

  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

  function render(step) {
    const p = step.progress;
    const typing = clamp(p / TYPE_SHARE, 0, 1);
    const chars = Math.floor(typing * step.command.length);
    step.typed.textContent = step.command.slice(0, chars);
    step.cursor.classList.toggle("typing", p > 0 && p < TYPE_SHARE);

    const n = step.items.length;
    step.items.forEach((el, k) => {
      const threshold = TYPE_SHARE + ((1 - TYPE_SHARE) * k) / n;
      el.classList.toggle("shown", p >= threshold);
    });
  }

  // The stage pins when the step's top edge reaches the pin line, 41% of the
  // screen height (see .js-live .stage in styles.css). The run lasts for the
  // step's run-space, so progress is how far the step has moved past the pin
  // line, measured against that run-space.
  function update() {
    queued = false;
    const pin = window.innerHeight * 0.41;
    for (const step of steps) {
      const top = step.getBoundingClientRect().top;
      const run = step.runSpace.offsetHeight;
      const p = run > 0 ? clamp((pin - top) / run, 0, 1) : (top <= pin ? 1 : 0);
      if (p > step.progress) step.progress = p;
      render(step);
    }
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  update();
})();
