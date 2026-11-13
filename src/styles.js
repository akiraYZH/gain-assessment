import { styles as footerDrawerStyles } from "./footer-drawer/index.js";
import { styles as pokemonListingStyles } from "./pokemon-listing/index.js";
import { styles as questionnaireStyles } from "./questionnaire/index.js";

// Shared style source for both the runtime injection and standalone CSS build.
export const styles = [
  questionnaireStyles,
  footerDrawerStyles,
  pokemonListingStyles,
].join("\n");
