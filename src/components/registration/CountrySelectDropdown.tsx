import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import flags from "react-phone-number-input/flags";
import { getCountryCallingCode } from "react-phone-number-input";
import type { Country } from "react-phone-number-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface Option {
  value?: string;
  label: string;
}

interface CountrySelectDropdownProps {
  value?: string;
  onChange: (value?: string) => void;
  options: Option[];
  disabled?: boolean;
  name?: string;
  className?: string;
}

export const emojiFlag = (iso?: string) =>
  iso && /^[A-Za-z]{2}$/.test(iso)
    ? iso.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    : "";

const Flag = ({ country }: { country?: string }) => {
  const FlagComponent = country ? (flags as Record<string, React.ComponentType<{ title?: string }>>)[country] : undefined;
  if (!FlagComponent) {
    const emoji = emojiFlag(country);
    if (emoji) {
      return (
        <span className="inline-flex w-6 h-4 items-center justify-center text-base leading-none" title={country}>
          {emoji}
        </span>
      );
    }
    return <span className="inline-block w-6 h-4 rounded-sm bg-muted" aria-hidden />;
  }
  return (
    <span className="inline-block w-6 h-4 overflow-hidden rounded-sm">
      <FlagComponent title={country} />
    </span>
  );
};

/**
 * Searchable country dropdown used as the country selector of
 * react-phone-number-input. Renders flag + localized name + dial code
 * and never overflows small screens.
 */
export function CountrySelectDropdown({
  value,
  onChange,
  options,
  disabled,
  className,
}: CountrySelectDropdownProps) {
  const [open, setOpen] = useState(false);

  const items = useMemo(
    () =>
      options
        .filter((o) => !!o.value)
        .map((o) => {
          let dial = "";
          try {
            dial = `+${getCountryCallingCode(o.value as Country)}`;
          } catch {
            dial = "";
          }
          return { value: o.value as string, label: o.label, dial };
        }),
    [options]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1 rounded-sm outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-50",
            className
          )}
          aria-label="Select country"
        >
          <Flag country={value} />
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-0 w-[min(20rem,calc(100vw-2rem))]"
        collisionPadding={12}
      >
        <Command
          filter={(itemValue, search) => (itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}
        >
          <CommandInput placeholder="Search country..." />
          <CommandList className="max-h-64">
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={`${item.label} ${item.dial} ${item.value}`}
                  onSelect={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className="gap-2"
                >
                  <Flag country={item.value} />
                  <span className="flex-1 truncate">{item.label}</span>
                  <span className="text-muted-foreground text-xs">{item.dial}</span>
                  {value === item.value && <Check className="w-4 h-4 text-primary" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default CountrySelectDropdown;
