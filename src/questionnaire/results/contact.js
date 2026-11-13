import { createSection } from "./utils.js";

export function createContactSection(contact) {
  const section = createSection("Talk to our team");
  const description = document.createElement("p");
  const link = document.createElement("a");

  section.classList.add("ga-questionnaire-results-contact");
  description.textContent =
    "Tell us what you’re working on and we’ll help you find the next step.";
  link.className = "ga-questionnaire-results-email";
  link.href = contact.href;
  link.textContent = contact.email;
  section.append(description, link);
  return section;
}
