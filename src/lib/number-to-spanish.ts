/**
 * Utility functions to convert numbers to Spanish text for legal documents
 */

const UNITS = [
  "", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
  "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete",
  "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés",
  "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"
];

const TENS = [
  "", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"
];

const HUNDREDS = [
  "", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos",
  "seiscientos", "setecientos", "ochocientos", "novecientos"
];

// Feminine forms for currency (euros is masculine, but keeping for completeness)
const _HUNDREDS_FEMININE = [
  "", "ciento", "doscientas", "trescientas", "cuatrocientas", "quinientas",
  "seiscientas", "setecientas", "ochocientas", "novecientas"
];

/**
 * Converts a number (0-999) to Spanish words
 */
function convertHundreds(num: number): string {
  if (num === 0) return "";
  if (num === 100) return "cien";
  if (num < 30) return UNITS[num] ?? "";

  if (num < 100) {
    const ten = Math.floor(num / 10);
    const unit = num % 10;
    if (unit === 0) return TENS[ten] ?? "";
    return `${TENS[ten]} y ${UNITS[unit]}`;
  }

  const hundred = Math.floor(num / 100);
  const remainder = num % 100;
  const hundredWord = HUNDREDS[hundred] ?? "";

  if (remainder === 0) {
    return hundred === 1 ? "cien" : hundredWord;
  }

  if (remainder < 30) {
    return `${hundredWord} ${UNITS[remainder]}`;
  }

  const ten = Math.floor(remainder / 10);
  const unit = remainder % 10;
  if (unit === 0) {
    return `${hundredWord} ${TENS[ten]}`;
  }
  return `${hundredWord} ${TENS[ten]} y ${UNITS[unit]}`;
}

/**
 * Converts an integer to Spanish words
 * Supports numbers from 0 to 999,999,999
 */
export function numberToSpanishWords(num: number): string {
  if (num === 0) return "cero";
  if (num < 0) return `menos ${numberToSpanishWords(Math.abs(num))}`;

  // Handle whole number
  const intNum = Math.floor(num);

  if (intNum < 1000) {
    return convertHundreds(intNum).trim();
  }

  if (intNum < 1000000) {
    const thousands = Math.floor(intNum / 1000);
    const remainder = intNum % 1000;

    let result = "";
    if (thousands === 1) {
      result = "mil";
    } else {
      result = `${convertHundreds(thousands)} mil`;
    }

    if (remainder > 0) {
      result += ` ${convertHundreds(remainder)}`;
    }

    return result.trim();
  }

  // Millions
  const millions = Math.floor(intNum / 1000000);
  const remainder = intNum % 1000000;

  let result = "";
  if (millions === 1) {
    result = "un millón";
  } else {
    result = `${convertHundreds(millions)} millones`;
  }

  if (remainder > 0) {
    result += ` ${numberToSpanishWords(remainder)}`;
  }

  return result.trim();
}

/**
 * Converts a percentage to Spanish text
 * Examples:
 * - 3 → "TRES POR CIENTO"
 * - 3.5 → "TRES CON CINCO POR CIENTO"
 * - 100 → "CIEN POR CIENTO"
 */
export function percentageToSpanish(percent: number): string {
  const intPart = Math.floor(percent);
  const decimalPart = Math.round((percent - intPart) * 10);

  let result = numberToSpanishWords(intPart);

  if (decimalPart > 0) {
    result += ` con ${numberToSpanishWords(decimalPart)}`;
  }

  result += " por ciento";

  return result.toUpperCase();
}

/**
 * Converts a currency amount to Spanish text
 * Examples:
 * - 600 → "SEISCIENTOS EUROS"
 * - 1500 → "MIL QUINIENTOS EUROS"
 * - 1000000 → "UN MILLÓN DE EUROS"
 */
export function currencyToSpanish(amount: number): string {
  const intAmount = Math.floor(amount);

  if (intAmount === 0) return "CERO EUROS";
  if (intAmount === 1) return "UN EURO";

  let result = numberToSpanishWords(intAmount);

  // Add "de" before "euros" for millions
  if (intAmount >= 1000000 && intAmount % 1000000 === 0) {
    result += " de euros";
  } else {
    result += " euros";
  }

  return result.toUpperCase();
}

/**
 * Formats a number with Spanish locale and adds text representation
 * Example: formatWithText(1500, "€") → "1.500€ (MIL QUINIENTOS EUROS)"
 */
export function formatCurrencyWithText(amount: number | string): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  const formatted = new Intl.NumberFormat("es-ES").format(numAmount);
  const text = currencyToSpanish(numAmount);
  return `${formatted}€ (${text})`;
}

/**
 * Formats a percentage with text representation
 * Example: formatPercentageWithText(3.5) → "3,5% (TRES CON CINCO POR CIENTO)"
 */
export function formatPercentageWithText(percent: number): string {
  const formatted = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(percent);
  const text = percentageToSpanish(percent);
  return `${formatted}% (${text})`;
}

/**
 * Formats a number with text representation
 * Example: formatNumberWithText(12) → "12 (DOCE)"
 */
export function formatNumberWithText(num: number): string {
  const text = numberToSpanishWords(num).toUpperCase();
  return `${num} (${text})`;
}
