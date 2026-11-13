import { createQuestionnaireCta } from "./cta/index.js";
import { createQuestionnaireModal } from "./modal/index.js";
import {
  readArticlesFromPage,
  readCaseStudiesFromPage,
  readFooterEmailFromPage,
  readIndustriesFromPage,
  readServicesFromPage,
  readWorkUrlFromPage,
} from "../data.js";

import { createQuestion } from "./question/index.js";
import { createProgress } from "./progress/index.js";
import { createResults } from "./results/index.js";
import { setPageScrollLocked } from "./scroll-lock.js";
import { styles } from "./styles.js";

function renderQuestionStep({
  modal,
  content,
  actions,
  backButton,
  questions,
  resultsData,
  state,
}) {
  const nextButton = document.createElement("button");
  nextButton.className = "ga-questionnaire-modal-next";
  nextButton.type = "button";
  nextButton.textContent =
    state.currentStep === questions.length - 1 ? "See results" : "Next";
  nextButton.addEventListener("click", () => {
    state.currentStep += 1;
    renderCurrentStep({ modal, questions, resultsData, state });
  });

  const updateNextButton = () => {
    nextButton.disabled = selectedAnswers.size === 0;
  };

  // render questions
  const questionConfig = questions[state.currentStep];
  const selectedAnswers = state.answers[questionConfig.id];
  const question = createQuestion({
    id: questionConfig.id,
    title: questionConfig.title,
    options: questionConfig.options,
    selected: selectedAnswers,
    multiple: questionConfig.multiple,
    onChange(optionId, checked) {
      if (checked) {
        if (!questionConfig.multiple) {
          selectedAnswers.clear();
        }

        selectedAnswers.add(optionId);
      } else {
        selectedAnswers.delete(optionId);
      }

      updateNextButton();
    },
  });

  updateNextButton();
  content.replaceChildren(question);
  modal.scrollTop = 0;

  if (state.currentStep === 0) {
    actions.replaceChildren(nextButton);
  } else {
    actions.replaceChildren(backButton, nextButton);
  }
}

function renderResultsStep({
  modal,
  content,
  actions,
  backButton,
  questions,
  resultsData,
  state,
}) {
  const results = createResults({
    answers: state.answers,
    questions,
    ...resultsData,
    onEdit(stepIndex) {
      state.currentStep = stepIndex;
      renderCurrentStep({ modal, questions, resultsData, state });
    },
  });

  content.replaceChildren(results);
  actions.replaceChildren(backButton);
  modal.scrollTop = 0;
}

function renderCurrentStep({ modal, questions, resultsData, state }) {
  const content = modal.querySelector(".ga-questionnaire-modal-content");
  const actions = modal.querySelector(".ga-questionnaire-modal-actions");
  const progress = modal.querySelector(".ga-questionnaire-modal-progress");

  if (!content || !actions || !progress) {
    throw new Error("Questionnaire modal content containers were not found.");
  }

  // progress bar
  progress.replaceChildren(
    createProgress({
      steps: [...questions.map((question) => question.stepLabel), "Results"],
      currentStep: state.currentStep,
    }),
  );

  // back button
  const backButton = document.createElement("button");
  backButton.className = "ga-questionnaire-modal-back";
  backButton.type = "button";
  backButton.textContent = "Back";
  backButton.addEventListener("click", () => {
    state.currentStep -= 1;
    renderCurrentStep({ modal, questions, resultsData, state });
  });

  const renderStep =
    state.currentStep === questions.length
      ? renderResultsStep
      : renderQuestionStep;

  renderStep({
    modal,
    content,
    actions,
    backButton,
    questions,
    resultsData,
    state,
  });
}

// Questionnaire
function createQuestionnaire() {
  const cta = createQuestionnaireCta();
  let modal;

  const state = {
    currentStep: 0,
    answers: {
      services: new Set(),
      industries: new Set(),
      usefulness: new Set(),
      timeline: new Set(),
    },
  };

  try {
    const questions = [
      {
        id: "services",
        stepLabel: "Services",
        title: "What do you need help with?",
        options: readServicesFromPage(),
        multiple: true,
      },
      {
        id: "industries",
        stepLabel: "Industry",
        title: "Which industry are you in?",
        options: readIndustriesFromPage(),
        multiple: true,
      },
      {
        id: "usefulness",
        stepLabel: "Useful now",
        title: "What would be most useful right now?",
        options: [
          {
            id: "case-studies",
            label: "Case studies like mine",
          },
          {
            id: "articles",
            label: "Articles to read",
          },
          {
            id: "contact",
            label: "Talk to someone",
          },
        ],
        multiple: false,
      },
      {
        id: "timeline",
        stepLabel: "Timeline",
        title: "When are you looking to start?",
        options: [
          {
            id: "right-away",
            label: "Right away",
          },
          {
            id: "next-three-months",
            label: "In the next 3 months",
          },
          {
            id: "exploring",
            label: "Just exploring",
          },
        ],
        multiple: false,
      },
    ];

    const trigger = cta.querySelector(".ga-questionnaire-cta-button");

    if (!trigger) {
      throw new Error("Questionnaire trigger button was not found.");
    }

    const resultsData = {
      articles: readArticlesFromPage(),
      caseStudies: readCaseStudiesFromPage(),
      contact: readFooterEmailFromPage(),
      workUrl: readWorkUrlFromPage(),
    };

    modal = createQuestionnaireModal();

    renderCurrentStep({ modal, questions, resultsData, state });

    trigger.addEventListener("click", () => {
      if (modal.open) return;

      modal.showModal();
      setPageScrollLocked(true);
    });

    modal.addEventListener("close", () => {
      setPageScrollLocked(false);
      trigger.focus();
    });
    return [cta, modal];
  } catch (error) {
    cta.remove();
    modal?.remove();
    throw error;
  }
}

export { createQuestionnaire, styles };
