"use client";

import { Button } from "@/components/ui/button";
import { IdCard } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  ApplyRoleToUserForm,
  applyRoleToUserFormSchema,
} from "@/lib/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import useHttp from "@/lib/hooks/usePost";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ApplyToUser = ({ userRoleData }: { userRoleData: any }) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<ApplyRoleToUserForm>({
    resolver: zodResolver(applyRoleToUserFormSchema),
    defaultValues: {
      userId: "",
      roleId: userRoleData.userRole.id, // MUST BE NUMBER
    },
  });

const { loading, executeAsync } = useHttp("/user-roles/apply", "PUT");

  const onSubmit = async (data: ApplyRoleToUserForm) => {
    const sendData = {
      userId: Number(data.userId),
      roleId: data.roleId,
    };

    try {
      const response = await executeAsync(sendData);

      if (response) {
        toast.success("Role applied!");
        form.reset();
        setOpen(false);
        router.refresh();
      }
    } catch (err) {
      console.error("SUBMIT ERROR:", err);
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
            Assign <b>{userRoleData.userRole.roleName}</b> Role
          </SheetTitle>
          <SheetDescription>Select a user to assign this role.</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="mt-8 space-y-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            {/* SELECT USER */}
            <FormField
              name="userId"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User</FormLabel>

                  <Select
                    onValueChange={(v) => field.onChange(v)}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {userRoleData?.users?.users?.map((user: any) => (
                        <SelectItem key={user.id} value={String(user.id)}>
                          {user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full mt-4" disabled={loading}>
              {loading ? "Loading..." : "Assign Role"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default ApplyToUser;