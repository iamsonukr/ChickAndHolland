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
  AddUserRoleForm as AddUserRoleFormType,
  addUserRoleFormSchema,
} from "@/lib/formSchemas";
import useHttp from "@/lib/hooks/usePost";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/custom/multi-select";
import { getMenuListForSelection } from "@/lib/menuList";

const AddUserRoleForm = () => {
  const [open, setOpen] = useState(false);

  const form = useForm<AddUserRoleFormType>({
    resolver: zodResolver(addUserRoleFormSchema),
    defaultValues: {
      roleName: "",
      permissions: [],
    },
  });

const { loading, executeAsync } = useHttp("/user-roles");

  const router = useRouter();

  const onSubmit = async (data: AddUserRoleFormType) => {
    try {
      const response = await executeAsync(data, {}, (error) => {
        return toast.error(error?.message ?? "Failed to add User Role");
      });

      form.reset();
      setOpen(false);

      if (response.success) {
        toast.success(response.message ?? "User Role added successfully");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to add User Role");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          Add New User Role <Plus />
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-[100%] overflow-y-auto md:min-w-[50%] lg:min-w-[35%]">
        <SheetHeader>
          <SheetTitle>Add New User Role</SheetTitle>
          <SheetDescription>
            Fill in the form below to add a new User Role
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="mt-8 space-y-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="roleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permissions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pages</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={getMenuListForSelection()}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      placeholder="Select permissions"
                      variant="inverted"
                      maxCount={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Choose the modules this role will have access to.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permissions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pages Actions</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={getMenuListForSelection()}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      placeholder="Select permissions"
                      variant="inverted"
                      maxCount={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Choose the modules this role will have access to.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Button type="submit" className="mt-4 w-full" disabled={loading}>
                {loading ? "Loading..." : "Add User Role"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default AddUserRoleForm;
