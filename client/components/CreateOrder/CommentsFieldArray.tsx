"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Delete, Plus } from "lucide-react";
import React, { useRef, useState } from "react";
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
  const [newComment, setNewComment] = useState("");
  const newCommentRef = useRef<HTMLTextAreaElement | null>(null);

  const handleAddComment = () => {
    const trimmed = newComment.trim();
    if (!trimmed) return;
    append(trimmed);
    setNewComment("");
    newCommentRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddComment();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Comments</Label>
        <Button variant="secondary" onClick={handleAddComment} type="button">
          Add Comment <Plus className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {/* New comment input */}
      <div className="flex items-center gap-4">
        <Textarea
          ref={newCommentRef}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your comment here and press Enter or click Add Comment"
          className="w-full"
        />
      </div>

      {/* Existing comments */}
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