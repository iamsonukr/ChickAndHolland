"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  BeaderOption,
  normalizeBeaderNames,
} from "@/lib/beaders";

interface BeaderSelectFieldProps {
  label?: string;
  placeholder?: string;
  value?: string | null;
  onChange: (value: string) => void;
  beaders: Array<BeaderOption | string>;
  disabled?: boolean;
}

const BeaderSelectField = ({
  label = "Beader",
  placeholder = "Select Beader",
  value,
  onChange,
  beaders,
  disabled = false,
}: BeaderSelectFieldProps) => {
  const options = normalizeBeaderNames([
    ...(value ? [value] : []),
    ...(beaders ?? []),
  ]);

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <Select
        onValueChange={onChange}
        value={value ?? ""}
        disabled={disabled || options.length === 0}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No beaders available
            </div>
          ) : (
            options.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  );
};

export default BeaderSelectField;
