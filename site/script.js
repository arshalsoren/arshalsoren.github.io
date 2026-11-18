(() => {
  "use strict";

  const EMAIL = "arshalsoren@gmail.com";
  const form = document.getElementById("contact-form");

  // The only interactive part of the page. It opens the visitor's mail app
  // with the message filled in. Nothing is sent from this site.
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
})();
