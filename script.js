const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav-toggle");
const mobile = document.querySelector(".nav-mobile");

window.addEventListener(
  "scroll",
  () => {
    nav?.classList.toggle("scrolled", window.scrollY > 8);
  },
  { passive: true }
);

toggle?.addEventListener("click", () => {
  const open = mobile?.hasAttribute("hidden") ?? true;
  if (!mobile) return;
  if (open) {
    mobile.removeAttribute("hidden");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
  } else {
    mobile.setAttribute("hidden", "");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  }
});

mobile?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mobile.setAttribute("hidden", "");
    toggle?.setAttribute("aria-expanded", "false");
  });
});

// ---------------------------------------------------------------------------
// Download gate
//
// The builds are behind an address. Formspree takes the submission and emails
// it on — no backend, no account key in this file.
//
// Worth being clear-eyed about what this is: the .dmg URLs are public GitHub
// release assets, so anyone who goes looking can reach them without the form.
// This captures the addresses of people who are not trying to dodge it, which
// is what a gate on a static page can honestly do.
// ---------------------------------------------------------------------------
const FORM_ENDPOINT = "https://formspree.io/f/xwvgylkg";

/** Remembers a visitor who has already given an address, so it asks once. */
const GATE_KEY = "orchestra:download-access";

const downloads = document.querySelector("#downloads");
const gate = document.querySelector("#download-gate");
const gateStatus = document.querySelector(".gate-status");

function gateSay(message, state) {
  if (!gateStatus) return;
  gateStatus.textContent = message;
  gateStatus.dataset.state = state;
  gateStatus.hidden = false;
}

/** Drops the gate and puts the builds on screen. */
function openDownloads(announce) {
  downloads?.removeAttribute("data-gated");
  if (!announce) return;
  // Land them on the buttons they came for rather than leaving them to scroll.
  downloads?.querySelector(".download-grid .btn")?.focus({ preventScroll: true });
  downloads?.querySelector(".download-grid")?.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });
}

// A returning visitor has already paid the toll.
try {
  if (localStorage.getItem(GATE_KEY)) openDownloads(false);
} catch {
  // Private browsing can refuse storage; the form still works, it just asks again.
}

gate?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (gate.hasAttribute("data-busy")) return;

  const input = gate.querySelector("input[name='email']");
  const email = input?.value.trim() ?? "";

  // `novalidate` turns off the browser bubble so the message lands in the same
  // place as every other one.
  if (!input?.checkValidity() || !email) {
    gateSay("Enter an email address so we can send you updates.", "error");
    input?.focus();
    return;
  }

  gate.setAttribute("data-busy", "");
  gateSay("One moment…", "pending");

  try {
    // Formspree expects standard form fields (URL-encoded), not JSON.
    const payload = new URLSearchParams();
    payload.set("email", email);
    payload.set("source", "download-gate");
    payload.set("_subject", "Orchestra download");

    const res = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        accept: "application/json",
      },
      body: payload.toString(),
    });

    if (!res.ok) {
      gateSay("That did not go through. Try again in a moment.", "error");
      return;
    }

    try {
      localStorage.setItem(GATE_KEY, new Date().toISOString());
    } catch {
      // Nothing to do — they will be asked again next visit.
    }

    gateSay(`Thanks. Your builds are below, ${email}.`, "ok");
    openDownloads(true);
  } catch {
    gateSay("That did not go through. Check your connection and try again.", "error");
  } finally {
    gate.removeAttribute("data-busy");
  }
});

/** When signups close. Also stated in the markup, so keep the two in step. */
const DEADLINE = new Date("2026-08-03T23:59:59");

// ---------------------------------------------------------------------------
// Download counter
//
// Shown total = BASELINE + GitHub release-asset download_count. Baseline is
// the starting figure; GitHub adds real downloads on top.
// ---------------------------------------------------------------------------
const RELEASE_API =
  "https://api.github.com/repos/Mitaligrawal/orchestra-website/releases/tags/v0.1.0";
const BASELINE = 849;

