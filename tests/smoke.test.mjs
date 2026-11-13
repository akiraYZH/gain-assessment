import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { after, before } from "node:test";
import { chromium } from "playwright";

const bundle = await readFile("dist/main.js", "utf8");
const standaloneStyles = await readFile("dist/styles.css", "utf8");
let browser;

const homepageFixture = `<!doctype html>
<html>
  <head><base href="https://www.thisisgain.com/"></head>
  <body>
    <main id="main-content"><section><h1>GAIN</h1></section></main>
    <nav>
      <div class="site-navigation__item">
        <button class="site-navigation__link" data-behaviour="menu-toggle">Solutions</button>
        <a class="site-navigation__submenu-link" href="/creative-studios/">
          <span class="site-navigation__submenu-link-title">Creative Studios</span>
          <span class="site-navigation__submenu-link-description">Creative description</span>
        </a>
      </div>
    </nav>
    <div class="wp-block-columns">
      <p>Our Sectors</p>
      <div class="wp-block-buttons">
        <a class="wp-block-button__link" href="/finance/">Finance</a>
        <a class="wp-block-button__link" href="/retail/">Retail</a>
        <a class="wp-block-button__link" href="/government/">Government</a>
        <a class="wp-block-button__link" href="/health/">Health &amp; Wellbeing</a>
        <a class="wp-block-button__link" href="/travel/">Travel &amp; Holiday</a>
        <a class="wp-block-button__link" href="/tech/">Tech &amp; Telco</a>
        <a class="wp-block-button__link" href="/consumer-goods/">Consumer Goods</a>
        <a class="wp-block-button__link" href="/food-drink/">Food &amp; Drink</a>
        <a class="wp-block-button__link" href="/non-profit/">Non-Profit</a>
        <a class="wp-block-button__link" href="/fashion/">Fashion</a>
        <a class="wp-block-button__link" href="/education/">Education</a>
        <a class="wp-block-button__link" href="/automotive/">Automotive</a>
      </div>
    </div>
    <div class="wp-block-group">
      <h2 id="h-work">Work</h2>
      <a href="/work/">All Work</a>
    </div>
    <div class="content-card content-card--work">
      <a class="content-card__link" href="/work/example/">Example work</a>
      <h3 class="content-card__title">Example work</h3>
      <ul class="content-tags"><li>Creative Studios</li><li>Finance</li></ul>
    </div>
    <div class="content-card content-card--post">
      <a class="content-card__link" href="/post/one/">Article one</a>
      <h3 class="content-card__title">Article one</h3>
    </div>
    <footer class="site-footer">
      <a href="mailto:hello@example.com">hello@example.com</a>
    </footer>
  </body>
</html>`;

function createArticleCards(count, startId = 1) {
  return Array.from(
    { length: count },
    (_, index) => `
      <li class="listing-box">
        <a class="listing-box__link" href="/post/${startId + index}/">
          Article ${startId + index}
        </a>
      </li>`,
  ).join("");
}

const blogFixture = `<!doctype html>
<html>
  <head><style>.listing-box { display: flex; }</style></head>
  <body>
    <div class="listing-filters" data-behaviour="listing-filters">
      <div class="filter-dropdown">
        <select name="category"><option>Filter by Categories</option></select>
        <select name="post_tag"><option>Filter by Tags</option></select>
        <select name="capability"><option>Filter by Capability</option></select>
        <select name="sector"><option>Filter by Sector</option></select>
      </div>
    </div>
    <div data-behaviour="listing">
      <ul>${createArticleCards(12)}</ul>
      <nav>Pagination</nav>
    </div>
  </body>
</html>`;

before(async () => {
  browser = await chromium.launch({ channel: "chrome", headless: true });
});

after(async () => {
  await browser.close();
});

