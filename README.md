# GAIN Take-Home Assessment

The project builds a native JavaScript IIFE bundle that can be pasted directly into the browser DevTools Console. The entry point is safe to run more than once on the same page.

## Project structure

- `src/main.js`: The single entry point. It prevents duplicate initialization and injects all CSS.
- `src/data.js`: Reads homepage data shared by Tasks 1 and 2 from the GAIN DOM.
- `src/utils.js`: Utilities shared across tasks, including text matching and image parsing.
- `src/questionnaire/index.js`: The Task 1 entry point.
- `src/questionnaire/styles.css`: The questionnaire-level CSS entry point.
- `src/questionnaire/cta/index.js`: Creates the complete questionnaire CTA section.
- `src/questionnaire/cta/cta.css`: Styles the CTA section and the five button states.
- `src/questionnaire/cta/Jersey15-Regular.woff2`: The button font, inlined into the bundle as a data URL during the build.
- `src/questionnaire/cta/OFL.txt`: The SIL Open Font License for Jersey 15.
- `src/questionnaire/modal/index.js`: Creates the native dialog and handles its close button and backdrop.
- `src/questionnaire/modal/modal.css`: Styles the modal, backdrop and responsive layouts.
- `src/questionnaire/question/index.js`: Creates reusable question and option elements.
- `src/questionnaire/question/question.css`: Styles questions, checkboxes and selected states.
- `src/footer-drawer/index.js`: Creates the drawer and handles its toggle, overlay and close behaviour.
- `src/footer-drawer/slider.js`: Handles pagination, arrow controls, responsive calculations and mouse dragging.
- `src/footer-drawer/slide.js`: Creates and populates case-study slides from homepage data.
- `src/footer-drawer/tooltip.js`: Handles tooltip visibility, positioning, edge detection and position updates.
- `src/footer-drawer/drawer.css`: Styles the drawer, slider, slides and responsive layouts.
- `src/pokemon-listing/index.js`: The Task 3 entry point. It reads the current page and coordinates React listing updates.
- `src/pokemon-listing/api.js`: Fetches and caches Pokémon data from PokéAPI.
- `src/pokemon-listing/card.js`: Creates Pokémon skeletons, front and back content, and flip interactions.
- `src/pokemon-listing/filter.js`: Replaces the capability filter with a Pokémon type filter and handles empty results.
- `src/pokemon-listing/utils.js`: Text-formatting utilities shared within Task 3.
- `src/pokemon-listing/observer.js`: Observes React listing replacements and schedules Task 3 updates.
- `src/pokemon-listing/pokemon-listing.css`: Styles Pokémon cards, skeletons and responsive layouts.
- `tests/smoke.test.mjs`: Runs browser smoke tests for all three tasks, filtering, pagination and repeated injection.
- `dist/main.js`: The final bundle that can be pasted directly into the Console.
- `dist/styles.css`: The complete stylesheet, available for separate injection into `<head>`.

## Build and check

```bash
npm install
npm run build
npm run check
```

`npm run check` builds both deliverables and runs the Playwright smoke tests in an installed Google Chrome browser.

## Development watch mode

```bash
npm run dev
```

This command watches the JavaScript and CSS files imported by the entry point under `src/`. Saving a file automatically rebuilds `dist/main.js`. Press `Ctrl+C` to stop watching. It does not refresh the browser automatically; refresh the GAIN page and paste the latest bundle again.

## Injection

Paste the complete contents of `dist/main.js` into the DevTools Console. The first run injects a `<style>` element with a fixed ID and sets `window.__GAIN_ASSESSMENT__`. Later runs detect this flag and exit without initializing the application again. The bundle can also run at `document-start`; it waits for the required page DOM before initializing.

`dist/styles.css` contains the same complete stylesheet for separate injection into the page `<head>`. It is not required when using the default `dist/main.js` bundle because the bundle injects the CSS automatically.

## Take-home checklist

### All tasks

- [x] Safe to run more than once on the same page (no duplicate sections, drawers or cards)

### 1. Dynamic Modal: Questionnaire (https://www.thisisgain.com/)

- [x] Uses Flex or Grid CSS
- [x] Works on desktop, tablet and mobile (down to 375px)
- [x] Nothing is hardcoded: options, case studies, articles and the email are read from the homepage
- [x] New section under the hero: header, paragraph and button
- [x] Button UI states match Figure 1 (CSS only)
- [x] Button opens a modal
- [x] 4 question steps + a results step
- [x] Service options match the "Solutions" menu and industry options match "Our Sectors"
- [x] Questions 1 and 2 allow more than one answer, questions 3 and 4 allow one
- [x] Results heading changes with question 4
- [x] Results content changes with question 3 (case studies, articles or email)
- [x] Exact matches first, topped up with labelled related ones (max 3, in slider order), plus the "none" message
- [x] "Right away" always shows the email at the top (only once with "Talk to someone")
- [x] "Talk to someone" + "Just exploring" also shows the 3 latest articles
- [x] Summary of the question 1 and 2 picks, with a way to go back and change them
- [x] Case studies and articles link to their real pages
- [x] Progress bar with active (blue, bold), completed (blue + green checkmark) and next (white) states
- [x] Can't go to the next step until the current one is answered
- [x] Can go back, change an answer, and the results update

### 2. Footer Drawer (https://www.thisisgain.com/)

- [x] Uses Flex or Grid CSS
- [x] Works on desktop, tablet and mobile (down to 375px)
- [x] Sticky drawer at the bottom of the page
- [x] Tab toggles the drawer on/off
- [x] Chevron rotates 180 degrees on toggle
- [x] Drawer slides in and out from the bottom
- [x] Page count and arrow buttons when the drawer is open
- [x] Overlay on the page, and clicking it closes the drawer
- [x] Drawer closes automatically at the bottom of the page
- [x] One slide per case study, read from the "Work" slider (nothing hardcoded or fetched)
- [x] Each slide has an image, header, industry tag with tooltip, service description and link
- [x] Slider is draggable and swipeable on smaller viewports
- [x] Tooltip matches Figure 5 and handles small screens or tight space
- [x] 4+ slides on desktop, 2+ on tablet, 1 on mobile

### 3. SPA DOM Manipulation (https://www.thisisgain.com/blog/)

- [x] Uses Flex or Grid CSS
- [x] Works on desktop, tablet and mobile (down to 375px)
- [x] Every article card shows a Pokémon (image, name, types) based on its position
- [x] No article content flashes before the Pokémon appear (paging and filtering too)
- [x] Pokémon numbers follow the page (page 2 starts at #13)
- [x] "Filter by Tags" hidden, and "Filter by type" lists the 18 regular types and filters the current page, with an empty message
- [x] The chosen type stays selected when changing pages
- [x] Clicking a Pokémon card flips it to show more details, and still works after paging or filtering
- [x] All changes persist through the type filter and paging

### Bonus

- [x] [Bonus] Animations where they improve the experience
- [x] [Bonus] Works when it runs before the page has finished loading
