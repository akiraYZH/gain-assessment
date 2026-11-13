const MIN_PREFIX_MATCH_LENGTH = 8;

export function normalizeText(value) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

export function normalizeMatchValue(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function labelsMatch(firstLabel, secondLabel) {
  const first = normalizeMatchValue(firstLabel);
  const second = normalizeMatchValue(secondLabel);
  const shortestLength = Math.min(first.length, second.length);

  return (
    first === second ||
    (shortestLength >= MIN_PREFIX_MATCH_LENGTH &&
      (first.startsWith(second) || second.startsWith(first)))
  );
}

export function getLastPathSegment(url) {
  const pathParts = new URL(url, window.location.href).pathname
    .split("/")
    .filter(Boolean);

  return pathParts.at(-1) ?? "";
}

export function getContentCardData(card) {
  const link = card.querySelector(".content-card__link");
  const image = card.querySelector(".content-card__image");

  const getImageUrl = () => {
    if (!image) return "";

    const encodedUrl = image.getAttribute("data-u");
    const placeholderUrl = [image.currentSrc, image.src].find((url) =>
      url?.startsWith("data:image/svg+xml"),
    );
    let decodedUrl = "";
    let placeholderImageUrl = "";

    if (encodedUrl) {
      try {
        decodedUrl = decodeURIComponent(encodedUrl);
      } catch {
        decodedUrl = encodedUrl;
      }
    }

    if (placeholderUrl) {
      try {
        const [, metadata, data] = placeholderUrl.match(
          /^data:image\/svg\+xml(;base64)?,(.*)$/,
        );
        const svg = metadata ? window.atob(data) : decodeURIComponent(data);
        const embeddedUrl = svg.match(/\bdata-u=["']([^"']+)["']/)?.[1];

        if (embeddedUrl) {
          placeholderImageUrl = decodeURIComponent(embeddedUrl);
        }
      } catch {
        placeholderImageUrl = "";
      }
    }

    const candidates = [
      image.currentSrc,
      image.src,
      image.getAttribute("data-src"),
      image.getAttribute("data-lazy-src"),
      decodedUrl,
      placeholderImageUrl,
    ].filter(Boolean);

    return (
      candidates.find((url) => !url.startsWith("data:image/svg+xml")) ??
      candidates[0] ??
      ""
    );
  };

  return {
    title: normalizeText(
      card.querySelector(".content-card__title")?.textContent ??
        link?.textContent,
    ),
    href: link?.href ?? "",
    image: getImageUrl(),
    tags: [...card.querySelectorAll(".content-tags li")].map((tag) =>
      normalizeText(tag.textContent),
    ),
  };
}

export function decodeCloudflareEmail(encodedEmail) {
  const key = Number.parseInt(encodedEmail.slice(0, 2), 16);
  let email = "";

  for (let index = 2; index < encodedEmail.length; index += 2) {
    const characterCode = Number.parseInt(
      encodedEmail.slice(index, index + 2),
      16,
    );
    email += String.fromCharCode(characterCode ^ key);
  }

  return email;
}
