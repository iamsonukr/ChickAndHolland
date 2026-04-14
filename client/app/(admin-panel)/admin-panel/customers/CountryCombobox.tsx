"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type CountryOption = {
  id: number | string;
  name: string;
  code?: string | null;
  isoCode?: string | null;
  iso_code?: string | null;
};

type CountryComboboxProps = Omit<ButtonProps, "value" | "onChange"> & {
  countries: CountryOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const CountryCombobox = React.forwardRef<HTMLButtonElement, CountryComboboxProps>(
  (
    {
      countries,
      value,
      onChange,
      placeholder = "Select Country",
      className,
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);

    const countryOptions = [...countries]
      .filter((country) => country?.id != null && country?.name)
      .sort((a, b) => a.name.localeCompare(b.name));

    const selectedCountry = countryOptions.find(
      (country) => country.id.toString() === value,
    );

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal",
              !selectedCountry && "text-muted-foreground",
              className,
            )}
            {...props}
          >
            <span className="truncate">
              {selectedCountry?.name ?? placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Search countries..." />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {countryOptions.map((country) => (
                  <CommandItem
                    key={country.id.toString()}
                    value={country.name}
                    keywords={[
                      country.code ?? "",
                      country.isoCode ?? "",
                      country.iso_code ?? "",
                    ]}
                    onSelect={() => {
                      onChange(country.id.toString());
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        country.id.toString() === value
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    <span>{country.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);

CountryCombobox.displayName = "CountryCombobox";

export default CountryCombobox;
