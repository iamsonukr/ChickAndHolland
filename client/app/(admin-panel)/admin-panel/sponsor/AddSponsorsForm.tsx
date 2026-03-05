"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormLabel,
  FormField,
  FormMessage,
  FormItem,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AddSponsorForm as dd, addSponsorFormSchema } from "@/lib/formSchemas";
import useHttp from "@/lib/hooks/usePost";

const AddSponsorForm = () => {
  const [open, setOpen] = useState(false);

  const form = useForm<dd>({
    resolver: zodResolver(addSponsorFormSchema),
    defaultValues: {
      description: "",
      file: undefined,
    },
  });

  const { loading, executeAsync } = useHttp("/sponsors");

  const router = useRouter();

  const onSubmit = async (data: dd) => {
    try {
      const formData = new FormData();
      formData.append("description", data.description || "");

      if (data.file instanceof File) {
        formData.append("file", data.file);
      }

      const response = await executeAsync(formData, {}, (error) => {
        toast.error("Failed to add sponsor", {
          description: error?.message,
        });
      });

      form.reset();
      setOpen(false);
      toast.success(response.message ?? "Sponsor added successfully");
      router.refresh();
    } catch (err) {
      toast.error("Failed to add sponsor");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          Add New Sponsor <Plus />
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-[100%] overflow-y-auto md:min-w-[50%] lg:min-w-[35%]">
        <SheetHeader>
          <SheetTitle>Add New Sponsor</SheetTitle>
          <SheetDescription>
            Fill in the form below to add Sponsor
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="mt-8 space-y-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="file"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      onChange={(e) => {
                        // Get the file directly from the event
                        const file = e.target.files?.[0];
                        onChange(file);
                      }}
                      {...field}
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
                    <Input placeholder="description" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter description for the sponsor
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <Button type="submit" className="mt-4 w-full" disabled={loading}>
                {loading ? "Loading..." : "Add Sponsor"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export const DeleteSPonsor = ({ id }: { id: number }) => {
  const { executeAsync: deleteSponsor } = useHttp("/sponsors", "DELETE");
  const [deletePhoto, setDeletePhoto] = useState(false);
  const router = useRouter();
  const onDeleteFun = async () => {
    try {
      setDeletePhoto(true);
      await deleteSponsor({ id: id });

      toast.success("sponsor Deleted");
      router.refresh();
    } catch (error) {
      console.log(error);
    } finally {
      setDeletePhoto(false);
    }
  };
  return (
    <Button
      onClick={onDeleteFun}
      variant={"destructive"}
      disabled={deletePhoto}
      className="w-full rounded-none"
    >
      Delete
    </Button>
  );
};

export default AddSponsorForm;
