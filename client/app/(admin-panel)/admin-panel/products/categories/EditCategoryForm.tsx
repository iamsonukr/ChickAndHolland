"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormLabel,
  FormField,
  FormMessage,
  FormItem, FormDescription
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
import { Edit, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  AddProductCategoryForm,
  AddStockForm as AddStockFormType,
  addProductCategoryFormSchema,
  addStockFormSchema,
} from "@/lib/formSchemas";
import useHttp from "@/lib/hooks/usePost";

const EditCategoryForm = ({ previousData }: any) => {
  const [open, setOpen] = useState(false);

  const form = useForm<AddProductCategoryForm>({
    resolver: zodResolver(addProductCategoryFormSchema),
    defaultValues: {
      name: "",
      priority: "0",
    },
  });

  const { loading, error, executeAsync } = useHttp("/categories/new", "PUT");

  const router = useRouter();

  const onSubmit = async (data: AddProductCategoryForm) => {
    try {
      const response = await executeAsync(
        {
          ...data,
          id: previousData.id,
        },
        {},
        (error) => {
          return toast.error("Failed to edit category");
        },
      );

      form.reset();
      setOpen(false);
      toast.success(response.message ?? "category edited successfully");
      router.refresh();
    } catch (err) {
      toast.error("Failed to edit category", {
        description: error?.message,
      });
    }
  };

  useEffect(() => {
    form.reset({ name: previousData.name, priority: previousData.priority.toString() });
  }, [previousData]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size={"icon"} variant={"outline"}>
          <Edit />
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-[100%] overflow-y-auto md:min-w-[50%] lg:min-w-[35%]">
        <SheetHeader>
          <SheetTitle>Add New Category</SheetTitle>
          <SheetDescription>
            Fill in the form below to add category
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
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Couture" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <Input placeholder="Priority" type={'number'} {...field} />
                  </FormControl>
                  <FormDescription>
                    This is the order of this category which will be shown on
                    the Header. <b>Lower the better</b>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />


            <div>
              <Button type="submit" className="mt-4 w-full" disabled={loading}>
                {loading ? "Loading..." : "Add Category"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default EditCategoryForm;
