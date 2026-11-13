import { createFooterDrawer } from "./footer-drawer/index.js";
import { createPokemonListing } from "./pokemon-listing/index.js";
import { createQuestionnaire } from "./questionnaire/index.js";
import { styles } from "./styles.js";

const APP_KEY = "__GAIN_ASSESSMENT__";
const STYLE_ID = "gain-assessment-styles";

function isBlogPage(pathname) {
  return pathname === "/blog" || pathname.startsWith("/blog/");
}

function pageIsReady() {
  const { pathname } = window.location;

  if (isBlogPage(pathname)) {
    const listing = document.querySelector('[data-behaviour="listing"]');

    return Boolean(
      document.body &&
        document.querySelector('[data-behaviour="listing-filters"]') &&
        listing?.querySelector(".listing-box") &&
        listing.querySelector(":scope > nav"),
    );
  }

  return pathname !== "/" || document.readyState !== "loading";
}

function waitForPage() {
  if (pageIsReady()) return Promise.resolve();

  return new Promise((resolve) => {
    const observer = new MutationObserver(checkPage);

    function checkPage() {
      if (!pageIsReady()) return;

      observer.disconnect();
      document.removeEventListener("DOMContentLoaded", checkPage);
      resolve();
    }

    observer.observe(document, { childList: true, subtree: true });
    document.addEventListener("DOMContentLoaded", checkPage);
  });
}

function createPageElements(elements, cleanups) {
  const { pathname } = window.location;

  if (isBlogPage(pathname)) {
    cleanups.push(createPokemonListing());
    return;
  }

  if (pathname === "/") {
    elements.push(...createQuestionnaire());
    elements.push(...createFooterDrawer());
  }
}

async function bootstrap() {
  if (window[APP_KEY]) {
    console.info("GAIN assessment is already initialized.");
    return;
  }

  window[APP_KEY] = "initializing";

  const elements = [];
  const cleanups = [];
  let style;

  try {
    await waitForPage();
    createPageElements(elements, cleanups);

    style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = styles;
    (document.head ?? document.documentElement).append(style);

    window[APP_KEY] = "initialized";

    console.info("GAIN assessment initialized.");
  } catch (error) {
    cleanups.reverse().forEach((cleanup) => cleanup());
    elements.forEach((element) => element.remove());
    style?.remove();
    delete window[APP_KEY];

    console.error("GAIN assessment initialization failed.", error);
  }
}

bootstrap();
