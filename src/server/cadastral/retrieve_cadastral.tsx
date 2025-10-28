"use server";

import { retrieveGeocodingData } from "../googlemaps/retrieve_geo";

// Types for the cadastral API response
// Individual BI (building information) unit
interface BiUnit {
  rc?: {
    pc1: string;
    pc2: string;
    car?: string;
    cc1?: string;
    cc2?: string;
  };
  dt: {
    np: string; // Province
    nm: string; // Municipality
    locs: {
      lous: {
        lourb: {
          dir: {
            tv: string; // Street type (CL, AV, etc.)
            nv: string; // Street name
            pnp: string; // Number
          };
          loint: {
            es?: string; // Staircase
            pt: string; // Floor
            pu: string; // Door
          };
          dp: string; // Postal code
        };
      };
    };
  };
  debi: {
    luso: string; // Usage
    sfc: string; // Built surface area
    ant: string; // Year built
  };
  idbi?: {
    rc?: {
      pc1: string;
      pc2: string;
    };
  };
}

interface CadastralResponse {
  consulta_dnprcResult?: {
    control?: {
      cudnp: number;
    };
    lrcdnp?: {
      rcdnp: BiUnit[]; // Array of property units
    };
    bico?: {
      bi: BiUnit | BiUnit[]; // Can be single object or array (old format)
      lcons?: Array<{
        lcd: string; // Construction type
      }>;
    };
  };
  consulta_dnplocResult?: {
    control: {
      cuerr: number;
    };
    lerr?: Array<{
      cod: string;
      des: string;
    }>;
    bico?: {
      bi: BiUnit | BiUnit[]; // Can be single object or array
      lcons?: Array<{
        lcd: string; // Construction type
      }>;
    };
  };
  Consulta_RCCOORResult?: {
    control: {
      cucoor: number;
    };
    coordenadas?: {
      coord: Array<{
        pc: {
          pc1: string; // First part of cadastral reference
          pc2: string; // Second part of cadastral reference
        };
        geo: {
          xcen: string; // Longitude
          ycen: string; // Latitude
          srs: string; // Coordinate system
        };
        ldt: string; // Full address (e.g., "CL VALLEHERMOSO 58 MADRID (MADRID)")
      }>;
    };
  };
}

// Formatted cadastral data for database
interface FormattedCadastralData {
  street: string;
  addressDetails: string;
  squareMeter: number;
  builtSurfaceArea: number;
  yearBuilt: number;
  propertyType: string;
  municipality: string;
  neighborhood: string;
  postalCode: string;
  latitude?: string;
  longitude?: string;
  neighborhoodId?: number;
  city?: string;
  province?: string;
}

// Format street type abbreviations to full names
function formatStreetType(abbreviation: string): string {
  const streetTypes: Record<string, string> = {
    CL: "Calle",
    AV: "Avenida",
    PL: "Plaza",
    PS: "Paseo",
    CR: "Carrera",
    TR: "Travesía",
    CT: "Cuesta",
    GL: "Glorieta",
    RD: "Ronda",
    CM: "Camino",
    PG: "Paseo",
    PZ: "Plaza",
    VR: "Vereda",
  };

  return streetTypes[abbreviation] ?? abbreviation;
}

