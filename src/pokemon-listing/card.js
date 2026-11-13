import { formatPokemonLabel } from "./utils.js";

function togglePokemonCard(shell, pokemonName) {
  const isFlipped = shell.classList.toggle("ga-pokemon-card-flipped");
  const front = shell.querySelector(".ga-pokemon-card-front");
  const back = shell.querySelector(".ga-pokemon-card-back");

  shell.setAttribute("aria-pressed", String(isFlipped));
  shell.setAttribute(
    "aria-label",
    `${isFlipped ? "Show front of" : "Show details for"} ${pokemonName}`,
  );
  front?.setAttribute("aria-hidden", String(isFlipped));
  back?.setAttribute("aria-hidden", String(!isFlipped));
}

function enableCardFlip(shell, pokemonName) {
  if (shell.dataset.gaFlipReady === "true") return;

  shell.dataset.gaFlipReady = "true";
  shell.setAttribute("role", "button");
  shell.setAttribute("tabindex", "0");
  shell.setAttribute("aria-pressed", "false");
  shell.setAttribute("aria-label", `Show details for ${pokemonName}`);

  shell.addEventListener("click", () => {
    togglePokemonCard(shell, pokemonName);
  });

  shell.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    togglePokemonCard(shell, pokemonName);
  });
}

// Replaces the original article content with a skeleton while Pokémon data loads.
export function preparePokemonCard(card, pokemonId) {
  const currentPokemonId = Number.parseInt(card.dataset.gaPokemonId, 10);
  const currentShell = card.querySelector(":scope > .ga-pokemon-card-shell");

  if (currentPokemonId === pokemonId && currentShell) return;

  currentShell?.remove();

  const shell = document.createElement("div");

  shell.className = "ga-pokemon-card-shell ga-pokemon-card-loading";
  shell.setAttribute("aria-busy", "true");
  shell.innerHTML = `
    <div
      class="listing-box__media listing-box__media--news ga-pokemon-card-image-skeleton"
      aria-hidden="true"
    ></div>
    <span class="ga-pokemon-card-number"></span>
    <h2
      class="listing-box__title has-inter-tight-font-family has-body-xl-font-size"
    >
      <span class="ga-pokemon-card-name-skeleton" aria-hidden="true"></span>
    </h2>
    <ul class="content-tags ga-pokemon-card-type-skeletons" aria-hidden="true">
      <li><span></span></li>
      <li><span></span></li>
    </ul>
    <span class="ga-pokemon-card-loading-text"></span>
  `;

  const number = shell.querySelector(".ga-pokemon-card-number");
  const loadingText = shell.querySelector(".ga-pokemon-card-loading-text");

  if (!number || !loadingText) {
    throw new Error("Pokémon card skeleton was not created.");
  }

  number.textContent = `#${String(pokemonId).padStart(3, "0")}`;
  loadingText.textContent = `Loading Pokémon #${pokemonId}`;

  card.classList.add("ga-pokemon-card");
  card.dataset.gaPokemonId = String(pokemonId);
  card.append(shell);
}

// Replaces the skeleton with the completed, flippable Pokémon card.
export function renderPokemonCard(card, pokemon) {
  const shell = card.querySelector(":scope > .ga-pokemon-card-shell");

  if (!shell) return;
  if (
    shell.classList.contains("ga-pokemon-card-loaded") &&
    card.dataset.gaPokemonId === String(pokemon.id)
  ) {
    return;
  }

  shell.className = "ga-pokemon-card-shell ga-pokemon-card-loaded";
  shell.setAttribute("aria-busy", "false");
  shell.innerHTML = `
    <div class="ga-pokemon-card-flipper">
      <div class="ga-pokemon-card-face ga-pokemon-card-front" aria-hidden="false">
        <div class="listing-box__media listing-box__media--news ga-pokemon-card-media">
          <img class="listing-box__image ga-pokemon-card-image" loading="lazy" />
        </div>
        <span class="ga-pokemon-card-number"></span>
        <h2
          class="listing-box__title has-inter-tight-font-family has-body-xl-font-size ga-pokemon-card-name"
        ></h2>
        <ul class="content-tags ga-pokemon-card-types"></ul>
        <span class="ga-pokemon-card-flip-hint">View details</span>
      </div>
      <div class="ga-pokemon-card-face ga-pokemon-card-back" aria-hidden="true">
        <span class="ga-pokemon-card-number"></span>
        <h2
          class="listing-box__title has-inter-tight-font-family has-body-xl-font-size ga-pokemon-card-back-name"
        ></h2>
        <dl class="ga-pokemon-card-details">
          <div>
            <dt>Height</dt>
            <dd class="ga-pokemon-card-height"></dd>
          </div>
          <div>
            <dt>Weight</dt>
            <dd class="ga-pokemon-card-weight"></dd>
          </div>
          <div>
            <dt>Abilities</dt>
            <dd class="ga-pokemon-card-abilities"></dd>
          </div>
          <div>
            <dt>Base experience</dt>
            <dd class="ga-pokemon-card-experience"></dd>
          </div>
        </dl>
        <span class="ga-pokemon-card-flip-hint">Back to Pokémon</span>
      </div>
    </div>
  `;

  const image = shell.querySelector(".ga-pokemon-card-image");
  const name = shell.querySelector(".ga-pokemon-card-name");
  const types = shell.querySelector(".ga-pokemon-card-types");
  const pokemonName = formatPokemonLabel(pokemon.name);

  if (!image || !name || !types) {
    throw new Error("Pokémon card elements were not created.");
  }

  image.src = pokemon.image;
  image.alt = pokemonName;
  name.textContent = pokemonName;

  shell.querySelectorAll(".ga-pokemon-card-number").forEach((number) => {
    number.textContent = `#${String(pokemon.id).padStart(3, "0")}`;
  });
  shell.querySelector(".ga-pokemon-card-back-name").textContent = pokemonName;
  shell.querySelector(".ga-pokemon-card-height").textContent =
    `${pokemon.height / 10} m`;
  shell.querySelector(".ga-pokemon-card-weight").textContent =
    `${pokemon.weight / 10} kg`;
  shell.querySelector(".ga-pokemon-card-abilities").textContent =
    pokemon.abilities.map(formatPokemonLabel).join(", ");
  shell.querySelector(".ga-pokemon-card-experience").textContent =
    String(pokemon.baseExperience ?? "Unknown");

  pokemon.types.forEach((type) => {
    const typeTag = document.createElement("li");

    typeTag.textContent = formatPokemonLabel(type);
    types.append(typeTag);
  });

  enableCardFlip(shell, pokemonName);
}

export function renderPokemonError(card, pokemonId) {
  const shell = card.querySelector(":scope > .ga-pokemon-card-shell");

  if (!shell) return;

  shell.className = "ga-pokemon-card-shell ga-pokemon-card-error";
  shell.setAttribute("aria-busy", "false");
  shell.innerHTML = `
    <div class="listing-box__media listing-box__media--news ga-pokemon-card-error-media">
      <span aria-hidden="true">!</span>
    </div>
    <span class="ga-pokemon-card-number"></span>
    <h2
      class="listing-box__title has-inter-tight-font-family has-body-xl-font-size"
    >Unable to load Pokémon</h2>
    <p class="listing-box__excerpt has-body-xs-font-size">
      Please try changing page and coming back.
    </p>
  `;

  const number = shell.querySelector(".ga-pokemon-card-number");

  if (!number) {
    throw new Error("Pokémon error card was not created.");
  }

  number.textContent = `#${String(pokemonId).padStart(3, "0")}`;
}
