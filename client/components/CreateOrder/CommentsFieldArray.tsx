"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Delete, Plus } from "lucide-react";
import { useEffect } from "react";
import { Control, useFieldArray } from "react-hook-form";
import { CreateOrderForm } from "@/lib/formSchemas";

interface CommentsFieldArrayProps {
  control: Control<CreateOrderForm>;
  name: any;
  register: any;
}

const CommentsFieldArray = ({
  control,
  name,
  register,
}: CommentsFieldArrayProps) => {
  const { fields, append, remove } = useFieldArray({ control, name });

  useEffect(() => {
    if (fields.length === 0) append("");
  }, [append, fields.length]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Comments</Label>
        <Button variant="secondary" onClick={() => append("")} type="button">
          Add Comment <Plus className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-4">
          <Textarea
            {...register(`${name}.${index}`)}
            placeholder="Type your comment here"
            className="w-full"
          />
          <Button
            variant="destructive"
            onClick={() => remove(index)}
            type="button"
            size="icon"
            disabled={fields.length === 1}
            aria-label={`Remove comment ${index + 1}`}
          >
            <Delete className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default CommentsFieldArray;
