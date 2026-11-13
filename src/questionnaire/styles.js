import questionnaireStyles from "./styles.css";
import { styles as ctaStyles } from "./cta/index.js";
import { styles as modalStyles } from "./modal/index.js";
import { styles as progressStyles } from "./progress/index.js";
import { styles as questionStyles } from "./question/index.js";
import { styles as resultsStyles } from "./results/index.js";

export const styles = [
  questionnaireStyles,
  ctaStyles,
  modalStyles,
  questionStyles,
  progressStyles,
  resultsStyles,
].join("\n");
