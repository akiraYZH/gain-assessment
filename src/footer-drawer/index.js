import { readCaseStudiesFromPage, readServicesFromPage } from "../data.js";
import styles from "./drawer.css";
import { createFooterSlider } from "./slider.js";

const DRAWER_ID = "gain-footer-drawer";
const PANEL_ID = "gain-footer-drawer-panel";

export function createFooterDrawer() {
  const caseStudies = readCaseStudiesFromPage();
  const services = readServicesFromPage();
  const overlay = document.createElement("div");
  const drawer = document.createElement("aside");

  // Overlay
  overlay.className = "ga-footer-drawer-overlay";
  overlay.setAttribute("aria-hidden", "true");

  // Drawer
  drawer.id = DRAWER_ID;
  drawer.className = "ga-footer-drawer";
  drawer.innerHTML = `
    <div class="ga-footer-drawer-tab">
      <button
        class="ga-footer-drawer-label-toggle"
        type="button"
        aria-controls="${PANEL_ID}"
        aria-expanded="false"
      >
        Sticky drawer
      </button>
      <div class="ga-footer-drawer-pagination" aria-label="Slider pagination">
        <button
          class="ga-footer-drawer-previous"
          type="button"
          aria-label="Previous case studies"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <span class="ga-footer-drawer-page" aria-live="polite">1 / 1</span>
        <button
          class="ga-footer-drawer-next"
          type="button"
          aria-label="Next case studies"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <button
        class="ga-footer-drawer-chevron-toggle"
        type="button"
        aria-label="Toggle sticky drawer"
        aria-controls="${PANEL_ID}"
        aria-expanded="false"
      >
        <span class="ga-footer-drawer-chevron" aria-hidden="true"></span>
      </button>
    </div>
    <div
      id="${PANEL_ID}"
      class="ga-footer-drawer-panel"
      aria-hidden="true"
      inert
    >
      <div class="ga-footer-drawer-content"></div>
    </div>
  `;

  // drawer tab
  const tab = drawer.querySelector(".ga-footer-drawer-tab");
  // tab text
  const labelToggle = drawer.querySelector(".ga-footer-drawer-label-toggle");
  // toggle icon
  const chevronToggle = drawer.querySelector(
    ".ga-footer-drawer-chevron-toggle",
  );

  const previousButton = drawer.querySelector(".ga-footer-drawer-previous");
  const nextButton = drawer.querySelector(".ga-footer-drawer-next");
  const pageStatus = drawer.querySelector(".ga-footer-drawer-page");

  // panel
  const panel = drawer.querySelector(".ga-footer-drawer-panel");
  // content
  const content = drawer.querySelector(".ga-footer-drawer-content");

  if (
    !tab ||
    !labelToggle ||
    !chevronToggle ||
    !previousButton ||
    !nextButton ||
    !pageStatus ||
    !panel ||
    !content
  ) {
    throw new Error("Footer drawer controls were not created.");
  }

  const slider = createFooterSlider({
    caseStudies,
    services,
    previousButton,
    nextButton,
    pageStatus,
  });

  content.append(slider.element);

  let isOpen = false;
  let scrollCheckRequested = false;

  // Toggle the panel function
  const setOpen = (open, restoreFocus = false) => {
    isOpen = open;
    drawer.classList.toggle("ga-footer-drawer-open", open);
    overlay.classList.toggle("ga-footer-drawer-overlay-visible", open);
    overlay.setAttribute("aria-hidden", String(!open));
    labelToggle.setAttribute("aria-expanded", String(open));
    chevronToggle.setAttribute("aria-expanded", String(open));
    panel.setAttribute("aria-hidden", String(!open));
    panel.inert = !open;

    if (open) {
      window.requestAnimationFrame(slider.refresh);
    } else if (restoreFocus) {
      labelToggle.focus();
    }
  };

  // click to toggle
  tab.addEventListener("click", (event) => {
    if (event.target.closest(".ga-footer-drawer-pagination")) return;
    setOpen(!isOpen);
  });

  // overlay toggle
  overlay.addEventListener("click", () => setOpen(false, true));

  // Escape to close
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen) {
      setOpen(false, true);
    }
  });

  window.addEventListener(
    "scroll",
    () => {
      if (!isOpen || scrollCheckRequested) return;

      scrollCheckRequested = true;
      window.requestAnimationFrame(() => {
        const reachedPageBottom =
          window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 2;

        if (reachedPageBottom) {
          setOpen(false);
        }

        scrollCheckRequested = false;
      });
    },
    { passive: true },
  );

  document.body.append(overlay, drawer);
  return [overlay, drawer];
}

export { styles };
