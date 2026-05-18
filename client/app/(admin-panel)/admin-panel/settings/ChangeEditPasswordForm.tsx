"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/custom/button";
import { PasswordInput } from "@/components/custom/password-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import useHttp from "@/lib/hooks/usePost";

const changeEditPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangeEditPasswordValues = z.infer<typeof changeEditPasswordSchema>;

const ChangeEditPasswordForm = () => {
  const form = useForm<ChangeEditPasswordValues>({
    resolver: zodResolver(changeEditPasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { executeAsync, loading } = useHttp(
    "/admin-settings/edit-password",
    "PUT",
  );

  const onSubmit = async (values: ChangeEditPasswordValues) => {
    try {
      const response = await executeAsync(
        values,
        {},
        (error) => toast.error(error?.message ?? "Failed to update edit password"),
      );

      toast.success(response?.message ?? "Edit password updated");
      form.reset();
    } catch (error: any) {
      if (!error?.message) {
        toast.error("Failed to update edit password");
      }
    }
  };

  return (
    <div className="w-full max-w-xl rounded-md border bg-background p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-base font-semibold">Change Edit Password</h2>
      </div>

      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" loading={loading} className="w-full">
            Update Password
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ChangeEditPasswordForm;
