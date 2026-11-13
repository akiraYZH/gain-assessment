const POKEMON_API_URL = "https://pokeapi.co/api/v2/pokemon";
const pokemonRequests = new Map();

function normalizePokemon(pokemon) {
  return {
    id: pokemon.id,
    name: pokemon.name,
    image:
      pokemon.sprites.other?.home?.front_default ??
      pokemon.sprites.front_default ??
      "",
    types: [...pokemon.types]
      .sort((first, second) => first.slot - second.slot)
      .map(({ type }) => type.name),
    height: pokemon.height,
    weight: pokemon.weight,
    abilities: pokemon.abilities.map(({ ability }) => ability.name),
    baseExperience: pokemon.base_experience,
  };
}

async function fetchPokemon(pokemonId) {
  const response = await fetch(`${POKEMON_API_URL}/${pokemonId}`);

  if (!response.ok) {
    throw new Error(`PokéAPI returned ${response.status} for #${pokemonId}.`);
  }

  return normalizePokemon(await response.json());
}

export function getPokemon(pokemonId) {
  if (!pokemonRequests.has(pokemonId)) {
    const request = fetchPokemon(pokemonId).catch((error) => {
      pokemonRequests.delete(pokemonId);
      throw error;
    });

    pokemonRequests.set(pokemonId, request);
  }

  return pokemonRequests.get(pokemonId);
}