// Format street name with proper capitalization
function formatStreetName(name: string): string {
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Types for location search response
export interface CadastralSearchResult {
  cadastralReference: string;
  street: string;
  addressDetails: string;
  postalCode: string;
  city?: string;
  province?: string;
  municipality: string;
  builtSurfaceArea: number;
  yearBuilt: number;
}

// Types for data comparison
export interface CadastralDiscrepancy {
  field: string;
  fieldLabel: string;
  current: string;
  suggested: string;
}

export interface CadastralComparisonResult {
  hasDiscrepancies: boolean;
  differences: CadastralDiscrepancy[];
}

// Normalize string for comparison (lowercase, trim, remove accents)
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Compare cadastral data with current form data
export async function compareCadastralData(
  currentData: {
    street?: string;
    postalCode?: string;
    city?: string;
    province?: string;
  },
  cadastralData: FormattedCadastralData,
): Promise<CadastralComparisonResult> {
  const differences: CadastralDiscrepancy[] = [];

  // Compare street
  if (currentData.street && cadastralData.street) {
    const currentStreet = normalizeString(currentData.street);
    const cadastralStreet = normalizeString(cadastralData.street);
    if (currentStreet !== cadastralStreet) {
      differences.push({
        field: "street",
        fieldLabel: "Calle",
        current: currentData.street,
        suggested: cadastralData.street,
      });
    }
  }

  // Compare postal code
  if (currentData.postalCode && cadastralData.postalCode) {
    const currentPostal = normalizeString(currentData.postalCode);
    const cadastralPostal = normalizeString(cadastralData.postalCode);
    if (currentPostal !== cadastralPostal) {
      differences.push({
        field: "postalCode",
        fieldLabel: "Código Postal",
        current: currentData.postalCode,
        suggested: cadastralData.postalCode,
      });
    }
  }

  // Compare city
  if (currentData.city && cadastralData.city) {
    const currentCity = normalizeString(currentData.city);
    const cadastralCity = normalizeString(cadastralData.city);
    if (currentCity !== cadastralCity) {
      differences.push({
        field: "city",
        fieldLabel: "Ciudad",
        current: currentData.city,
        suggested: cadastralData.city,
      });
    }
  }

  // Compare province
  if (currentData.province && cadastralData.province) {
    const currentProvince = normalizeString(currentData.province);
    const cadastralProvince = normalizeString(cadastralData.province);
    if (currentProvince !== cadastralProvince) {
      differences.push({
        field: "province",
        fieldLabel: "Provincia",
        current: currentData.province,
        suggested: cadastralData.province,
      });
    }
  }

  const result = {
    hasDiscrepancies: differences.length > 0,
    differences,
  };

  return result;
}

// Map common province names to Catastro API province names
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mapProvinceName(province: string): string {
  const provinceMapping: Record<string, string> = {
    "Comunidad de Madrid": "Madrid",
    Madrid: "Madrid",
    "Comunidad Valenciana": "Valencia",
    Valencia: "Valencia",
    Cataluña: "Barcelona",
    Barcelona: "Barcelona",
    Andalucía: "Sevilla",
    Sevilla: "Sevilla",
    "Castilla y León": "Valladolid",
    Valladolid: "Valladolid",
    Galicia: "A Coruña",
    "A Coruña": "A Coruña",
    "País Vasco": "Vizcaya",
    Vizcaya: "Vizcaya",
    Canarias: "Las Palmas",
    "Las Palmas": "Las Palmas",
    "Islas Baleares": "Baleares",
    Baleares: "Baleares",
    Aragón: "Zaragoza",
    Zaragoza: "Zaragoza",
    "Castilla-La Mancha": "Toledo",
    Toledo: "Toledo",
    Extremadura: "Badajoz",
    Badajoz: "Badajoz",
    Asturias: "Asturias",
    "Principado de Asturias": "Asturias",
    Cantabria: "Cantabria",
    "La Rioja": "La Rioja",
    Navarra: "Navarra",
    Murcia: "Murcia",
    "Región de Murcia": "Murcia",
  };

  return provinceMapping[province] ?? province;
}

// Clean street name by removing trailing commas and extra spaces
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cleanStreetName(streetName: string): string {
  return streetName.replace(/,\s*$/, "").trim();
}

// Normalize text for Catastro API - removes accents, commas, converts to uppercase
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeCatastroText(str: string): string {
  return str
    .normalize("NFD") // split accent marks
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/,/g, "") // remove commas
    .trim()
    .toUpperCase(); // Catastro expects uppercase
}

// Normalize street name specifically for Catastro API - removes street type prefixes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeCatastroStreetName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(
      /^(CALLE|CL|AVENIDA|AVDA|AVD|PASEO|PS|CARRERA|CR|TRAVESIA|TR|CALLE DE|AVENIDA DE|PASEO DE|CARRERA DE)\s+/i,
      "",
    ) // remove street type prefixes
    .replace(/,/g, "") // remove commas
    .trim()
    .toUpperCase();
}

// Validate and clean street number for Catastro API - must be up to 4 digits
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validateCatastroStreetNumber(number: string): string {
  // Extract only digits from the input
  const digitsOnly = number.replace(/\D/g, "");

  // Validate: must be 1-4 digits (Catastro requirement)
  if (digitsOnly.length === 0) {
    throw new Error(
      "Street number is required and must contain at least one digit",
    );
  }

  if (digitsOnly.length > 4) {
    throw new Error(
      `Street number must be up to 4 digits, got ${digitsOnly.length} digits: ${digitsOnly}`,
    );
  }

  return digitsOnly;
}

