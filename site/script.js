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
  const COMMANDS = [
    ["whoami", "who I am"],
    ["about", "what I do"],
    ["experience", "where I have worked"],
    ["projects", "what I build"],
    ["skills", "languages and tools"],
    ["education", "where I studied"],
    ["resume", "open the résumé PDF"],
    ["contact", "send me a message"],
    ["ls", "list the sections"],
    ["open <target>", "github, linkedin, sponsor, topd, resume"],
    ["clear", "clear this log"],
    ["help", "show this list"],
  ];
  const HELP = ["commands:", ...COMMANDS.map(([name, text]) => `  ${name.padEnd(19)}${text}`)];

  const TYPE_MS = 55;      // delay per typed character
  const RESULT_MS = 450;   // pause after each result appears
  const GESTURE_GAP = 350; // scroll input this long after the last one starts a new step

  // A reload starts at the top, where whoami is, instead of restoring a scroll position.
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  const stream = document.getElementById("stream");
  const form = document.getElementById("cmd-form");
  const input = document.getElementById("cmd");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Contact forms open the visitor's mail app with the message filled in.
  // Nothing is sent from this site. Works for the scripted form and any copy.
  document.addEventListener("submit", (event) => {
    const f = event.target;
    if (!f.classList.contains("contact-form")) return;
    event.preventDefault();
    const data = new FormData(f);
    const name = String(data.get("name") || "").trim();
    const message = String(data.get("message") || "").trim();
    const subject = `Message from ${name} via your portfolio`;
    const body = `${message}\n\n— ${name}`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  // ---- Scripted commands: each step types one command, then reveals its output ----

  const scripted = [...stream.querySelectorAll(".block[data-scripted]")];
  const allBlocks = () => [...stream.querySelectorAll(".block")];
  // Copies of each section's output, taken before anything can be cleared, so
  // typed commands like whoami or about still work after clear.
  const library = new Map(allBlocks().map((b) => [
    b.dataset.name,
    [...b.querySelector(".out").children]
      .filter((el) => !el.classList.contains("continue-row"))
      .map((el) => el.cloneNode(true)),
  ]));
  let queue = [...scripted]; // commands not run yet, in order
  let busy = false;          // a step is running
  let skipping = false;      // skip intro was pressed: steps finish at once
  let streamDone = false;    // help has run and the live prompt is waiting
  let lastInput = -Infinity;

  function showAll(block) {
    block.classList.add("started");
    block.querySelector(".typed").textContent = block.dataset.cmd;
    for (const el of block.querySelector(".out").children) el.classList.add("shown");
  }

  // whoami is already run: it shows in full on load.
  stream.querySelectorAll(".block[data-played]").forEach(showAll);

  if (reduceMotion) {
    scripted.forEach(showAll);
    queue = [];
    streamDone = true;
    stream.querySelectorAll(".continue-row").forEach((row) => row.remove());
  } else {
    document.documentElement.classList.add("js-live");
    for (const block of scripted) block.querySelector(".typed").textContent = "";
    // Only one prompt waits at a time: the next command, and the live prompt after help.
    form.hidden = true;
    if (queue[0]) queue[0].classList.add("ready");
  }

  // Keeps a command and its results in the middle of the screen once a result has
  // crossed the middle. A block taller than the screen follows its newest line instead.
  function keepInView(block) {
    const shown = block.querySelectorAll(".out > .shown");
    const newest = shown[shown.length - 1];
    if (!newest) return;
    const line = block.querySelector(".cmd-line").getBoundingClientRect();
    const bottom = newest.getBoundingClientRect().bottom;
    const mid = window.innerHeight / 2;
    if (bottom <= mid) return;
    const height = bottom - line.top;
    const target = height > window.innerHeight * 0.8
      ? Math.max(0, bottom - window.innerHeight * 0.9)
      : line.top + height / 2 - mid;
    if (Math.abs(target) > 1) window.scrollBy({ top: target, behavior: "smooth" });
  }

  // Runs one scripted command: types it, then reveals each result in turn.
  async function play(block) {
    busy = true;
    block.classList.remove("ready");
    block.classList.add("started");
    const typed = block.querySelector(".typed");
    const line = block.querySelector(".cmd-line");
    const cmd = block.dataset.cmd;
    typed.textContent = "";
    line.classList.add("typing");
    for (let i = 1; i <= cmd.length && !skipping; i++) {
      typed.textContent = cmd.slice(0, i);
      await wait(TYPE_MS);
    }
    typed.textContent = cmd;
    line.classList.remove("typing");
    for (const el of block.querySelector(".out").children) {
      el.classList.add("shown");
      if (skipping) continue;
      keepInView(block);
      await wait(RESULT_MS);
    }
    busy = false;
  }

  // Skip intro: finish whatever is running, show the rest at once, run help,
  // and leave the live prompt ready at the bottom.
  async function skipIntro() {
    if (streamDone) return;
    skipping = true;
    while (busy) await wait(20);
    if (streamDone) return;
    while (queue.length) showAll(queue.shift());
    const helpBlock = buildBlock("help", HELP.map((l) => makeLine(l, "line")));
    stream.insertBefore(helpBlock, form);
    showAll(helpBlock);
    streamDone = true;
    stream.querySelectorAll(".ready").forEach((b) => b.classList.remove("ready"));
    stream.querySelectorAll(".continue-row").forEach((row) => row.remove());
    form.hidden = false;
    form.scrollIntoView({ block: "end", behavior: "smooth" });
    input.focus({ preventScroll: true });
  }

  // One step: run the next command. After the last one, help runs by itself
  // and the live prompt waits for input.
  async function advance() {
    if (busy || streamDone) return;
    if (queue.length) {
      await play(queue.shift());
      if (queue.length) {
        queue[0].classList.add("ready");
        return;
      }
    }
    const helpBlock = buildBlock("help", HELP.map((l) => makeLine(l, "line")));
    stream.insertBefore(helpBlock, form);
    await play(helpBlock);
    streamDone = true;
    form.hidden = false;
    input.focus({ preventScroll: true });
  }

  // A step starts on the first scroll after a pause, so one gesture runs one step.
  function gesture() {
    const now = performance.now();
    const fresh = now - lastInput > GESTURE_GAP;
    lastInput = now;
    if (fresh) advance();
  }

  // Until the stream is done, scrolling down runs the next step instead of moving the page.
  // Scrolling up, and typing in fields, still work.
  const inField = (target) => target.closest && target.closest("input,textarea,select,button");
  window.addEventListener("wheel", (event) => {
    if (streamDone || event.deltaY <= 0 || inField(event.target)) return;
    event.preventDefault();
    gesture();
  }, { passive: false });

  window.addEventListener("keydown", (event) => {
    if (streamDone || inField(event.target)) return;
    if (!["ArrowDown", "PageDown", " "].includes(event.key)) return;
    event.preventDefault();
    gesture();
  });

  let touchY = null;
  window.addEventListener("touchstart", (event) => {
    touchY = event.touches[0].clientY;
  }, { passive: true });
  window.addEventListener("touchmove", (event) => {
    if (streamDone || touchY === null || inField(event.target)) return;
    const y = event.touches[0].clientY;
    const up = touchY - y;
    touchY = y;
    if (up <= 0) return;
    event.preventDefault();
    gesture();
  }, { passive: false });

  // ---- Typed commands: each one adds a block above the prompt ----

  function makeLine(text, cls = "") {
    const div = document.createElement("div");
    if (cls) div.className = cls;
    div.textContent = text;
    return div;
  }

  // Builds a block: the echoed command line, then its output. Output is not shown yet.
  function buildBlock(cmdText, outputNodes) {
    const block = document.createElement("div");
    block.className = "block";
    block.dataset.cmd = cmdText;
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
    for (const node of outputNodes) out.appendChild(node);
    block.append(line, out);
    return block;
  }

  // Adds a typed command above the prompt, with its output shown at once.
  function addBlock(cmdText, outputNodes) {
    const block = buildBlock(cmdText, outputNodes);
    block.classList.add("started"); // shows the echoed command line with its prompt
    for (const el of block.querySelector(".out").children) el.classList.add("shown");
    stream.insertBefore(block, form);
    form.scrollIntoView({ block: "end", behavior: reduceMotion ? "auto" : "smooth" });
  }

  // Copies a scripted command's output, so typed commands show the same content.
  // The continue button is left out: it only belongs to the stream.
  function outputOf(name) {
    const nodes = library.get(name);
    return nodes ? nodes.map((el) => el.cloneNode(true)) : null;
  }

  // Opens a link in a new tab after the "opening" line has had time to show.
  const OPEN_DELAY = 750;
  function openAfterMessage(url) {
    setTimeout(() => window.open(url, "_blank", "noopener,noreferrer"), OPEN_DELAY);
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
      addBlock(trimmed, [makeLine("opening resume.pdf", "sys")]);
      openAfterMessage(LINKS.resume);
      return;
    }
    if (cmd === "open") {
      const key = (args[0] || "").toLowerCase();
      if (!LINKS[key]) {
        addBlock(trimmed, [makeLine(`usage: open <${Object.keys(LINKS).join("|")}>`, "err")]);
        return;
      }
      addBlock(trimmed, [makeLine(`opening ${key}`, "sys")]);
      openAfterMessage(LINKS[key]);
      return;
    }
    // "get <section>" prints that section, the same as typing its name.
    const output = outputOf(cmd === "get" ? (args[0] || "").toLowerCase() : cmd);
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

  // Continue buttons run the next step, the same as scrolling does.
  // Tapping the stream focuses the prompt, except on links and form fields.
  // preventScroll: focusing the prompt must not jump the page to the bottom.
  stream.addEventListener("click", (event) => {
    if (event.target.closest(".continue")) {
      advance();
      return;
    }
    if (event.target.closest(".skip")) {
      skipIntro();
      return;
    }
    if (!event.target.closest("a,button,input,textarea,form")) input.focus({ preventScroll: true });
  });
})();
