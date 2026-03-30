"use client";

import { Check, ChevronsUpDown, DollarSign, X } from "lucide-react";
import { Control, UseFormReturn } from "react-hook-form";
import { AddProductForm as AddProductFormType } from "@/lib/formSchemas";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/custom/button";
import { cn } from "@/lib/utils";
import { Colour, Currency } from "./types-hooks";

// ---------------------------------------------------------------------------
// ColourSelectField
// ---------------------------------------------------------------------------

interface ColourSelectFieldProps {
  label: string;
  placeholder: string;
  colours: Colour[];
  value: string | undefined;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export const ColourSelectField = ({
  label,
  placeholder,
  colours,
  value,
  onChange,
  disabled = false,
}: ColourSelectFieldProps) => (
  <FormItem>
    <FormLabel>{label}</FormLabel>
    <Select onValueChange={onChange} value={value ?? ""} disabled={disabled}>
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {colours.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No colours available
          </div>
        ) : (
          colours.map((colour) => (
            <SelectItem key={colour.id} value={colour.hexcode}>
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-4 shrink-0 rounded-full border border-black"
                  style={{ backgroundColor: colour.hexcode }}
                />
                <span>{colour.name}</span>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
    <FormMessage />
  </FormItem>
);

// ---------------------------------------------------------------------------
// CurrencyPricingSection
// ---------------------------------------------------------------------------

interface CurrencyPricingSectionProps {
  fields: { id: string; currencyId: string }[];
  control: Control<AddProductFormType>;
  currencyMap: Map<string, Currency>;
  availableCurrencies: Currency[];
  currencyComboboxOpen: Record<number, boolean>;
  toggleCombobox: (index: number, value: boolean) => void;
  append: (value: { currencyId: string; price: number }) => void;
  remove: (index: number) => void;
  showLoading: boolean;
}

export const CurrencyPricingSection = ({
  fields,
  control,
  currencyMap,
  availableCurrencies,
  currencyComboboxOpen,
  toggleCombobox,
  append,
  remove,
  showLoading,
}: CurrencyPricingSectionProps) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <FormLabel className="text-base font-semibold">
        Additional Currency Pricing (Optional)
      </FormLabel>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ currencyId: "", price: 0 })}
        disabled={availableCurrencies.length === 0 || showLoading}
      >
        <DollarSign className="mr-1 h-4 w-4" />
        Add USD/GBP Price
      </Button>
    </div>

    {fields.length > 0 && (
      <div className="space-y-3 rounded-lg bg-gray-50 p-4">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-end gap-2">
            {/* Currency combobox */}
            <FormField
              control={control}
              name={`currencyBasedPricing.${index}.currencyId`}
              render={({ field: f }) => {
                const selected = currencyMap.get(f.value);
                return (
                  <FormItem className="flex-1">
                    <FormLabel>Currency</FormLabel>
                    <Popover
                      open={currencyComboboxOpen[index] ?? false}
                      onOpenChange={(v) => toggleCombobox(index, v)}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={showLoading}
                            className={cn(
                              "w-full justify-between",
                              !f.value && "text-muted-foreground",
                            )}
                          >
                            {selected
                              ? `${selected.name} (${selected.symbol})`
                              : "Select currency"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search currencies..." />
                          <CommandList>
                            <CommandEmpty>No currency found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {selected && (
                                <CommandItem
                                  key={`selected-${f.value}`}
                                  value={selected.name.toLowerCase()}
                                  onSelect={() => toggleCombobox(index, false)}
                                >
                                  <Check className="mr-2 h-4 w-4 opacity-100" />
                                  {selected.name} ({selected.code}){" "}
                                  {selected.symbol}
                                </CommandItem>
                              )}
                              {availableCurrencies
                                .filter((c) => c.id.toString() !== f.value)
                                .map((currency) => (
                                  <CommandItem
                                    key={`currency-${currency.id}`}
                                    value={currency.name.toLowerCase()}
                                    onSelect={() => {
                                      f.onChange(currency.id.toString());
                                      toggleCombobox(index, false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        f.value === currency.id.toString()
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    {currency.name} ({currency.code}){" "}
                                    {currency.symbol}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Price input */}
            <FormField
              control={control}
              name={`currencyBasedPricing.${index}.price`}
              render={({ field: f }) => (
                <FormItem className="flex-1">
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      disabled={showLoading}
                      {...f}
                      onChange={(e) => f.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => remove(index)}
              className="mb-2"
              disabled={showLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    )}
  </div>
);