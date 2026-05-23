"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Control, useFieldArray } from "react-hook-form";
import { CreateOrderForm } from "@/lib/formSchemas";

interface CustomSizesQuantityFieldArrayProps {
  control: Control<CreateOrderForm>;
  name: any;
  register: any; // kept for API compatibility; not used internally
}

const CustomSizesQuantityFieldArray = ({
  control,
  name,
}: CustomSizesQuantityFieldArrayProps) => {
  const { fields } = useFieldArray({ control, name });

  if (fields.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
      {fields.map((field: any, index) => (
        <div key={field.id} className="flex items-center gap-4">
          <div className="space-y-2">
            <Label>Size</Label>
            <Input disabled value={field.size} aria-label={`Size ${field.size}`} />
          </div>

          <FormField
            control={control}
            name={`${name}.${index}.quantity` as any}
            render={({ field: quantityField }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    {...quantityField}
                    placeholder="100"
                    type="number"
                    min={1}
                    step={1}
                    aria-label={`Quantity for size ${field.size}`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}
    </div>
  );
};

export default CustomSizesQuantityFieldArray;
