import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Country, City } from "country-state-city";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface SearchableSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; hint?: string }[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  disabled?: boolean;
}

export function SearchableSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-12 w-full justify-between font-normal bg-background",
            !selected && "text-muted-foreground"
          )}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50 bg-popover" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-64">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                  {option.hint && (
                    <span className="ml-auto text-xs text-muted-foreground">{option.hint}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface CountryCitySelectProps {
  country: string;
  city: string;
  onCountryChange: (countryName: string, isoCode: string) => void;
  onCityChange: (city: string) => void;
}

/**
 * Two linked searchable dropdowns: selecting a country filters the city list.
 * Values are stored as plain names so existing profile data stays compatible.
 */
export function CountryCitySelect({
  country,
  city,
  onCountryChange,
  onCityChange,
}: CountryCitySelectProps) {
  const countries = useMemo(
    () =>
      Country.getAllCountries().map((c) => ({
        value: c.name,
        label: `${c.flag} ${c.name}`,
        iso: c.isoCode,
      })),
    []
  );

  const selectedIso = countries.find((c) => c.value === country)?.iso ?? "";

  const cities = useMemo(() => {
    if (!selectedIso) return [];
    const list = City.getCitiesOfCountry(selectedIso) || [];
    const unique = Array.from(new Set(list.map((c) => c.name))).sort((a, b) =>
      a.localeCompare(b)
    );
    return unique.map((name) => ({ value: name, label: name }));
  }, [selectedIso]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label htmlFor="country" className="text-xs uppercase tracking-wider font-medium">
          Country *
        </label>
        <SearchableSelect
          id="country"
          value={country}
          onChange={(val) => {
            const iso = countries.find((c) => c.value === val)?.iso ?? "";
            onCountryChange(val, iso);
            onCityChange("");
          }}
          options={countries}
          placeholder="Select country"
          searchPlaceholder="Search country..."
          emptyText="No country found."
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="city" className="text-xs uppercase tracking-wider font-medium">
          City *
        </label>
        <SearchableSelect
          id="city"
          value={city}
          onChange={onCityChange}
          options={cities}
          placeholder={country ? "Select city" : "Select country first"}
          searchPlaceholder="Search city..."
          emptyText="No city found."
          disabled={!country}
        />
      </div>
    </div>
  );
}

export { Search };
