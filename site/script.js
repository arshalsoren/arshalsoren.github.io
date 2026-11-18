(() => {
  "use strict";

  const EMAIL = "arshalsoren@gmail.com";
  const PIN = 0.22; // the command line sits here while its run plays out (see styles.css)

  const LINKS = {
    github: "https://github.com/arshalsoren",
    linkedin: "https://linkedin.com/in/arshalsoren",
    sponsor: "https://github.com/sponsors/arshalsoren",
    topd: "https://github.com/arshalsoren/topd",
    resume: "arshal-soren-resume.pdf",
  };

  // Typed command -> section id. Sections are also played in this order by scrolling.
  const SECTION_COMMANDS = {
    whoami: "intro",
    about: "about",
    experience: "experience",
    projects: "projects",
    ongoing: "ongoing",
    skills: "skills",
    education: "education",
    contact: "contact",
  };

  const form = document.getElementById("contact-form");
  const cmdForm = document.getElementById("cmd-form");
  const input = document.getElementById("cmd");
  const log = document.getElementById("log");
  const session = document.getElementById("session");

  // Contact form: opens the visitor's mail app with the message filled in.
  // Nothing is sent from this site.
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();

    const subject = `Message from ${name} via your portfolio`;
    const body = `${message}\n\n— ${name} (${email})`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  const steps = [...document.querySelectorAll(".step")];
  const stepById = Object.fromEntries(steps.map((s) => [s.id, s]));
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Scripted run: scrolling plays the commands in order -----------------

  const scripted = !reduceMotion && steps.length > 0;
  if (scripted) {
    document.documentElement.classList.add("js-live");
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
  }

  const TYPE_SHARE = 0.5; // share of a run spent typing the command

  function render(step) {
    const p = step.progress;
    const typing = clamp(p / TYPE_SHARE, 0, 1);
    step.typed.textContent = step.command.slice(0, Math.floor(typing * step.command.length));
    step.cursor.classList.toggle("typing", p > 0 && p < TYPE_SHARE);

    const n = step.items.length;
    step.items.forEach((el, k) => {
      const threshold = TYPE_SHARE + ((1 - TYPE_SHARE) * k) / n;
      el.classList.toggle("shown", p >= threshold);
    });
  }

  // A step's stage pins when its top edge reaches the pin line. The run lasts
  // for the step's run-space, so progress is how far it has moved past the pin.
  function update() {
    queued = false;
    if (!scripted) return;
    const pin = window.innerHeight * PIN;
    for (const step of steps) {
      const top = step.getBoundingClientRect().top;
      const run = step.runSpace.offsetHeight;
      const p = run > 0 ? clamp((pin - top) / run, 0, 1) : (top <= pin ? 1 : 0);
      if (p > step.progress) step.progress = p; // progress never goes back
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

  // ---- Typed commands at the prompt ---------------------------------------

  function print(text, cls = "") {
    const line = document.createElement("div");
    if (cls) line.className = cls;
    line.textContent = text;
    log.appendChild(line);
  }

  function echo(raw) {
    const line = document.createElement("div");
    line.className = "line-in";
    const ps1 = document.createElement("span");
    ps1.className = "ps1";
    ps1.textContent = "arshalsoren:~$ ";
    const text = document.createElement("span");
    text.textContent = raw;
    line.append(ps1, text);
    log.appendChild(line);
  }

  // Bring a section onto the screen with its full output shown, as if its
  // scripted run had already played out.
  function runSection(id) {
    const step = stepById[id];
    if (!step) return;
    if (scripted) {
      step.progress = 1;
      render(step);
    }
    const docTop = step.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: docTop - window.innerHeight * PIN, behavior: reduceMotion ? "auto" : "smooth" });
  }

  const HELP = [
    "commands:",
    "  whoami | about | experience | projects | ongoing | skills | education | contact",
    "  ls                 list the sections",
    "  open <target>      github, linkedin, sponsor, topd, resume",
    "  resume             open the résumé PDF",
    "  clear              clear this log",
    "  help               show this list",
  ];

  function run(raw) {
    const trimmed = raw.trim();
    echo(raw);
    if (!trimmed) return;

    const [name, ...args] = trimmed.split(/\s+/);
    const cmd = name.toLowerCase();

    if (cmd === "help") {
      HELP.forEach((l) => print(l));
    } else if (cmd === "clear") {
      log.textContent = "";
    } else if (cmd === "ls") {
      print(Object.keys(SECTION_COMMANDS).join("  "));
    } else if (cmd === "resume") {
      window.open(LINKS.resume, "_blank", "noopener,noreferrer");
      print("opening resume.pdf", "sys");
    } else if (cmd === "open") {
      const key = (args[0] || "").toLowerCase();
      if (!LINKS[key]) {
        print(`usage: open <${Object.keys(LINKS).join("|")}>`, "err");
        return;
      }
      window.open(LINKS[key], "_blank", "noopener,noreferrer");
      print(`opening ${key}`, "sys");
    } else if (SECTION_COMMANDS[cmd]) {
      runSection(SECTION_COMMANDS[cmd]);
      print(`ran ${cmd}`, "sys");
    } else {
      print(`${name}: command not found. type help.`, "err");
    }
  }

  cmdForm.addEventListener("submit", (event) => {
    event.preventDefault();
    run(input.value);
    input.value = "";
  });

  // Tapping anywhere in the session area focuses the prompt.
  session.addEventListener("click", (event) => {
    if (!event.target.closest("a")) input.focus();
  });
})();
