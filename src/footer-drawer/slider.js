import { createCaseStudySlide } from "./slide.js";

const SMALL_VIEWPORT_QUERY = "(max-width: 1023px)";

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function createSliderStructure() {
  const slider = document.createElement("section");

  slider.className = "ga-footer-slider";
  slider.setAttribute("aria-label", "Featured case studies");
  slider.innerHTML = `
    <div class="ga-footer-slider-viewport">
      <ul class="ga-footer-slider-track"></ul>
    </div>
  `;

  const viewport = slider.querySelector(".ga-footer-slider-viewport");
  const track = slider.querySelector(".ga-footer-slider-track");

  if (!viewport || !track) {
    throw new Error("Footer slider elements were not created.");
  }

  return { slider, viewport, track };
}

function setupScrollUpdates(viewport, updateCurrentPage) {
  let updateRequested = false;

  viewport.addEventListener(
    "scroll",
    () => {
      if (updateRequested) return;

      updateRequested = true;
      window.requestAnimationFrame(() => {
        updateCurrentPage();
        updateRequested = false;
      });
    },
    { passive: true },
  );
}

function setupMouseDragging(viewport, goToNearestPage) {
  let pointerId = null;
  let pointerStartX = 0;
  let pointerStartScroll = 0;
  let suppressClick = false;

  viewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    if (!window.matchMedia(SMALL_VIEWPORT_QUERY).matches) return;
    if (event.target.closest("a, button")) return;

    pointerId = event.pointerId;
    pointerStartX = event.clientX;
    pointerStartScroll = viewport.scrollLeft;
    suppressClick = false;
    viewport.setPointerCapture(pointerId);
    viewport.classList.add("ga-footer-slider-dragging");
  });

  viewport.addEventListener("pointermove", (event) => {
    if (event.pointerId !== pointerId) return;

    const distance = event.clientX - pointerStartX;
    if (Math.abs(distance) > 5) suppressClick = true;
    viewport.scrollLeft = pointerStartScroll - distance;
  });

  const finishDragging = (event) => {
    if (event.pointerId !== pointerId) return;

    if (viewport.hasPointerCapture(pointerId)) {
      viewport.releasePointerCapture(pointerId);
    }

    pointerId = null;
    viewport.classList.remove("ga-footer-slider-dragging");
    goToNearestPage();
  };

  viewport.addEventListener("pointerup", finishDragging);
  viewport.addEventListener("pointercancel", finishDragging);
  viewport.addEventListener(
    "click",
    (event) => {
      if (!suppressClick) return;

      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    },
    true,
  );
}

function observeSliderResize(viewport, refresh) {
  const observer = new ResizeObserver(refresh);
  observer.observe(viewport);
}

export function createFooterSlider({
  caseStudies,
  services,
  previousButton,
  nextButton,
  pageStatus,
}) {
  const { slider, viewport, track } = createSliderStructure();

  caseStudies.forEach((caseStudy, index) => {
    track.append(createCaseStudySlide({ caseStudy, services, index }));
  });

  const slides = [...track.children];
  let slidesPerPage = 1;
  let currentPage = 0;
  let programmaticPage = null;

  const readSlidesPerPage = () =>
    Number.parseInt(
      getComputedStyle(slider).getPropertyValue("--ga-drawer-slides-per-page"),
      10,
    ) || 1;

  const getTotalPages = () => Math.ceil(slides.length / slidesPerPage);

  const getPageOffset = (pageIndex) => {
    // get the index of the first slide of the page
    const slideIndex = Math.min(pageIndex * slidesPerPage, slides.length - 1);
    // get the first slide of the page
    const slide = slides[slideIndex];

    // calculate max scrollable width
    const maximumOffset = viewport.scrollWidth - viewport.clientWidth;

    return slide
      ? Math.min(slide.offsetLeft - track.offsetLeft, maximumOffset)
      : 0;
  };

  const updateControls = () => {
    const totalPages = getTotalPages();

    currentPage = clamp(currentPage, 0, Math.max(totalPages - 1, 0));

    pageStatus.textContent = `${currentPage + 1} / ${totalPages}`;

    previousButton.disabled = currentPage === 0;

    nextButton.disabled = currentPage >= totalPages - 1;
  };

  const goToPage = (pageIndex, behavior = "smooth") => {
    currentPage = clamp(pageIndex, 0, Math.max(getTotalPages() - 1, 0));

    // only use smooth config for arrow clicks
    // programmaticPage will be prioritized
    programmaticPage = behavior === "smooth" ? currentPage : null;
    viewport.scrollTo({ left: getPageOffset(currentPage), behavior });
    updateControls();
  };

  /**
   * Finds the page closest to the current scroll position.
   * Used to update pagination and snap to a page after a manual drag or swipe.
   */
  const findNearestPage = () => {
    let nearestPage = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    // Compare the current scroll position with each page's actual offset.
    for (let pageIndex = 0; pageIndex < getTotalPages(); pageIndex += 1) {
      const distance = Math.abs(viewport.scrollLeft - getPageOffset(pageIndex));

      // Keep the page with the smallest distance from the viewport.
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPage = pageIndex;
      }
    }

    return nearestPage;
  };

  const updateCurrentPage = () => {
    if (programmaticPage !== null) {
      //When programmaticPage is not null
      // Don't update currentPage
      const reachedTarget =
        Math.abs(viewport.scrollLeft - getPageOffset(programmaticPage)) <= 2;

      if (!reachedTarget) return;
      // unlock
      programmaticPage = null;
    }

    // update currentPage when scroll is finished.
    currentPage = findNearestPage();
    updateControls();
  };

  const refresh = () => {
    const firstVisibleSlide = currentPage * slidesPerPage;
    slidesPerPage = readSlidesPerPage();
    currentPage = Math.floor(firstVisibleSlide / slidesPerPage);
    updateControls();
    window.requestAnimationFrame(() => goToPage(currentPage, "auto"));
  };

  previousButton.addEventListener("click", () => goToPage(currentPage - 1));
  nextButton.addEventListener("click", () => goToPage(currentPage + 1));
  viewport.addEventListener(
    "pointerdown",
    () => {
      programmaticPage = null;
      viewport.scrollTo({ left: viewport.scrollLeft, behavior: "auto" });
    },
    { passive: true },
  );

  setupScrollUpdates(viewport, updateCurrentPage);
  setupMouseDragging(viewport, () => goToPage(findNearestPage()));
  observeSliderResize(viewport, refresh);
  refresh();

  return { element: slider, refresh };
}
