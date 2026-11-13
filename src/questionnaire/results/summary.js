import { createSection, getSelectedLabels } from "./utils.js";

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

export function createSummary({ answers, questions, onEdit }) {
  const section = createSection("Your selections");
  const summary = document.createElement("div");

  summary.className = "ga-questionnaire-results-summary";
  for (const questionId of ["services", "industries"]) {
    const questionIndex = questions.findIndex(
      (question) => question.id === questionId,
    );
    const question = questions[questionIndex];

    summary.append(
      createSummaryGroup({
        question,
        answers,
        onEdit: () => onEdit(questionIndex),
      }),
    );
  }

  section.append(summary);
  return section;
}
