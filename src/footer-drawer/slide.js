import { labelsMatch } from "../utils.js";
import { setupTooltip } from "./tooltip.js";

function getServiceDescription(caseStudy, services) {
  return (
    services.find((service) => labelsMatch(service.label, caseStudy.service))
      ?.description ?? ""
  );
}

export function createCaseStudySlide({ caseStudy, services, index }) {
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
    ".ga-footer-slider-tooltip-trigger",
  );
  const tooltip = slide.querySelector(".ga-footer-slider-tooltip");
  const title = slide.querySelector(".ga-footer-slider-title-text");
  const description = slide.querySelector(".ga-footer-slider-description");
  const link = slide.querySelector(".ga-footer-slider-link");

  if (
    !media ||
    !tag ||
    !tooltipTrigger ||
    !tooltip ||
    !title ||
    !description ||
    !link
  ) {
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
  tooltip.textContent = `${caseStudy.service} · ${caseStudy.industry}`;
  title.textContent = caseStudy.title;
  description.textContent = getServiceDescription(caseStudy, services);
  link.href = caseStudy.href;
  setupTooltip(tooltipTrigger, tooltip);
  return slide;
}
