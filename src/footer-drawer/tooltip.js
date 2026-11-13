const TOOLTIP_VIEWPORT_GAP = 12;
const TOOLTIP_TRIGGER_GAP = 10;

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function setupTooltip(trigger, tooltip) {
  let positionRequest = null;

  const positionTooltip = () => {
    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const triggerCenter = triggerRect.left + triggerRect.width / 2;
    const preferredLeft = triggerCenter - tooltipRect.width / 2;
    const maximumLeft =
      window.innerWidth - tooltipRect.width - TOOLTIP_VIEWPORT_GAP;
    const left = clamp(
      preferredLeft,
      TOOLTIP_VIEWPORT_GAP,
      Math.max(TOOLTIP_VIEWPORT_GAP, maximumLeft),
    );
    const preferredTop =
      triggerRect.top - tooltipRect.height - TOOLTIP_TRIGGER_GAP;
    const showBelow = preferredTop < TOOLTIP_VIEWPORT_GAP;
    const top = showBelow
      ? triggerRect.bottom + TOOLTIP_TRIGGER_GAP
      : preferredTop;
    const arrowLeft = clamp(
      triggerCenter - left,
      TOOLTIP_VIEWPORT_GAP,
      tooltipRect.width - TOOLTIP_VIEWPORT_GAP,
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
      passive: true,
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
