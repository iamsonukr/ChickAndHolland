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
import { Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  AddUserRoleForm as AddUserRoleFormType,
  addUserRoleFormSchema,
} from "@/lib/formSchemas";
import useHttp from "@/lib/hooks/usePost";
import { MultiSelect } from "@/components/custom/multi-select";
import { getMenuListForSelection } from "@/lib/menuList";

interface EditUserRoleFormProps {
  previousData: {
    id: string;
    roleName: string;
    permissions: string[];
  };
}

const EditUserRoleForm = ({ previousData }: EditUserRoleFormProps) => {
  const [open, setOpen] = useState(false);

  const form = useForm<AddUserRoleFormType>({
    resolver: zodResolver(addUserRoleFormSchema),
    defaultValues: {
      roleName: "",
      permissions: [],
    },
  });

  const { loading, error, executeAsync } = useHttp(`/user-roles/${previousData.id}`, "PUT");

  const router = useRouter();

  const onSubmit = async (data: AddUserRoleFormType) => {
    try {
      const response = await executeAsync(data);

      if (error) {
        return toast.error("Failed to edit user role");
      }

      form.reset();
      setOpen(false);
      toast.success(response.message ?? "User role updated successfully");
      router.refresh();
    } catch (err) {
      toast.error("Failed to edit user role", {
        description: error?.message,
      });
    }
  };

  useEffect(() => {
    form.reset({
      roleName: previousData.roleName,
      permissions: previousData.permissions,
    });
  }, [previousData]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline">
          <Edit />
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-[100%] overflow-y-auto md:min-w-[50%] lg:min-w-[35%]">
        <SheetHeader>
          <SheetTitle>Edit User Role</SheetTitle>
          <SheetDescription>
            Fill in the form below to edit the user role
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
                    <Input placeholder="Admin" {...field} />
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
                  <FormLabel>Permissions</FormLabel>
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
                {loading ? "Loading..." : "Update User Role"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default EditUserRoleForm;