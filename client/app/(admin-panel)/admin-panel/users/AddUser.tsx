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
  AddUserForm as AddUserFormType,
  addUserFormSchema,
} from "@/lib/formSchemas";
import useHttp from "@/lib/hooks/usePost";

const AddUserForm = () => {
  const [open, setOpen] = useState(false);

  const form = useForm<AddUserFormType>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: {
      username: "",
      password: "",
      // userRoleId: undefined,
    },
  });

  const { loading, executeAsync } = useHttp("/users/");

  const router = useRouter();

  const onSubmit = async (data: AddUserFormType) => {
    try {
      const response = await executeAsync(data, {}, (error) => {
        return toast.error(error?.message ?? "Failed to add User");
      });

      form.reset();
      setOpen(false);
      if (response.success) {
        toast.success(response.message ?? "User added successfully");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to add User");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          Add New User <Plus />
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-[100%] overflow-y-auto md:min-w-[50%] lg:min-w-[35%]">
        <SheetHeader>
          <SheetTitle>Add New User </SheetTitle>
          <SheetDescription>
            Fill in the form below to add a new User
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
                    <Input placeholder="johndoe" {...field} />
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
                    <Input placeholder="johndoe@123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Button type="submit" className="mt-4 w-full" disabled={loading}>
                {loading ? "Loading..." : "Add User"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default AddUserForm;
