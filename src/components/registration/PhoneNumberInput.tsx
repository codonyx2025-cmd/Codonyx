import { useEffect, useState } from "react";
import PhoneInputBase, { getCountryCallingCode } from "react-phone-number-input";
import type { Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./phone-input.css";
import { CountrySelectDropdown } from "./CountrySelectDropdown";
import { cn } from "@/lib/utils";

interface PhoneNumberInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** ISO code of the country picked elsewhere in the form (e.g. Country field). */
  country?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

/**
 * International phone input with country flag, dial-code selector and
 * automatic formatting. The country selector follows the form's Country
 * field but can still be changed manually afterwards.
 */
export function PhoneNumberInput({
  id,
  value,
  onChange,
  country,
  placeholder = "Enter phone number",
  required,
  className,
}: PhoneNumberInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>(
    (country || undefined) as Country | undefined
  );

  // Auto-update the dial code when the form's Country field changes.
  useEffect(() => {
    if (!country) return;
    setSelectedCountry(country as Country);
    try {
      const dial = `+${getCountryCallingCode(country as Country)}`;
      const digitsOnly = (value || "").replace(/^\+\d+/, "");
      if (!value || !digitsOnly) onChange(dial);
    } catch {
      /* unknown country code — ignore */
    }
  }, [country]);

  return (
    <PhoneInputBase
      id={id}
      international
      withCountryCallingCode
      country={selectedCountry}
      onCountryChange={(c) => setSelectedCountry(c || undefined)}
      countrySelectComponent={(props: React.ComponentProps<typeof CountrySelectDropdown>) => (
        <CountrySelectDropdown {...props} value={props.value || selectedCountry} />
      )}
      value={value || undefined}
      onChange={(v) => onChange(v || "")}
      placeholder={placeholder}
      limitMaxLength
      numberInputProps={{ required, maxLength: 20 }}
      className={cn("codonyx-phone-input", className)}
    />
  );
}

export default PhoneNumberInput;
