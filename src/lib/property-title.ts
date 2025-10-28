export function generatePropertyTitle(
  propertyType: string,
  street = "",
  neighborhood = "",
) {
  const getPropertyTypeText = (type: string) => {
    switch (type) {
      case "piso":
        return "Piso";
      case "casa":
        return "Casa";
      case "local":
        return "Local";
      case "solar":
        return "Solar";
      case "garaje":
        return "Garaje";
      default:
        return type;
    }
  };

  const type = getPropertyTypeText(propertyType);
  const neighborhoodText = neighborhood ? `(${neighborhood})` : "";
  return `${type} en ${street} ${neighborhoodText}`.trim();
}
