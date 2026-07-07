"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Edit, Plus } from "lucide-react";

import { Button } from "@/components/custom/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import useHttp from "@/lib/hooks/usePost";

type BeaderFormValues = {
  name: string;
};

const BeaderForm = ({ beader }: { beader?: { id: number; name: string } }) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const isEdit = Boolean(beader?.id);
  const form = useForm<BeaderFormValues>({
    defaultValues: {
      name: beader?.name ?? "",
    },
  });

  const { executeAsync, loading } = useHttp(
    isEdit ? `/beaders/${beader?.id}` : "/beaders",
    isEdit ? "PUT" : "POST",
  );

  useEffect(() => {
    form.reset({ name: beader?.name ?? "" });
  }, [beader, form]);

  const onSubmit = async (values: BeaderFormValues) => {
    const name = values.name.trim();
    if (!name) {
      toast.error("Beader name is required");
      return;
    }

    try {
      const response = await executeAsync({ name }, {}, (err) => {
        toast.error(err?.message ?? "Failed to save beader");
      });
      form.reset({ name: "" });
      setOpen(false);
      toast.success(response.message ?? "Beader saved successfully");
      router.refresh();
    } catch {
      toast.error("Failed to save beader");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {isEdit ? (
          <Button size="icon" variant="outline" aria-label="Edit beader">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            Add New Beader <Plus className="ml-2 h-4 w-4" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="min-w-[100%] overflow-y-auto md:min-w-[50%] lg:min-w-[35%]">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Beader" : "Add New Beader"}</SheetTitle>
          <SheetDescription>
            Fill in the form below to save beader
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="mt-8 space-y-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beader Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter beader name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="mt-4 w-full" disabled={loading}>
              {loading ? "Loading..." : isEdit ? "Update Beader" : "Add Beader"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default BeaderForm;