test("homepage bundle is idempotent and renders Tasks 1 and 2", async () => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 800 },
  });
  await context.addInitScript({ content: bundle });
  const page = await context.newPage();

  await page.route("https://www.thisisgain.com/", (route) =>
    route.fulfill({ contentType: "text/html", body: homepageFixture }),
  );
  await page.goto("https://www.thisisgain.com/");
  await page.locator("#gain-questionnaire-cta").waitFor();
  await page.addScriptTag({ content: bundle });

  assert.equal(await page.locator("#gain-questionnaire-cta").count(), 1);
  assert.equal(await page.locator("#gain-questionnaire-modal").count(), 1);
  assert.equal(await page.locator("#gain-footer-drawer").count(), 1);
  assert.equal(await page.locator("#gain-assessment-styles").count(), 1);
  assert.equal(
    await page.locator("#gain-assessment-styles").textContent(),
    standaloneStyles,
  );
  assert.match(
    await page
      .locator(".ga-questionnaire-cta-button")
      .evaluate((button) => getComputedStyle(button).transitionProperty),
    /--ga-button-bg/,
  );

  await page.locator(".ga-footer-drawer-label-toggle").click();
  assert.equal(await page.locator(".ga-footer-slider-slide").count(), 1);
  assert.equal(
    await page.locator(".ga-footer-drawer-panel").getAttribute("aria-hidden"),
    "false",
  );
  await page.locator(".ga-footer-slider-tooltip-trigger").focus();
  assert.notEqual(
    await page
      .locator(".ga-footer-slider-tooltip-visible")
      .evaluate((tooltip) => getComputedStyle(tooltip).transitionDuration),
    "0s",
  );
  assert.match(
    await page
      .locator(".ga-footer-slider-link")
      .evaluate((link) => getComputedStyle(link).transitionProperty),
    /background-color/,
  );

  await page.locator(".ga-questionnaire-cta-button").click();
  await page.evaluate(() => {
    window.__gaTestProgress = document.querySelector(
      ".ga-questionnaire-progress",
    );
  });
  await page.locator('input[value="creative-studios"]').check();
  await page.locator(".ga-questionnaire-modal-next").click();

  const modalLayout = await page.locator("#gain-questionnaire-modal").evaluate(
    (modal) => {
      const content = modal.querySelector(".ga-questionnaire-modal-content");
      const actions = modal.querySelector(".ga-questionnaire-modal-actions");
      const modalBounds = modal.getBoundingClientRect();
      const actionsBounds = actions.getBoundingClientRect();

      return {
        contentScrolls: content.scrollHeight > content.clientHeight,
        actionsInsideModal: actionsBounds.bottom <= modalBounds.bottom,
        modalOverflow: getComputedStyle(modal).overflow,
        contentOverflow: getComputedStyle(content).overflowY,
      };
    },
  );

  assert.deepEqual(modalLayout, {
    contentScrolls: true,
    actionsInsideModal: true,
    modalOverflow: "hidden",
    contentOverflow: "auto",
  });
  assert.equal(
    await page
      .locator(".ga-questionnaire-modal-content > *")
      .evaluate((content) => getComputedStyle(content).animationName),
    "ga-questionnaire-content-enter",
  );
  assert.equal(
    await page.evaluate(
      () =>
        window.__gaTestProgress ===
        document.querySelector(".ga-questionnaire-progress"),
    ),
    true,
  );
  assert.deepEqual(
    await page.locator(".ga-questionnaire-progress-step").evaluateAll((steps) =>
      steps.map((step) => ({
        active: step.classList.contains(
          "ga-questionnaire-progress-step-active",
        ),
        completed: step.classList.contains(
          "ga-questionnaire-progress-step-completed",
        ),
      })),
    ),
    [
      { active: false, completed: true },
      { active: true, completed: false },
      { active: false, completed: false },
      { active: false, completed: false },
      { active: false, completed: false },
    ],
  );

  for (const value of ["finance", "case-studies", "next-three-months"]) {
    await page.locator(`input[value="${value}"]`).check();
    await page.locator(".ga-questionnaire-modal-next").click();
  }

  assert.equal(
    await page.locator(".ga-questionnaire-results-title").textContent(),
    "Here’s where to start",
  );
  assert.equal(await page.getByText("Exact match", { exact: true }).count(), 1);
  assert.match(
    await page
      .locator(".ga-questionnaire-progress-indicator")
      .first()
      .evaluate((indicator) => getComputedStyle(indicator).transitionProperty),
    /background-color/,
  );

  await page
    .locator('.ga-questionnaire-progress-step-button[aria-label="Go back to Industry"]')
    .click();
  assert.equal(
    await page.locator(".ga-questionnaire-question-title").textContent(),
    "Which industry are you in?",
  );
  assert.equal(await page.locator('input[value="finance"]').isChecked(), true);

  await context.close();
});

