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

  // Scroll-linked session. Each command runs as its block moves up the screen:
  // it types during the first half of the run, then its results appear one by
  // one. Nothing moves unless the reader scrolls. Progress never goes back, so
  // a reader who scrolls up again does not see the text disappear.
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

  function update() {
    queued = false;
    const vh = window.innerHeight;
    // The command starts typing as its line nears the middle of the screen and
    // is complete, with its results, when it sits exactly in the middle.
    const runStart = vh * 1.4;
    const runEnd = vh * 0.5;
    for (const step of steps) {
      const top = step.cursor.getBoundingClientRect().top;
      const p = clamp((runStart - top) / (runStart - runEnd), 0, 1);
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
