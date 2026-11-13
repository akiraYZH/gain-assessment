(() => {
  // src/utils.js
  var MIN_PREFIX_MATCH_LENGTH = 8;
  function normalizeText(value) {
    return value?.replace(/\s+/g, " ").trim() ?? "";
  }
  function normalizeMatchValue(value) {
    return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
  }
  function labelsMatch(firstLabel, secondLabel) {
    const first = normalizeMatchValue(firstLabel);
    const second = normalizeMatchValue(secondLabel);
    const shortestLength = Math.min(first.length, second.length);
    return first === second || shortestLength >= MIN_PREFIX_MATCH_LENGTH && (first.startsWith(second) || second.startsWith(first));
  }
  function getLastPathSegment(url) {
    const pathParts = new URL(url, window.location.href).pathname.split("/").filter(Boolean);
    return pathParts.at(-1) ?? "";
  }
  function getContentCardData(card) {
    const link = card.querySelector(".content-card__link");
    const image = card.querySelector(".content-card__image");
    const getImageUrl = () => {
      if (!image) return "";
      const encodedUrl = image.getAttribute("data-u");
      const placeholderUrl = [image.currentSrc, image.src].find(
        (url) => url?.startsWith("data:image/svg+xml")
      );
      let decodedUrl = "";
      let placeholderImageUrl = "";
      if (encodedUrl) {
        try {
          decodedUrl = decodeURIComponent(encodedUrl);
        } catch {
          decodedUrl = encodedUrl;
        }
      }
      if (placeholderUrl) {
        try {
          const [, metadata, data] = placeholderUrl.match(
            /^data:image\/svg\+xml(;base64)?,(.*)$/
          );
          const svg = metadata ? window.atob(data) : decodeURIComponent(data);
          const embeddedUrl = svg.match(/\bdata-u=["']([^"']+)["']/)?.[1];
          if (embeddedUrl) {
            placeholderImageUrl = decodeURIComponent(embeddedUrl);
          }
        } catch {
          placeholderImageUrl = "";
        }
      }
      const candidates = [
        image.currentSrc,
        image.src,
        image.getAttribute("data-src"),
        image.getAttribute("data-lazy-src"),
        decodedUrl,
        placeholderImageUrl
      ].filter(Boolean);
      return candidates.find((url) => !url.startsWith("data:image/svg+xml")) ?? candidates[0] ?? "";
    };
    return {
      title: normalizeText(
        card.querySelector(".content-card__title")?.textContent ?? link?.textContent
      ),
      href: link?.href ?? "",
      image: getImageUrl(),
      tags: [...card.querySelectorAll(".content-tags li")].map(
        (tag) => normalizeText(tag.textContent)
      )
    };
  }
  function decodeCloudflareEmail(encodedEmail) {
    const key = Number.parseInt(encodedEmail.slice(0, 2), 16);
    let email = "";
    for (let index = 2; index < encodedEmail.length; index += 2) {
      const characterCode = Number.parseInt(
        encodedEmail.slice(index, index + 2),
        16
      );
      email += String.fromCharCode(characterCode ^ key);
    }
    return email;
  }

  // src/data.js
  function readServicesFromPage() {
    const navigationLinks = [
      ...document.querySelectorAll(
        ".site-navigation__link[data-behaviour='menu-toggle']"
      )
    ];
    const solutionsLink = navigationLinks.find(
      (link) => normalizeText(link.textContent).toLowerCase() === "solutions"
    );
    const solutionsMenu = solutionsLink?.closest(".site-navigation__item");
    if (!solutionsMenu) {
      throw new Error("GAIN Solutions menu was not found.");
    }
    const services = [
      ...solutionsMenu.querySelectorAll(".site-navigation__submenu-link")
    ].map((link) => ({
      id: getLastPathSegment(link.href),
      label: normalizeText(
        link.querySelector(".site-navigation__submenu-link-title")?.textContent
      ),
      description: normalizeText(
        link.querySelector(".site-navigation__submenu-link-description")?.textContent
      ),
      href: link.href
    }));
    const validServices = services.filter(
      (service) => service.id && service.label
    );
    if (validServices.length === 0) {
      throw new Error("No services were found in the GAIN Solutions menu.");
    }
    return validServices;
  }
  function readIndustriesFromPage() {
    const sectorsHeading = [...document.querySelectorAll("p")].find(
      (element) => normalizeText(element.textContent).toLowerCase() === "our sectors"
    );
    const sectorsSection = sectorsHeading?.closest(".wp-block-columns");
    if (!sectorsSection) {
      throw new Error('GAIN "Our Sectors" section was not found.');
    }
    const industries = [
      ...sectorsSection.querySelectorAll(
        ".wp-block-buttons .wp-block-button__link"
      )
    ].map((link) => ({
      id: getLastPathSegment(link.href),
      label: normalizeText(link.textContent),
      href: link.href
    }));
    const validIndustries = industries.filter(
      (industry) => industry.id && industry.label
    );
    if (validIndustries.length === 0) {
      throw new Error(
        'No industries were found in the GAIN "Our Sectors" section.'
      );
    }
    return validIndustries;
  }
  function readCaseStudiesFromPage() {
    const caseStudies = [...document.querySelectorAll(".content-card--work")].map(
      (card) => {
        const content = getContentCardData(card);
        return {
          ...content,
          service: content.tags[0] ?? "",
          industry: content.tags[1] ?? ""
        };
      }
    );
    const validCaseStudies = caseStudies.filter(
      (caseStudy) => caseStudy.title && caseStudy.href
    );
    if (validCaseStudies.length === 0) {
      throw new Error('No case studies were found in the GAIN "Work" slider.');
    }
    return validCaseStudies;
  }
  function readWorkUrlFromPage() {
    const workHeading = document.querySelector("#h-work");
    const workHeader = workHeading?.closest(".wp-block-group");
    const workLink = workHeader?.querySelector('a[href*="/work/"]');
    if (!workLink) {
      throw new Error('GAIN "All Work" link was not found.');
    }
    return workLink.href;
  }
  function readArticlesFromPage() {
    const articles = [...document.querySelectorAll(".content-card--post")].map(getContentCardData).filter((article) => article.title && article.href).slice(0, 3);
    if (articles.length === 0) {
      throw new Error('No articles were found in the GAIN "Insights" slider.');
    }
    return articles;
  }
  function readFooterEmailFromPage() {
    const footer = document.querySelector(".site-footer");
    const emailLink = footer?.querySelector('a[href^="mailto:"]');
    if (emailLink) {
      const email = decodeURIComponent(emailLink.href.slice(7).split("?")[0]);
      return { email, href: emailLink.href };
    }
    const protectedEmail = footer?.querySelector("[data-cfemail]");
    const encodedEmail = protectedEmail?.getAttribute("data-cfemail");
    if (encodedEmail) {
      const email = decodeCloudflareEmail(encodedEmail);
      return { email, href: `mailto:${email}` };
    }
    throw new Error("GAIN footer email was not found.");
  }

  // src/footer-drawer/drawer.css
  var drawer_default = '.ga-footer-drawer {\n  --ga-drawer-background: #ffffff;\n  --ga-drawer-card-background: #f1f1f1;\n  --ga-drawer-gold: #ddad50;\n  --ga-drawer-text: #232323;\n  --ga-drawer-tab-height: 56px;\n\n  position: fixed;\n  z-index: 10001;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  display: flex;\n  flex-direction: column;\n  max-height: calc(78dvh + var(--ga-drawer-tab-height));\n  color: var(--ga-drawer-text);\n  pointer-events: none;\n  transform: translateY(calc(100% - var(--ga-drawer-tab-height)));\n  transition: transform 280ms ease;\n}\n\n.ga-footer-drawer *,\n.ga-footer-drawer *::before,\n.ga-footer-drawer *::after {\n  box-sizing: border-box;\n}\n\n.ga-footer-drawer-open {\n  transform: translateY(0);\n}\n\n.ga-footer-drawer-tab {\n  position: relative;\n  z-index: 2;\n  display: flex;\n  align-items: center;\n  align-self: center;\n  width: min(520px, calc(100% - 32px));\n  min-height: var(--ga-drawer-tab-height);\n  padding: 0 16px;\n  border-bottom: 0;\n  border-radius: 12px 12px 0 0;\n  background: var(--ga-drawer-gold);\n  pointer-events: auto;\n  transition: background 180ms ease;\n}\n\n.ga-footer-drawer-open .ga-footer-drawer-tab {\n  background: var(--ga-drawer-background);\n}\n\n.ga-footer-drawer-label-toggle,\n.ga-footer-drawer-chevron-toggle,\n.ga-footer-drawer-previous,\n.ga-footer-drawer-next {\n  border: 0;\n  background: transparent;\n  color: inherit;\n  cursor: pointer;\n  font: inherit;\n}\n\n.ga-footer-drawer-label-toggle {\n  align-self: stretch;\n  flex: 1 1 0;\n  padding: 0;\n  font-size: 17px;\n  font-weight: 700;\n  text-align: left;\n}\n\n.ga-footer-drawer-chevron-toggle {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  flex: 0 0 40px;\n  width: 40px;\n  height: 40px;\n  padding: 0;\n}\n\n.ga-footer-drawer-label-toggle:focus-visible,\n.ga-footer-drawer-chevron-toggle:focus-visible,\n.ga-footer-drawer-previous:focus-visible,\n.ga-footer-drawer-next:focus-visible,\n.ga-footer-slider-tooltip-trigger:focus-visible,\n.ga-footer-slider-link:focus-visible {\n  outline: 3px solid #2850c3;\n  outline-offset: 2px;\n}\n\n.ga-footer-drawer-chevron {\n  width: 13px;\n  height: 13px;\n  border-right: 3px solid currentcolor;\n  border-bottom: 3px solid currentcolor;\n  transform: translateY(3px) rotate(225deg);\n  transition: transform 280ms ease;\n}\n\n.ga-footer-drawer-open .ga-footer-drawer-chevron {\n  transform: translateY(-3px) rotate(45deg);\n}\n\n.ga-footer-drawer-pagination {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 8px;\n  flex: 0 0 auto;\n  visibility: hidden;\n  opacity: 0;\n  transition: opacity 180ms ease;\n}\n\n.ga-footer-drawer-open .ga-footer-drawer-pagination {\n  visibility: visible;\n  opacity: 1;\n}\n\n.ga-footer-drawer-previous,\n.ga-footer-drawer-next {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 32px;\n  height: 36px;\n  padding: 0;\n  font-size: 30px;\n  line-height: 1;\n}\n\n.ga-footer-drawer-previous:disabled,\n.ga-footer-drawer-next:disabled {\n  cursor: default;\n  opacity: 0.3;\n}\n\n.ga-footer-drawer-page {\n  min-width: 48px;\n  font-size: 14px;\n  font-weight: 700;\n  text-align: center;\n}\n\n.ga-footer-drawer-panel {\n  min-height: 0;\n  max-height: 78dvh;\n  background: var(--ga-drawer-background);\n  box-shadow: 0 -6px 20px rgb(0 0 0 / 14%);\n  overflow-y: auto;\n  overscroll-behavior: contain;\n  pointer-events: auto;\n}\n\n.ga-footer-drawer-content {\n  width: min(100%, 1600px);\n  margin: 0 auto;\n  padding: 24px 32px 32px;\n}\n\n.ga-footer-drawer-overlay {\n  position: fixed;\n  z-index: 10000;\n  inset: 0;\n  background: rgb(35 35 35 / 55%);\n  opacity: 0;\n  pointer-events: none;\n  transition: opacity 280ms ease;\n}\n\n.ga-footer-drawer-overlay-visible {\n  opacity: 1;\n  pointer-events: auto;\n}\n\n.ga-footer-slider {\n  --ga-drawer-slides-per-page: 4;\n  --ga-drawer-slide-gap: 16px;\n\n  min-width: 0;\n}\n\n.ga-footer-slider-viewport {\n  width: 100%;\n  overflow-x: auto;\n  overflow-y: hidden;\n  overscroll-behavior-x: contain;\n  scroll-snap-type: x mandatory;\n  scrollbar-width: none;\n  cursor: default;\n}\n\n.ga-footer-slider-viewport::-webkit-scrollbar {\n  display: none;\n}\n\n.ga-footer-slider-dragging {\n  cursor: grabbing;\n  scroll-snap-type: none;\n  user-select: none;\n}\n\n.ga-footer-slider-track {\n  display: flex;\n  align-items: stretch;\n  gap: var(--ga-drawer-slide-gap);\n  width: 100%;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.ga-footer-slider-slide {\n  display: flex;\n  flex: 0 0 calc((100% - 48px) / 4);\n  flex-direction: column;\n  min-width: 0;\n  border-radius: 10px;\n  background: var(--ga-drawer-card-background);\n  scroll-snap-align: start;\n  overflow: hidden;\n}\n\n.ga-footer-slider-media {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  aspect-ratio: 16 / 9;\n  background: #dedbd7;\n  overflow: hidden;\n}\n\n.ga-footer-slider-image {\n  display: block;\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  transition: transform 220ms ease;\n}\n\n.ga-footer-slider-slide:hover .ga-footer-slider-image {\n  transform: scale(1.025);\n}\n\n.ga-footer-slider-image-fallback {\n  color: #77716d;\n  font-size: 22px;\n  font-weight: 700;\n  letter-spacing: 3px;\n}\n\n.ga-footer-slider-body {\n  display: flex;\n  flex: 1 1 auto;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: 14px;\n  min-width: 0;\n  padding: 18px;\n}\n\n.ga-footer-slider-tag {\n  align-self: flex-start;\n  padding: 5px 9px;\n  border: 1px solid var(--ga-drawer-text);\n  border-radius: 999px;\n  background: transparent;\n  color: inherit;\n  font-size: 12px;\n  font-weight: 700;\n}\n\n.ga-footer-slider-tooltip-wrapper {\n  position: relative;\n  display: inline-flex;\n  margin-left: 6px;\n  vertical-align: 2px;\n}\n\n.ga-footer-slider-tooltip-trigger {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 19px;\n  height: 19px;\n  padding: 0;\n  border: 2px solid currentcolor;\n  border-radius: 50%;\n  background: transparent;\n  color: inherit;\n  cursor: help;\n  font: inherit;\n  font-size: 12px;\n  font-weight: 700;\n  line-height: 1;\n}\n\n.ga-footer-slider-tooltip {\n  --ga-tooltip-arrow-left: 50%;\n\n  position: fixed;\n  z-index: 10002;\n  top: 0;\n  left: 0;\n  box-sizing: border-box;\n  width: max-content;\n  max-width: min(240px, calc(100vw - 24px));\n  padding: 10px 14px;\n  border-radius: 8px;\n  background: #c52869;\n  box-shadow: 0 5px 14px rgb(0 0 0 / 22%);\n  color: #ffffff;\n  font-size: 13px;\n  font-weight: 700;\n  line-height: 1.4;\n  text-align: center;\n  visibility: hidden;\n  opacity: 0;\n  pointer-events: none;\n  transform: translateY(4px);\n  transition:\n    visibility 0s linear 160ms,\n    opacity 160ms ease,\n    transform 160ms ease;\n}\n\n.ga-footer-slider-tooltip::after {\n  position: absolute;\n  top: 100%;\n  left: var(--ga-tooltip-arrow-left);\n  width: 0;\n  height: 0;\n  border-top: 8px solid #c52869;\n  border-right: 7px solid transparent;\n  border-left: 7px solid transparent;\n  content: "";\n  transform: translateX(-50%);\n}\n\n.ga-footer-slider-tooltip-visible {\n  visibility: visible;\n  opacity: 1;\n  transform: translateY(0);\n  transition-delay: 0s;\n}\n\n.ga-footer-slider-tooltip-below:not(\n    .ga-footer-slider-tooltip-visible\n  ) {\n  transform: translateY(-4px);\n}\n\n.ga-footer-slider-tooltip-below::after {\n  top: auto;\n  bottom: 100%;\n  border-top: 0;\n  border-right: 7px solid transparent;\n  border-bottom: 8px solid #c52869;\n  border-left: 7px solid transparent;\n}\n\n.ga-footer-slider-title {\n  margin: 0;\n  font-size: clamp(18px, 1.6vw, 24px);\n  line-height: 1.15;\n}\n\n.ga-footer-slider-description {\n  margin: 0;\n  color: #4f4b48;\n  font-size: 14px;\n  line-height: 1.45;\n}\n\n.ga-footer-slider-link {\n  margin-top: auto;\n  padding: 9px 13px;\n  border-radius: 999px;\n  background: var(--ga-drawer-gold);\n  box-shadow: 0 0 0 rgb(0 0 0 / 0%);\n  color: var(--ga-drawer-text);\n  font-size: 13px;\n  font-weight: 700;\n  text-decoration: none;\n  transform: translateY(0);\n  transition:\n    background-color 160ms ease,\n    box-shadow 160ms ease,\n    transform 100ms ease;\n}\n\n.ga-footer-slider-link:hover {\n  background: #c99638;\n  box-shadow: 0 4px 10px rgb(0 0 0 / 14%);\n  transform: translateY(-2px);\n}\n\n.ga-footer-slider-link:active {\n  box-shadow: 0 1px 3px rgb(0 0 0 / 12%);\n  transform: translateY(0);\n}\n\n@media (max-width: 1023px) {\n  .ga-footer-slider {\n    --ga-drawer-slides-per-page: 2;\n  }\n\n  .ga-footer-slider-slide {\n    flex-basis: calc((100% - 16px) / 2);\n  }\n\n  .ga-footer-slider-viewport {\n    cursor: grab;\n  }\n}\n\n@media (max-width: 767px) {\n  .ga-footer-drawer {\n    --ga-drawer-tab-height: 52px;\n\n    max-height: calc(82dvh + var(--ga-drawer-tab-height));\n  }\n\n  .ga-footer-drawer-tab {\n    width: calc(100% - 24px);\n    padding: 0 10px 0 14px;\n  }\n\n  .ga-footer-drawer-label-toggle {\n    font-size: 14px;\n  }\n\n  .ga-footer-drawer-pagination {\n    gap: 2px;\n  }\n\n  .ga-footer-drawer-previous,\n  .ga-footer-drawer-next {\n    width: 28px;\n  }\n\n  .ga-footer-drawer-page {\n    min-width: 42px;\n    font-size: 12px;\n  }\n\n  .ga-footer-drawer-panel {\n    max-height: 82dvh;\n  }\n\n  .ga-footer-drawer-content {\n    padding: 16px 16px 24px;\n  }\n\n  .ga-footer-slider {\n    --ga-drawer-slides-per-page: 1;\n    --ga-drawer-slide-gap: 12px;\n  }\n\n  .ga-footer-slider-slide {\n    flex-basis: 100%;\n  }\n\n  .ga-footer-slider-body {\n    gap: 12px;\n    padding: 16px;\n  }\n\n  .ga-footer-slider-title {\n    font-size: 21px;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .ga-footer-drawer,\n  .ga-footer-drawer-tab,\n  .ga-footer-drawer-chevron,\n  .ga-footer-drawer-pagination,\n  .ga-footer-drawer-overlay,\n  .ga-footer-slider-image,\n  .ga-footer-slider-tooltip,\n  .ga-footer-slider-link {\n    transition: none;\n  }\n\n  .ga-footer-slider-viewport {\n    scroll-behavior: auto;\n  }\n}\n';

  // src/footer-drawer/tooltip.js
  var TOOLTIP_VIEWPORT_GAP = 12;
  var TOOLTIP_TRIGGER_GAP = 10;
  function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
  }
  function setupTooltip(trigger, tooltip) {
    let positionRequest = null;
    const positionTooltip = () => {
      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const triggerCenter = triggerRect.left + triggerRect.width / 2;
      const preferredLeft = triggerCenter - tooltipRect.width / 2;
      const maximumLeft = window.innerWidth - tooltipRect.width - TOOLTIP_VIEWPORT_GAP;
      const left = clamp(
        preferredLeft,
        TOOLTIP_VIEWPORT_GAP,
        Math.max(TOOLTIP_VIEWPORT_GAP, maximumLeft)
      );
      const preferredTop = triggerRect.top - tooltipRect.height - TOOLTIP_TRIGGER_GAP;
      const showBelow = preferredTop < TOOLTIP_VIEWPORT_GAP;
      const top = showBelow ? triggerRect.bottom + TOOLTIP_TRIGGER_GAP : preferredTop;
      const arrowLeft = clamp(
        triggerCenter - left,
        TOOLTIP_VIEWPORT_GAP,
        tooltipRect.width - TOOLTIP_VIEWPORT_GAP
      );
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      tooltip.style.setProperty("--ga-tooltip-arrow-left", `${arrowLeft}px`);
      tooltip.classList.toggle("ga-footer-slider-tooltip-below", showBelow);
    };
    const requestPositionUpdate = () => {
      if (positionRequest !== null) return;
      positionRequest = window.requestAnimationFrame(() => {
        positionTooltip();
        positionRequest = null;
      });
    };
    const showTooltip = () => {
      if (tooltip.parentElement !== document.body) {
        document.body.append(tooltip);
      }
      positionTooltip();
      tooltip.classList.add("ga-footer-slider-tooltip-visible");
      window.addEventListener("resize", requestPositionUpdate);
      window.addEventListener("scroll", requestPositionUpdate, {
        capture: true,
        passive: true
      });
    };
    const hideTooltip = () => {
      tooltip.classList.remove("ga-footer-slider-tooltip-visible");
      window.removeEventListener("resize", requestPositionUpdate);
      window.removeEventListener("scroll", requestPositionUpdate, true);
    };
    trigger.addEventListener("pointerenter", showTooltip);
    trigger.addEventListener("pointerleave", hideTooltip);
    trigger.addEventListener("focus", showTooltip);
    trigger.addEventListener("blur", hideTooltip);
  }

  // src/footer-drawer/slide.js
  function getServiceDescription(caseStudy, services) {
    return services.find((service) => labelsMatch(service.label, caseStudy.service))?.description ?? "";
  }
  function createCaseStudySlide({ caseStudy, services, index }) {
    const slide = document.createElement("li");
    const tooltipId = `gain-footer-drawer-tooltip-${index}`;
    slide.className = "ga-footer-slider-slide";
    slide.innerHTML = `
    <div class="ga-footer-slider-media"></div>
    <div class="ga-footer-slider-body">
      <span class="ga-footer-slider-tag"></span>
      <h3 class="ga-footer-slider-title">
        <span class="ga-footer-slider-title-text"></span>
        <span class="ga-footer-slider-tooltip-wrapper">
          <button
            class="ga-footer-slider-tooltip-trigger"
            type="button"
            aria-label="Case study service and industry"
            aria-describedby="${tooltipId}"
          >
            <span aria-hidden="true">i</span>
          </button>
          <span
            id="${tooltipId}"
            class="ga-footer-slider-tooltip"
            role="tooltip"
          ></span>
        </span>
      </h3>
      <p class="ga-footer-slider-description"></p>
      <a class="ga-footer-slider-link">View case study</a>
    </div>
  `;
    const media = slide.querySelector(".ga-footer-slider-media");
    const tag = slide.querySelector(".ga-footer-slider-tag");
    const tooltipTrigger = slide.querySelector(
      ".ga-footer-slider-tooltip-trigger"
    );
    const tooltip = slide.querySelector(".ga-footer-slider-tooltip");
    const title = slide.querySelector(".ga-footer-slider-title-text");
    const description = slide.querySelector(".ga-footer-slider-description");
    const link = slide.querySelector(".ga-footer-slider-link");
    if (!media || !tag || !tooltipTrigger || !tooltip || !title || !description || !link) {
      throw new Error("Case study slide elements were not created.");
    }
    if (caseStudy.image) {
      const image = document.createElement("img");
      image.className = "ga-footer-slider-image";
      image.src = caseStudy.image;
      image.alt = caseStudy.title;
      image.loading = "lazy";
      image.draggable = false;
      media.append(image);
    } else {
      const imageFallback = document.createElement("span");
      imageFallback.className = "ga-footer-slider-image-fallback";
      imageFallback.textContent = "GAIN";
      media.append(imageFallback);
    }
    tag.textContent = caseStudy.industry;
    tooltip.textContent = `${caseStudy.service} \xB7 ${caseStudy.industry}`;
    title.textContent = caseStudy.title;
    description.textContent = getServiceDescription(caseStudy, services);
    link.href = caseStudy.href;
    setupTooltip(tooltipTrigger, tooltip);
    return slide;
  }

  // src/footer-drawer/slider.js
  var SMALL_VIEWPORT_QUERY = "(max-width: 1023px)";
  function clamp2(value, minimum, maximum) {
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
      { passive: true }
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
      true
    );
  }
  function observeSliderResize(viewport, refresh) {
    const observer = new ResizeObserver(refresh);
    observer.observe(viewport);
  }
  function createFooterSlider({
    caseStudies,
    services,
    previousButton,
    nextButton,
    pageStatus
  }) {
    const { slider, viewport, track } = createSliderStructure();
    caseStudies.forEach((caseStudy, index) => {
      track.append(createCaseStudySlide({ caseStudy, services, index }));
    });
    const slides = [...track.children];
    let slidesPerPage = 1;
    let currentPage = 0;
    let programmaticPage = null;
    const readSlidesPerPage = () => Number.parseInt(
      getComputedStyle(slider).getPropertyValue("--ga-drawer-slides-per-page"),
      10
    ) || 1;
    const getTotalPages = () => Math.ceil(slides.length / slidesPerPage);
    const getPageOffset = (pageIndex) => {
      const slideIndex = Math.min(pageIndex * slidesPerPage, slides.length - 1);
      const slide = slides[slideIndex];
      const maximumOffset = viewport.scrollWidth - viewport.clientWidth;
      return slide ? Math.min(slide.offsetLeft - track.offsetLeft, maximumOffset) : 0;
    };
    const updateControls = () => {
      const totalPages = getTotalPages();
      currentPage = clamp2(currentPage, 0, Math.max(totalPages - 1, 0));
      pageStatus.textContent = `${currentPage + 1} / ${totalPages}`;
      previousButton.disabled = currentPage === 0;
      nextButton.disabled = currentPage >= totalPages - 1;
    };
    const goToPage = (pageIndex, behavior = "smooth") => {
      currentPage = clamp2(pageIndex, 0, Math.max(getTotalPages() - 1, 0));
      programmaticPage = behavior === "smooth" ? currentPage : null;
      viewport.scrollTo({ left: getPageOffset(currentPage), behavior });
      updateControls();
    };
    const findNearestPage = () => {
      let nearestPage = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (let pageIndex = 0; pageIndex < getTotalPages(); pageIndex += 1) {
        const distance = Math.abs(viewport.scrollLeft - getPageOffset(pageIndex));
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestPage = pageIndex;
        }
      }
      return nearestPage;
    };
    const updateCurrentPage = () => {
      if (programmaticPage !== null) {
        const reachedTarget = Math.abs(viewport.scrollLeft - getPageOffset(programmaticPage)) <= 2;
        if (!reachedTarget) return;
        programmaticPage = null;
      }
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
      { passive: true }
    );
    setupScrollUpdates(viewport, updateCurrentPage);
    setupMouseDragging(viewport, () => goToPage(findNearestPage()));
    observeSliderResize(viewport, refresh);
    refresh();
    return { element: slider, refresh };
  }

  // src/footer-drawer/index.js
  var DRAWER_ID = "gain-footer-drawer";
  var PANEL_ID = "gain-footer-drawer-panel";
  function createFooterDrawer() {
    const caseStudies = readCaseStudiesFromPage();
    const services = readServicesFromPage();
    const overlay = document.createElement("div");
    const drawer = document.createElement("aside");
    overlay.className = "ga-footer-drawer-overlay";
    overlay.setAttribute("aria-hidden", "true");
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
          <span aria-hidden="true">\u2039</span>
        </button>
        <span class="ga-footer-drawer-page" aria-live="polite">1 / 1</span>
        <button
          class="ga-footer-drawer-next"
          type="button"
          aria-label="Next case studies"
        >
          <span aria-hidden="true">\u203A</span>
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
    const tab = drawer.querySelector(".ga-footer-drawer-tab");
    const labelToggle = drawer.querySelector(".ga-footer-drawer-label-toggle");
    const chevronToggle = drawer.querySelector(
      ".ga-footer-drawer-chevron-toggle"
    );
    const previousButton = drawer.querySelector(".ga-footer-drawer-previous");
    const nextButton = drawer.querySelector(".ga-footer-drawer-next");
    const pageStatus = drawer.querySelector(".ga-footer-drawer-page");
    const panel = drawer.querySelector(".ga-footer-drawer-panel");
    const content = drawer.querySelector(".ga-footer-drawer-content");
    if (!tab || !labelToggle || !chevronToggle || !previousButton || !nextButton || !pageStatus || !panel || !content) {
      throw new Error("Footer drawer controls were not created.");
    }
    const slider = createFooterSlider({
      caseStudies,
      services,
      previousButton,
      nextButton,
      pageStatus
    });
    content.append(slider.element);
    let isOpen = false;
    let scrollCheckRequested = false;
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
    tab.addEventListener("click", (event) => {
      if (event.target.closest(".ga-footer-drawer-pagination")) return;
      setOpen(!isOpen);
    });
    overlay.addEventListener("click", () => setOpen(false, true));
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
          const reachedPageBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
          if (reachedPageBottom) {
            setOpen(false);
          }
          scrollCheckRequested = false;
        });
      },
      { passive: true }
    );
    document.body.append(overlay, drawer);
    return [overlay, drawer];
  }

  // src/pokemon-listing/api.js
  var POKEMON_API_URL = "https://pokeapi.co/api/v2/pokemon";
  var pokemonRequests = /* @__PURE__ */ new Map();
  function normalizePokemon(pokemon) {
    return {
      id: pokemon.id,
      name: pokemon.name,
      image: pokemon.sprites.other?.home?.front_default ?? pokemon.sprites.front_default ?? "",
      types: [...pokemon.types].sort((first, second) => first.slot - second.slot).map(({ type }) => type.name),
      height: pokemon.height,
      weight: pokemon.weight,
      abilities: pokemon.abilities.map(({ ability }) => ability.name),
      baseExperience: pokemon.base_experience
    };
  }
  async function fetchPokemon(pokemonId) {
    const response = await fetch(`${POKEMON_API_URL}/${pokemonId}`);
    if (!response.ok) {
      throw new Error(`Pok\xE9API returned ${response.status} for #${pokemonId}.`);
    }
    return normalizePokemon(await response.json());
  }
  function getPokemon(pokemonId) {
    if (!pokemonRequests.has(pokemonId)) {
      const request = fetchPokemon(pokemonId).catch((error) => {
        pokemonRequests.delete(pokemonId);
        throw error;
      });
      pokemonRequests.set(pokemonId, request);
    }
    return pokemonRequests.get(pokemonId);
  }

  // src/pokemon-listing/utils.js
  function formatPokemonLabel(value) {
    return value.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  }

  // src/pokemon-listing/card.js
  function togglePokemonCard(shell, pokemonName) {
    const isFlipped = shell.classList.toggle("ga-pokemon-card-flipped");
    const front = shell.querySelector(".ga-pokemon-card-front");
    const back = shell.querySelector(".ga-pokemon-card-back");
    shell.setAttribute("aria-pressed", String(isFlipped));
    shell.setAttribute(
      "aria-label",
      `${isFlipped ? "Show front of" : "Show details for"} ${pokemonName}`
    );
    front?.setAttribute("aria-hidden", String(isFlipped));
    back?.setAttribute("aria-hidden", String(!isFlipped));
  }
  function enableCardFlip(shell, pokemonName) {
    if (shell.dataset.gaFlipReady === "true") return;
    shell.dataset.gaFlipReady = "true";
    shell.setAttribute("role", "button");
    shell.setAttribute("tabindex", "0");
    shell.setAttribute("aria-pressed", "false");
    shell.setAttribute("aria-label", `Show details for ${pokemonName}`);
    shell.addEventListener("click", () => {
      togglePokemonCard(shell, pokemonName);
    });
    shell.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      togglePokemonCard(shell, pokemonName);
    });
  }
  function preparePokemonCard(card, pokemonId) {
    const currentPokemonId = Number.parseInt(card.dataset.gaPokemonId, 10);
    const currentShell = card.querySelector(":scope > .ga-pokemon-card-shell");
    if (currentPokemonId === pokemonId && currentShell) return;
    currentShell?.remove();
    const shell = document.createElement("div");
    shell.className = "ga-pokemon-card-shell ga-pokemon-card-loading";
    shell.setAttribute("aria-busy", "true");
    shell.innerHTML = `
    <div
      class="listing-box__media listing-box__media--news ga-pokemon-card-image-skeleton"
      aria-hidden="true"
    ></div>
    <span class="ga-pokemon-card-number"></span>
    <h2
      class="listing-box__title has-inter-tight-font-family has-body-xl-font-size"
    >
      <span class="ga-pokemon-card-name-skeleton" aria-hidden="true"></span>
    </h2>
    <ul class="content-tags ga-pokemon-card-type-skeletons" aria-hidden="true">
      <li><span></span></li>
      <li><span></span></li>
    </ul>
    <span class="ga-pokemon-card-loading-text"></span>
  `;
    const number = shell.querySelector(".ga-pokemon-card-number");
    const loadingText = shell.querySelector(".ga-pokemon-card-loading-text");
    if (!number || !loadingText) {
      throw new Error("Pok\xE9mon card skeleton was not created.");
    }
    number.textContent = `#${String(pokemonId).padStart(3, "0")}`;
    loadingText.textContent = `Loading Pok\xE9mon #${pokemonId}`;
    card.classList.add("ga-pokemon-card");
    card.dataset.gaPokemonId = String(pokemonId);
    card.append(shell);
  }
  function renderPokemonCard(card, pokemon) {
    const shell = card.querySelector(":scope > .ga-pokemon-card-shell");
    if (!shell) return;
    if (shell.classList.contains("ga-pokemon-card-loaded") && card.dataset.gaPokemonId === String(pokemon.id)) {
      return;
    }
    shell.className = "ga-pokemon-card-shell ga-pokemon-card-loaded";
    shell.setAttribute("aria-busy", "false");
    shell.innerHTML = `
    <div class="ga-pokemon-card-flipper">
      <div class="ga-pokemon-card-face ga-pokemon-card-front" aria-hidden="false">
        <div class="listing-box__media listing-box__media--news ga-pokemon-card-media">
          <img class="listing-box__image ga-pokemon-card-image" loading="lazy" />
        </div>
        <span class="ga-pokemon-card-number"></span>
        <h2
          class="listing-box__title has-inter-tight-font-family has-body-xl-font-size ga-pokemon-card-name"
        ></h2>
        <ul class="content-tags ga-pokemon-card-types"></ul>
        <span class="ga-pokemon-card-flip-hint">View details</span>
      </div>
      <div class="ga-pokemon-card-face ga-pokemon-card-back" aria-hidden="true">
        <span class="ga-pokemon-card-number"></span>
        <h2
          class="listing-box__title has-inter-tight-font-family has-body-xl-font-size ga-pokemon-card-back-name"
        ></h2>
        <dl class="ga-pokemon-card-details">
          <div>
            <dt>Height</dt>
            <dd class="ga-pokemon-card-height"></dd>
          </div>
          <div>
            <dt>Weight</dt>
            <dd class="ga-pokemon-card-weight"></dd>
          </div>
          <div>
            <dt>Abilities</dt>
            <dd class="ga-pokemon-card-abilities"></dd>
          </div>
          <div>
            <dt>Base experience</dt>
            <dd class="ga-pokemon-card-experience"></dd>
          </div>
        </dl>
        <span class="ga-pokemon-card-flip-hint">Back to Pok\xE9mon</span>
      </div>
    </div>
  `;
    const image = shell.querySelector(".ga-pokemon-card-image");
    const name = shell.querySelector(".ga-pokemon-card-name");
    const types = shell.querySelector(".ga-pokemon-card-types");
    const pokemonName = formatPokemonLabel(pokemon.name);
    if (!image || !name || !types) {
      throw new Error("Pok\xE9mon card elements were not created.");
    }
    image.src = pokemon.image;
    image.alt = pokemonName;
    name.textContent = pokemonName;
    shell.querySelectorAll(".ga-pokemon-card-number").forEach((number) => {
      number.textContent = `#${String(pokemon.id).padStart(3, "0")}`;
    });
    shell.querySelector(".ga-pokemon-card-back-name").textContent = pokemonName;
    shell.querySelector(".ga-pokemon-card-height").textContent = `${pokemon.height / 10} m`;
    shell.querySelector(".ga-pokemon-card-weight").textContent = `${pokemon.weight / 10} kg`;
    shell.querySelector(".ga-pokemon-card-abilities").textContent = pokemon.abilities.map(formatPokemonLabel).join(", ");
    shell.querySelector(".ga-pokemon-card-experience").textContent = String(pokemon.baseExperience ?? "Unknown");
    pokemon.types.forEach((type) => {
      const typeTag = document.createElement("li");
      typeTag.textContent = formatPokemonLabel(type);
      types.append(typeTag);
    });
    enableCardFlip(shell, pokemonName);
  }
  function renderPokemonError(card, pokemonId) {
    const shell = card.querySelector(":scope > .ga-pokemon-card-shell");
    if (!shell) return;
    shell.className = "ga-pokemon-card-shell ga-pokemon-card-error";
    shell.setAttribute("aria-busy", "false");
    shell.innerHTML = `
    <div class="listing-box__media listing-box__media--news ga-pokemon-card-error-media">
      <span aria-hidden="true">!</span>
    </div>
    <span class="ga-pokemon-card-number"></span>
    <h2
      class="listing-box__title has-inter-tight-font-family has-body-xl-font-size"
    >Unable to load Pok\xE9mon</h2>
    <p class="listing-box__excerpt has-body-xs-font-size">
      Please try changing page and coming back.
    </p>
  `;
    const number = shell.querySelector(".ga-pokemon-card-number");
    if (!number) {
      throw new Error("Pok\xE9mon error card was not created.");
    }
    number.textContent = `#${String(pokemonId).padStart(3, "0")}`;
  }

  // src/pokemon-listing/filter.js
  var FILTERS_SELECTOR = '[data-behaviour="listing-filters"]';
  var ARTICLE_CARD_SELECTOR = ".listing-box";
  var TYPE_FILTER_CLASS = "ga-pokemon-type-filter";
  var POKEMON_TYPES = [
    "normal",
    "fighting",
    "flying",
    "poison",
    "ground",
    "rock",
    "bug",
    "ghost",
    "steel",
    "fire",
    "water",
    "grass",
    "electric",
    "psychic",
    "ice",
    "dragon",
    "dark",
    "fairy"
  ];
  var selectedType = "";
  function getEmptyMessage(listing) {
    let message = document.querySelector(".ga-pokemon-empty-message");
    if (message) return message;
    message = document.createElement("p");
    message.className = "ga-pokemon-empty-message";
    message.hidden = true;
    const pagination = listing.querySelector(":scope > nav");
    if (pagination) {
      listing.insertBefore(message, pagination);
    } else {
      listing.append(message);
    }
    return message;
  }
  function applyPokemonTypeFilter(listing) {
    const cards = [...listing.querySelectorAll(ARTICLE_CARD_SELECTOR)];
    const emptyMessage = getEmptyMessage(listing);
    let visibleCardCount = 0;
    let pendingCardCount = 0;
    cards.forEach((card) => {
      const status = card.dataset.gaPokemonStatus;
      const pokemonTypes = (card.dataset.gaPokemonTypes ?? "").split(" ");
      if (status === "loading") {
        pendingCardCount += 1;
      }
      const matchesType = !selectedType || status === "loaded" && pokemonTypes.includes(selectedType);
      card.hidden = !matchesType;
      if (matchesType) visibleCardCount += 1;
    });
    const showEmptyMessage = Boolean(selectedType) && pendingCardCount === 0 && visibleCardCount === 0;
    emptyMessage.hidden = !showEmptyMessage;
    emptyMessage.textContent = showEmptyMessage ? `No ${formatPokemonLabel(selectedType)} Pok\xE9mon appear on this page.` : "";
  }
  function setupPokemonTypeFilter(listing) {
    const filters = document.querySelector(FILTERS_SELECTOR);
    if (!filters) return;
    filters.classList.add("ga-pokemon-filters");
    const existingFilter = filters.querySelector(`.${TYPE_FILTER_CLASS}`);
    if (existingFilter) {
      existingFilter.value = selectedType;
      return;
    }
    const typeFilter = document.createElement("select");
    typeFilter.className = TYPE_FILTER_CLASS;
    typeFilter.name = "pokemon_type";
    typeFilter.setAttribute("aria-label", "Filter Pok\xE9mon by type");
    typeFilter.innerHTML = `
    <option value="">Filter by type</option>
    ${POKEMON_TYPES.map(
      (type) => `<option value="${type}">${formatPokemonLabel(type)}</option>`
    ).join("")}
  `;
    typeFilter.value = selectedType;
    typeFilter.addEventListener("change", () => {
      selectedType = typeFilter.value;
      applyPokemonTypeFilter(listing);
    });
    const filterDropdown = filters.querySelector(".filter-dropdown") ?? filters;
    const capabilityFilter = filters.querySelector('select[name="capability"]');
    if (capabilityFilter) {
      capabilityFilter.insertAdjacentElement("afterend", typeFilter);
    } else {
      filterDropdown.append(typeFilter);
    }
  }

  // src/pokemon-listing/observer.js
  function observeListingChanges(listing, onUpdate) {
    let updateRequest = null;
    const requestUpdate = () => {
      if (updateRequest !== null) return;
      updateRequest = window.requestAnimationFrame(() => {
        updateRequest = null;
        onUpdate();
      });
    };
    const observer = new MutationObserver((mutations) => {
      const listingChanged = mutations.some(
        (mutation) => {
          if (mutation.target.nodeType === Node.ELEMENT_NODE && mutation.target.closest(".ga-pokemon-card-shell")) {
            return false;
          }
          if (mutation.type === "attributes") {
            return !mutation.target.classList.contains("ga-pokemon-card");
          }
          const changedNodes = [
            ...mutation.addedNodes,
            ...mutation.removedNodes
          ];
          const onlyPokemonShellChanged = changedNodes.length > 0 && changedNodes.every(
            (node) => node.nodeType === Node.ELEMENT_NODE && (node.matches(".ga-pokemon-card-shell") || node.closest(".ga-pokemon-card-shell"))
          );
          return !onlyPokemonShellChanged;
        }
      );
      if (listingChanged) requestUpdate();
    });
    onUpdate();
    observer.observe(listing, {
      attributes: true,
      attributeFilter: ["class"],
      characterData: true,
      childList: true,
      subtree: true
    });
    return () => {
      observer.disconnect();
      if (updateRequest !== null) {
        window.cancelAnimationFrame(updateRequest);
      }
    };
  }

  // src/pokemon-listing/pokemon-listing.css
  var pokemon_listing_default = '.ga-pokemon-listing {\n  --ga-pokemon-card-skeleton: #dedbd7;\n  --ga-pokemon-card-skeleton-highlight: #ebe8e5;\n}\n\n.ga-pokemon-filters select[name="post_tag"],\n.ga-pokemon-filters select[name="capability"] {\n  display: none;\n}\n\n.ga-pokemon-empty-message {\n  padding: 36px;\n  margin: 32px 0 0;\n  font-size: 18px;\n  font-weight: 700;\n  text-align: center;\n  background: #f1efed;\n  border-radius: 10px;\n}\n\n.ga-pokemon-listing .listing-box > :not(.ga-pokemon-card-shell) {\n  display: none;\n}\n\n.ga-pokemon-listing .listing-box[hidden] {\n  display: none;\n}\n\n.ga-pokemon-card {\n  min-width: 0;\n}\n\n.ga-pokemon-card-shell {\n  display: flex;\n  flex: 1 1 auto;\n  flex-direction: column;\n  min-height: 390px;\n  perspective: 1200px;\n}\n\n.ga-pokemon-card-loading,\n.ga-pokemon-card-error {\n  gap: 24px;\n}\n\n.ga-pokemon-card-loaded {\n  cursor: pointer;\n}\n\n.ga-pokemon-card-loaded:focus-visible {\n  outline: 3px solid #324fbc;\n  outline-offset: 4px;\n}\n\n.ga-pokemon-card-flipper {\n  display: grid;\n  flex: 1 1 auto;\n  transform-style: preserve-3d;\n  transition: transform 450ms ease;\n}\n\n.ga-pokemon-card-flipped .ga-pokemon-card-flipper {\n  transform: rotateY(180deg);\n}\n\n.ga-pokemon-card-face {\n  display: flex;\n  grid-area: 1 / 1;\n  flex-direction: column;\n  gap: 24px;\n  min-width: 0;\n  backface-visibility: hidden;\n  -webkit-backface-visibility: hidden;\n}\n\n.ga-pokemon-card-back {\n  padding: 28px;\n  color: #ffffff;\n  background: #252220;\n  border-radius: 10px;\n  transform: rotateY(180deg);\n}\n\n.ga-pokemon-card-back .listing-box__title {\n  color: inherit;\n}\n\n.ga-pokemon-card-image-skeleton,\n.ga-pokemon-card-name-skeleton,\n.ga-pokemon-card-type-skeletons span {\n  background: linear-gradient(\n    90deg,\n    var(--ga-pokemon-card-skeleton) 25%,\n    var(--ga-pokemon-card-skeleton-highlight) 50%,\n    var(--ga-pokemon-card-skeleton) 75%\n  );\n  background-size: 200% 100%;\n  animation: ga-pokemon-skeleton-loading 1200ms linear infinite;\n}\n\n.ga-pokemon-card-image-skeleton {\n  width: 100%;\n  aspect-ratio: 4 / 3;\n}\n\n.ga-pokemon-card-number {\n  font-size: 14px;\n  font-weight: 700;\n}\n\n.ga-pokemon-card-media {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n\n.ga-pokemon-card-image {\n  height: 100%;\n  padding: 24px;\n  object-fit: contain;\n}\n\n.ga-pokemon-card-name {\n  text-transform: capitalize;\n}\n\n.ga-pokemon-card-types {\n  margin-top: auto;\n}\n\n.ga-pokemon-card-flip-hint {\n  align-self: flex-start;\n  padding-bottom: 3px;\n  font-size: 14px;\n  font-weight: 700;\n  border-bottom: 2px solid currentColor;\n}\n\n.ga-pokemon-card-details {\n  display: flex;\n  flex-direction: column;\n  gap: 18px;\n  margin: 0;\n}\n\n.ga-pokemon-card-details div {\n  display: flex;\n  align-items: baseline;\n  justify-content: space-between;\n  gap: 20px;\n  padding-bottom: 10px;\n  border-bottom: 1px solid rgb(255 255 255 / 35%);\n}\n\n.ga-pokemon-card-details dt {\n  font-size: 14px;\n  font-weight: 700;\n}\n\n.ga-pokemon-card-details dd {\n  max-width: 60%;\n  margin: 0;\n  text-align: right;\n}\n\n.ga-pokemon-card-back .ga-pokemon-card-flip-hint {\n  margin-top: auto;\n}\n\n.ga-pokemon-card-error-media {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: #55504c;\n  font-size: 56px;\n  font-weight: 700;\n}\n\n.ga-pokemon-card-name-skeleton {\n  display: block;\n  width: 70%;\n  height: 28px;\n  border-radius: 5px;\n}\n\n.ga-pokemon-card-type-skeletons {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n}\n\n.ga-pokemon-card-type-skeletons li {\n  list-style: none;\n}\n\n.ga-pokemon-card-type-skeletons li span {\n  display: block;\n  width: 76px;\n  height: 30px;\n  border-radius: 999px;\n}\n\n.ga-pokemon-card-type-skeletons li:last-child span {\n  width: 58px;\n}\n\n.ga-pokemon-card-loading-text {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  white-space: nowrap;\n  border: 0;\n}\n\n@keyframes ga-pokemon-skeleton-loading {\n  from {\n    background-position: 200% 0;\n  }\n\n  to {\n    background-position: -200% 0;\n  }\n}\n\n@media (max-width: 767px) {\n  .ga-pokemon-card-shell {\n    min-height: 360px;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .ga-pokemon-card-flipper,\n  .ga-pokemon-card-image-skeleton,\n  .ga-pokemon-card-name-skeleton,\n  .ga-pokemon-card-type-skeletons span {\n    animation: none;\n  }\n}\n';

  // src/pokemon-listing/index.js
  var LISTING_SELECTOR = '[data-behaviour="listing"]';
  var ARTICLE_CARD_SELECTOR2 = ".listing-box";
  var CARDS_PER_PAGE = 12;
  var renderVersion = 0;
  function getCurrentPage() {
    const pageMatch = window.location.pathname.match(/\/page\/(\d+)\/?$/);
    return pageMatch ? Number.parseInt(pageMatch[1], 10) : 1;
  }
  function isCardCurrent(card, pokemonId, currentRenderVersion) {
    return currentRenderVersion === renderVersion && card.isConnected && card.dataset.gaPokemonId === String(pokemonId);
  }
  async function loadPokemonCard({
    card,
    pokemonId,
    listing,
    currentRenderVersion
  }) {
    let pokemon;
    try {
      pokemon = await getPokemon(pokemonId);
    } catch {
      if (!isCardCurrent(card, pokemonId, currentRenderVersion)) return;
      card.dataset.gaPokemonStatus = "error";
      renderPokemonError(card, pokemonId);
      applyPokemonTypeFilter(listing);
      return;
    }
    if (!isCardCurrent(card, pokemonId, currentRenderVersion)) return;
    card.dataset.gaPokemonStatus = "loaded";
    card.dataset.gaPokemonTypes = pokemon.types.join(" ");
    renderPokemonCard(card, pokemon);
    applyPokemonTypeFilter(listing);
  }
  function handleListingUpdate(listing) {
    const currentRenderVersion = ++renderVersion;
    const currentPage = getCurrentPage();
    const articleCards = [
      ...listing.querySelectorAll(ARTICLE_CARD_SELECTOR2)
    ];
    listing.classList.add("ga-pokemon-listing");
    listing.dataset.gaPokemonPage = String(currentPage);
    listing.dataset.gaPokemonCardCount = String(articleCards.length);
    articleCards.forEach((card, cardIndex) => {
      const pokemonId = (currentPage - 1) * CARDS_PER_PAGE + cardIndex + 1;
      preparePokemonCard(card, pokemonId);
      card.dataset.gaPokemonStatus = "loading";
      delete card.dataset.gaPokemonTypes;
      loadPokemonCard({
        card,
        pokemonId,
        listing,
        currentRenderVersion
      });
    });
    setupPokemonTypeFilter(listing);
    applyPokemonTypeFilter(listing);
  }
  function createPokemonListing() {
    const listing = document.querySelector(LISTING_SELECTOR);
    if (!listing) {
      throw new Error("GAIN Blog listing was not found.");
    }
    return observeListingChanges(listing, () => handleListingUpdate(listing));
  }

  // src/questionnaire/cta/cta.css
  var cta_default = '@property --ga-button-bg {\n  syntax: "<color>";\n  inherits: true;\n  initial-value: #5b813d;\n}\n\n@property --ga-button-highlight {\n  syntax: "<color>";\n  inherits: true;\n  initial-value: #729e52;\n}\n\n@property --ga-button-shadow {\n  syntax: "<color>";\n  inherits: true;\n  initial-value: #405e2b;\n}\n\n@font-face {\n  font-family: "GA Jersey 15";\n  src: url("__GA_JERSEY_15_FONT_URL__") format("woff2");\n  font-display: block;\n  font-style: normal;\n  font-weight: 400;\n}\n\n.ga-questionnaire-cta {\n  --ga-button-bg: #5b813d;\n  --ga-button-highlight: #729e52;\n  --ga-button-shadow: #405e2b;\n  --ga-button-outline: #232323;\n  --ga-button-text: #ffffff;\n\n  box-sizing: border-box;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 50px;\n  background: #2c2828;\n}\n\n.ga-questionnaire-cta *,\n.ga-questionnaire-cta *::before,\n.ga-questionnaire-cta *::after {\n  box-sizing: border-box;\n}\n\n.ga-questionnaire-cta-content {\n  display: flex;\n  flex-direction: column;\n\n  width: min(100%, 1088px);\n}\n\n.ga-questionnaire-cta-heading {\n  max-width: 720px;\n  margin: 0 0 24px;\n  color: #ffffff;\n  font-size: clamp(36px, 6vw, 72px);\n  line-height: 1;\n}\n\n.ga-questionnaire-cta-copy {\n  margin: 0 0 32px;\n  font-size: clamp(16px, 2vw, 20px);\n  line-height: 1.5;\n  color: white;\n}\n\n.ga-questionnaire-cta-button {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 108px;\n  height: 48px;\n  padding: 0;\n  border: 0;\n  clip-path: polygon(\n    4px 0,\n    calc(100% - 4px) 0,\n    calc(100% - 4px) 4px,\n    100% 4px,\n    100% calc(100% - 4px),\n    calc(100% - 4px) calc(100% - 4px),\n    calc(100% - 4px) 100%,\n    4px 100%,\n    4px calc(100% - 4px),\n    0 calc(100% - 4px),\n    0 4px,\n    4px 4px\n  );\n  background:\n    linear-gradient(\n      to bottom,\n      var(--ga-button-highlight) 0 4px,\n      transparent 4px\n    ),\n    linear-gradient(\n      to bottom,\n      var(--ga-button-bg) 0 calc(100% - 4px),\n      var(--ga-button-shadow) calc(100% - 4px)\n    );\n  box-shadow:\n    inset 0 0 0 2px var(--ga-button-outline),\n    inset 6px 0 0 var(--ga-button-shadow),\n    inset -6px 0 0 var(--ga-button-shadow);\n  filter: drop-shadow(0 5px 0 #2c2828);\n  color: var(--ga-button-text);\n  cursor: pointer;\n  font-family: "GA Jersey 15", monospace;\n  font-size: 27px;\n  font-style: normal;\n  font-weight: 400;\n  letter-spacing: 2px;\n  line-height: 1;\n  text-shadow: 0 3px 0 var(--ga-button-shadow);\n  text-transform: uppercase;\n  transition:\n    --ga-button-bg 140ms ease,\n    --ga-button-highlight 140ms ease,\n    --ga-button-shadow 140ms ease,\n    color 140ms ease,\n    filter 80ms linear,\n    transform 80ms linear;\n}\n\n.ga-questionnaire-cta-button:hover:not(:disabled) {\n  --ga-button-bg: #4b6d35;\n}\n\n.ga-questionnaire-cta-button:focus-visible {\n  --ga-button-bg: #4b6d35;\n  outline: none;\n  clip-path: none;\n  border: 1px solid white;\n  box-shadow: inset 0 0 0 2px #2850c3;\n}\n\n.ga-questionnaire-cta-button:active:not(:disabled) {\n  --ga-button-bg: #405e2b;\n  --ga-button-highlight: #405e2b;\n  --ga-button-shadow: #405e2b;\n\n  box-shadow: inset 0 0 0 2px var(--ga-button-outline);\n  filter: none;\n  text-shadow: none;\n  transform: translateY(5px);\n}\n\n.ga-questionnaire-cta-button:disabled {\n  --ga-button-bg: #e9e1e1;\n  --ga-button-highlight: #e9e1e1;\n  --ga-button-shadow: #e9e1e1;\n  --ga-button-outline: #a4a09c;\n  --ga-button-text: #a4a09c;\n\n  box-shadow: inset 0 0 0 2px var(--ga-button-outline);\n  filter: none;\n  cursor: not-allowed;\n  text-shadow: none;\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .ga-questionnaire-cta-button {\n    transition: none;\n  }\n}\n';

  // src/questionnaire/cta/Jersey15-Regular.woff2
  var Jersey15_Regular_default = "data:font/woff2;base64,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";

  // src/questionnaire/cta/index.js
  var SECTION_ID = "gain-questionnaire-cta";
  var styles = cta_default.replace(
    "__GA_JERSEY_15_FONT_URL__",
    Jersey15_Regular_default
  );
  function findHero() {
    const main = document.querySelector("#main-content, main");
    const heading = main?.querySelector("h1");
    if (!main || !heading) {
      throw new Error("GAIN hero section was not found.");
    }
    return heading.closest("section") ?? heading.parentElement;
  }
  function createQuestionnaireCta() {
    const hero = findHero();
    const section = document.createElement("section");
    section.id = SECTION_ID;
    section.className = "ga-questionnaire-cta";
    section.innerHTML = `
    <div class="ga-questionnaire-cta-content">
      <h2 class="ga-questionnaire-cta-heading">Find your way forward.</h2>
      <p class="ga-questionnaire-cta-copy">
        Answer four quick questions to discover the work, insights and people most relevant to you.
      </p>
      <button class="ga-questionnaire-cta-button" type="button">Hero</button>
    </div>
  `;
    hero.insertAdjacentElement("afterend", section);
    return section;
  }

  // src/questionnaire/modal/modal.css
  var modal_default = ".ga-questionnaire-modal {\n  --ga-modal-background: #f4f1ed;\n  --ga-modal-border: #232323;\n  --ga-modal-text: #232323;\n  --ga-modal-backdrop: rgb(0 0 0 / 70%);\n  --ga-modal-close-background: #232323;\n  --ga-modal-close-text: #ffffff;\n\n  width: min(calc(100% - 32px), 720px);\n  max-width: 720px;\n  max-height: calc(100dvh - 32px);\n  padding: 0;\n  border: 2px solid var(--ga-modal-border);\n  background: var(--ga-modal-background);\n  box-shadow: 8px 8px 0 rgb(0 0 0 / 30%);\n  color: var(--ga-modal-text);\n  overflow: hidden;\n}\n\n.ga-questionnaire-modal[open] {\n  display: flex;\n  flex-direction: column;\n}\n\n.ga-questionnaire-modal::backdrop {\n  background: var(--ga-modal-backdrop);\n}\n\n.ga-questionnaire-modal *,\n.ga-questionnaire-modal *::before,\n.ga-questionnaire-modal *::after {\n  box-sizing: border-box;\n}\n\n.ga-questionnaire-modal-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 24px;\n  padding: 24px;\n  border-bottom: 2px solid var(--ga-modal-border);\n}\n\n.ga-questionnaire-modal-title {\n  margin: 0;\n  font-size: clamp(28px, 5vw, 48px);\n  line-height: 1;\n}\n\n.ga-questionnaire-modal-close {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  flex: 0 0 auto;\n  width: 44px;\n  height: 44px;\n  padding: 0;\n  border: 0;\n  background: var(--ga-modal-close-background);\n  color: var(--ga-modal-close-text);\n  cursor: pointer;\n  font: inherit;\n  font-size: 32px;\n  line-height: 1;\n}\n\n.ga-questionnaire-modal-close:focus-visible {\n  outline: 2px solid #2850c3;\n  outline-offset: 2px;\n}\n\n.ga-questionnaire-modal-back,\n.ga-questionnaire-modal-next {\n  min-width: 112px;\n  min-height: 44px;\n  padding: 10px 20px;\n  border: 2px solid var(--ga-modal-border);\n  background: var(--ga-modal-border);\n  color: #ffffff;\n  cursor: pointer;\n  font: inherit;\n  font-size: 16px;\n  font-weight: 700;\n}\n\n.ga-questionnaire-modal-back {\n  background: #ffffff;\n  color: var(--ga-modal-text);\n}\n\n.ga-questionnaire-modal-back:focus-visible,\n.ga-questionnaire-modal-next:focus-visible {\n  outline: 2px solid #2850c3;\n  outline-offset: 2px;\n}\n\n.ga-questionnaire-modal-next:disabled {\n  border-color: #a4a09c;\n  background: #e9e1e1;\n  color: #a4a09c;\n  cursor: not-allowed;\n}\n\n.ga-questionnaire-modal-progress,\n.ga-questionnaire-modal-content,\n.ga-questionnaire-modal-actions {\n  padding: 24px;\n}\n\n.ga-questionnaire-modal-header,\n.ga-questionnaire-modal-progress,\n.ga-questionnaire-modal-actions {\n  flex: 0 0 auto;\n}\n\n.ga-questionnaire-modal-content {\n  flex: 1 1 auto;\n  min-height: 0;\n  overflow-y: auto;\n  overscroll-behavior: contain;\n  touch-action: pan-y;\n}\n\n.ga-questionnaire-modal-content > * {\n  animation: ga-questionnaire-content-enter 180ms ease-out both;\n}\n\n.ga-questionnaire-modal-actions {\n  display: flex;\n  justify-content: flex-end;\n  gap: 16px;\n  border-top: 2px solid var(--ga-modal-border);\n}\n\n@keyframes ga-questionnaire-content-enter {\n  from {\n    opacity: 0;\n    transform: translateY(6px);\n  }\n\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n\n@media (max-width: 480px) {\n  .ga-questionnaire-modal {\n    width: calc(100% - 24px);\n    max-height: calc(100dvh - 24px);\n    box-shadow: 5px 5px 0 rgb(0 0 0 / 30%);\n  }\n\n  .ga-questionnaire-modal-header,\n  .ga-questionnaire-modal-progress,\n  .ga-questionnaire-modal-content,\n  .ga-questionnaire-modal-actions {\n    padding: 16px;\n  }\n\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .ga-questionnaire-modal-content > * {\n    animation: none;\n  }\n}\n";

  // src/questionnaire/modal/index.js
  var MODAL_ID = "gain-questionnaire-modal";
  function createQuestionnaireModal() {
    const dialog = document.createElement("dialog");
    dialog.id = MODAL_ID;
    dialog.className = "ga-questionnaire-modal";
    dialog.setAttribute("aria-labelledby", "gain-questionnaire-modal-title");
    dialog.setAttribute("data-lenis-prevent", "");
    dialog.innerHTML = `
    <header class="ga-questionnaire-modal-header">
      <h2 id="gain-questionnaire-modal-title" class="ga-questionnaire-modal-title">
        Questionnaire
      </h2>
      <button
        class="ga-questionnaire-modal-close"
        type="button"
        aria-label="Close questionnaire"
      >
        &times;
      </button>
    </header>
    <div class="ga-questionnaire-modal-progress"></div>
    <div class="ga-questionnaire-modal-content"></div>
    <footer class="ga-questionnaire-modal-actions"></footer>
  `;
    dialog.querySelector(".ga-questionnaire-modal-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      const clickedOutside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
      if (clickedOutside) dialog.close();
    });
    document.body.append(dialog);
    return dialog;
  }

  // src/questionnaire/question/question.css
  var question_default = ".ga-questionnaire-question {\n  --ga-question-border: #232323;\n  --ga-question-selected: #e3eddd;\n  --ga-question-accent: #5b813d;\n  --ga-question-description: #5f5b58;\n\n  min-width: 0;\n  margin: 0;\n  padding: 0;\n  border: 0;\n}\n\n.ga-questionnaire-question-title {\n  width: 100%;\n  margin: 0 0 24px;\n  padding: 0;\n  font-size: clamp(26px, 4vw, 40px);\n  font-weight: 700;\n  line-height: 1.1;\n}\n\n.ga-questionnaire-option-list {\n  display: flex;\n  flex-direction: column;\n}\n\n.ga-questionnaire-option {\n  display: flex;\n  align-items: flex-start;\n  gap: 12px;\n  min-width: 0;\n  padding: 5px 10px;\n  border: 2px solid var(--ga-question-border);\n  background: #ffffff;\n  cursor: pointer;\n}\n\n.ga-questionnaire-option:has(.ga-questionnaire-option-input:checked) {\n  border-color: var(--ga-question-accent);\n  background: var(--ga-question-selected);\n}\n\n.ga-questionnaire-option:has(.ga-questionnaire-option-input:focus-visible) {\n  outline: 2px solid #2850c3;\n  outline-offset: 2px;\n}\n\n.ga-questionnaire-option-input {\n  width: 20px;\n  height: 20px;\n  margin: 2px 0 0;\n  accent-color: var(--ga-question-accent);\n  cursor: pointer;\n}\n\n.ga-questionnaire-option-text {\n  min-width: 0;\n  margin: 0;\n}\n\n.ga-questionnaire-option-title {\n  font-size: 18px;\n  font-weight: 700;\n  line-height: 1.2;\n  margin: 0;\n}\n\n.ga-questionnaire-option-description {\n  color: var(--ga-question-description);\n  font-size: 14px;\n  line-height: 1.4;\n}\n\n";

  // src/questionnaire/question/index.js
  function createOption({ questionId, option, selected, multiple, onChange }) {
    const optionId = `gain-questionnaire-${questionId}-${option.id}`;
    const label = document.createElement("label");
    label.className = "ga-questionnaire-option";
    label.htmlFor = optionId;
    label.innerHTML = `
    <input class="ga-questionnaire-option-input" />
    <div class="ga-questionnaire-option-text">
      <span class="ga-questionnaire-option-title"></span>
      <span class="ga-questionnaire-option-description"></span>
    </div>
  `;
    const input = label.querySelector(".ga-questionnaire-option-input");
    const title = label.querySelector(".ga-questionnaire-option-title");
    const description = label.querySelector(
      ".ga-questionnaire-option-description"
    );
    if (!input || !title || !description) {
      throw new Error("Question option elements were not created.");
    }
    input.id = optionId;
    input.type = multiple ? "checkbox" : "radio";
    input.name = questionId;
    input.value = option.id;
    input.checked = selected.has(option.id);
    input.addEventListener("change", () => {
      onChange(option.id, input.checked);
    });
    title.textContent = option.label;
    if (option.description) {
      description.textContent = option.description;
    } else {
      description.remove();
    }
    return label;
  }
  function createQuestion({
    id,
    title,
    options,
    selected,
    multiple,
    onChange
  }) {
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    const optionList = document.createElement("div");
    fieldset.className = "ga-questionnaire-question";
    legend.className = "ga-questionnaire-question-title";
    legend.textContent = title;
    optionList.className = "ga-questionnaire-option-list";
    for (const option of options) {
      optionList.append(
        createOption({
          questionId: id,
          option,
          selected,
          multiple,
          onChange
        })
      );
    }
    fieldset.append(legend, optionList);
    return fieldset;
  }

  // src/questionnaire/progress/progress.css
  var progress_default = '.ga-questionnaire-progress {\n  --ga-progress-blue: #2850c3;\n  --ga-progress-green: #5b813d;\n  --ga-progress-border: #c9c7c4;\n  --ga-progress-text: #6b6865;\n  --ga-progress-background: #ffffff;\n\n  width: 100%;\n}\n\n.ga-questionnaire-progress-list {\n  display: flex;\n  width: 100%;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.ga-questionnaire-progress-step {\n  position: relative;\n  display: flex;\n  align-items: center;\n  flex: 1 1 0;\n  min-width: 0;\n  color: var(--ga-progress-text);\n  text-align: center;\n  transition: color 220ms ease-out;\n}\n\n.ga-questionnaire-progress-step-button {\n  display: flex;\n  align-items: center;\n  flex-direction: column;\n  gap: 8px;\n  width: 100%;\n  min-width: 0;\n  padding: 0;\n  border: 0;\n  background: transparent;\n  color: inherit;\n  cursor: pointer;\n  font: inherit;\n}\n\n.ga-questionnaire-progress-step-button:disabled {\n  color: inherit;\n  cursor: default;\n  opacity: 1;\n}\n\n.ga-questionnaire-progress-step-button:focus-visible {\n  outline: 2px solid var(--ga-progress-blue);\n  outline-offset: 4px;\n}\n\n.ga-questionnaire-progress-step-completed\n  .ga-questionnaire-progress-step-button:hover\n  .ga-questionnaire-progress-label {\n  text-decoration: underline;\n}\n\n.ga-questionnaire-progress-step:not(:last-child)::after {\n  position: absolute;\n  z-index: 0;\n  top: 16px;\n  left: 50%;\n  width: 100%;\n  height: 4px;\n  background:\n    linear-gradient(var(--ga-progress-blue), var(--ga-progress-blue)) left / 0%\n      100% no-repeat,\n    var(--ga-progress-border);\n  content: "";\n  transition: background-size 260ms ease-out;\n}\n\n.ga-questionnaire-progress-step-completed:not(:last-child)::after {\n  background:\n    linear-gradient(var(--ga-progress-blue), var(--ga-progress-blue)) left / 100%\n      100% no-repeat,\n    var(--ga-progress-border);\n}\n\n.ga-questionnaire-progress-indicator {\n  position: relative;\n  z-index: 1;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 36px;\n  height: 36px;\n  border: 3px solid var(--ga-progress-border);\n  border-radius: 50%;\n  background: var(--ga-progress-background);\n  font-size: 15px;\n  font-weight: 700;\n  line-height: 1;\n  transition:\n    border-color 220ms ease-out,\n    background-color 220ms ease-out,\n    color 220ms ease-out;\n}\n\n.ga-questionnaire-progress-step-active,\n.ga-questionnaire-progress-step-completed {\n  color: var(--ga-progress-blue);\n}\n\n.ga-questionnaire-progress-step-active {\n  font-weight: 700;\n}\n\n.ga-questionnaire-progress-step-active .ga-questionnaire-progress-indicator,\n.ga-questionnaire-progress-step-completed .ga-questionnaire-progress-indicator {\n  border-color: var(--ga-progress-blue);\n  background: var(--ga-progress-blue);\n  color: #ffffff;\n}\n\n.ga-questionnaire-progress-checkmark {\n  position: absolute;\n  top: -8px;\n  right: -8px;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 18px;\n  height: 18px;\n  border: 2px solid var(--ga-progress-background);\n  border-radius: 50%;\n  background: var(--ga-progress-green);\n  color: #ffffff;\n  font-size: 12px;\n  line-height: 1;\n  opacity: 0;\n  transform: scale(0.5);\n  transition:\n    opacity 220ms ease-out,\n    transform 220ms ease-out;\n}\n\n.ga-questionnaire-progress-step-completed\n  .ga-questionnaire-progress-checkmark {\n  opacity: 1;\n  transform: scale(1);\n}\n\n.ga-questionnaire-progress-label {\n  position: relative;\n  z-index: 1;\n  max-width: 100%;\n  font-size: 13px;\n  line-height: 1.2;\n}\n\n@media (max-width: 480px) {\n  .ga-questionnaire-progress-step-button {\n    gap: 6px;\n  }\n\n  .ga-questionnaire-progress-step:not(:last-child)::after {\n    top: 14px;\n  }\n\n  .ga-questionnaire-progress-indicator {\n    width: 32px;\n    height: 32px;\n    font-size: 13px;\n  }\n\n  .ga-questionnaire-progress-label {\n    font-size: 11px;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .ga-questionnaire-progress-step,\n  .ga-questionnaire-progress-step:not(:last-child)::after,\n  .ga-questionnaire-progress-indicator,\n  .ga-questionnaire-progress-checkmark {\n    transition: none;\n  }\n}\n';

  // src/questionnaire/progress/index.js
  function createProgressStep({ step, index, onStepClick }) {
    const item = document.createElement("li");
    item.className = "ga-questionnaire-progress-step";
    item.innerHTML = `
    <button class="ga-questionnaire-progress-step-button" type="button">
      <span class="ga-questionnaire-progress-indicator">
        ${index + 1}
        <span class="ga-questionnaire-progress-checkmark" aria-hidden="true">\u2713</span>
      </span>
      <span class="ga-questionnaire-progress-label"></span>
    </button>
  `;
    const button = item.querySelector(".ga-questionnaire-progress-step-button");
    const label = item.querySelector(".ga-questionnaire-progress-label");
    if (!button || !label) {
      throw new Error("Questionnaire progress step elements were not created.");
    }
    label.textContent = step;
    button.addEventListener("click", () => onStepClick(index));
    return item;
  }
  function createProgress({ steps, onStepClick }) {
    const navigation = document.createElement("nav");
    const list = document.createElement("ol");
    navigation.className = "ga-questionnaire-progress";
    navigation.setAttribute("aria-label", "Questionnaire progress");
    list.className = "ga-questionnaire-progress-list";
    steps.forEach((step, index) => {
      list.append(createProgressStep({ step, index, onStepClick }));
    });
    navigation.append(list);
    return navigation;
  }
  function updateProgress(navigation, currentStep) {
    const steps = navigation.querySelectorAll(
      ".ga-questionnaire-progress-step"
    );
    steps.forEach((step, index) => {
      const button = step.querySelector(
        ".ga-questionnaire-progress-step-button"
      );
      const label = step.querySelector(".ga-questionnaire-progress-label");
      const isCompleted = index < currentStep;
      const isActive = index === currentStep;
      if (!button || !label) {
        throw new Error("Questionnaire progress step elements were not found.");
      }
      step.classList.toggle(
        "ga-questionnaire-progress-step-completed",
        isCompleted
      );
      step.classList.toggle("ga-questionnaire-progress-step-active", isActive);
      button.disabled = !isCompleted;
      if (isCompleted) {
        button.setAttribute("aria-label", `Go back to ${label.textContent}`);
      } else {
        button.removeAttribute("aria-label");
      }
      if (isActive) {
        step.setAttribute("aria-current", "step");
      } else {
        step.removeAttribute("aria-current");
      }
    });
  }

  // src/questionnaire/results/results.css
  var results_default = ".ga-questionnaire-results {\n  --ga-results-border: #232323;\n  --ga-results-background: #ffffff;\n  --ga-results-accent: #5b813d;\n  --ga-results-highlight: #e3eddd;\n  --ga-results-link: #2850c3;\n\n  display: flex;\n  flex-direction: column;\n  gap: 28px;\n}\n\n.ga-questionnaire-results-title {\n  margin: 0;\n  font-size: clamp(30px, 5vw, 48px);\n  line-height: 1;\n}\n\n.ga-questionnaire-results-section {\n  display: flex;\n  flex-direction: column;\n  gap: 14px;\n}\n\n.ga-questionnaire-results-section-title,\n.ga-questionnaire-results-summary-title,\n.ga-questionnaire-results-summary-values,\n.ga-questionnaire-results-section p {\n  margin: 0;\n}\n\n.ga-questionnaire-results-section-title {\n  font-size: 22px;\n  line-height: 1.2;\n}\n\n.ga-questionnaire-results-contact {\n  padding: 20px;\n  border: 2px solid var(--ga-results-border);\n  background: var(--ga-results-highlight);\n}\n\n.ga-questionnaire-results-email {\n  color: var(--ga-results-link);\n  font-size: 18px;\n  font-weight: 700;\n  overflow-wrap: anywhere;\n}\n\n.ga-questionnaire-results-list,\n.ga-questionnaire-results-summary {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n\n.ga-questionnaire-results-card {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 16px;\n  padding: 16px;\n  border: 2px solid var(--ga-results-border);\n  background: var(--ga-results-background);\n  color: var(--ga-results-border);\n  text-decoration: none;\n}\n\n.ga-questionnaire-results-card:hover {\n  background: var(--ga-results-highlight);\n}\n\n.ga-questionnaire-results-card:focus-visible,\n.ga-questionnaire-results-edit:focus-visible {\n  outline: 2px solid var(--ga-results-link);\n  outline-offset: 2px;\n}\n\n.ga-questionnaire-results-card-title {\n  font-weight: 700;\n}\n\n.ga-questionnaire-results-match {\n  flex: 0 0 auto;\n  padding: 4px 8px;\n  background: var(--ga-results-accent);\n  color: #ffffff;\n  font-size: 13px;\n  font-weight: 700;\n}\n\n.ga-questionnaire-results-summary-group {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 16px;\n  padding: 16px;\n  border: 2px solid var(--ga-results-border);\n  background: var(--ga-results-background);\n}\n\n.ga-questionnaire-results-summary-title {\n  font-size: 16px;\n  line-height: 1.3;\n}\n\n.ga-questionnaire-results-summary-values {\n  margin-top: 6px;\n  line-height: 1.4;\n}\n\n.ga-questionnaire-results-edit {\n  padding: 0;\n  border: 0;\n  background: transparent;\n  color: var(--ga-results-link);\n  cursor: pointer;\n  font: inherit;\n  font-weight: 700;\n  text-decoration: underline;\n}\n\n@media (max-width: 480px) {\n  .ga-questionnaire-results-card,\n  .ga-questionnaire-results-summary-group {\n    align-items: flex-start;\n    flex-direction: column;\n  }\n}\n";

  // src/questionnaire/results/resource-card.js
  function createResourceCard(resource, matchLabel) {
    const card = document.createElement("a");
    const title = document.createElement("span");
    card.className = "ga-questionnaire-results-card";
    card.href = resource.href;
    title.className = "ga-questionnaire-results-card-title";
    title.textContent = resource.title;
    card.append(title);
    if (matchLabel) {
      const label = document.createElement("span");
      label.className = "ga-questionnaire-results-match";
      label.textContent = matchLabel;
      card.append(label);
    }
    return card;
  }

  // src/questionnaire/results/utils.js
  function getSelectedValue(answers, questionId) {
    return [...answers[questionId]][0];
  }
  function getSelectedLabels(answers, question) {
    const selectedIds = answers[question.id];
    return question.options.filter((option) => selectedIds.has(option.id)).map((option) => option.label);
  }
  function createSection(title) {
    const section = document.createElement("section");
    const heading = document.createElement("h3");
    section.className = "ga-questionnaire-results-section";
    heading.className = "ga-questionnaire-results-section-title";
    heading.textContent = title;
    section.append(heading);
    return section;
  }

  // src/questionnaire/results/articles.js
  function createArticlesSection(articles) {
    const section = createSection("Latest insights");
    const list = document.createElement("div");
    list.className = "ga-questionnaire-results-list";
    for (const article of articles) {
      list.append(createResourceCard(article));
    }
    section.append(list);
    return section;
  }

  // src/questionnaire/results/case-studies.js
  function getRecommendations({ answers, questions, caseStudies }) {
    const servicesQuestion = questions.find(
      (question) => question.id === "services"
    );
    const industriesQuestion = questions.find(
      (question) => question.id === "industries"
    );
    const selectedServices = getSelectedLabels(answers, servicesQuestion);
    const selectedIndustries = getSelectedLabels(answers, industriesQuestion);
    const matchesSelectedLabel = (selectedLabels, caseStudyLabel) => selectedLabels.some(
      (selectedLabel) => labelsMatch(selectedLabel, caseStudyLabel)
    );
    const exactMatches = caseStudies.filter(
      (caseStudy) => matchesSelectedLabel(selectedServices, caseStudy.service) && matchesSelectedLabel(selectedIndustries, caseStudy.industry)
    );
    const relatedMatches = caseStudies.filter(
      (caseStudy) => matchesSelectedLabel(selectedServices, caseStudy.service) && !exactMatches.includes(caseStudy)
    );
    return [
      ...exactMatches.map((caseStudy) => ({
        caseStudy,
        matchLabel: "Exact match"
      })),
      ...relatedMatches.map((caseStudy) => ({
        caseStudy,
        matchLabel: "Related"
      }))
    ].slice(0, 3);
  }
  function createEmptyMessage(workUrl) {
    const message = document.createElement("p");
    const link = document.createElement("a");
    message.textContent = "We don\u2019t have a matching case study in the homepage slider yet. ";
    link.href = workUrl;
    link.textContent = "Explore all work";
    message.append(link);
    return message;
  }
  function createCaseStudiesSection({
    answers,
    questions,
    caseStudies,
    workUrl
  }) {
    const section = createSection("Recommended work");
    const recommendations = getRecommendations({
      answers,
      questions,
      caseStudies
    });
    if (recommendations.length === 0) {
      section.append(createEmptyMessage(workUrl));
      return section;
    }
    const list = document.createElement("div");
    list.className = "ga-questionnaire-results-list";
    for (const recommendation of recommendations) {
      list.append(
        createResourceCard(recommendation.caseStudy, recommendation.matchLabel)
      );
    }
    section.append(list);
    return section;
  }

  // src/questionnaire/results/contact.js
  function createContactSection(contact) {
    const section = createSection("Talk to our team");
    const description = document.createElement("p");
    const link = document.createElement("a");
    section.classList.add("ga-questionnaire-results-contact");
    description.textContent = "Tell us what you\u2019re working on and we\u2019ll help you find the next step.";
    link.className = "ga-questionnaire-results-email";
    link.href = contact.href;
    link.textContent = contact.email;
    section.append(description, link);
    return section;
  }

  // src/questionnaire/results/heading.js
  var RESULT_HEADINGS = {
    "right-away": "Let\u2019s talk this week",
    "next-three-months": "Here\u2019s where to start",
    exploring: "Take your time"
  };
  function createResultsHeading(timeline) {
    const heading = document.createElement("h2");
    heading.className = "ga-questionnaire-results-title";
    heading.textContent = RESULT_HEADINGS[timeline];
    return heading;
  }

  // src/questionnaire/results/summary.js
  function createSummaryGroup({ question, answers, onEdit }) {
    const group = document.createElement("div");
    const content = document.createElement("div");
    const title = document.createElement("h4");
    const values = document.createElement("p");
    const editButton = document.createElement("button");
    group.className = "ga-questionnaire-results-summary-group";
    title.className = "ga-questionnaire-results-summary-title";
    title.textContent = question.title;
    values.className = "ga-questionnaire-results-summary-values";
    values.textContent = getSelectedLabels(answers, question).join(", ");
    editButton.className = "ga-questionnaire-results-edit";
    editButton.type = "button";
    editButton.textContent = "Change";
    editButton.addEventListener("click", onEdit);
    content.append(title, values);
    group.append(content, editButton);
    return group;
  }
  function createSummary({ answers, questions, onEdit }) {
    const section = createSection("Your selections");
    const summary = document.createElement("div");
    summary.className = "ga-questionnaire-results-summary";
    for (const questionId of ["services", "industries"]) {
      const questionIndex = questions.findIndex(
        (question2) => question2.id === questionId
      );
      const question = questions[questionIndex];
      summary.append(
        createSummaryGroup({
          question,
          answers,
          onEdit: () => onEdit(questionIndex)
        })
      );
    }
    section.append(summary);
    return section;
  }

  // src/questionnaire/results/index.js
  function createResults({
    answers,
    questions,
    caseStudies,
    articles,
    contact,
    workUrl,
    onEdit
  }) {
    const results = document.createElement("div");
    const usefulness = getSelectedValue(answers, "usefulness");
    const timeline = getSelectedValue(answers, "timeline");
    let contactShown = false;
    results.className = "ga-questionnaire-results";
    results.append(createResultsHeading(timeline));
    const showContact = () => {
      if (contactShown) return;
      results.append(createContactSection(contact));
      contactShown = true;
    };
    if (timeline === "right-away") {
      showContact();
    }
    switch (usefulness) {
      case "case-studies":
        results.append(
          createCaseStudiesSection({
            answers,
            questions,
            caseStudies,
            workUrl
          })
        );
        break;
      case "articles":
        results.append(createArticlesSection(articles));
        break;
      case "contact":
        showContact();
        if (timeline === "exploring") {
          results.append(createArticlesSection(articles));
        }
        break;
      default:
        throw new Error(`Unknown usefulness option: ${usefulness}`);
    }
    results.append(createSummary({ answers, questions, onEdit }));
    return results;
  }

  // src/questionnaire/scroll-lock.js
  var SCROLL_LOCK_CLASS = "ga-questionnaire-scroll-locked";
  var lockedScrollY = 0;
  function setPageScrollLocked(locked) {
    if (locked) {
      lockedScrollY = window.scrollY;
      document.body.style.setProperty(
        "--ga-questionnaire-scroll-offset",
        `-${lockedScrollY}px`
      );
    }
    document.documentElement.classList.toggle(SCROLL_LOCK_CLASS, locked);
    document.body.classList.toggle(SCROLL_LOCK_CLASS, locked);
    if (!locked) {
      document.body.style.removeProperty("--ga-questionnaire-scroll-offset");
      window.scrollTo(0, lockedScrollY);
    }
  }

  // src/questionnaire/styles.css
  var styles_default = "html.ga-questionnaire-scroll-locked,\nbody.ga-questionnaire-scroll-locked {\n  overflow: hidden !important;\n}\n\nbody.ga-questionnaire-scroll-locked {\n  position: fixed !important;\n  top: var(--ga-questionnaire-scroll-offset) !important;\n  right: 0 !important;\n  left: 0 !important;\n  width: 100% !important;\n}\n";

  // src/questionnaire/styles.js
  var styles2 = [
    styles_default,
    styles,
    modal_default,
    question_default,
    progress_default,
    results_default
  ].join("\n");

  // src/questionnaire/index.js
  function renderQuestionStep({
    modal,
    content,
    actions,
    backButton,
    questions,
    resultsData,
    state
  }) {
    const nextButton = document.createElement("button");
    nextButton.className = "ga-questionnaire-modal-next";
    nextButton.type = "button";
    nextButton.textContent = state.currentStep === questions.length - 1 ? "See results" : "Next";
    nextButton.addEventListener("click", () => {
      state.currentStep += 1;
      renderCurrentStep({ modal, questions, resultsData, state });
    });
    const updateNextButton = () => {
      nextButton.disabled = selectedAnswers.size === 0;
    };
    const questionConfig = questions[state.currentStep];
    const selectedAnswers = state.answers[questionConfig.id];
    const question = createQuestion({
      id: questionConfig.id,
      title: questionConfig.title,
      options: questionConfig.options,
      selected: selectedAnswers,
      multiple: questionConfig.multiple,
      onChange(optionId, checked) {
        if (checked) {
          if (!questionConfig.multiple) {
            selectedAnswers.clear();
          }
          selectedAnswers.add(optionId);
        } else {
          selectedAnswers.delete(optionId);
        }
        updateNextButton();
      }
    });
    updateNextButton();
    content.replaceChildren(question);
    content.scrollTop = 0;
    if (state.currentStep === 0) {
      actions.replaceChildren(nextButton);
    } else {
      actions.replaceChildren(backButton, nextButton);
    }
  }
  function renderResultsStep({
    modal,
    content,
    actions,
    backButton,
    questions,
    resultsData,
    state
  }) {
    const results = createResults({
      answers: state.answers,
      questions,
      ...resultsData,
      onEdit(stepIndex) {
        state.currentStep = stepIndex;
        renderCurrentStep({ modal, questions, resultsData, state });
      }
    });
    content.replaceChildren(results);
    actions.replaceChildren(backButton);
    content.scrollTop = 0;
  }
  function renderCurrentStep({ modal, questions, resultsData, state }) {
    const content = modal.querySelector(".ga-questionnaire-modal-content");
    const actions = modal.querySelector(".ga-questionnaire-modal-actions");
    const progress = modal.querySelector(".ga-questionnaire-modal-progress");
    if (!content || !actions || !progress) {
      throw new Error("Questionnaire modal content containers were not found.");
    }
    let progressNavigation = progress.querySelector(
      ".ga-questionnaire-progress"
    );
    if (!progressNavigation) {
      progressNavigation = createProgress({
        steps: [...questions.map((question) => question.stepLabel), "Results"],
        onStepClick(stepIndex) {
          state.currentStep = stepIndex;
          renderCurrentStep({ modal, questions, resultsData, state });
        }
      });
      progress.append(progressNavigation);
    }
    updateProgress(progressNavigation, state.currentStep);
    const backButton = document.createElement("button");
    backButton.className = "ga-questionnaire-modal-back";
    backButton.type = "button";
    backButton.textContent = "Back";
    backButton.addEventListener("click", () => {
      state.currentStep -= 1;
      renderCurrentStep({ modal, questions, resultsData, state });
    });
    const renderStep = state.currentStep === questions.length ? renderResultsStep : renderQuestionStep;
    renderStep({
      modal,
      content,
      actions,
      backButton,
      questions,
      resultsData,
      state
    });
  }
  function createQuestionnaire() {
    const cta = createQuestionnaireCta();
    let modal;
    const state = {
      currentStep: 0,
      answers: {
        services: /* @__PURE__ */ new Set(),
        industries: /* @__PURE__ */ new Set(),
        usefulness: /* @__PURE__ */ new Set(),
        timeline: /* @__PURE__ */ new Set()
      }
    };
    try {
      const questions = [
        {
          id: "services",
          stepLabel: "Services",
          title: "What do you need help with?",
          options: readServicesFromPage(),
          multiple: true
        },
        {
          id: "industries",
          stepLabel: "Industry",
          title: "Which industry are you in?",
          options: readIndustriesFromPage(),
          multiple: true
        },
        {
          id: "usefulness",
          stepLabel: "Useful now",
          title: "What would be most useful right now?",
          options: [
            {
              id: "case-studies",
              label: "Case studies like mine"
            },
            {
              id: "articles",
              label: "Articles to read"
            },
            {
              id: "contact",
              label: "Talk to someone"
            }
          ],
          multiple: false
        },
        {
          id: "timeline",
          stepLabel: "Timeline",
          title: "When are you looking to start?",
          options: [
            {
              id: "right-away",
              label: "Right away"
            },
            {
              id: "next-three-months",
              label: "In the next 3 months"
            },
            {
              id: "exploring",
              label: "Just exploring"
            }
          ],
          multiple: false
        }
      ];
      const trigger = cta.querySelector(".ga-questionnaire-cta-button");
      if (!trigger) {
        throw new Error("Questionnaire trigger button was not found.");
      }
      const resultsData = {
        articles: readArticlesFromPage(),
        caseStudies: readCaseStudiesFromPage(),
        contact: readFooterEmailFromPage(),
        workUrl: readWorkUrlFromPage()
      };
      modal = createQuestionnaireModal();
      renderCurrentStep({ modal, questions, resultsData, state });
      trigger.addEventListener("click", () => {
        if (modal.open) return;
        modal.showModal();
        setPageScrollLocked(true);
      });
      modal.addEventListener("close", () => {
        setPageScrollLocked(false);
        trigger.focus();
      });
      return [cta, modal];
    } catch (error) {
      cta.remove();
      modal?.remove();
      throw error;
    }
  }

  // src/styles.js
  var styles3 = [
    styles2,
    drawer_default,
    pokemon_listing_default
  ].join("\n");

  // src/main.js
  var APP_KEY = "__GAIN_ASSESSMENT__";
  var STYLE_ID = "gain-assessment-styles";
  function isBlogPage(pathname) {
    return pathname === "/blog" || pathname.startsWith("/blog/");
  }
  function pageIsReady() {
    const { pathname } = window.location;
    if (isBlogPage(pathname)) {
      const listing = document.querySelector('[data-behaviour="listing"]');
      return Boolean(
        document.body && document.querySelector('[data-behaviour="listing-filters"]') && listing?.querySelector(".listing-box") && listing.querySelector(":scope > nav")
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
      style.textContent = styles3;
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
})();
