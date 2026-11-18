(() => {
  "use strict";

  const output = document.getElementById("output");
  const form = document.getElementById("prompt");
  const input = document.getElementById("cmd");

  // Allow-listed targets for `open`. Nothing else can be opened.
  const LINKS = {
    github: "https://github.com/arshalsoren",
    linkedin: "https://linkedin.com/in/arshalsoren",
    sponsors: "https://github.com/sponsors/arshalsoren",
    topd: "https://github.com/arshalsoren/topd",
    site: "https://arshalsoren.github.io/topd/",
  };

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const link = (key, label = LINKS[key]) =>
    `<a href="${LINKS[key]}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;

  const COMMANDS = {
    help: () => `
      <p>Commands:</p>
      <pre>whoami        who I am, in one paragraph
about         a short summary
experience    work history
projects      things I have built
skills        languages, tools, and infrastructure
education     degree
contact       where to find me
ls            list sections
open &lt;name&gt;  open a link: ${Object.keys(LINKS).map(esc).join(", ")}
clear         clear the screen</pre>`,

    whoami: () => `
      <p><strong>Arshal Soren</strong></p>
      <p>Backend software engineer. I design, build, and operate scalable, high-availability services and APIs, and I care about the performance, reliability, and observability of distributed platforms.</p>`,

    about: () => `
      <p>Four years of backend work across PHP, Go, Node.js, and TypeScript, on systems that handle large daily traffic. I work closely with product and DevOps, and I like making systems easier to run: better caching, clearer observability, and less manual operations work.</p>`,

    experience: () => `
      <div class="h">Trackier — Software Engineer II</div>
      <p class="muted">Noida, India · Apr 2026 – Oct 2026</p>
      <p>Leading backend development for a high-scale performance-marketing platform. Upgraded production MongoDB from 3.6 to 7.0 with zero data loss, improving database performance by 50%. Designed caching, observability, and operational tooling. Drove code reviews and deployment processes.</p>

      <div class="h">Trackier — Software Engineer</div>
      <p class="muted">Remote · Dec 2022 – Mar 2026</p>
      <p>Built and maintained backend services and API features across PHP, Go, Node.js, MongoDB, Redis, and ClickHouse. Led resolution of critical production issues. Automated operational workflows, reducing manual effort and mean time to resolution.</p>

      <div class="h">Byju's — Software Engineer</div>
      <p class="muted">Remote · Jul 2022 – Nov 2022</p>
      <p>Backend systems for interactive learning with the In-Class Experience team. Event-driven workflows and Kafka streams for the Suggestions Engine. CI/CD pipelines for AWS Lambda deployments.</p>`,

    projects: () => `
      <div class="h">topd</div>
      <p class="muted">Nov 2026 – present · Swift 5.10, SwiftUI, AppKit, SMAppService</p>
      <p>htop for macOS, without opening a window. A native menu bar system monitor with live CPU, memory, GPU, storage, and network cards. Idle CPU stays under 0.2%.</p>
      <p>${link("topd", "GitHub")} · ${link("site", "project site")}</p>`,

    skills: () => `
      <pre>Languages    Go, JavaScript, TypeScript, PHP, C++, Python, Swift
Backend      Node.js, Express.js, REST APIs, microservices, gRPC, event-driven architecture
Databases    MongoDB, ClickHouse, PostgreSQL, Redis, Memcached
Cloud/DevOps Google Cloud, AWS, Docker, Kubernetes, Jenkins, Terraform
Tools        Kafka, Git, Linux, CI/CD, observability</pre>`,

    education: () => `
      <div class="h">Bachelor of Technology, Computer Science and Engineering</div>
      <p class="muted">Birla Institute of Technology, Mesra · 2018 – 2022 · Ranchi, India</p>`,

    contact: () => `
      <p>${link("linkedin", "LinkedIn")}</p>
      <p>${link("github", "GitHub")}</p>
      <p>${link("sponsors", "GitHub Sponsors")}</p>`,

    ls: () => `<pre>about/  experience/  projects/  skills/  education/  contact/</pre>`,

    sudo: () => `<p class="err">Nice try. Say hello on LinkedIn instead.</p>`,
  };

  const NAMES = Object.keys(COMMANDS).concat(["open", "clear"]).sort();

  let history = [];
  let historyIndex = 0;

  function print(html) {
    const block = document.createElement("div");
    block.innerHTML = html;
    output.appendChild(block);
    window.scrollTo(0, document.body.scrollHeight);
  }

  function echo(raw) {
    const line = document.createElement("div");
    line.className = "line-in";
    const ps1 = document.createElement("span");
    ps1.className = "ps1";
    ps1.textContent = "arshal@soren:~$ ";
    const text = document.createElement("span");
    text.textContent = raw; // user input is never parsed as HTML
    line.append(ps1, text);
    output.appendChild(line);
  }

  function run(raw) {
    const trimmed = raw.trim();
    echo(raw);
    if (!trimmed) return;

    history.push(trimmed);
    historyIndex = history.length;

    const [name, ...args] = trimmed.split(/\s+/);
    const cmd = name.toLowerCase();

    if (cmd === "clear") {
      output.textContent = "";
      return;
    }

    if (cmd === "open") {
      const key = (args[0] || "").toLowerCase();
      if (!LINKS[key]) {
        print(`<p class="err">usage: open &lt;${Object.keys(LINKS).map(esc).join("|")}&gt;</p>`);
        return;
      }
      window.open(LINKS[key], "_blank", "noopener,noreferrer");
      print(`<p class="muted">opening ${esc(LINKS[key])}</p>`);
      return;
    }

    const fn = COMMANDS[cmd];
    if (!fn) {
      print(`<p class="err">${esc(name)}: command not found. Type <code>help</code>.</p>`);
      return;
    }
    print(fn());
  }

  function complete() {
    const value = input.value;
    if (value.includes(" ")) return;
    const matches = NAMES.filter((n) => n.startsWith(value.toLowerCase()));
    if (matches.length === 1) {
      input.value = matches[0] + " ";
    } else if (matches.length > 1) {
      print(`<pre>${matches.map(esc).join("  ")}</pre>`);
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run(input.value);
    input.value = "";
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      complete();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (historyIndex > 0) historyIndex -= 1;
      input.value = history[historyIndex] || "";
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      historyIndex = Math.min(history.length, historyIndex + 1);
      input.value = history[historyIndex] || "";
    }
  });

  // Tapping anywhere in the window focuses the prompt, except on links.
  document.querySelector(".window").addEventListener("click", (event) => {
    if (!event.target.closest("a")) input.focus();
  });

  // Welcome message
  print(`
    <p>Welcome to Arshal's terminal.</p>
    <p class="muted">Type <code>help</code> to see what you can run, or <code>whoami</code> to start.</p>`);
})();
