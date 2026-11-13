import { getPokemon } from "./api.js";
import {
  preparePokemonCard,
  renderPokemonCard,
  renderPokemonError,
} from "./card.js";
import {
  applyPokemonTypeFilter,
  setupPokemonTypeFilter,
} from "./filter.js";
import { observeListingChanges } from "./observer.js";
import styles from "./pokemon-listing.css";

const LISTING_SELECTOR = '[data-behaviour="listing"]';
const ARTICLE_CARD_SELECTOR = ".listing-box";
const CARDS_PER_PAGE = 12;

// Prevents stale API responses from rendering into a newer listing update.
let renderVersion = 0;

// Reads the React pagination state from the URL.
function getCurrentPage() {
  const pageMatch = window.location.pathname.match(/\/page\/(\d+)\/?$/);

  return pageMatch ? Number.parseInt(pageMatch[1], 10) : 1;
}

function isCardCurrent(card, pokemonId, currentRenderVersion) {
  return (
    currentRenderVersion === renderVersion &&
    card.isConnected &&
    card.dataset.gaPokemonId === String(pokemonId)
  );
}

async function loadPokemonCard({
  card,
  pokemonId,
  listing,
  currentRenderVersion,
}) {
  let pokemon;

  try {
    pokemon = await getPokemon(pokemonId);
  } catch {
    if (!isCardCurrent(card, pokemonId, currentRenderVersion)) return;

    card.dataset.gaPokemonStatus = "error";
    renderPokemonError(card, pokemonId);
    applyPokemonTypeFilter(listing);
    return;
  }

  if (!isCardCurrent(card, pokemonId, currentRenderVersion)) return;

  card.dataset.gaPokemonStatus = "loaded";
  card.dataset.gaPokemonTypes = pokemon.types.join(" ");
  renderPokemonCard(card, pokemon);
  applyPokemonTypeFilter(listing);
}

function handleListingUpdate(listing) {
  const currentRenderVersion = ++renderVersion;
  const currentPage = getCurrentPage();
  const articleCards = [
    ...listing.querySelectorAll(ARTICLE_CARD_SELECTOR),
  ];

  listing.classList.add("ga-pokemon-listing");
  listing.dataset.gaPokemonPage = String(currentPage);
  listing.dataset.gaPokemonCardCount = String(articleCards.length);

  articleCards.forEach((card, cardIndex) => {
    const pokemonId =
      (currentPage - 1) * CARDS_PER_PAGE + cardIndex + 1;

    preparePokemonCard(card, pokemonId);
    card.dataset.gaPokemonStatus = "loading";
    delete card.dataset.gaPokemonTypes;

    loadPokemonCard({
      card,
      pokemonId,
      listing,
      currentRenderVersion,
    });
  });

  setupPokemonTypeFilter(listing);
  applyPokemonTypeFilter(listing);
}

export function createPokemonListing() {
  const listing = document.querySelector(LISTING_SELECTOR);

  if (!listing) {
    throw new Error("GAIN Blog listing was not found.");
  }

  return observeListingChanges(listing, () => handleListingUpdate(listing));
}

export { styles };