test("homepage initialization rolls back previously created elements", async () => {
  const page = await browser.newPage();

  await page.route("https://www.thisisgain.com/", (route) =>
    route.fulfill({ contentType: "text/html", body: homepageFixture }),
  );
  await page.goto("https://www.thisisgain.com/");
  await page.evaluate(() => {
    window.ResizeObserver = undefined;
  });
  await page.addScriptTag({ content: bundle });
  await page.waitForFunction(() => !window.__GAIN_ASSESSMENT__);

  assert.equal(await page.locator("#gain-questionnaire-cta").count(), 0);
  assert.equal(await page.locator("#gain-questionnaire-modal").count(), 0);
  assert.equal(await page.locator("#gain-footer-drawer").count(), 0);
  assert.equal(
    await page.evaluate(() => Boolean(window.__GAIN_ASSESSMENT__)),
    false,
  );

  await page.close();
});

test("blog bundle keeps filtering and flipping across React updates", async () => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 800 },
  });
  await context.addInitScript({ content: bundle });
  const page = await context.newPage();

  await page.route("https://www.thisisgain.com/blog/", (route) =>
    route.fulfill({ contentType: "text/html", body: blogFixture }),
  );
  await page.route("https://pokeapi.co/api/v2/pokemon/*", (route) => {
    const pokemonId = Number(
      new URL(route.request().url()).pathname.split("/").filter(Boolean).at(-1),
    );

    if (pokemonId === 15) {
      route.fulfill({ status: 500, body: "API error" });
      return;
    }

    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: pokemonId,
        name: `pokemon-${pokemonId}`,
        sprites: {
          other: {
            home: {
              front_default: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
            },
          },
          front_default: null,
        },
        types: [
          {
            slot: 1,
            type: { name: pokemonId % 2 === 0 ? "fire" : "grass" },
          },
        ],
        height: pokemonId,
        weight: pokemonId * 10,
        abilities: [{ ability: { name: "test-ability" } }],
        base_experience: 50,
      }),
    });
  });

  await page.goto("https://www.thisisgain.com/blog/");
  await page.addScriptTag({ content: bundle });
  await page.waitForFunction(
    () => document.querySelectorAll(".ga-pokemon-card-loaded").length === 12,
  );

  const typeFilter = page.locator(".ga-pokemon-type-filter");
  assert.equal(await typeFilter.locator("option").count(), 19);
  await typeFilter.selectOption("fire");

  const visibleCards = () =>
    page.locator(".listing-box").evaluateAll(
      (cards) =>
        cards.filter((card) => getComputedStyle(card).display !== "none").length,
    );

  assert.equal(await visibleCards(), 6);

  await page.evaluate((cards) => {
    history.pushState({}, "", "/blog/page/2/");
    document.querySelector('[data-behaviour="listing"]').innerHTML = `
      <ul>${cards}</ul>
      <nav>Pagination</nav>
    `;
  }, createArticleCards(3, 13));
  await page.waitForFunction(
    () =>
      document.querySelectorAll(
        ".ga-pokemon-card-loaded, .ga-pokemon-card-error",
      ).length === 3,
  );

  assert.equal(await typeFilter.evaluate((select) => select.value), "fire");
  assert.equal(await visibleCards(), 1);
  assert.deepEqual(
    await page.locator(".listing-box").evaluateAll((cards) =>
      cards.map((card) => card.dataset.gaPokemonId),
    ),
    ["13", "14", "15"],
  );

  const visibleCard = page.locator(".listing-box:not([hidden])").first();
  await visibleCard.locator(".ga-pokemon-card-shell").click();
  assert.equal(
    await visibleCard
      .locator(".ga-pokemon-card-shell")
      .getAttribute("aria-pressed"),
    "true",
  );

  await typeFilter.selectOption("fairy");
  assert.equal(await visibleCards(), 0);
  assert.equal(
    await page.locator(".ga-pokemon-empty-message").textContent(),
    "No Fairy Pokémon appear on this page.",
  );
  assert.equal(
    await page.locator(".ga-pokemon-empty-message").evaluate(
      (message) => message.nextElementSibling?.tagName,
    ),
    "NAV",
  );
  assert.equal(await page.locator("#gain-assessment-styles").count(), 1);

  await context.close();
});
