import styles from "./results.css";
import { createArticlesSection } from "./articles.js";
import { createCaseStudiesSection } from "./case-studies.js";
import { createContactSection } from "./contact.js";
import { createResultsHeading } from "./heading.js";
import { createSummary } from "./summary.js";
import { getSelectedValue } from "./utils.js";

export function createResults({
  answers,
  questions,
  caseStudies,
  articles,
  contact,
  workUrl,
  onEdit,
}) {
  // get results
  const results = document.createElement("div");
  const usefulness = getSelectedValue(answers, "usefulness");
  const timeline = getSelectedValue(answers, "timeline");
  let contactShown = false;

  results.className = "ga-questionnaire-results";

  // heading
  results.append(createResultsHeading(timeline));

  const showContact = () => {
    if (contactShown) return;

    results.append(createContactSection(contact));
    contactShown = true;
  };

  // If they picked “Right away”, always show the footer email at the top,
  if (timeline === "right-away") {
    showContact();
  }

  // usefulness
  switch (usefulness) {
    case "case-studies":
      results.append(
        createCaseStudiesSection({
          answers,
          questions,
          caseStudies,
          workUrl,
        }),
      );
      break;

    case "articles": //the 3 latest articles from the “Insights” slider
      results.append(createArticlesSection(articles));
      break;

    case "contact": // show the email address from the site footer
      showContact();

      // If they picked “Talk to someone” and “Just exploring”, also show the 3
      // latest articles under the email
      if (timeline === "exploring") {
        results.append(createArticlesSection(articles));
      }
      break;

    default:
      throw new Error(`Unknown usefulness option: ${usefulness}`);
  }

  // show summary of question 1 and 2
  results.append(createSummary({ answers, questions, onEdit }));
  return results;
}

export { styles };
