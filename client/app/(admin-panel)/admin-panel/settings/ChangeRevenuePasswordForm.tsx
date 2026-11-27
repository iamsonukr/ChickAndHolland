"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/constants";
import { getCookie } from "@/lib/utils";
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
  const [saved, setSaved] = useState<{
    configured: boolean;
    password: string | null;
  } | null>(null);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/admin-settings/revenue-password`, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${getCookie("token") || ""}` },
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.message || "Unable to load saved password.");
        if (!controller.signal.aborted) setSaved(result);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setLoadError(error.message);
      });
    return () => controller.abort();
  }, []);
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
      setSaved({ configured: true, password: values.newPassword });
      setLoadError("");
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
      <div className="mb-4 space-y-2">
        <p className="text-sm font-medium">Last Saved Password</p>
        {saved?.password !== null && saved?.password !== undefined ? (
          <PasswordInput
            aria-label="Last saved revenue password"
            value={saved.password}
            readOnly
            autoComplete="off"
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {loadError ||
              (!saved
                ? "Loading..."
                : saved.configured
                  ? "Save the password again to make it viewable here."
                  : "No password saved yet.")}
          </p>
        )}
      </div>
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
