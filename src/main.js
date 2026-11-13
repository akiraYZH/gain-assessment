import { createFooterDrawer } from "./footer-drawer/index.js";
import { createPokemonListing } from "./pokemon-listing/index.js";
import { createQuestionnaire } from "./questionnaire/index.js";
import { styles } from "./styles.js";

const APP_KEY = "__GAIN_ASSESSMENT__";
const STYLE_ID = "gain-assessment-styles";

function isBlogPage(pathname) {
  return pathname === "/blog" || pathname.startsWith("/blog/");
}

function createPageElements() {
  const { pathname } = window.location;

  if (isBlogPage(pathname)) {
    return createPokemonListing();
  }

  if (pathname === "/") {
    return [...createQuestionnaire(), ...createFooterDrawer()];
  }

  return [];
}

function bootstrap() {
  if (window[APP_KEY]) {
    console.info("GAIN assessment is already initialized.");
    return;
  }

  let elements = [];
  let style;

  try {
    elements.push(...createPageElements());

    style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = styles;
    (document.head ?? document.documentElement).append(style);

    window[APP_KEY] = true;

    console.info("GAIN assessment initialized.");
  } catch (error) {
    elements.forEach((element) => element.remove());
    style?.remove();

    console.error("GAIN assessment initialization failed.", error);
  }
}

bootstrap();
