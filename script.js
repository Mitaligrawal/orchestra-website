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
// Early access signup
//
// Formspree takes the submission and emails it to you — no backend needed.
// ---------------------------------------------------------------------------
const FORM_ENDPOINT = "https://formspree.io/f/xwvgylkg";

/** When signups close. Also stated in the markup, so keep the two in step. */
const DEADLINE = new Date("2026-08-03T23:59:59");

const signup = document.querySelector("#signup");
const status = document.querySelector(".signup-status");

function say(message, state) {
  if (!status) return;
  status.textContent = message;
  status.dataset.state = state;
  status.hidden = false;
}

signup?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (signup.hasAttribute("data-busy")) return;

  const input = signup.querySelector("input[name='email']");
  const email = input?.value.trim() ?? "";

  // `novalidate` turns off the browser bubble so the message lands in the same
  // place as every other one.
  if (!input?.checkValidity() || !email) {
    say("Enter an email address we can send the download link to.", "error");
    input?.focus();
    return;
  }

  signup.setAttribute("data-busy", "");
  say("Sending…", "pending");

  try {
    const payload = new URLSearchParams();
    payload.set("email", email);
    payload.set("_subject", "Orchestra early access signup");

    const res = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        accept: "application/json",
      },
      body: payload.toString(),
    });

    if (!res.ok) {
      say("That did not go through. Try again in a moment.", "error");
      return;
    }

    signup.reset();
    say(`You're on the list. Your download link is on its way to ${email}.`, "ok");
  } catch {
    say("That did not go through. Try again, or email us and we'll add you by hand.", "error");
  } finally {
    signup.removeAttribute("data-busy");
  }
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