// Search for cadastral references by coordinates (CHAINED - expands 14-char parcels)
export async function searchCadastralByCoordinates(params: {
  latitude: number;
  longitude: number;
}): Promise<CadastralSearchResult[]> {
  try {
    console.log(
      "🔍 [searchCadastralByCoordinates] ========================================",
    );
    console.log("🔍 [searchCadastralByCoordinates] STARTING COORDINATE SEARCH");
    console.log(
      "🔍 [searchCadastralByCoordinates] ========================================",
    );
    console.log("📋 [searchCadastralByCoordinates] Input coordinates:", params);

    // Build the API URL for coordinate-based search
    const baseUrl =
      "https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCoordenadas.svc/json/Consulta_RCCOOR";

    // URL encode parameters
    const queryParams = new URLSearchParams({
      CoorX: params.longitude.toString(),
      CoorY: params.latitude.toString(),
      SRS: "EPSG:4326", // WGS84 coordinate system (standard for GPS/Google Maps)
    });

    const apiUrl = `${baseUrl}?${queryParams.toString()}`;

    console.log("📡 [searchCadastralByCoordinates] API URL:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; RealEstateApp/1.0)",
      },
    });

    console.log(
      "📊 [searchCadastralByCoordinates] API Response status:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "❌ [searchCadastralByCoordinates] API returned error status:",
        response.status,
      );
      console.error(
        "❌ [searchCadastralByCoordinates] Error response:",
        errorText,
      );
      return [];
    }

    const responseText = await response.text();

    console.log(
      "📄 [searchCadastralByCoordinates] Raw response (first 500 chars):",
      responseText.substring(0, 500),
    );

    let data: CadastralResponse;
    try {
      data = JSON.parse(responseText) as CadastralResponse;
      console.log("✅ [searchCadastralByCoordinates] JSON parsed successfully");
    } catch (parseError) {
      console.error(
        "❌ [searchCadastralByCoordinates] JSON parse error:",
        parseError,
      );
      console.error(
        "❌ [searchCadastralByCoordinates] Failed response text:",
        responseText,
      );
      return [];
    }

    // The response can contain multiple properties at the same coordinates
    const results: CadastralSearchResult[] = [];

    // Check if we have the coordinate-based response
    if (!data.Consulta_RCCOORResult?.coordenadas?.coord) {
      console.warn(
        "⚠️ [searchCadastralByCoordinates] No coordinate data found in response",
      );
      console.warn(
        "⚠️ [searchCadastralByCoordinates] Response structure:",
        JSON.stringify(data, null, 2),
      );
      return [];
    }

    const coordArray = data.Consulta_RCCOORResult.coordenadas.coord;
    console.log(
      `📊 [searchCadastralByCoordinates] Found ${coordArray.length} cadastral references at coordinates`,
    );

    // Process each property found at the coordinates
    for (let i = 0; i < coordArray.length; i++) {
      const coordItem = coordArray[i];
      if (!coordItem) continue;

      console.log(
        `\n🔄 [searchCadastralByCoordinates] Processing item ${i + 1}/${coordArray.length}`,
      );

      // Extract cadastral reference
      const cadastralReference =
        coordItem.pc.pc1 && coordItem.pc.pc2
          ? `${coordItem.pc.pc1}${coordItem.pc.pc2}`
          : "";

      // Parse the ldt (full address) to extract components
      // Example: "CL VALLEHERMOSO 58 MADRID (MADRID)"
      const fullAddress = coordItem.ldt;

      console.log(
        `   📋 Cadastral Reference (${cadastralReference.length} chars):`,
        cadastralReference,
      );
      console.log(`   📍 Full Address:`, fullAddress);

      // If RC is 14 chars, fetch detailed BI info for each dwelling in the parcel
      if (cadastralReference.length === 14) {
        console.log(
          `   🔍 14-character parcel detected - expanding to individual dwellings...`,
        );
        const dnpUrl = `https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/Consulta_DNPRC?RefCat=${cadastralReference}`;

        console.log(`   📡 DNPRC expansion URL:`, dnpUrl);

        try {
          const dnpResp = await fetch(dnpUrl, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "User-Agent": "Mozilla/5.0 (compatible; RealEstateApp/1.0)",
            },
          });

          console.log(
            `   📊 DNPRC Response status:`,
            dnpResp.status,
            dnpResp.statusText,
          );

          if (dnpResp.ok) {
            const dnpResponseText = await dnpResp.text();

            const dnpData = JSON.parse(dnpResponseText) as CadastralResponse;

            // Try new format first (lrcdnp.rcdnp), then fall back to old format (bico.bi)
            let biList: BiUnit[] = [];
            if (dnpData?.consulta_dnprcResult?.lrcdnp?.rcdnp) {
              biList = dnpData.consulta_dnprcResult.lrcdnp.rcdnp;
              console.log(
                `   ✅ Found ${biList.length} dwelling units (new format: lrcdnp.rcdnp)`,
              );
            } else {
              const biArray = dnpData?.consulta_dnprcResult?.bico?.bi;
              biList = Array.isArray(biArray)
                ? biArray
                : biArray
                  ? [biArray]
                  : [];
              console.log(
                `   ✅ Found ${biList.length} dwelling units (old format: bico.bi)`,
              );
            }

            console.log(
              `   🏠 Processing ${biList.length} individual dwellings...`,
            );

            for (const bi of biList) {
              if (!bi) continue;

              // Extract full cadastral reference including car (unit number)
              const fullRC =
                bi.rc?.pc1 && bi.rc?.pc2
                  ? `${bi.rc.pc1}${bi.rc.pc2}${bi.rc.car ?? ""}`
                  : bi.idbi?.rc?.pc1 && bi.idbi?.rc?.pc2
                    ? `${bi.idbi.rc.pc1}${bi.idbi.rc.pc2}`
                    : cadastralReference;

              const dir = bi.dt?.locs?.lous?.lourb?.dir;
              const loint = bi.dt?.locs?.lous?.lourb?.loint;

              let formattedStreet = fullAddress;
              if (dir) {
                const streetType = formatStreetType(dir.tv);
                const streetName = formatStreetName(dir.nv);
                formattedStreet = `${streetType} ${streetName}, ${dir.pnp ?? ""}`;
              }

              // Format address details: Floor and door (e.g., "Planta 01, Puerta 3")
              let addressDetails = "";
              if (loint) {
                const floor = loint.pt ?? "";
                const door = loint.pu ?? "";
                if (floor && door) {
                  addressDetails = `Planta ${floor}, Puerta ${door}`;
                } else if (floor) {
                  addressDetails = `Planta ${floor}`;
                } else if (door) {
                  addressDetails = `Puerta ${door}`;
                }
              }

              const postalCode = bi.dt?.locs?.lous?.lourb?.dp ?? "";
              const municipality = bi.dt?.nm ?? "";
              const province = bi.dt?.np ?? "";
              const builtSurfaceArea = parseFloat(bi.debi?.sfc ?? "0");
              const yearBuilt = parseInt(bi.debi?.ant ?? "0", 10);

              const unitResult: CadastralSearchResult = {
                cadastralReference: fullRC,
                street: formattedStreet,
                addressDetails: addressDetails,
                postalCode: postalCode,
                city: province,
                province: province,
                municipality: municipality,
                builtSurfaceArea: builtSurfaceArea,
                yearBuilt: yearBuilt,
              };

              results.push(unitResult);
            }
          } else {
            await dnpResp.text();
            console.warn(
              `   ⚠️ DNPRC expansion failed with status ${dnpResp.status}`,
            );
            console.warn(`   ⚠️ Falling back to parcel-level data`);

            // Fallback: add the parcel itself
            const addressRegex = /^(.+?)\s+(\d+)\s+(.+?)\s+\((.+?)\)$/;
            const addressMatch = addressRegex.exec(fullAddress);
            let street = fullAddress;
            let municipality = "";
            let province = "";

            if (addressMatch) {
              const streetPart = addressMatch[1] ?? "";
              const streetNumber = addressMatch[2] ?? "";
              municipality = addressMatch[3]?.trim() ?? "";
              province = addressMatch[4]?.trim() ?? "";

              const streetParts = streetPart.trim().split(/\s+/);
              if (streetParts.length > 0) {
                const streetType = formatStreetType(streetParts[0] ?? "");
                const streetName = formatStreetName(
                  streetParts.slice(1).join(" "),
                );
                street = `${streetType} ${streetName}, ${streetNumber}`;
              }
            }

            results.push({
              cadastralReference: cadastralReference,
              street: street,
              addressDetails: "",
              postalCode: "",
              city: province,
              province: province,
              municipality: municipality,
              builtSurfaceArea: 0,
              yearBuilt: 0,
            });
          }
        } catch (dnpError) {
          console.error(`   ❌ DNPRC expansion error:`, dnpError);
          console.error(
            `   ❌ Error type:`,
            dnpError instanceof Error
              ? dnpError.constructor.name
              : typeof dnpError,
          );
          console.error(`   ❌ Falling back to parcel-level data`);

          // Fallback: add the parcel itself
          const addressRegex2 = /^(.+?)\s+(\d+)\s+(.+?)\s+\((.+?)\)$/;
          const addressMatch = addressRegex2.exec(fullAddress);
          let street = fullAddress;
          let municipality = "";
          let province = "";

          if (addressMatch) {
            const streetPart = addressMatch[1] ?? "";
            const streetNumber = addressMatch[2] ?? "";
            municipality = addressMatch[3]?.trim() ?? "";
            province = addressMatch[4]?.trim() ?? "";

            const streetParts = streetPart.trim().split(/\s+/);
            if (streetParts.length > 0) {
              const streetType = formatStreetType(streetParts[0] ?? "");
              const streetName = formatStreetName(
                streetParts.slice(1).join(" "),
              );
              street = `${streetType} ${streetName}, ${streetNumber}`;
            }
          }

          results.push({
            cadastralReference: cadastralReference,
            street: street,
            addressDetails: "",
            postalCode: "",
            city: province,
            province: province,
            municipality: municipality,
            builtSurfaceArea: 0,
            yearBuilt: 0,
          });
        }
      } else {
        // 20-character RCs: already individual units, no expansion needed
        console.log(
          `   ✅ 20-character reference detected - no expansion needed`,
        );

        // Parse the address string
        // Format: "STREET_TYPE STREET_NAME NUMBER MUNICIPALITY (PROVINCE)"
        const addressRegex3 = /^(.+?)\s+(\d+)\s+(.+?)\s+\((.+?)\)$/;
        const addressMatch = addressRegex3.exec(fullAddress);

        let street = "";
        let municipality = "";
        let province = "";

        if (addressMatch) {
          const streetPart = addressMatch[1] ?? ""; // e.g., "CL VALLEHERMOSO"
          const streetNumber = addressMatch[2] ?? "";
          municipality = addressMatch[3]?.trim() ?? "";
          province = addressMatch[4]?.trim() ?? "";

          // Format the street part
          const streetParts = streetPart.trim().split(/\s+/);
          if (streetParts.length > 0) {
            const streetType = formatStreetType(streetParts[0] ?? "");
            const streetName = formatStreetName(streetParts.slice(1).join(" "));
            street = `${streetType} ${streetName}, ${streetNumber}`;
          } else {
            street = `${streetPart}, ${streetNumber}`;
          }
        } else {
          // Fallback if parsing fails
          street = fullAddress;
        }

        const result: CadastralSearchResult = {
          cadastralReference,
          street,
          addressDetails: "", // Coordinate search doesn't provide floor/door details
          postalCode: "", // Coordinate search doesn't provide postal code directly
          city: province, // Use province as city for now
          province: province,
          municipality: municipality,
          builtSurfaceArea: 0, // Not available in coordinate search
          yearBuilt: 0, // Not available in coordinate search
        };

        results.push(result);
      }
    }

    console.log(
      "\n✅ [searchCadastralByCoordinates] ========================================",
    );
    console.log(
      "✅ [searchCadastralByCoordinates] SEARCH COMPLETED SUCCESSFULLY",
    );
    console.log(
      "✅ [searchCadastralByCoordinates] ========================================",
    );
    console.log(
      `✅ [searchCadastralByCoordinates] Total results: ${results.length} cadastral references`,
    );

    return results;
  } catch (error) {
    console.error(
      "\n❌ [searchCadastralByCoordinates] ========================================",
    );
    console.error("❌ [searchCadastralByCoordinates] FATAL ERROR");
    console.error(
      "❌ [searchCadastralByCoordinates] ========================================",
    );
    console.error("❌ [searchCadastralByCoordinates] Error:", error);
    console.error(
      "❌ [searchCadastralByCoordinates] Error type:",
      error instanceof Error ? error.constructor.name : typeof error,
    );
    console.error(
      "❌ [searchCadastralByCoordinates] Error message:",
      error instanceof Error ? error.message : String(error),
    );
    if (error instanceof Error && error.stack) {
      console.error(
        "❌ [searchCadastralByCoordinates] Stack trace:",
        error.stack,
      );
    }
    console.error("❌ [searchCadastralByCoordinates] Returning empty array");
    return [];
  }
}

