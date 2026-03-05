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

const EnquireProducts = ({
  productCodes,
  buttonText = "Enquire Now",
  disabled = false,
  callback = () => {},
}: {
  productCodes: string;
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
      // categoryName: productDetails.subCategory.name
    },
  });

  const [enquireModelOpen, setEnquireModelOpen] = useState(false);

  const { executeAsync, isExecuting } = useAction(submitEnquiryForm);

  const onSubmit = async (values: EnquireNowForm) => {
    const res = await executeAsync(values);

    enquireNowForm.reset();
    setEnquireModelOpen(false);

    toast("Enquiry submitted successfully", {
      description:
        "We have received your enquiry and will get back to you soon.",
    });

    callback?.();
  };

  useEffect(() => {
    if (enquireModelOpen) {
      enquireNowForm.reset();
    }
  }, []);

  useEffect(() => {
    enquireNowForm.setValue("productCodes", productCodes);
  }, [productCodes]);

  return (
    <Dialog open={enquireModelOpen} onOpenChange={setEnquireModelOpen}>
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
              console.log(errors);
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
