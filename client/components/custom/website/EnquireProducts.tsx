"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { EnquireNowForm, enquireNowFormSchema } from "@/lib/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { submitEnquiryForm } from "@/lib/actions";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const GoogleRecaptcha = dynamic(() => import("./GoogleRecaptcha"), {
  ssr: false,
});

const EnquireProducts = ({
  productCodes,
  page = "product",
  buttonText = "Enquire Now",
  disabled = false,
  callback = () => {},
}: {
  productCodes: string;
  page?: string;
  buttonText?: string;
  disabled?: boolean;
  callback?: () => void;
}) => {
  const enquireNowForm = useForm<EnquireNowForm>({
    resolver: zodResolver(enquireNowFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      contactNumber: "",
      message: "",
      city: "",
      country: "",
      productCodes: productCodes,
      page,
      recaptchaToken: "",
      // categoryName: productDetails.subCategory.name
    },
  });

  const [enquireModelOpen, setEnquireModelOpen] = useState(false);

  const { executeAsync, isExecuting } = useAction(submitEnquiryForm);

  const handleOpenChange = (open: boolean) => {
    setEnquireModelOpen(open);

    if (!open) {
      enquireNowForm.reset({
        firstName: "",
        lastName: "",
        email: "",
        contactNumber: "",
        message: "",
        city: "",
        country: "",
        productCodes,
        page,
        recaptchaToken: "",
      });
    }
  };

  const onSubmit = async (values: EnquireNowForm) => {
    console.log("Product Query Frontend Form Submission:", values);
    console.log("Product Query Frontend Product Codes:", productCodes);
    console.log("Product Query Frontend Source Page:", page);

    try {
      console.log("Submitting Product Query via server action...");
      const res = await executeAsync(values);
      console.log("Product Query Frontend Action Response:", res);

      const actionData = ((res as any)?.data ?? res) as {
        success?: boolean;
        emailSent?: boolean;
        message?: string;
      };

      if (actionData?.success) {
        enquireNowForm.reset();
        setEnquireModelOpen(false);

        if (actionData.emailSent === false) {
          console.error("Product Query Email Failed After Save:", actionData);
          toast("Enquiry saved, email notification failed", {
            description:
              actionData.message ||
              "Your enquiry was saved, but the admin email could not be sent.",
          });
        } else {
          toast("Enquiry submitted successfully", {
            description:
              "We have received your enquiry and will get back to you soon.",
          });
        }

        callback?.();
        return;
      }

      console.error("Product Query Frontend Failure:", actionData);
      toast("Failed to submit enquiry", {
        description:
          actionData?.message ||
          "There was an error submitting your enquiry. Please try again later.",
      });
    } catch (error) {
      console.error("Product Query Error:", error);
      toast("Failed to submit enquiry", {
        description:
          error instanceof Error
            ? error.message
            : "There was an error submitting your enquiry. Please try again later.",
      });
    }
  };

  useEffect(() => {
    enquireNowForm.setValue("productCodes", productCodes);
    enquireNowForm.setValue("page", page);
  }, [productCodes, page]);

  return (
    <Dialog
      open={enquireModelOpen}
      onOpenChange={handleOpenChange}
      modal={false}
    >
      <DialogTrigger asChild>
        <Button disabled={disabled} className="w-full !p-4">
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-[90%] overflow-y-auto md:min-w-[40%]">
        <DialogHeader>
          <DialogTitle>Chic & Holland</DialogTitle>
          <DialogDescription>
            <b>Product Code{productCodes.split(",").length > 1 && "s"}:</b>{" "}
            {productCodes}
          </DialogDescription>
        </DialogHeader>

        <Form {...enquireNowForm}>
          <form
            onSubmit={enquireNowForm.handleSubmit(onSubmit, (errors) => {
              console.error("Product Query Form Validation Errors:", errors);
            })}
            className="grid grid-cols-2 gap-2"
          >
            <FormField
              control={enquireNowForm.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Nathan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={enquireNowForm.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Ake" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={enquireNowForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="nathanake@gmail.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={enquireNowForm.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+31620874518" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={enquireNowForm.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Rotterdam" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={enquireNowForm.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="Netherlands" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={enquireNowForm.control}
              name="message"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Message" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={enquireNowForm.control}
              name="recaptchaToken"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <div className="space-y-3 rounded-md border px-4 py-3">
                    <div className="space-y-1">
                      <FormLabel>Security Check</FormLabel>
                      <FormDescription>
                        Complete Google reCAPTCHA before sending your product enquiry.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <GoogleRecaptcha
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="col-span-2 mt-2"
              disabled={isExecuting}
            >
              {isExecuting ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EnquireProducts;