// Retrieve cadastral data from the API
export async function retrieveCadastralData(
  cadastralReference: string,
): Promise<FormattedCadastralData | null> {
  try {
    const apiUrl = `https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/Consulta_DNPRC?RefCat=${cadastralReference}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; RealEstateApp/1.0)",
      },
    });

    if (!response.ok) {
      await response.text();
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();

    let data: CadastralResponse;
    try {
      data = JSON.parse(responseText) as CadastralResponse;
    } catch (parseError) {
      throw parseError;
    }

    // Check for API errors first (only for consulta_dnplocResult which has error reporting)
    if (data.consulta_dnplocResult) {
      const responseResult = data.consulta_dnplocResult;
      if (responseResult.control?.cuerr > 0) {
        const errorData = responseResult.lerr?.[0];
        const errorMessage = `[Catastro] ${errorData?.cod ?? "Unknown"}: ${errorData?.des ?? "Unknown error"}`;
        throw new Error(errorMessage);
      }
    }

    // Try to get property data from new format (lrcdnp.rcdnp) or old format (bico.bi)
    let bi: BiUnit | undefined;
    let constructionType: string | undefined;

    if (data.consulta_dnprcResult?.lrcdnp?.rcdnp) {
      // New format: lrcdnp.rcdnp (array of units)
      bi = data.consulta_dnprcResult.lrcdnp.rcdnp[0];
    } else if (data.consulta_dnprcResult?.bico?.bi) {
      // Old format: bico.bi (can be single or array)
      const biData = data.consulta_dnprcResult.bico.bi;
      bi = Array.isArray(biData) ? biData[0] : biData;
      constructionType = data.consulta_dnprcResult.bico.lcons?.[0]?.lcd;
    } else if (data.consulta_dnplocResult?.bico?.bi) {
      // Fallback to consulta_dnplocResult
      const biData = data.consulta_dnplocResult.bico.bi;
      bi = Array.isArray(biData) ? biData[0] : biData;
      constructionType = data.consulta_dnplocResult.bico.lcons?.[0]?.lcd;
    }

    if (!bi) {
      throw new Error("No property data found");
    }

    const dt = bi.dt;
    const debi = bi.debi;
    const dir = dt.locs.lous.lourb.dir;
    const loint = dt.locs.lous.lourb.loint;

    const formattedStreetType = formatStreetType(dir.tv);
    const formattedStreetName = formatStreetName(dir.nv);

    const street = `${formattedStreetType} ${formattedStreetName}, ${dir.pnp}`;

    const fullAddress = `${street}, ${dt.nm}, ${dt.np}, España`;

    const geoData = await retrieveGeocodingData(fullAddress);

    const addressDetails = `${loint.es}ª ${loint.pt}º ${loint.pu}`;

    const squareMeter = parseFloat(debi.sfc) || 0;
    const builtSurfaceArea = parseFloat(debi.sfc) || 0;
    const yearBuilt = parseInt(debi.ant) || 0;

    const getPropertyType = (
      usage: string,
      constructionType?: string,
    ): string => {
      const usageLower = usage.toLowerCase();
      const constructionLower = constructionType?.toLowerCase() ?? "";

      if (
        usageLower.includes("vivienda") ||
        usageLower.includes("residencial") ||
        constructionLower.includes("vivienda")
      ) {
        return "piso";
      } else if (
        usageLower.includes("comercial") ||
        usageLower.includes("local")
      ) {
        return "local";
      } else if (
        usageLower.includes("garaje") ||
        usageLower.includes("parking")
      ) {
        return "garaje";
      } else if (
        usageLower.includes("solar") ||
        usageLower.includes("terreno")
      ) {
        return "solar";
      }
      return "piso";
    };

    const propertyType = getPropertyType(debi.luso, constructionType);

    const neighborhood = geoData?.neighborhood ?? dt.nm;
    const municipality = geoData?.municipality ?? dt.nm;
    const city = geoData?.city ?? dt.np;
    const province = geoData?.province ?? dt.np;

    const formattedData: FormattedCadastralData = {
      street,
      addressDetails,
      squareMeter,
      builtSurfaceArea,
      yearBuilt,
      propertyType,
      municipality,
      neighborhood,
      postalCode: dt.locs.lous.lourb.dp,
      latitude: geoData?.latitude,
      longitude: geoData?.longitude,
      neighborhoodId: geoData?.neighborhoodId,
      city,
      province,
    };

    return formattedData;
  } catch {
    return null;
  }
}
