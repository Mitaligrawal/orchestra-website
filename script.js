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

/** When signups close. Also stated in the markup, so keep the two in step. */
const DEADLINE = new Date("2026-08-03T23:59:59");

// ---------------------------------------------------------------------------
// User count
//
// There is no backend to poll, so the real number is the one written into the
// markup — edit it there. This only counts up to whatever it already says.
// ---------------------------------------------------------------------------
const usercount = document.querySelector("[data-usercount]");
const target = Number(usercount?.textContent.replace(/\D/g, ""));

if (usercount && target > 0 && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const DURATION = 900;
  let start;

  const step = (now) => {
    start ??= now;
    const t = Math.min((now - start) / DURATION, 1);
    // Ease out, so it decelerates into the final number instead of snapping.
    const value = Math.round(target * (1 - Math.pow(1 - t, 3)));
    usercount.textContent = value.toLocaleString();
    if (t < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

// ---------------------------------------------------------------------------
// Download counter
//
// Counts locally, in this browser only — there is no backend to aggregate
// across visitors, so the label says so rather than implying a global total.
// ---------------------------------------------------------------------------
const TALLY_KEY = "orchestra:downloads";

/** Reads the tally, tolerating a cleared, corrupt, or blocked localStorage. */
function readTally() {
  try {
    const raw = localStorage.getItem(TALLY_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeTally(tally) {
  try {
    localStorage.setItem(TALLY_KEY, JSON.stringify(tally));
  } catch {
    // Private browsing or a full quota — the number still shows for this page
    // view, it just will not survive a reload.
  }
}

const tallyBox = document.querySelector("[data-tally]");
const tallyCount = document.querySelector("[data-tally-count]");
const tallyLabel = document.querySelector("[data-tally-label]");
const downloadLinks = document.querySelectorAll("[data-download]");

let tally = readTally();

function renderTally() {
  const total = Object.values(tally).reduce(
    (sum, n) => sum + (Number.isFinite(n) ? n : 0),
    0
  );

  if (tallyBox && tallyCount && tallyLabel) {
    tallyCount.textContent = String(total);
    tallyLabel.textContent =
      total === 1
        ? "download from this browser"
        : "downloads from this browser";
    tallyBox.hidden = total === 0;
  }

  for (const link of downloadLinks) {
    const id = link.dataset.download;
    const note = document.querySelector(`[data-card-tally="${id}"]`);
    if (!note) continue;
    const count = tally[id] ?? 0;
    note.textContent = count === 1 ? "Downloaded once" : `Downloaded ${count} times`;
    note.hidden = count === 0;
  }
}

for (const link of downloadLinks) {
  link.addEventListener("click", () => {
    const id = link.dataset.download;
    if (!id) return;

    // Re-read first: another tab may have counted a download since this page
    // loaded, and a blind write would drop it.
    tally = readTally();
    tally[id] = (tally[id] ?? 0) + 1;
    writeTally(tally);
    renderTally();

    tallyBox?.classList.remove("bump");
    // Restart the animation rather than letting a rapid second click skip it.
    void tallyBox?.offsetWidth;
    tallyBox?.classList.add("bump");
  });
}

renderTally();

// Keep two open tabs in step.
window.addEventListener("storage", (event) => {
  if (event.key !== TALLY_KEY) return;
  tally = readTally();
  renderTally();
});

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
