import rawStyles from "./cta.css";
import jersey15FontUrl from "./Jersey15-Regular.woff2";

const SECTION_ID = "gain-questionnaire-cta";
const styles = rawStyles.replace(
  "__GA_JERSEY_15_FONT_URL__",
  jersey15FontUrl,
);

function findHero() {
  const main = document.querySelector("#main-content, main");
  const heading = main?.querySelector("h1");

  if (!main || !heading) {
    throw new Error("GAIN hero section was not found.");
  }

  return heading.closest("section") ?? heading.parentElement;
}

export function createQuestionnaireCta() {
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

export { styles };
