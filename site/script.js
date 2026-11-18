(() => {
  "use strict";

  const EMAIL = "arshalsoren@gmail.com";
  const LINKS = {
    github: "https://github.com/arshalsoren",
    linkedin: "https://linkedin.com/in/arshalsoren",
    sponsor: "https://github.com/sponsors/arshalsoren",
    topd: "https://github.com/arshalsoren/topd",
    resume: "arshal-soren-resume.pdf",
  };
  const HELP = [
    "commands:",
    "  whoami | about | experience | projects | ongoing | skills | education | contact",
    "  ls                 list the sections",
    "  open <target>      github, linkedin, sponsor, topd, resume",
    "  resume             open the résumé PDF",
    "  clear              clear this log",
    "  help               show this list",
  ];

  const TYPE_SHARE = 0.5; // share of a command's scroll run spent typing it
  const RUN = 0.6;        // scroll run per command, as a share of the screen height
  const START = 0.9;      // a command starts typing when its line is this far down the screen

  const stream = document.getElementById("stream");
  const form = document.getElementById("cmd-form");
  const input = document.getElementById("cmd");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

  // Contact forms open the visitor's mail app with the message filled in.
  // Nothing is sent from this site. Works for the scripted form and any copy.
  document.addEventListener("submit", (event) => {
    const f = event.target;
    if (!f.classList.contains("contact-form")) return;
    event.preventDefault();
    const data = new FormData(f);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();
    const subject = `Message from ${name} via your portfolio`;
    const body = `${message}\n\n— ${name} (${email})`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  // ---- Scripted commands: scrolling types each one, then reveals its output ----

  const scripted = [...stream.querySelectorAll(".block[data-scripted]")];
  const allBlocks = () => [...stream.querySelectorAll(".block")];

  // Set the typed text and which output lines are visible for a given progress.
  function render(block) {
    const p = block.progress;
    const typed = block.querySelector(".typed");
    const line = block.querySelector(".cmd-line");
    const cmd = block.dataset.cmd;
    const typing = clamp(p / TYPE_SHARE, 0, 1);
    typed.textContent = cmd.slice(0, Math.floor(typing * cmd.length));
    line.classList.toggle("typing", p > 0 && p < TYPE_SHARE);

    const items = [...block.querySelector(".out").children];
    items.forEach((el, k) => {
      const threshold = TYPE_SHARE + ((1 - TYPE_SHARE) * k) / items.length;
      el.classList.toggle("shown", p >= threshold);
    });
  }

  for (const block of scripted) {
    block.progress = block.dataset.played ? 1 : 0;
    render(block);
  }
  // The first command is already run; it needs no scroll.
  for (const block of allBlocks()) {
    if (block.dataset.played) {
      block.progress = 1;
      render(block);
    }
  }

  if (reduceMotion) {
    scripted.forEach((b) => { b.progress = 1; render(b); });
  } else {
    document.documentElement.classList.add("js-live");
  }

  // A command's run starts once its line has scrolled to START of the way down
  // the screen, and lasts RUN of a screen height of scrolling. If the line is
  // already that high on the page, the run starts at the top of the page, so
  // the first scroll moves it. Progress never goes back.
  function update() {
    queued = false;
    if (reduceMotion) return;
    const span = window.innerHeight * RUN;
    for (const block of scripted) {
      if (block.progress >= 1) continue;
      const docTop = block.querySelector(".cmd-line").getBoundingClientRect().top + window.scrollY;
      const runStart = Math.max(0, docTop - window.innerHeight * START);
      const p = clamp((window.scrollY - runStart) / span, 0, 1);
      if (p > block.progress) {
        block.progress = p;
        render(block);
      }
    }
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }
  // Nothing runs on load: progress only moves once the reader scrolls.
  if (!reduceMotion) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
  }

  // ---- Typed commands: each one adds a block above the prompt ----

  function makeLine(text, cls = "") {
    const div = document.createElement("div");
    if (cls) div.className = cls;
    div.textContent = text;
    return div;
  }

  // Adds a block above the prompt: the echoed command line, then its output.
  function addBlock(cmdText, outputNodes) {
    const block = document.createElement("div");
    block.className = "block";
    const line = document.createElement("div");
    line.className = "cmd-line";
    const ps1 = document.createElement("span");
    ps1.className = "ps1";
    ps1.textContent = "arshalsoren:~$ ";
    const typed = document.createElement("span");
    typed.className = "typed";
    typed.textContent = cmdText; // user input is never parsed as HTML
    line.append(ps1, typed);
    const out = document.createElement("div");
    out.className = "out";
    for (const node of outputNodes) {
      node.classList.add("shown");
      out.appendChild(node);
    }
    block.append(line, out);
    stream.insertBefore(block, form);
    form.scrollIntoView({ block: "end", behavior: reduceMotion ? "auto" : "smooth" });
  }

  // Copies a scripted command's output, so typed commands show the same content.
  function outputOf(name) {
    const source = scripted.find((b) => b.dataset.name === name) || allBlocks().find((b) => b.dataset.name === name);
    if (!source) return null;
    return [...source.querySelector(".out").children].map((el) => el.cloneNode(true));
  }

  function run(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const [name, ...args] = trimmed.split(/\s+/);
    const cmd = name.toLowerCase();

    if (cmd === "clear") {
      allBlocks().forEach((b) => b.remove());
      return;
    }
    if (cmd === "help") {
      addBlock(trimmed, HELP.map((l) => makeLine(l, "line")));
      return;
    }
    if (cmd === "ls") {
      const names = scripted.map((b) => b.dataset.name).join("  ");
      addBlock(trimmed, [makeLine(names, "line")]);
      return;
    }
    if (cmd === "resume") {
      window.open(LINKS.resume, "_blank", "noopener,noreferrer");
      addBlock(trimmed, [makeLine("opening resume.pdf", "sys")]);
      return;
    }
    if (cmd === "open") {
      const key = (args[0] || "").toLowerCase();
      if (!LINKS[key]) {
        addBlock(trimmed, [makeLine(`usage: open <${Object.keys(LINKS).join("|")}>`, "err")]);
        return;
      }
      window.open(LINKS[key], "_blank", "noopener,noreferrer");
      addBlock(trimmed, [makeLine(`opening ${key}`, "sys")]);
      return;
    }
    const output = outputOf(cmd);
    if (output) {
      addBlock(trimmed, output);
      return;
    }
    addBlock(trimmed, [makeLine(`${name}: command not found. type help.`, "err")]);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input.value;
    input.value = "";
    if (!value.trim()) return;
    run(value);
  });

  // Tapping the stream focuses the prompt, except on links and form fields.
  stream.addEventListener("click", (event) => {
    if (!event.target.closest("a,button,input,textarea,form")) input.focus();
  });
})();
