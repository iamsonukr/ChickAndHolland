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

const changeRevenuePasswordSchema = z
  .object({
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangeRevenuePasswordValues = z.infer<typeof changeRevenuePasswordSchema>;

const ChangeRevenuePasswordForm = () => {
  const form = useForm<ChangeRevenuePasswordValues>({
    resolver: zodResolver(changeRevenuePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { executeAsync, loading } = useHttp(
    "/admin-settings/revenue-password",
    "PUT",
  );

  const onSubmit = async (values: ChangeRevenuePasswordValues) => {
    try {
      const response = await executeAsync(values, {}, (error) =>
        toast.error(error?.message ?? "Failed to update revenue password"),
      );

      toast.success(response?.message ?? "Revenue password updated");
      form.reset();
    } catch (error: any) {
      if (!error?.message) {
        toast.error("Failed to update revenue password");
      }
    }
  };

  return (
    <div className="w-full max-w-xl rounded-md border bg-background p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-base font-semibold">
          Set / Reset Revenue Summary Password
        </h2>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Enter and confirm a new Revenue Summary password.
      </p>
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
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

export default ChangeRevenuePasswordForm;
