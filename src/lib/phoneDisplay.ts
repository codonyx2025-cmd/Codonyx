import { formatPhoneNumberIntl } from "react-phone-number-input";
import { Country } from "country-state-city";

/**
 * Format a stored phone number for display, always including the country
 * calling code (e.g. "+91 81234 56789"). Falls back to the raw value.
 */
export function formatPhoneDisplay(value?: string | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  const normalized = trimmed.startsWith("+") ? trimmed : `+${trimmed.replace(/^0+/, "")}`;
  const formatted = formatPhoneNumberIntl(normalized);
  return formatted || trimmed;
}

const flagFromIso = (iso: string) =>
  iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

/**
 * Given a stored location string ("City, Country" or "Country"),
 * return the matching country flag emoji, or "" when unknown.
 */
export function countryFlagFromLocation(location?: string | null): string {
  if (!location) return "";
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
  const countries = Country.getAllCountries();
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i].toLowerCase();
    const match = countries.find((c) => c.name.toLowerCase() === part);
    if (match) return flagFromIso(match.isoCode);
  }
  return "";
}
