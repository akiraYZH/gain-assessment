import { createResourceCard } from "./resource-card.js";
import { createSection } from "./utils.js";

export function createArticlesSection(articles) {
  const section = createSection("Latest insights");
  const list = document.createElement("div");

  list.className = "ga-questionnaire-results-list";
  for (const article of articles) {
    list.append(createResourceCard(article));
  }

  section.append(list);
  return section;
}
