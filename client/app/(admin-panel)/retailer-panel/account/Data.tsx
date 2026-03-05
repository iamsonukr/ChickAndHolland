"use client";

import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useHttp from "@/lib/hooks/usePost";
import { getBankDetails } from "@/lib/data";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/custom/phone-input";

// Bank details schema
const bankSchema = z.object({
  name: z
    .string()
    .min(2, "Bank name must be at least 2 characters")
    .max(100, "Bank name must not exceed 100 characters"),
  account: z
    .string()
    .min(8, "Account number must be at least 8 characters")
    .max(20, "Account number must not exceed 20 characters")
    .regex(/^\d+$/, "Account number must contain only numbers"),
  ifc: z
    .string()
    .regex(
      /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
      "Invalid SWIFT code format",
    ),
  branch: z
    .string()
    .min(2, "Branch name must be at least 2 characters")
    .max(100, "Branch name must not exceed 100 characters"),
  address: z
    .string()
    .min(5, "Bank address must be at least 5 characters")
    .max(200, "Bank address must not exceed 200 characters"),
});

// Card details schema
const cardSchema = z.object({
  card_name: z.string().min(2, "Card name must be at least 2 characters"),
  card_number: z
    .string()
    .min(13, "Card number must be at least 13 characters")
    .max(19, "Card number must not exceed 19 characters")
    .regex(/^\d+$/, "Card number must contain only numbers"),
  expiry_date: z
    .string()
    .regex(
      /^(0[1-9]|1[0-2])\/[0-9]{2}$/,
      "Expiry date must be in MM/YY format",
    ),
  card_address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address must not exceed 200 characters"),
});

function Data({
  data,
  retailerId,
  whatToShow,
}: {
  data: {
    account: string;
    bankName: string;
    branch: string;
    ifc: string;
    retailerId: string;
    address?: string;
    card?: string;
    exp?: string;
    card_address?: string;
    card_name?: string;
  };
  retailerId: number;
  whatToShow: "bank" | "card";
}) {
  const [open, setOpen] = useState<boolean>();
  const router = useRouter();

  const {
    executeAsync: addBank,
    loading: removeLoading,
    error: postError,
  } = useHttp(`/retailer-bank/${retailerId}`, "POST");

  const { executeAsync: patchBank } = useHttp(
    `/retailer-bank/${retailerId}`,
    "PATCH",
  );

  const formSchema = whatToShow === "bank" ? bankSchema : cardSchema;
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: whatToShow === "bank" 
      ? {
          name: "",
          account: "",
          ifc: "",
          branch: "",
          address: "",
        }
      : {
          card_name: "",
          card_number: "",
          expiry_date: "",
          card_address: "",
        },
  });

  async function onSubmit(values: any) {
    try {
      if (data) {
        await patchBank(values);
        toast.success("Details Updated");
      } else {
        await addBank(values);
        toast.success("Bank Details Uploaded");
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.log(error);
    }
  }
  useEffect(() => {
    if (data) {
      if (whatToShow === "bank") {
        form.setValue("account", data.account);
        form.setValue("branch", data.branch);
        form.setValue("ifc", data.ifc);
        form.setValue("name", data.bankName);
        form.setValue("address", data.address || "");
      } else {
        form.setValue("card_name", data.card_name || "");
        form.setValue("card_number", data.card || "");
        form.setValue("expiry_date", data.exp || "");
        form.setValue("card_address", data.card_address || "");
      }
    }
  }, [data, form, whatToShow]);

  return (
    <div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button className="w-full">
            {data ? "Edit Details" : "Add Details"}
          </Button>
        </SheetTrigger>
        <SheetContent className="!max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Edit {whatToShow == "bank" ? "Bank" : "Card"} Details
            </SheetTitle>
            <SheetDescription>These Details are Encrypted</SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, (errors) => {
                console.error("Form submission errors:", errors);
                toast.error("Please fix the errors in the form.");
              })}
              className="mx-auto max-w-3xl space-y-8 py-10"
            >
              {whatToShow == "bank" ? (
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 text-lg font-medium">Bank Details</h3>
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter Bank Name"
                              type="text"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="account"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter Account Number"
                              type="text"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ifc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Swift Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter Swift Code"
                              type="text"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="branch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Branch"
                              type="text"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter Bank Address"
                              type="text"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 text-lg font-medium">Card Details</h3>
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="card_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter Card Name"
                              type="text"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="card_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter Card Number"
                              type="text"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiry_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input placeholder="MM/YY" type="text" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="card_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Billing Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter Billing Address"
                              type="text"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full">
                Submit
              </Button>
            </form>
          </Form>
          <SheetFooter></SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default Data;

// Define the validation schema using Zod
const formDetailsSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .refine(
      (value) => {
        const phoneRegex =
          /^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
        return phoneRegex.test(value);
      },
      { message: "Please enter a valid phone number" },
    ),
  name: z
    .string()
    .min(2, " name must be at least 2 characters")
    .max(50, " name must not exceed 50 characters"),
  storeName: z
    .string()
    .min(2, "Store name must be at least 2 characters")
    .max(50, "Store name must not exceed 50 characters"),
});

// Updated TypeScript type
type FormValues = z.infer<typeof formDetailsSchema>;

export function PersonalDetailsForm({
  retailerId,
  data,
}: {
  retailerId: number;
  data: any;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formDetailsSchema),
    defaultValues: {
      email: "",
      phoneNumber: "",
      storeName: "",
      name: "",
    },
  });
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { executeAsync } = useHttp(
    `/retailers/retailer/personal/${retailerId}`,
    "PATCH",
  );
  function onSubmit(data: FormValues) {
    try {
      executeAsync(data);
      router.refresh();
      toast.success("Details Updated");
      setOpen(false);
    } catch (error) {}
  }

  useEffect(() => {
    if (data) {
      form.setValue("email", data.email);
      form.setValue("phoneNumber", data.phoneNumber);
      form.setValue("storeName", data.storeName);
      form.setValue("name", data.name);
    }
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
       <Button className="bg-black text-white hover:bg-gray-800 transition-colors">
  Edit Details
</Button>

      </SheetTrigger>

      <SheetContent className="w-full bg-gray-50 sm:max-w-md">
        <SheetHeader className="mb-6 border-b pb-4">
          <SheetTitle className="text-2xl font-semibold text-gray-800">
            Edit Your Details
          </SheetTitle>
          <SheetDescription className="text-gray-600">
            Update your contact and store information below
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Awesome Store"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="mt-1 text-sm text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="storeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Store Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Awesome Store"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="mt-1 text-sm text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="your.email@example.com"
                      type="email"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="mt-1 text-sm text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Phone Number
                  </FormLabel>
                  <FormControl>
                    <PhoneInput
                      placeholder="Enter a phone number"
                      {...field}
                      defaultCountry="NL"
                    />
                    {/* <Input
                      placeholder="(123) 456-7890"
                      type="tel"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      {...field}
                    /> */}
                  </FormControl>
                  <FormMessage className="mt-1 text-sm text-red-500" />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-2">
              <Button type="submit" className="flex-1 rounded-lg bg-black text-white hover:bg-gray-800">
  Save Changes
</Button>

              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-lg border-gray-300 py-2 text-gray-700 transition-colors hover:bg-gray-100"
                onClick={() => form.reset()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
