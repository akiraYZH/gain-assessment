import {
  decodeCloudflareEmail,
  getContentCardData,
  getLastPathSegment,
  normalizeText,
} from "./utils.js";

export function readServicesFromPage() {
  const navigationLinks = [
    ...document.querySelectorAll(
      ".site-navigation__link[data-behaviour='menu-toggle']",
    ),
  ];
  const solutionsLink = navigationLinks.find(
    (link) => normalizeText(link.textContent).toLowerCase() === "solutions",
  );
  const solutionsMenu = solutionsLink?.closest(".site-navigation__item");

  if (!solutionsMenu) {
    throw new Error("GAIN Solutions menu was not found.");
  }

  const services = [
    ...solutionsMenu.querySelectorAll(".site-navigation__submenu-link"),
  ].map((link) => ({
    id: getLastPathSegment(link.href),
    label: normalizeText(
      link.querySelector(".site-navigation__submenu-link-title")?.textContent,
    ),
    description: normalizeText(
      link.querySelector(".site-navigation__submenu-link-description")
        ?.textContent,
    ),
    href: link.href,
  }));
  const validServices = services.filter(
    (service) => service.id && service.label,
  );

  if (validServices.length === 0) {
    throw new Error("No services were found in the GAIN Solutions menu.");
  }

  return validServices;
}

export function readIndustriesFromPage() {
  const sectorsHeading = [...document.querySelectorAll("p")].find(
    (element) =>
      normalizeText(element.textContent).toLowerCase() === "our sectors",
  );
  const sectorsSection = sectorsHeading?.closest(".wp-block-columns");

  if (!sectorsSection) {
    throw new Error('GAIN "Our Sectors" section was not found.');
  }

  const industries = [
    ...sectorsSection.querySelectorAll(
      ".wp-block-buttons .wp-block-button__link",
    ),
  ].map((link) => ({
    id: getLastPathSegment(link.href),
    label: normalizeText(link.textContent),
    href: link.href,
  }));
  const validIndustries = industries.filter(
    (industry) => industry.id && industry.label,
  );

  if (validIndustries.length === 0) {
    throw new Error(
      'No industries were found in the GAIN "Our Sectors" section.',
    );
  }

  return validIndustries;
}

export function readCaseStudiesFromPage() {
  const caseStudies = [...document.querySelectorAll(".content-card--work")].map(
    (card) => {
      const content = getContentCardData(card);

      return {
        ...content,
        service: content.tags[0] ?? "",
        industry: content.tags[1] ?? "",
      };
    },
  );
  const validCaseStudies = caseStudies.filter(
    (caseStudy) => caseStudy.title && caseStudy.href,
  );

  if (validCaseStudies.length === 0) {
    throw new Error('No case studies were found in the GAIN "Work" slider.');
  }

  return validCaseStudies;
}

export function readWorkUrlFromPage() {
  const workHeading = document.querySelector("#h-work");
  const workHeader = workHeading?.closest(".wp-block-group");
  const workLink = workHeader?.querySelector('a[href*="/work/"]');

  if (!workLink) {
    throw new Error('GAIN "All Work" link was not found.');
  }

  return workLink.href;
}

export function readArticlesFromPage() {
  const articles = [...document.querySelectorAll(".content-card--post")]
    .map(getContentCardData)
    .filter((article) => article.title && article.href)
    .slice(0, 3);

  if (articles.length === 0) {
    throw new Error('No articles were found in the GAIN "Insights" slider.');
  }

  return articles;
}

export function readFooterEmailFromPage() {
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
