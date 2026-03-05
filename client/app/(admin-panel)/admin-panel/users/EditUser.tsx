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
import { Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  EditUserFormType,
  editUserFormSchema,
} from "@/lib/formSchemas";
import useHttp from "@/lib/hooks/usePost";

const EditUserForm = ({ previousData }: any) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<EditUserFormType>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // ✅ Ensure correct endpoint and method
  const { loading, executeAsync } = useHttp(`/users/${previousData.id}`, "PUT");

  // ✅ Corrected submit handler
  const onSubmit = async (values: EditUserFormType) => {
    try {
      // ✅ Send lowercase `username` key (backend expects this)
      const payload = {
        username: values.username,
        password: values.password,
      };

      const response = await executeAsync(payload);

      if (!response?.success) {
        toast.error(response?.message ?? "Failed to edit user");
        return;
      }

      toast.success(response.message ?? "User updated successfully");
      form.reset();
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error("Failed to edit user", {
        description: error?.message ?? "Something went wrong",
      });
    }
  };

  // ✅ Pre-fill form when opening sheet
  useEffect(() => {
    form.reset({
      username: previousData.username ?? "",
      password: "", // never prefill password
    });
  }, [previousData, form]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline">
          <Edit />
        </Button>
      </SheetTrigger>

      <SheetContent className="min-w-[100%] overflow-y-auto md:min-w-[50%] lg:min-w-[35%]">
        <SheetHeader>
          <SheetTitle>Edit User</SheetTitle>
          <SheetDescription>
            Fill in the form below to edit the user
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="mt-8 space-y-2"
            onSubmit={form.handleSubmit(onSubmit)}
            autoComplete="off"
          >
            {/* ✅ Username */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ✅ Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Leave blank to keep current password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Button type="submit" className="mt-4 w-full" disabled={loading}>
                {loading ? "Loading..." : "Update User"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default EditUserForm;
