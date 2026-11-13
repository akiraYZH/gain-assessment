const SCROLL_LOCK_CLASS = "ga-questionnaire-scroll-locked";
let lockedScrollY = 0;

export function setPageScrollLocked(locked) {
  if (locked) {
    lockedScrollY = window.scrollY;
    document.body.style.setProperty(
      "--ga-questionnaire-scroll-offset",
      `-${lockedScrollY}px`,
    );
  }

  document.documentElement.classList.toggle(SCROLL_LOCK_CLASS, locked);
  document.body.classList.toggle(SCROLL_LOCK_CLASS, locked);

  if (!locked) {
    document.body.style.removeProperty("--ga-questionnaire-scroll-offset");
    window.scrollTo(0, lockedScrollY);
  }
}
