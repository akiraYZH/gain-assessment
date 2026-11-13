import styles from "./progress.css";

function createProgressStep({ step, index, currentStep }) {
  const item = document.createElement("li");
  const isCompleted = index < currentStep;
  const isActive = index === currentStep;

  item.className = "ga-questionnaire-progress-step";
  item.innerHTML = `
    <span class="ga-questionnaire-progress-indicator"></span>
    <span class="ga-questionnaire-progress-label"></span>
  `;

  const indicator = item.querySelector(
    ".ga-questionnaire-progress-indicator",
  );
  const label = item.querySelector(".ga-questionnaire-progress-label");

  if (!indicator || !label) {
    throw new Error("Questionnaire progress step elements were not created.");
  }

  indicator.textContent = String(index + 1);
  label.textContent = step;

  if (isCompleted) {
    const checkmark = document.createElement("span");

    item.classList.add("ga-questionnaire-progress-step-completed");
    checkmark.className = "ga-questionnaire-progress-checkmark";
    checkmark.textContent = "✓";
    checkmark.setAttribute("aria-hidden", "true");
    indicator.append(checkmark);
  } else if (isActive) {
    item.classList.add("ga-questionnaire-progress-step-active");
    item.setAttribute("aria-current", "step");
  }

  return item;
}

export function createProgress({ steps, currentStep }) {
  const navigation = document.createElement("nav");
  const list = document.createElement("ol");

  navigation.className = "ga-questionnaire-progress";
  navigation.setAttribute("aria-label", "Questionnaire progress");
  list.className = "ga-questionnaire-progress-list";

  steps.forEach((step, index) => {
    list.append(createProgressStep({ step, index, currentStep }));
  });

  navigation.append(list);
  return navigation;
}

export { styles };
