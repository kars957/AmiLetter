const cover = document.querySelector("#cover");
const letter = document.querySelector("#letter");
const readButton = document.querySelector("#readButton");
const readingPages = [...document.querySelectorAll("[data-reading-page]")];
const previousButtons = [...document.querySelectorAll("[data-previous-page]")];
const nextButtons = [...document.querySelectorAll("[data-next-page]")];
const ackPrompt = document.querySelector("#ackPrompt");
const ackButton = document.querySelector("#ackButton");
const ackComplete = document.querySelector("#ackComplete");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const pageOrder = ["intro", "1", "2", "3", "4", "5", "final"];
let currentPageIndex = 0;

const letterInteractionState = {
  opened: {
    count: 0,
    clicks: [],
  },
  pageProgress: {
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

function updateCodeVisibleCounters(type) {
  const target = letterInteractionState[type];
  const lastClick = target.clicks[target.clicks.length - 1];

  document.documentElement.dataset[`${type}ClickCount`] = String(target.count);

  if (lastClick) {
    document.documentElement.dataset[`${type}LastClickedAtSydney`] = lastClick.sydney;
    document.documentElement.dataset[`${type}LastClickedAtIso`] = lastClick.iso;
  }
}

function syncAllCodeVisibleCounters() {
  updateCodeVisibleCounters("opened");
  updateCodeVisibleCounters("pageProgress");
  updateCodeVisibleCounters("acknowledged");
}

window.getLetterInteractionState = function getLetterInteractionState() {
  return {
    opened: {
      count: letterInteractionState.opened.count,
      clicks: letterInteractionState.opened.clicks.slice(),
    },
    pageProgress: {
      count: letterInteractionState.pageProgress.count,
      clicks: letterInteractionState.pageProgress.clicks.slice(),
    },
    acknowledged: {
      count: letterInteractionState.acknowledged.count,
      clicks: letterInteractionState.acknowledged.clicks.slice(),
    },
    readButton: {
      count: letterInteractionState.opened.count,
      clicks: letterInteractionState.opened.clicks.slice(),
    },
    acknowledgementButton: {
      count: letterInteractionState.acknowledged.count,
      clicks: letterInteractionState.acknowledged.clicks.slice(),
    },
  };
};
globalThis.getLetterInteractionState = window.getLetterInteractionState;

syncAllCodeVisibleCounters();

function recordLocalInteraction(type, page) {
  const stateKey = type === "page_progress" ? "pageProgress" : type;
  const target = letterInteractionState[stateKey];

  if (!target) {
    return;
  }

  target.count += 1;
  target.clicks.push({
    ...getSydneyTimestamp(),
    page: page || null,
  });
  updateCodeVisibleCounters(stateKey);

  if (page) {
    document.documentElement.dataset.pageProgressLastPage = String(page);
  }
}

function logInteraction(type, page) {
  recordLocalInteraction(type, page);

  const payload = page ? { type, page } : { type };

  fetch("/api/interaction", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    // The letter should still work when previewed without Cloudflare Functions.
  });
}

function getCurrentPageKey() {
  return pageOrder[currentPageIndex];
}

function setActivePage(pageKey, direction) {
  letter.classList.toggle("is-moving-back", direction === "back");

  readingPages.forEach((page) => {
    page.classList.toggle("is-active", page.dataset.readingPage === pageKey);
  });

  window.scrollTo({ top: 0, behavior: "auto" });
  letter.focus({ preventScroll: true });
}

function goToPage(nextIndex, direction) {
  if (nextIndex < 0 || nextIndex >= pageOrder.length) {
    return;
  }

  currentPageIndex = nextIndex;
  setActivePage(getCurrentPageKey(), direction);

  const reachedPage = Number(getCurrentPageKey());

  if (direction === "forward" && Number.isInteger(reachedPage)) {
    logInteraction("page_progress", reachedPage);
  }
}

function openLetter() {
  logInteraction("opened");
  currentPageIndex = 0;
  setActivePage("intro", "forward");
  cover.classList.add("is-hidden");
  letter.classList.add("is-visible");

  window.setTimeout(() => {
    cover.setAttribute("hidden", "");
    letter.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  }, prefersReducedMotion.matches ? 0 : 620);
}

function acknowledgeLetter() {
  logInteraction("acknowledged");
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

readButton.addEventListener("click", openLetter);
ackButton.addEventListener("click", acknowledgeLetter);

previousButtons.forEach((button) => {
  button.addEventListener("click", () => {
    goToPage(currentPageIndex - 1, "back");
  });
});

nextButtons.forEach((button) => {
  button.addEventListener("click", () => {
    goToPage(currentPageIndex + 1, "forward");
  });
});
