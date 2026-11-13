const RESULT_HEADINGS = {
  "right-away": "Let’s talk this week",
  "next-three-months": "Here’s where to start",
  exploring: "Take your time",
};

export function createResultsHeading(timeline) {
  const heading = document.createElement("h2");

  heading.className = "ga-questionnaire-results-title";
  heading.textContent = RESULT_HEADINGS[timeline];
  return heading;
}
