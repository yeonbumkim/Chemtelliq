/* ============================================================
   Chemtelliq — main.js
   No dependencies. Each block guards for missing elements so the
   same file can be loaded on every page.
   ============================================================ */
(function () {
  "use strict";

  /* ---- Mobile navigation ---- */
  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.querySelector("[data-nav]");

  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.setAttribute("data-open", String(open));
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    // Close when a link is followed
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    // Reset when resizing back to desktop
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) setOpen(false);
    });
  }

  /* ---- Reveal on scroll ---- */
  var revealables = document.querySelectorAll("[data-reveal]");
  if (revealables.length) {
    if (!("IntersectionObserver" in window)) {
      revealables.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });

      revealables.forEach(function (el) { observer.observe(el); });
    }
  }

  /* ---- Current year in footer ---- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---- Looping media: pause control + reduced-motion ---- */
  var reduceMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  document.querySelectorAll("[data-media-toggle]").forEach(function (btn) {
    var figure = btn.closest(".media-figure");
    var video = figure && figure.querySelector("video");
    if (!video) return;

    var setPaused = function (paused) {
      btn.setAttribute("aria-pressed", String(paused));
      btn.setAttribute("aria-label", paused ? "Play animation" : "Pause animation");
    };

    // Someone who asked for less motion should not be handed an autoplaying loop.
    if (reduceMotion && reduceMotion.matches) {
      video.removeAttribute("autoplay");
      video.pause();
      setPaused(true);
    }

    btn.addEventListener("click", function () {
      if (video.paused) {
        video.play();
        setPaused(false);
      } else {
        video.pause();
        setPaused(true);
      }
    });

    // Keep the button honest if playback changes for any other reason
    video.addEventListener("play",  function () { setPaused(false); });
    video.addEventListener("pause", function () { setPaused(true); });
  });

  /* ---- Contact form ----
     Posts to a Make.com custom webhook. Paste the webhook URL below; while it is
     empty the form refuses to pretend it worked and points at the email address
     instead. FormData (not JSON) keeps this a "simple" request, so the browser
     sends no CORS preflight. */
  var WEBHOOK_URL = "https://hook.eu2.make.com/wvq3z5rxw7uksv0tyjnnt7xnpujaeve1";
  var FALLBACK_EMAIL = "yeonbum.kim@chemtelliq.com";

  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var status = form.querySelector("[data-form-status]");
    var button = form.querySelector('button[type="submit"]');
    var label = button ? button.textContent : "";

    var say = function (state, text) {
      if (!status) return;
      status.setAttribute("data-state", state);
      status.textContent = text;
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }


      if (!WEBHOOK_URL) {
        say("error",
          "This form is not connected yet. Please email " + FALLBACK_EMAIL + " directly.");
        return;
      }

      // Honeypot. Rather than dropping the message here, flag it and let the Make
      // scenario filter it out. A silent client-side drop meant that anything which
      // tripped the trap by accident - mobile autofill did exactly this - vanished
      // without the sender or us ever knowing.
      var data = new FormData(form);
      var trap = form.elements.hp_ref ? form.elements.hp_ref.value : "";
      data.delete("hp_ref");
      if (trap) data.append("hp", trap);

      data.append("page", window.location.href);
      data.append("submitted_at", new Date().toISOString());

      if (button) { button.disabled = true; button.textContent = "Sending…"; }
      say("", "");

      fetch(WEBHOOK_URL, { method: "POST", body: data })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          form.reset();
          say("ok", "Thanks - your message has been sent. We will get back to you " +
                    "within two business days.");
        })
        .catch(function () {
          say("error", "Sorry - the message could not be sent. Please email " +
                       FALLBACK_EMAIL + " instead.");
        })
        .then(function () {
          if (button) { button.disabled = false; button.textContent = label; }
        });
    });
  }
})();
