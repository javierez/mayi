/**
 * Standardizes city names to proper Spanish title case
 * Example: "chozas de abajo" -> "Chozas de Abajo"
 */

// Spanish articles and prepositions that should remain lowercase
const LOWERCASE_WORDS = new Set([
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "y",
  "e",
  "o",
  "u",
  "a",
  "al",
]);

/**
 * Capitalizes the first letter of a word
 */
function capitalizeWord(word: string): string {
  if (word.length === 0) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Formats a city name to proper Spanish title case
 * @param cityName - The city name to format
 * @returns Properly formatted city name
 */
export function formatCityName(cityName: string): string {
  if (!cityName || cityName.trim().length === 0) {
    return cityName;
  }

  // Split by spaces and filter empty strings
  const words = cityName.trim().split(/\s+/);

  const formattedWords = words.map((word, index) => {
    // Always capitalize the first word
    if (index === 0) {
      return capitalizeWord(word);
    }

    // Check if word contains a hyphen (e.g., "Villanueva-de-la-Serena")
    if (word.includes("-")) {
      return word
        .split("-")
        .map((part, partIndex) => {
          // First part of hyphenated word is always capitalized
          if (partIndex === 0) {
            return capitalizeWord(part);
          }
          // Rest follow the lowercase words rule
          return LOWERCASE_WORDS.has(part.toLowerCase())
            ? part.toLowerCase()
            : capitalizeWord(part);
        })
        .join("-");
    }

    // Check if it's a lowercase word (article/preposition)
    if (LOWERCASE_WORDS.has(word.toLowerCase())) {
      return word.toLowerCase();
    }

    // Otherwise, capitalize it
    return capitalizeWord(word);
  });

  return formattedWords.join(" ");
}

/**
 * Formats multiple city names
 */
export function formatCityNames(cityNames: string[]): string[] {
  return cityNames.map(formatCityName);
}
