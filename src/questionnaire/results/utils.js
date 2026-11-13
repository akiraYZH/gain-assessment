export function getSelectedValue(answers, questionId) {
  return [...answers[questionId]][0];
}

export function getSelectedLabels(answers, question) {
  const selectedIds = answers[question.id];

  return question.options
    .filter((option) => selectedIds.has(option.id))
    .map((option) => option.label);
}

export function createSection(title) {
  const section = document.createElement("section");
  const heading = document.createElement("h3");

  section.className = "ga-questionnaire-results-section";
  heading.className = "ga-questionnaire-results-section-title";
  heading.textContent = title;
  section.append(heading);
  return section;
}
