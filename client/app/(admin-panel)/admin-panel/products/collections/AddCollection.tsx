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
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  AddProductCollectionForm,
  addProductCollectionFormSchema,
} from "@/lib/formSchemas";
import useHttp from "@/lib/hooks/usePost";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AddCollectionForm = ({ categories }: any) => {
  const [open, setOpen] = useState(false);

  const form = useForm<AddProductCollectionForm>({
    resolver: zodResolver(addProductCollectionFormSchema),
    defaultValues: {
      name: "",
      categoryId: undefined,
      priority: "0",
    },
  });

  const { loading, error, executeAsync } = useHttp("/subcategories/new");

  const router = useRouter();

  const onSubmit = async (data: AddProductCollectionForm) => {
    try {
      const response = await executeAsync(data, {}, (error) => {
        return toast.error("Failed to add collection");
      });

      form.reset();
      form.setValue("categoryId", "");
      setOpen(false);
      toast.success(response.message ?? "collection added successfully");
      router.refresh();
    } catch (err) {
      toast.error("Failed to add collection", {
        description: error?.message,
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          Add New Collection <Plus />
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-[100%] overflow-y-auto md:min-w-[50%] lg:min-w-[35%]">
        <SheetHeader>
          <SheetTitle>Add New collection</SheetTitle>
          <SheetDescription>
            Fill in the form below to add collection
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
                  <FormLabel>Collection Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Harmony of Hearts 2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select the category of this collection" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category: any) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Input placeholder="Priority" type={"number"} {...field} />
                  </FormControl>
                  <FormDescription>
                    This is the order of this collection which will be shown
                    under the category. <b>Lower the better</b>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Button type="submit" className="mt-4 w-full" disabled={loading}>
                {loading ? "Loading..." : "Add collection"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default AddCollectionForm;
