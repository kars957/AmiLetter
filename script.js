const cover = document.querySelector("#cover");
const letter = document.querySelector("#letter");
const readButton = document.querySelector("#readButton");
const ackPrompt = document.querySelector("#ackPrompt");
const ackButton = document.querySelector("#ackButton");
const ackComplete = document.querySelector("#ackComplete");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const letterInteractionState = {
  opened: {
    count: 0,
    clicks: [],
  },
  acknowledged: {
    count: 0,
    clicks: [],
  },
};

window.letterInteractionState = letterInteractionState;
globalThis.letterInteractionState = letterInteractionState;

function updateCodeVisibleCounters(type) {
  const target = letterInteractionState[type];
  const prefix = type === "opened" ? "opened" : "acknowledged";
  const lastClick = target.clicks[target.clicks.length - 1];

  document.documentElement.dataset[`${prefix}ClickCount`] = String(target.count);

  if (lastClick) {
    document.documentElement.dataset[`${prefix}LastClickedAtSydney`] = lastClick.sydney;
    document.documentElement.dataset[`${prefix}LastClickedAtIso`] = lastClick.iso;
  }
}

function syncAllCodeVisibleCounters() {
  updateCodeVisibleCounters("opened");
  updateCodeVisibleCounters("acknowledged");
}

window.getLetterInteractionState = function getLetterInteractionState() {
  return {
    readButton: {
      count: letterInteractionState.opened.count,
      clicks: letterInteractionState.opened.clicks.slice(),
    },
    acknowledgementButton: {
      count: letterInteractionState.acknowledged.count,
      clicks: letterInteractionState.acknowledged.clicks.slice(),
    },
    opened: {
      count: letterInteractionState.opened.count,
      clicks: letterInteractionState.opened.clicks.slice(),
    },
    acknowledged: {
      count: letterInteractionState.acknowledged.count,
      clicks: letterInteractionState.acknowledged.clicks.slice(),
    },
  };
};
globalThis.getLetterInteractionState = window.getLetterInteractionState;

syncAllCodeVisibleCounters();

function getSydneyTimestamp() {
  const clickedAt = new Date();

  return {
    iso: clickedAt.toISOString(),
    sydney: new Intl.DateTimeFormat("en-AU", {
      dateStyle: "full",
      timeStyle: "long",
      timeZone: "Australia/Sydney",
    }).format(clickedAt),
  };
}

function recordInteraction(type) {
  const target = letterInteractionState[type];

  if (!target) {
    return;
  }

  target.count += 1;
  target.clicks.push(getSydneyTimestamp());
  updateCodeVisibleCounters(type);

  sendInteractionToServer(type);
}

async function sendInteractionToServer(type) {
  try {
    await fetch("/api/interaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type }),
    });
  } catch {
    // The letter should still work when previewed without Cloudflare Functions.
  }
}

function openLetter() {
  recordInteraction("opened");
  cover.classList.add("is-hidden");
  letter.classList.add("is-visible");

  window.setTimeout(() => {
    cover.setAttribute("hidden", "");
    letter.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  }, prefersReducedMotion.matches ? 0 : 620);
}

readButton.addEventListener("click", openLetter);

function acknowledgeLetter() {
  recordInteraction("acknowledged");
  ackButton.disabled = true;
  ackPrompt.classList.add("is-leaving");

  window.setTimeout(() => {
    ackPrompt.setAttribute("hidden", "");
    ackComplete.hidden = false;
    requestAnimationFrame(() => {
      ackComplete.classList.add("is-visible");
    });
  }, prefersReducedMotion.matches ? 0 : 560);
}

ackButton.addEventListener("click", acknowledgeLetter);
