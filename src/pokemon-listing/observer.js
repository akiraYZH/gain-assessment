/**
 * Runs the update once initially and whenever React replaces listing content.
 */
export function observeListingChanges(listing, onUpdate) {
  let updateRequest = null;

  const requestUpdate = () => {
    if (updateRequest !== null) return;

    updateRequest = window.requestAnimationFrame(() => {
      updateRequest = null;
      onUpdate();
    });
  };

  const observer = new MutationObserver((mutations) => {
    const listingChanged = mutations.some(
      (mutation) => {
        if (
          mutation.target.nodeType === Node.ELEMENT_NODE &&
          mutation.target.closest(".ga-pokemon-card-shell")
        ) {
          return false;
        }

        if (mutation.type === "attributes") {
          return !mutation.target.classList.contains("ga-pokemon-card");
        }

        const changedNodes = [
          ...mutation.addedNodes,
          ...mutation.removedNodes,
        ];
        const onlyPokemonShellChanged =
          changedNodes.length > 0 &&
          changedNodes.every(
            (node) =>
              node.nodeType === Node.ELEMENT_NODE &&
              (node.matches(".ga-pokemon-card-shell") ||
                node.closest(".ga-pokemon-card-shell")),
          );

        return !onlyPokemonShellChanged;
      },
    );

    if (listingChanged) requestUpdate();
  });

  onUpdate();

  observer.observe(listing, {
    attributes: true,
    attributeFilter: ["class"],
    characterData: true,
    childList: true,
    subtree: true,
  });
}
