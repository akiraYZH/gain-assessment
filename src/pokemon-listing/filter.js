import { formatPokemonLabel } from "./utils.js";

const FILTERS_SELECTOR = '[data-behaviour="listing-filters"]';
const ARTICLE_CARD_SELECTOR = ".listing-box";
const TYPE_FILTER_CLASS = "ga-pokemon-type-filter";
const POKEMON_TYPES = [
  "normal",
  "fighting",
  "flying",
  "poison",
  "ground",
  "rock",
  "bug",
  "ghost",
  "steel",
  "fire",
  "water",
  "grass",
  "electric",
  "psychic",
  "ice",
  "dragon",
  "dark",
  "fairy",
];

let selectedType = "";

function getEmptyMessage(listing) {
  let message = document.querySelector(".ga-pokemon-empty-message");

  if (message) return message;

  message = document.createElement("p");
  message.className = "ga-pokemon-empty-message";
  message.hidden = true;

  const pagination = listing.querySelector(":scope > nav");

  if (pagination) {
    listing.insertBefore(message, pagination);
  } else {
    listing.append(message);
  }

  return message;
}

// Shows only cards matching the selected Pokémon type on the current page.
export function applyPokemonTypeFilter(listing) {
  const cards = [...listing.querySelectorAll(ARTICLE_CARD_SELECTOR)];
  const emptyMessage = getEmptyMessage(listing);
  let visibleCardCount = 0;
  let pendingCardCount = 0;

  cards.forEach((card) => {
    const status = card.dataset.gaPokemonStatus;
    const pokemonTypes = (card.dataset.gaPokemonTypes ?? "").split(" ");

    if (status === "loading") {
      pendingCardCount += 1;
    }

    const matchesType =
      !selectedType ||
      (status === "loaded" && pokemonTypes.includes(selectedType));

    card.hidden = !matchesType;

    if (matchesType) visibleCardCount += 1;
  });

  const showEmptyMessage =
    Boolean(selectedType) && pendingCardCount === 0 && visibleCardCount === 0;

  emptyMessage.hidden = !showEmptyMessage;
  emptyMessage.textContent = showEmptyMessage
    ? `No ${formatPokemonLabel(selectedType)} Pokémon appear on this page.`
    : "";
}

// Replaces the capability filter with a type filter and restores its selection.
export function setupPokemonTypeFilter(listing) {
  const filters = document.querySelector(FILTERS_SELECTOR);

  if (!filters) return;

  filters.classList.add("ga-pokemon-filters");

  const existingFilter = filters.querySelector(`.${TYPE_FILTER_CLASS}`);

  if (existingFilter) {
    existingFilter.value = selectedType;
    return;
  }

  const typeFilter = document.createElement("select");

  typeFilter.className = TYPE_FILTER_CLASS;
  typeFilter.name = "pokemon_type";
  typeFilter.setAttribute("aria-label", "Filter Pokémon by type");
  typeFilter.innerHTML = `
    <option value="">Filter by type</option>
    ${POKEMON_TYPES.map(
      (type) => `<option value="${type}">${formatPokemonLabel(type)}</option>`,
    ).join("")}
  `;
  typeFilter.value = selectedType;
  typeFilter.addEventListener("change", () => {
    selectedType = typeFilter.value;
    applyPokemonTypeFilter(listing);
  });

  const filterDropdown = filters.querySelector(".filter-dropdown") ?? filters;
  const capabilityFilter = filters.querySelector('select[name="capability"]');

  if (capabilityFilter) {
    capabilityFilter.insertAdjacentElement("afterend", typeFilter);
  } else {
    filterDropdown.append(typeFilter);
  }
}
