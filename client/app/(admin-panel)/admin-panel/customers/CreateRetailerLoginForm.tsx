"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormLabel,
  FormField,
  FormMessage,
  FormItem,
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
import { IdCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  CreateRetailerForm,
  createRetailerFormSchema,
} from "@/lib/formSchemas";
import useHttp from "@/lib/hooks/usePost";

const CreateRetailerLoginForm = ({ customerData }: any) => {
  const [open, setOpen] = useState(false);

  const form = useForm<CreateRetailerForm>({
    resolver: zodResolver(createRetailerFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const { loading, error, executeAsync } = useHttp("/customers/retailer");

  const router = useRouter();

  const onSubmit = async (data: CreateRetailerForm) => {
    try {
      const response = await executeAsync({
        ...data,
        customerId: customerData.id,
      });

      if (error) {
        return toast.error("Failed to create retailer credentials");
      }

      form.reset();
      setOpen(false);
      toast.success(
        response.message ?? "Retailer credentials created successfully",
      );
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create retailer credentials");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size={"icon"}>
          <IdCard />
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-[100%] overflow-y-auto md:min-w-[50%] lg:min-w-[35%]">
        <SheetHeader>
          <SheetTitle>
            Create Retailer Credentials for {customerData.name}
          </SheetTitle>
          <SheetDescription>
            Fill in the form below to create retailer credentials for this
            customer
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="mt-8 space-y-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={customerData.name
                        .toLowerCase()
                        .replaceAll(" ", "_")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        customerData.name.toLowerCase().replaceAll(" ", "_") +
                        "@123"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Button type="submit" className="mt-4 w-full" disabled={loading}>
                {loading ? "Loading..." : "Create Credentials"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default CreateRetailerLoginForm;
