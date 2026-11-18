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

  // Terminal-style reveal. When a panel scrolls into view, its command types
  // itself out, then the output lines appear one after another. Visitors only
  // scroll. Skipped with reduced motion; the content is already in the HTML.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const panels = [...document.querySelectorAll(".panel")].filter((p) => p.querySelector(".cmd"));
  if (reduceMotion || !("IntersectionObserver" in window) || panels.length === 0) return;

  document.documentElement.classList.add("js-anim");
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function run(panel) {
    const cmd = panel.querySelector(".cmd");
    const out = panel.querySelector(".out");

    const prompt = document.createElement("span");
    prompt.className = "ps1";
    prompt.textContent = "arshalsoren:~$ ";
    const typed = document.createElement("span");
    cmd.append(prompt, typed);
    cmd.classList.add("typing");

    for (const ch of cmd.dataset.cmd) {
      typed.textContent += ch;
      await sleep(35 + Math.random() * 45);
    }
    cmd.classList.remove("typing");

    await sleep(300);
    for (const line of out.children) {
      line.classList.add("shown");
      await sleep(160);
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        run(entry.target);
      }
    },
    { threshold: 0.25 }
  );
  panels.forEach((panel) => observer.observe(panel));
})();
