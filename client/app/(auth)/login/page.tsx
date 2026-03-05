"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/custom/button";
import { PasswordInput } from "@/components/custom/password-input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginForm, loginFormSchema } from "@/lib/formSchemas";
import { loginForm } from "@/lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      userName: "",
      password: "",
    },
  });

  const router = useRouter();

  const onSubmit = async (values: LoginForm) => {
    const res = await loginForm(values);
    form.reset();

    if (res?.success && res.id) {
      toast("Login successful", {
        description: "You have successfully logged in",
      });
      router.push("/admin-panel");
    } else {
      toast.error("Login failed", {
        description: "Please check your credentials and try again",
      });
    }
  };

  return (
    <div className="container grid h-svh flex-col items-center justify-center bg-background lg:max-w-none lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-2 sm:w-[480px] lg:p-8">
        <div className="mb-4 flex items-center justify-center">
          <h1 className="text-xl font-medium">Chic & Holland Admin Panel</h1>
        </div>
        <Card className="p-6">
          <div className="flex flex-col space-y-2 text-left">
            <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
            <p className="text-sm text-muted-foreground">
              Enter your username and password below <br />
              to log into your account
            </p>
          </div>
          <div className={cn("mt-2 grid gap-6")}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="userName"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="admin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="********" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button className="mt-2" type="submit">
                    Login
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
