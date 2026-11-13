import styles from "./progress.css";

function createProgressStep({ step, index, onStepClick }) {
  const item = document.createElement("li");

  item.className = "ga-questionnaire-progress-step";
  item.innerHTML = `
    <button class="ga-questionnaire-progress-step-button" type="button">
      <span class="ga-questionnaire-progress-indicator">
        ${index + 1}
        <span class="ga-questionnaire-progress-checkmark" aria-hidden="true">✓</span>
      </span>
      <span class="ga-questionnaire-progress-label"></span>
    </button>
  `;

  const button = item.querySelector(".ga-questionnaire-progress-step-button");
  const label = item.querySelector(".ga-questionnaire-progress-label");

  if (!button || !label) {
    throw new Error("Questionnaire progress step elements were not created.");
  }

  label.textContent = step;
  button.addEventListener("click", () => onStepClick(index));

  return item;
}

export function createProgress({ steps, onStepClick }) {
  const navigation = document.createElement("nav");
  const list = document.createElement("ol");

  navigation.className = "ga-questionnaire-progress";
  navigation.setAttribute("aria-label", "Questionnaire progress");
  list.className = "ga-questionnaire-progress-list";

  steps.forEach((step, index) => {
    list.append(createProgressStep({ step, index, onStepClick }));
  });

  navigation.append(list);
  return navigation;
}

export function updateProgress(navigation, currentStep) {
  const steps = navigation.querySelectorAll(
    ".ga-questionnaire-progress-step",
  );

  steps.forEach((step, index) => {
    const button = step.querySelector(
      ".ga-questionnaire-progress-step-button",
    );
    const label = step.querySelector(".ga-questionnaire-progress-label");
    const isCompleted = index < currentStep;
    const isActive = index === currentStep;

    if (!button || !label) {
      throw new Error("Questionnaire progress step elements were not found.");
    }

    step.classList.toggle(
      "ga-questionnaire-progress-step-completed",
      isCompleted,
    );
    step.classList.toggle("ga-questionnaire-progress-step-active", isActive);
    button.disabled = !isCompleted;

    if (isCompleted) {
      button.setAttribute("aria-label", `Go back to ${label.textContent}`);
    } else {
      button.removeAttribute("aria-label");
    }

    if (isActive) {
      step.setAttribute("aria-current", "step");
    } else {
      step.removeAttribute("aria-current");
    }
  });
}

export { styles };
