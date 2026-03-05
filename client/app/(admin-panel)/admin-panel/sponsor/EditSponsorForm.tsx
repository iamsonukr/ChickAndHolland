"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EditSponsorForm, editSponsorFormSchema } from "@/lib/formSchemas";
import useHttp from "@/lib/hooks/usePost";

const formSchema = z.object({
  Description: z.string().url("Please enter a valid URL"),
});

interface EditFormProps {
  id: number;
  imageUrl: string;
  description: string;
}

const EditForm = ({ id, imageUrl, description }: EditFormProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<EditSponsorForm>({
    resolver: zodResolver(editSponsorFormSchema),
    defaultValues: {
      description: "",
      file: undefined,
    },
  });

  const { loading, executeAsync } = useHttp(`/sponsors/${id}`, "PATCH");
  const onSubmit = async (data: EditSponsorForm) => {
    try {
      const formData = new FormData();
      if (data.file) {
        formData.append("file", data.file);
      }
      formData.append("description", data.description || "");

      const response = await executeAsync(formData);

      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating sponsor:", error);
    }
  };

  useEffect(() => {
    form.setValue("description", description);
  }, [description]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          Edit Sponsor
          <Edit className="ml-2 h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Sponsor</DialogTitle>
          <DialogDescription>
            Make changes to your sponsor here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex justify-center rounded-lg border bg-gray-50 p-4">
              <div className="relative max-h-[300px] w-full overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Current sponsor image"
                  className="h-auto w-full object-contain"
                  style={{ maxHeight: "300px" }}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          field.onChange(file);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditForm;
