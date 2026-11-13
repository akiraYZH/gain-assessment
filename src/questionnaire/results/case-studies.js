import { createResourceCard } from "./resource-card.js";
import { labelsMatch } from "../../utils.js";
import { createSection, getSelectedLabels } from "./utils.js";

function getRecommendations({ answers, questions, caseStudies }) {
  const servicesQuestion = questions.find(
    (question) => question.id === "services",
  );
  const industriesQuestion = questions.find(
    (question) => question.id === "industries",
  );

  //answers for services
  const selectedServices = getSelectedLabels(answers, servicesQuestion);
  // answers for industries
  const selectedIndustries = getSelectedLabels(answers, industriesQuestion);

  // get matched selected label function
  const matchesSelectedLabel = (selectedLabels, caseStudyLabel) =>
    selectedLabels.some((selectedLabel) =>
      labelsMatch(selectedLabel, caseStudyLabel),
    );

  // matches service and industry
  const exactMatches = caseStudies.filter(
    (caseStudy) =>
      matchesSelectedLabel(selectedServices, caseStudy.service) &&
      matchesSelectedLabel(selectedIndustries, caseStudy.industry),
  );

  // matches service or industry either one
  const relatedMatches = caseStudies.filter(
    (caseStudy) =>
      matchesSelectedLabel(selectedServices, caseStudy.service) &&
      !exactMatches.includes(caseStudy),
  );

  return [
    ...exactMatches.map((caseStudy) => ({
      caseStudy,
      matchLabel: "Exact match",
    })),
    ...relatedMatches.map((caseStudy) => ({
      caseStudy,
      matchLabel: "Related",
    })),
  ].slice(0, 3); // cut to 3
}

function createEmptyMessage(workUrl) {
  const message = document.createElement("p");
  const link = document.createElement("a");

  message.textContent =
    "We don’t have a matching case study in the homepage slider yet. ";
  link.href = workUrl;
  link.textContent = "Explore all work";
  message.append(link);
  return message;
}

export function createCaseStudiesSection({
  answers,
  questions,
  caseStudies,
  workUrl,
}) {
  const section = createSection("Recommended work");
  const recommendations = getRecommendations({
    answers,
    questions,
    caseStudies,
  });

  if (recommendations.length === 0) {
    section.append(createEmptyMessage(workUrl));
    return section;
  }

  const list = document.createElement("div");
  list.className = "ga-questionnaire-results-list";

  for (const recommendation of recommendations) {
    list.append(
      createResourceCard(recommendation.caseStudy, recommendation.matchLabel),
    );
  }

  section.append(list);
  return section;
}
