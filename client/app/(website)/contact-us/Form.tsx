"use client";

import { ContactUsForm, contactUsFormSchema } from "@/lib/formSchemas";
import useHttp from "@/lib/hooks/usePost";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/custom/phone-input";
import { useState, useEffect } from "react";

const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ContactUsForm>({
    resolver: zodResolver(contactUsFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      subject: "",
      message: "",
      country: "",
      state: "",
    },
  });

  const { executeAsync, loading } = useHttp(`/contactus`);

  const onSubmit = async (data: ContactUsForm) => {
    setIsSubmitting(true);
    try {
      const response = await executeAsync(data, {}, (error) => {
        return toast.error("Failed to submit form, please try again");
      });

      form.reset();
      toast.success(response.message ?? "Form submitted successfully", {
        description:
          "We have received your message and will get back to you ASAP",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit form, please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form className="luxury-contact-form space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="luxury-form-item">
                <FormLabel className="luxury-form-label">Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="John Doe" 
                    {...field} 
                    className="luxury-input"
                  />
                </FormControl>
                <FormMessage className="luxury-form-message" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="luxury-form-item">
                <FormLabel className="luxury-form-label">Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="johndoe@gmail.com" 
                    {...field} 
                    className="luxury-input"
                  />
                </FormControl>
                <FormMessage className="luxury-form-message" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem className="luxury-form-item">
              <FormLabel className="luxury-form-label">Phone Number</FormLabel>
              <FormControl>
                <PhoneInput
                  placeholder="Enter a phone number"
                  {...field}
                  defaultCountry="NL"
                  className="luxury-phone-input"
                />
              </FormControl>
              <FormDescription className="luxury-form-description">
                Enter your phone number with country code
              </FormDescription>
              <FormMessage className="luxury-form-message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem className="luxury-form-item">
              <FormLabel className="luxury-form-label">Subject</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Subject of your inquiry" 
                  {...field} 
                  className="luxury-input"
                />
              </FormControl>
              <FormMessage className="luxury-form-message" />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem className="luxury-form-item">
                <FormLabel className="luxury-form-label">Country</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Country" 
                    {...field} 
                    className="luxury-input"
                  />
                </FormControl>
                <FormMessage className="luxury-form-message" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem className="luxury-form-item">
                <FormLabel className="luxury-form-label">State</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="State" 
                    {...field} 
                    className="luxury-input"
                  />
                </FormControl>
                <FormMessage className="luxury-form-message" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem className="luxury-form-item">
              <FormLabel className="luxury-form-label">Message</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell us about your inquiry..." 
                  {...field} 
                  className="luxury-textarea min-h-[120px]"
                />
              </FormControl>
              <FormMessage className="luxury-form-message" />
            </FormItem>
          )}
        />

        <div className="pt-6">
          <Button 
            type="submit" 
            className="luxury-submit-btn w-full" 
            disabled={loading || isSubmitting}
          >
            <span className="btn-content">
              {loading || isSubmitting ? (
                <>
                  <div className="loading-spinner"></div>
                  Sending Message...
                </>
              ) : (
                <>
                  Send Message
                  <svg className="btn-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </span>
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ContactForm;