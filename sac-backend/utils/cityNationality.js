// utils/cityNationality.js
const cities = require("cities.json");

// Map ISO country code → your dropdown nationality labels
const COUNTRY_TO_NATIONALITY = {
  JP: "Japan",
  CN: "China",
  KR: "Korea",
  TW: "Taiwan",
  IN: "India",
  US: "USA",
  CA: "Canada",
  GB: "United Kingdom",
  FR: "France",
  DE: "Germany",
  IT: "Italy",
  ES: "Spain",
  RU: "Russia",
  BR: "Brazil",
  MX: "Mexico",
  AU: "Australia",
  TR: "Turkey",
  SA: "Saudi Arabia",
  AE: "United Arab Emirates",
  EG: "Egypt",
  ZA: "South Africa",
};

function cityToNationality(city) {
  if (!city || typeof city !== "string") return null;

  const name = city.trim().toLowerCase();
  if (!name || name === "not applicable") return null;

  const match = cities.find(
    (c) => c.name.toLowerCase() === name
  );

  if (!match) return null;

  return COUNTRY_TO_NATIONALITY[match.country] || null;
}

module.exports = { cityToNationality };