const usercountBox = document.querySelector("[data-usercount-box]");
const usercount = document.querySelector("[data-usercount]");
const usercountLabel = document.querySelector("[data-usercount-label]");
const tallyBox = document.querySelector("[data-tally]");
const tallyCount = document.querySelector("[data-tally-count]");
const tallyLabel = document.querySelector("[data-tally-label]");
const downloadLinks = document.querySelectorAll("[data-download]");

/** Map data-download id → asset filename from the link href. */
function assetName(link) {
  try {
    return decodeURIComponent(new URL(link.href).pathname.split("/").pop() || "");
  } catch {
    return "";
  }
}

let tally = Object.fromEntries(
  [...downloadLinks].map((link) => [link.dataset.download, 0])
);

function totalOf(counts) {
  return Object.values(counts).reduce(
    (sum, n) => sum + (Number.isFinite(n) ? n : 0),
    0
  );
}

function animateCount(el, target) {
  if (!el) return;
  const from = Number(String(el.textContent).replace(/\D/g, "")) || 0;
  if (
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    target === from
  ) {
    el.textContent = target.toLocaleString();
    return;
  }

  const DURATION = 900;
  let start;

  const step = (now) => {
    start ??= now;
    const t = Math.min((now - start) / DURATION, 1);
    const value = Math.round(from + (target - from) * (1 - Math.pow(1 - t, 3)));
    el.textContent = value.toLocaleString();
    if (t < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

function renderTally({ animate = false } = {}) {
  const total = BASELINE + totalOf(tally);

  if (tallyBox && tallyCount && tallyLabel) {
    if (animate) animateCount(tallyCount, total);
    else tallyCount.textContent = total.toLocaleString();
    tallyLabel.textContent = total === 1 ? "download" : "downloads";
    tallyBox.hidden = total === 0;
  }

  if (usercountBox && usercount && usercountLabel) {
    if (animate) animateCount(usercount, total);
    else usercount.textContent = total.toLocaleString();
    usercountLabel.textContent = total === 1 ? "download" : "downloads";
    usercountBox.hidden = total === 0;
  }

  for (const link of downloadLinks) {
    const id = link.dataset.download;
    const note = document.querySelector(`[data-card-tally="${id}"]`);
    if (!note) continue;
    const count = tally[id] ?? 0;
    if (count === 0) {
      note.textContent = "";
      note.hidden = true;
      continue;
    }
    note.textContent =
      count === 1 ? "1 download" : `${count.toLocaleString()} downloads`;
    note.hidden = false;
  }
}

async function loadReleaseCounts() {
  const res = await fetch(RELEASE_API);
  if (!res.ok) return null;

  const data = await res.json();
  const byName = Object.fromEntries(
    (data.assets ?? []).map((asset) => [asset.name, asset.download_count])
  );

  const next = {};
  for (const link of downloadLinks) {
    const id = link.dataset.download;
    const name = assetName(link);
    next[id] = Number(byName[name]) || 0;
  }
  return next;
}

renderTally({ animate: true });

loadReleaseCounts()
  .then((counts) => {
    if (!counts) return;
    tally = counts;
    renderTally({ animate: true });
  })
  .catch(() => {
    // Baseline already shown — GitHub numbers just stay at zero.
  });

for (const link of downloadLinks) {
  link.addEventListener("click", () => {
    const id = link.dataset.download;
    if (!id) return;

    // GitHub increments asynchronously; bump the UI now so the click feels real.
    tally[id] = (tally[id] ?? 0) + 1;
    renderTally();

    tallyBox?.classList.remove("bump");
    void tallyBox?.offsetWidth;
    tallyBox?.classList.add("bump");
  });
}

// Turns the static date into a countdown, but only while one is true — a stale
// page should fall back to the plain date in the markup, never show "-3 days".
const countdown = document.querySelector("[data-deadline-countdown]");
if (countdown) {
  const days = Math.ceil((DEADLINE - Date.now()) / 86_400_000);
  if (days === 1) countdown.textContent = "Closes tomorrow";
  else if (days > 1 && days <= 14) countdown.textContent = `Closes in ${days} days`;
}

document
  .querySelectorAll(".feature, .how, .frontier, .final, .trust")
  .forEach((el) => el.classList.add("reveal"));

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
} else {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
}
