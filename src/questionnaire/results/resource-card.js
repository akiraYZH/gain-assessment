export function createResourceCard(resource, matchLabel) {
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
