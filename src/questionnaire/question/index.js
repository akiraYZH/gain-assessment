import styles from "./question.css";

function createOption({ questionId, option, selected, multiple, onChange }) {
  const optionId = `gain-questionnaire-${questionId}-${option.id}`;
  const label = document.createElement("label");

  label.className = "ga-questionnaire-option";
  label.htmlFor = optionId;
  label.innerHTML = `
    <input class="ga-questionnaire-option-input" />
    <div class="ga-questionnaire-option-text">
      <span class="ga-questionnaire-option-title"></span>
      <span class="ga-questionnaire-option-description"></span>
    </div>
  `;

  const input = label.querySelector(".ga-questionnaire-option-input");
  const title = label.querySelector(".ga-questionnaire-option-title");
  const description = label.querySelector(
    ".ga-questionnaire-option-description",
  );

  if (!input || !title || !description) {
    throw new Error("Question option elements were not created.");
  }

  input.id = optionId;
  input.type = multiple ? "checkbox" : "radio";
  input.name = questionId;
  input.value = option.id;
  input.checked = selected.has(option.id);
  input.addEventListener("change", () => {
    onChange(option.id, input.checked);
  });

  title.textContent = option.label;

  if (option.description) {
    description.textContent = option.description;
  } else {
    description.remove();
  }

  return label;
}

export function createQuestion({
  id,
  title,
  options,
  selected,
  multiple,
  onChange,
}) {
  const fieldset = document.createElement("fieldset");
  const legend = document.createElement("legend");
  const optionList = document.createElement("div");

  fieldset.className = "ga-questionnaire-question";
  legend.className = "ga-questionnaire-question-title";
  legend.textContent = title;
  optionList.className = "ga-questionnaire-option-list";

  for (const option of options) {
    optionList.append(
      createOption({
        questionId: id,
        option,
        selected,
        multiple,
        onChange,
      }),
    );
  }

  fieldset.append(legend, optionList);
  return fieldset;
}

export { styles };
