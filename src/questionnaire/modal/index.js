import styles from "./modal.css";

const MODAL_ID = "gain-questionnaire-modal";

export function createQuestionnaireModal() {
  const dialog = document.createElement("dialog");
  dialog.id = MODAL_ID;
  dialog.className = "ga-questionnaire-modal";
  dialog.setAttribute("aria-labelledby", "gain-questionnaire-modal-title");
  dialog.setAttribute("data-lenis-prevent", "");
  dialog.innerHTML = `
    <header class="ga-questionnaire-modal-header">
      <h2 id="gain-questionnaire-modal-title" class="ga-questionnaire-modal-title">
        Questionnaire
      </h2>
      <button
        class="ga-questionnaire-modal-close"
        type="button"
        aria-label="Close questionnaire"
      >
        &times;
      </button>
    </header>
    <div class="ga-questionnaire-modal-progress"></div>
    <div class="ga-questionnaire-modal-content"></div>
    <footer class="ga-questionnaire-modal-actions"></footer>
  `;

  dialog
    .querySelector(".ga-questionnaire-modal-close")
    .addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;

    const bounds = dialog.getBoundingClientRect();
    const clickedOutside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (clickedOutside) dialog.close();
  });

  document.body.append(dialog);
  return dialog;
}

export { styles };
